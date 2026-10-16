import assert from "node:assert/strict";
import {
  branchDivergence,
  branchTree,
  createDivergenceSession,
  freezeDivergenceBranch,
  importDivergenceBranch,
  keepDivergenceBranch,
  unkeepDivergenceBranch
} from "../src/core/divergence.js";
import {
  DIVERGENCE_LIBRARY_LIMIT,
  entriesFromSession,
  isStaleEntry,
  legacySessionKey,
  libraryStoreKey,
  makeLibraryRecord,
  mergeLibrary,
  parseLibraryRecord,
  parseSessionRecord,
  removeFromLibrary,
  sessionStoreKey,
  sortLibraryEntries
} from "../src/core/divergence-library.js";
import { createDivergenceStore } from "../src/storage/divergence-store.js";
import { saveMetaEntry, loadMetaEntry, deleteMetaEntry } from "../src/storage/indexeddb-storage.js";

const project = {
  id: "p1",
  revision: 7,
  metadata: { title: "Seed" },
  basic: { key: "C", bpm: 120 },
  value: 10
};

function transform(payload, context) {
  return {
    payload: { ...payload, value: payload.value + 1 + Math.floor(context.random() * 50) },
    changedAxes: ["harmony"],
    meta: { summary: `value ${context.slot}` }
  };
}

function memoryMeta({ failSave = false, failLoad = false } = {}) {
  const map = new Map();
  return {
    map,
    load: async (key) => { if (failLoad) throw new Error("load failed"); return map.has(key) ? structuredClone(map.get(key)) : null; },
    save: async (key, value) => { if (failSave) throw new Error("quota"); map.set(key, structuredClone(value)); },
    remove: async (key) => { map.delete(key); }
  };
}

function memoryLegacy({ failSet = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { if (failSet) throw new Error("legacy quota"); map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); }
  };
}

// ---- Engine: unkeep / import ----
const base = createDivergenceSession(project, { seedValue: "lib-seed", distance: 3 });
const generated = branchDivergence(base, { count: 3, transform });
const [a, b, c] = generated.branches;

let session = keepDivergenceBranch(generated.session, a.id);
session = keepDivergenceBranch(session, b.id);
assert.equal(session.nodes[a.id].kept, true);

const unkept = unkeepDivergenceBranch(session, a.id);
assert.equal(unkept.nodes[a.id].kept, false);
assert.equal(session.nodes[a.id].kept, true, "unkeepは元のセッションを変更しない");
assert.throws(() => unkeepDivergenceBranch(session, "root"), /Original/);
const frozenSession = freezeDivergenceBranch(session, b.id).session;
assert.throws(() => unkeepDivergenceBranch(frozenSession, b.id), /Freeze/);

// ---- Library: entries / merge / remove / parse ----
const entries = entriesFromSession(session, { projectId: "p1", sourceRevision: 7, now: 1000 });
assert.equal(entries.length, 2, "root・未Keep(c)は含めない");
assert.deepEqual(entries.map((entry) => entry.id).sort(), [`${a.id}@r7`, `${b.id}@r7`].sort());
assert.ok(entries.every((entry) => entry.sourceRevision === 7 && entry.savedAt === 1000));
assert.equal(entries.find((entry) => entry.id === `${a.id}@r7`).payload.value, a.payload.value);
assert.ok(!entriesFromSession(frozenSession, { projectId: "p1", sourceRevision: 7 }).some((entry) => entry.id.startsWith(b.id)), "Freeze済みは含めない");

const merged = mergeLibrary([], entries);
assert.equal(merged.added.length, 2);
const again = mergeLibrary(merged.entries, entriesFromSession(session, { projectId: "p1", sourceRevision: 7, now: 2000 }));
assert.equal(again.entries.length, 2, "同じidは重複しない");
assert.equal(again.entries[0].savedAt, 1000, "最初の保存日時を保つ");

const many = Array.from({ length: DIVERGENCE_LIBRARY_LIMIT + 3 }, (_, index) => ({ id: `e${index}`, payload: {} }));
const limited = mergeLibrary([], many);
assert.equal(limited.entries.length, DIVERGENCE_LIBRARY_LIMIT);
assert.equal(limited.rejected.length, 3, "上限超過は黙って捨てず、rejectedで返す");

assert.equal(removeFromLibrary(merged.entries, entries[0].id).length, 1);
assert.deepEqual(sortLibraryEntries([{ id: "x", savedAt: 1 }, { id: "y", savedAt: 5 }]).map((entry) => entry.id), ["y", "x"]);

const record = makeLibraryRecord("p1", merged.entries);
assert.equal(parseLibraryRecord(record, "p1").length, 2);
assert.equal(parseLibraryRecord(record, "other").length, 0, "別Projectのライブラリは読まない");
assert.equal(parseLibraryRecord({ ...record, entries: [...record.entries, { id: "", payload: {} }, null, { id: "no-payload" }] }, "p1").length, 2, "壊れたEntryだけ捨てる");
assert.equal(parseLibraryRecord(null, "p1").length, 0);
assert.equal(parseLibraryRecord({ ...record, version: 99 }, "p1").length, 0);

assert.equal(isStaleEntry({ sourceRevision: 7 }, 7), false);
assert.equal(isStaleEntry({ sourceRevision: 7 }, 8), true);

