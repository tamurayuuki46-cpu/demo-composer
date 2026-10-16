// 発散モードの「Keepライブラリ」と、発散セッションの保存形式。
// このModuleは純関数だけで、Storage(IndexedDB等)を知らない。保存は src/storage/divergence-store.js が担当する。
// Project Schema 3 / SongProject v1 には一切触れない。補助データとして別キーに保存する。

export const DIVERGENCE_RECORD_VERSION = 1;
export const DIVERGENCE_LIBRARY_LIMIT = 40;

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

// 保存キー。meta storeの予約キー(activeProjectId / migrationBackup:*)とは重ならない。
export function sessionStoreKey(projectId, revision = 0) {
  return `divergence:session:v1:${projectId}:${Number(revision) || 0}`;
}

export function libraryStoreKey(projectId) {
  return `divergence:library:v1:${projectId}`;
}

// 旧実装(sessionStorage)のキー。移行と、IndexedDBが使えない時の退避先に使う。
export function legacySessionKey(projectId, revision = 0) {
  return `demo-composer:divergence:v1:${projectId ?? "none"}:${Number(revision) || 0}`;
}

export function makeSessionRecord(session, { projectId, revision = 0, now = Date.now() } = {}) {
  if (!session || typeof session !== "object") throw new Error("保存する発散セッションがありません。");
  return {
    version: DIVERGENCE_RECORD_VERSION,
    projectId,
    revision: Number(revision) || 0,
    savedAt: now,
    session: clone(session)
  };
}

// 保存されたセッションが、いま開いているProject(同じid・同じrevision)のものか確認する。
// 違えば null(別の元案から作られたセッションを混ぜない)。
export function parseSessionRecord(raw, sourceProject) {
  const session = raw?.session;
  if (raw?.version !== DIVERGENCE_RECORD_VERSION || session?.version !== 1) return null;
  const root = session?.nodes?.root?.payload;
  if (!root || !sourceProject) return null;
  if (root.id !== sourceProject.id) return null;
  if (Number(root.revision ?? 0) !== Number(sourceProject.revision ?? 0)) return null;
  return clone(session);
}

// ライブラリEntryのid。ライブラリから呼び出した案は元のidを引き継ぎ、二重登録しない。
export function libraryEntryId(node, sourceRevision = 0) {
  return node?.meta?.libraryId || `${node?.id}@r${Number(sourceRevision) || 0}`;
}

// 1つのBranchをEntryにする。Original(root)・Freeze済み・Payloadなしは対象外(null)。
export function entryFromNode(node, { projectId, sourceRevision = 0, now = Date.now() } = {}) {
  if (!node || node.id === "root" || node.frozen) return null;
  if (!node.payload || typeof node.payload !== "object") return null;
  const revision = node.meta?.sourceRevision ?? sourceRevision;
  return {
    id: libraryEntryId(node, sourceRevision),
    projectId,
    label: String(node.label ?? "Branch").replace(/^Keep:\s*/, ""),
    seedValue: String(node.seedValue ?? ""),
    distance: Number.isFinite(node.distance) ? node.distance : 0,
    changedAxes: Array.isArray(node.changedAxes) ? [...node.changedAxes] : [],
    summary: String(node.meta?.summary ?? ""),
    operation: String(node.operation ?? ""),
    sourceRevision: Number(revision) || 0,
    savedAt: now,
    payload: clone(node.payload)
  };
}

// セッションのKeep案を、ライブラリのEntryに変換する。OriginalとFreeze済みの案は含めない。
export function entriesFromSession(session, { projectId, sourceRevision = 0, now = Date.now() } = {}) {
  return Object.values(session?.nodes ?? {})
    .filter((node) => node?.kept)
    .map((node) => entryFromNode(node, { projectId, sourceRevision, now }))
    .filter(Boolean);
}

// 既存ライブラリへ追加する。同じidは既存を優先(最初の保存日時を保つ)。上限を超える分は追加せず、rejectedで返す。
export function mergeLibrary(existing, incoming, { limit = DIVERGENCE_LIBRARY_LIMIT } = {}) {
  const entries = [...(existing ?? [])];
  const known = new Set(entries.map((entry) => entry.id));
  const added = [];
  const rejected = [];
  for (const entry of incoming ?? []) {
    if (known.has(entry.id)) continue;
    if (entries.length >= limit) {
      rejected.push(entry.id);
      continue;
    }
    entries.push(entry);
    known.add(entry.id);
    added.push(entry.id);
  }
  return { entries, added, rejected };
}

export function removeFromLibrary(entries, entryId) {
  return (entries ?? []).filter((entry) => entry.id !== entryId);
}

export function makeLibraryRecord(projectId, entries) {
  return {
    version: DIVERGENCE_RECORD_VERSION,
    projectId,
    entries: clone(entries ?? [])
  };
}

// 保存データを読み込む。壊れたEntryだけ捨て、Libraryごと失わない。別Projectのものは空扱い。
export function parseLibraryRecord(raw, projectId) {
  if (!raw || raw.version !== DIVERGENCE_RECORD_VERSION || !Array.isArray(raw.entries)) return [];
  if (raw.projectId !== projectId) return [];
  return raw.entries
    .filter((entry) => entry
      && typeof entry.id === "string" && entry.id
      && entry.payload && typeof entry.payload === "object")
    .map((entry) => clone(entry));
}

// Keep元の元案revisionが、いまのProjectと違うか。違う案をFreezeすると現在の編集内容が置き換わる。
export function isStaleEntry(entry, currentRevision = 0) {
  return Number(entry?.sourceRevision ?? 0) !== Number(currentRevision ?? 0);
}

export function sortLibraryEntries(entries) {
  return [...(entries ?? [])].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}