// ---- Import from library ----
const fresh = createDivergenceSession({ ...project, revision: 9 }, { seedValue: "after-freeze" });
const imported = importDivergenceBranch(fresh, entries[0]);
assert.equal(imported.session.activeNodeId, imported.node.id);
assert.equal(imported.node.parentId, "root");
assert.equal(imported.node.kept, true);
assert.equal(imported.node.payload.value, entries[0].payload.value);
assert.equal(imported.node.meta.libraryId, entries[0].id);
assert.equal(imported.node.meta.sourceRevision, 7);
assert.equal(imported.session.branchRound, fresh.branchRound, "branchRoundは進めない");
const importedTwice = importDivergenceBranch(imported.session, entries[0]);
assert.equal(Object.keys(importedTwice.session.nodes).length, 2, "同じ案は1回だけ追加(冪等)");
assert.ok(branchTree(importedTwice.session).some((item) => item.label.startsWith("Keep: ")));
assert.throws(() => importDivergenceBranch(fresh, { id: "x" }), /不正/);

const reEntries = entriesFromSession(imported.session, { projectId: "p1", sourceRevision: 9, now: 3000 });
assert.equal(reEntries[0].id, entries[0].id, "呼び出した案は元のidを引き継ぎ二重登録しない");
assert.equal(reEntries[0].sourceRevision, 7, "元のsourceRevisionを保つ");
assert.ok(!reEntries[0].label.startsWith("Keep:"));

// ---- Store: 閉じて開き直しても残る ----
{
  const meta = memoryMeta();
  const legacy = memoryLegacy();
  const store1 = createDivergenceStore({ meta, legacy, now: () => 5000 });
  const saved = await store1.saveSession(project, session);
  assert.deepEqual([saved.ok, saved.where], [true, "indexeddb"]);
  assert.ok(meta.map.has(sessionStoreKey("p1", 7)));

  // 新しいstore = アプリを開き直した状態(メモリ上の変数は無い)
  const store2 = createDivergenceStore({ meta, legacy: memoryLegacy() });
  const loaded = await store2.loadSession(project);
  assert.equal(loaded.from, "indexeddb");
  assert.equal(loaded.session.nodes[a.id].kept, true);
  assert.equal(loaded.session.nodes[b.id].payload.value, b.payload.value);

  const otherRevision = await store2.loadSession({ ...project, revision: 8 });
  assert.equal(otherRevision.session, null, "別revisionのセッションは読まない");
  const otherProject = await store2.loadSession({ ...project, id: "p2" });
  assert.equal(otherProject.session, null, "別Projectのセッションは読まない");

  // ライブラリはFreeze後(revisionが変わった後)も残る
  const lib = await store1.saveLibrary("p1", merged.entries);
  assert.equal(lib.ok, true);
  await store1.deleteSession(project);
  assert.ok(!meta.map.has(sessionStoreKey("p1", 7)), "Freeze後は古いセッションを消す");
  const libLoaded = await store2.loadLibrary("p1");
  assert.equal(libLoaded.entries.length, 2, "Freezeしても他のKeep案が残る");
  assert.equal((await store2.loadLibrary("p2")).entries.length, 0);
}

// ---- Store: 旧sessionStorageからの移行 ----
{
  const meta = memoryMeta();
  const legacy = memoryLegacy();
  legacy.setItem(legacySessionKey("p1", 7), JSON.stringify(session));
  const store = createDivergenceStore({ meta, legacy });
  const loaded = await store.loadSession(project);
  assert.equal(loaded.from, "legacy");
  assert.equal(loaded.session.nodes[a.id].kept, true);
  assert.ok(meta.map.has(sessionStoreKey("p1", 7)), "IndexedDBへ移行する");
  assert.equal(legacy.map.size, 0, "移行後に旧キーを消す");

  legacy.setItem(legacySessionKey("p1", 7), "{broken json");
  const broken = await createDivergenceStore({ meta: memoryMeta(), legacy }).loadSession(project);
  assert.equal(broken.session, null, "壊れた旧データでも例外にしない");
}

// ---- Store: IndexedDBが使えない時 ----
{
  const legacy = memoryLegacy();
  const store = createDivergenceStore({ meta: memoryMeta({ failSave: true }), legacy });
  const result = await store.saveSession(project, session);
  assert.deepEqual([result.ok, result.where], [true, "session-storage"], "退避保存したと正直に返す");
  assert.ok(result.error);
  assert.ok(legacy.map.has(legacySessionKey("p1", 7)));

  const none = await createDivergenceStore({ meta: memoryMeta({ failSave: true }), legacy: memoryLegacy({ failSet: true }) }).saveSession(project, session);
  assert.deepEqual([none.ok, none.where], [false, "none"]);

  const libFail = await createDivergenceStore({ meta: memoryMeta({ failSave: true }), legacy: null }).saveLibrary("p1", merged.entries);
  assert.equal(libFail.ok, false, "ライブラリは退避せず、保存できなかったと返す");

  const loadFail = await createDivergenceStore({ meta: memoryMeta({ failLoad: true }), legacy: null }).loadLibrary("p1");
  assert.deepEqual([loadFail.entries.length, Boolean(loadFail.error)], [0, true]);
}

// ---- 保存キーの安全性 ----
assert.ok(sessionStoreKey("p1", 7).startsWith("divergence:"));
assert.ok(libraryStoreKey("p1").startsWith("divergence:"));
assert.ok(!parseSessionRecord({ version: 1, session: { version: 1, nodes: { root: { payload: { id: "p1", revision: 7 } } } } }, { id: "p1", revision: 8 }));
await assert.rejects(saveMetaEntry("activeProjectId", "x"), /予約/);
await assert.rejects(loadMetaEntry("migrationBackup:p1:schema3:revision1"), /予約/);
await assert.rejects(deleteMetaEntry(""), /不正/);

console.log("divergence-library-smoke-test: ok");
