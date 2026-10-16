import assert from 'node:assert/strict';
import { normalizeSourceProject, buildThreeCandidates, updateCandidateSection, arrangedNotes, createPartMidi } from '../src/core.js';
import * as cv from '../convergence/index.js';

const BAR = 1920;
const src = normalizeSourceProject({
  schemaVersion: 3, id: 'demo-1', revision: 1, metadata: { title: 'T' },
  basic: { bpm: 120, key: 'C', scale: 'major', timeSignature: '4/4', ppq: 480 },
  structure: { sections: [
    { id: 'v', kind: 'verse', name: 'A', bars: 2 }, { id: 'c', kind: 'chorus', name: 'サビ', bars: 2, energy: 'high' },
  ] },
  chords: [{ root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: BAR * 2 }, { root: 7, quality: 'major', degree: 'V', startTick: BAR * 2, durationTick: BAR * 2 }],
  tracks: [
    { role: 'melody', name: 'M', midiChannel: 2, notes: [{ id: 'm1', pitch: 64, startTick: 0, durationTick: 480, velocity: 100 }, { id: 'm2', pitch: 67, startTick: BAR * 2, durationTick: 960, velocity: 100 }] },
    { role: 'counter', name: 'C', midiChannel: 4, notes: [{ id: 'c1', pitch: 72, startTick: 960, durationTick: 480, velocity: 90 }, { id: 'c2', pitch: 74, startTick: BAR * 2 + 960, durationTick: 480, velocity: 90 }] },
    { role: 'bass', name: 'B', midiChannel: 3, notes: [{ id: 'b1', pitch: 36, startTick: 0, durationTick: BAR, velocity: 100 }] },
    { role: 'drums', name: 'D', midiChannel: 10, notes: [{ id: 'd1', pitch: 36, startTick: 0, durationTick: 120, velocity: 110 }, { id: 'd2', pitch: 38, startTick: BAR * 2 + 480, durationTick: 120, velocity: 100 }] },
  ],
});
const [A, B, C] = buildThreeCandidates(src, 'jpop-band');
const cands = [A, B, C];
const ids = { projectId: 'demo-1', planId: 'plan-1' };
const planFp = cv.planStructureFingerprint(src);
const T = 1000;

// --- canonical / hash
assert.equal(cv.stableStringify({ b: 1, a: undefined, c: -0, d: 1.23456789 }), '{"b":1,"c":0,"d":1.234568}');
assert.equal(cv.stableStringify({ z: [undefined, 2], a: 1 }), '{"a":1,"z":[null,2]}');
assert.equal(cv.hash64('abc'), cv.hash64('abc'));
assert.notEqual(cv.hash64('abc'), cv.hash64('abd'));
assert.equal(cv.hash64('abc').length, 16);
// golden: 固定入力→固定hash。変わったら FINGERPRINT_VERSION を上げる。
assert.equal(cv.hash64('demo-composer'), 'cdb74c1022cc3af5');
assert.equal(cv.hashOf({ a: 1, b: [1, 2] }), 'dc0c085c290b1f66');

// --- fingerprint
// golden: 固定fixture→固定fingerprint(FINGERPRINT_VERSION=1)。変えるときはversionを上げて意図的に更新する。
assert.equal(cv.FINGERPRINT_VERSION, 1);
assert.equal(cv.slotFingerprint(src, B, 'c'), '78837ede53d20eb8');
assert.equal(cv.slotFingerprint(src, B, 'c', 'drums'), '5a4d4a9acf642572');
assert.equal(planFp, '9755e484e1b1f8a5');
assert.equal(cv.slotFingerprint(src, A, 'c'), cv.slotFingerprint(src, A, 'c'));
assert.equal(cv.slotFingerprint(src, A, 'c', 'drums'), cv.slotFingerprint(src, B, 'c', 'drums')); // drumsはsource由来で候補差なし
const noCounter = updateCandidateSection(B, 'c', { enabled: { counter: false } });
assert.notEqual(cv.slotFingerprint(src, B, 'c', 'counter'), cv.slotFingerprint(src, noCounter, 'c', 'counter'));
assert.equal(cv.slotFingerprint(src, B, 'v'), cv.slotFingerprint(src, noCounter, 'v')); // 他Sectionは無関係
// Note IDは影響しない
const renamed = JSON.parse(JSON.stringify(src)); for (const t of renamed.tracks) t.notes.forEach((n, i) => { n.id = `x${i}`; });
assert.equal(cv.slotFingerprint(renamed, B, 'c'), cv.slotFingerprint(src, B, 'c'));
// drums: 別案で実際に鳴りが変わる場合は変化する
const noDrums = updateCandidateSection(B, 'c', { enabled: { drums: false } });
assert.notEqual(cv.slotFingerprint(src, B, 'c', 'drums'), cv.slotFingerprint(src, noDrums, 'c', 'drums'));
// 構造fingerprint: BPM・名前は無関係、bars変更は影響
const s2 = JSON.parse(JSON.stringify(src)); s2.basic.bpm = 90; s2.sections[0].name = '別名';
assert.equal(cv.planStructureFingerprint(s2), planFp);
const s3 = JSON.parse(JSON.stringify(src)); s3.sections[0].bars = 3; s3.sections[0].endTick += BAR;
assert.notEqual(cv.planStructureFingerprint(s3), planFp);

// --- state: 未決定の定義
let st = cv.createEmptyState({ ...ids, planFingerprint: planFp });
assert.deepEqual(cv.computeUnresolved(st, src).map((i) => i.kind), ['no-base', 'no-base']); // 全体未選択
st = cv.setDecision(st, cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(src, B), now: T });
assert.equal(cv.computeUnresolved(st, src).length, 0); // 継承は未決定でない
st = cv.setDecision(st, cv.sectionKey('c'), C.id, 'hold', { now: T });
assert.equal(cv.computeUnresolved(st, src).length, 1); // 保留は未決定
st = cv.setDecision(st, cv.sectionKey('c'), C.id, 'adopted', { fingerprint: cv.slotFingerprint(src, C, 'c'), now: T });
assert.equal(cv.computeUnresolved(st, src).length, 0);
// 別案の採用は自動不採用にしない
st = cv.setDecision(st, cv.sectionKey('c'), A.id, 'adopted', { fingerprint: cv.slotFingerprint(src, A, 'c'), now: T });
assert.equal(cv.getAdopted(st, cv.sectionKey('c')).candidateId, A.id);
assert.equal(cv.getStatus(st, cv.sectionKey('c'), C.id), 'undecided');
assert.throws(() => cv.setDecision(st, cv.sectionKey('c'), A.id, 'empty'), /不正/);
assert.throws(() => cv.setDecision(st, cv.sectionKey('c'), A.id, 'adopted'), /fingerprint/);
// DAWで決める: 持ち越し→未決定に数えない→採用で自動解除
let s = cv.createEmptyState({ ...ids, planFingerprint: planFp });
s = cv.setCarryOver(s, cv.sectionKey('c'), { note: 'サビが広がるか確認', now: T });
assert.equal(cv.computeUnresolved(s, src).filter((i) => i.sectionId === 'c').length, 0);
assert.equal(cv.computeUnresolved(s, src).filter((i) => i.sectionId === 'v').length, 1);
s = cv.setDecision(s, cv.sectionKey('c'), B.id, 'adopted', { fingerprint: cv.slotFingerprint(src, B, 'c'), now: T });
assert.equal(cv.carryOverList(s).length, 0);
// 保留は持ち越しで未決定から外れる
let h = cv.setDecision(cv.setDecision(cv.createEmptyState({ ...ids, planFingerprint: planFp }), cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(src, B) }), cv.elementKey('c', 'drums'), A.id, 'hold');
assert.equal(cv.computeUnresolved(h, src).length, 1);
h = cv.setCarryOver(h, cv.elementKey('c', 'drums'));
assert.equal(cv.computeUnresolved(h, src).length, 0);

// --- 解除: 上位を継承、履歴(hold/rejected)は残る
let r = cv.setDecision(cv.createEmptyState({ ...ids, planFingerprint: planFp }), cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(src, B) });
r = cv.setDecision(r, cv.sectionKey('c'), C.id, 'adopted', { fingerprint: cv.slotFingerprint(src, C, 'c') });
r = cv.setDecision(r, cv.elementKey('c', 'drums'), A.id, 'adopted', { fingerprint: cv.slotFingerprint(src, A, 'c', 'drums') });
r = cv.setDecision(r, cv.elementKey('c', 'drums'), C.id, 'rejected');
let res = cv.resolveCurrentPlan(src, cands, r);
assert.equal(res.tentative, false);
assert.equal(res.provenance[0].base.origin, 'global');
assert.equal(res.provenance[1].base.origin, 'section');
assert.equal(res.provenance[1].elements.drums.origin, 'element');
assert.equal(res.provenance[1].elements.counter.origin, 'section');
assert.equal(res.provenance[0].elements.drums.origin, 'global');
r = cv.releaseOverride(r, cv.elementKey('c', 'drums'));
assert.equal(cv.getStatus(r, cv.elementKey('c', 'drums'), C.id), 'rejected');
res = cv.resolveCurrentPlan(src, cands, r);
assert.equal(res.provenance[1].elements.drums.origin, 'section');
r = cv.releaseOverride(r, cv.sectionKey('c'));
res = cv.resolveCurrentPlan(src, cands, r);
assert.equal(res.provenance[1].base.origin, 'global');
assert.throws(() => cv.releaseOverride(r, cv.GLOBAL_KEY), /全体/);

// --- resolver: 優先順位と画面=Export一致
let q = cv.setDecision(cv.createEmptyState({ ...ids, planFingerprint: planFp }), cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(src, B) });
q = cv.setDecision(q, cv.sectionKey('c'), C.id, 'adopted', { fingerprint: cv.slotFingerprint(src, C, 'c') });
q = cv.setDecision(q, cv.elementKey('c', 'drums'), A.id, 'adopted', { fingerprint: cv.slotFingerprint(src, A, 'c', 'drums') });
res = cv.resolveCurrentPlan(src, cands, q);
assert.match(res.candidate.id, /^current-plan-[0-9a-f]{16}$/);
assert.equal(res.candidate.label, 'Current Planから合成');
assert.equal(res.candidate.sections[0].density, B.sections[0].density);
assert.equal(res.candidate.sections[1].density, C.sections[1].density);
assert.equal(cv.slotFingerprint(src, res.candidate, 'c', 'drums'), cv.slotFingerprint(src, A, 'c', 'drums'));
assert.equal(cv.slotFingerprint(src, res.candidate, 'v'), cv.slotFingerprint(src, B, 'v'));
assert.deepEqual(res.candidate.sections.map((x) => x.bars), src.sections.map((x) => x.bars));
for (const part of ['melody', 'counter', 'bass', 'drums', 'harmony']) assert.deepEqual(arrangedNotes(src, res.candidate, part), arrangedNotes(src, cv.resolveCurrentPlan(src, cands, q).candidate, part));
assert.deepEqual(cv.resolveCurrentPlan(src, cands, q).candidate, res.candidate); // 決定的
assert.ok(createPartMidi(src, res.candidate, 'melody') instanceof Uint8Array);
// 元Candidateは壊さない
assert.deepEqual(buildThreeCandidates(src, 'jpop-band'), cands);
// 全体未選択: 既定案で鳴る / 仮表示 / 採用扱いでない
const none = cv.resolveCurrentPlan(src, cands, cv.createEmptyState({ ...ids, planFingerprint: planFp }), { defaultCandidateId: B.id });
assert.equal(none.tentative, true);
assert.equal(none.tentativeLabel, '仮:B（未決定）');
assert.equal(none.unresolved.length, 2);
assert.equal(cv.slotFingerprint(src, none.candidate, 'c'), cv.slotFingerprint(src, B, 'c'));
// Section長不一致はエラー
const bad = JSON.parse(JSON.stringify(cands)); bad[0].sections[0].bars = 9;
assert.throws(() => cv.resolveCurrentPlan(src, bad, cv.setDecision(cv.createEmptyState({ ...ids, planFingerprint: planFp }), cv.GLOBAL_KEY, bad[0].id, 'adopted', { fingerprint: {} })), /小節数/);

// --- recovery
let g = q;
let v = cv.verifyState(g, { source: src, candidates: cands, now: T });
assert.equal(v.changed, false);
// 外部変更(source側のNote変更)→該当枠のみ未決定へ
const edited = JSON.parse(JSON.stringify(src)); edited.tracks.find((t) => t.role === 'drums').notes[1].pitch = 42;
v = cv.verifyState(g, { source: edited, candidates: cands, now: T });
assert.equal(v.changed, true);
assert.equal(v.message, '一部の判断を引き継げませんでした');
assert.equal(cv.getAdopted(v.state, cv.elementKey('c', 'drums')), null);
assert.equal(cv.getAdopted(v.state, cv.sectionKey('c')), null); // Section fpはdrumsを含む
assert.deepEqual(v.state.invalidGlobalSections, ['c']); // 全体判断はSection単位。Verseは無傷
assert.ok(cv.getAdopted(v.state, cv.GLOBAL_KEY));
assert.deepEqual(Object.keys(v.state.recovery).sort(), ['element:c:drums', 'global:c', 'section:c']);
assert.equal(v.state.recovery['section:c'].prior.candidateId, C.id);
assert.equal(v.state.recovery['section:c'].expiresAt, T + cv.RECOVERY_RETENTION_MS);
// 無効化後のresolver: 該当Sectionは仮案+未決定
let vr = cv.resolveCurrentPlan(edited, cands, v.state, { defaultCandidateId: B.id });
assert.equal(vr.tentative, true);
assert.equal(vr.provenance[0].base.origin, 'global');
assert.equal(vr.provenance[1].base.origin, 'default');
// 2回目の無効化でRecoveryを上書きしない
const edited2 = JSON.parse(JSON.stringify(edited)); edited2.tracks.find((t) => t.role === 'drums').notes[1].pitch = 46;
let v2 = cv.verifyState(cv.setDecision(v.state, cv.sectionKey('c'), A.id, 'adopted', { fingerprint: 'x', now: T + 1 }), { source: edited2, candidates: cands, now: T + 2 });
assert.equal(v2.state.recovery['section:c'].prior.candidateId, A.id); // 新判断でRecoveryは一度消え、新しい無効化で再作成
// 新判断を挟まない二重verifyでは保持される
let v3 = cv.verifyState(v.state, { source: edited2, candidates: cands, now: T + 5 });
assert.equal(v3.state.recovery['section:c'].prior.candidateId, C.id);
assert.equal(v3.changed, false);
// 「元の判断のまま採用」
let rr = cv.restoreRecovery(v.state, 'section:c', { source: edited, candidates: cands, now: T + 10 });
assert.equal(rr.ok, true);
assert.equal(cv.getAdopted(rr.state, cv.sectionKey('c')).candidateId, C.id);
assert.equal(cv.getAdopted(rr.state, cv.sectionKey('c')).fingerprint, cv.slotFingerprint(edited, C, 'c'));
assert.match(rr.journalText, /^【収束】/);
assert.equal(rr.state.recovery['section:c'], undefined);
rr = cv.restoreRecovery(rr.state, 'global:c', { source: edited, candidates: cands, now: T + 11 });
assert.equal(rr.ok, true); assert.deepEqual(rr.state.invalidGlobalSections, []);
assert.equal(cv.verifyState(rr.state, { source: edited, candidates: cands, now: T + 12 }).state.invalidGlobalSections.length, 0);
// 期限切れ
assert.equal(cv.restoreRecovery(v.state, 'section:c', { source: edited, candidates: cands, now: T + cv.RECOVERY_RETENTION_MS + 1 }).error, 'expired');
assert.equal(Object.keys(cv.purgeExpiredRecovery(v.state, T + cv.RECOVERY_RETENTION_MS + 1).recovery).length, 0);
assert.equal(Object.keys(cv.purgeExpiredRecovery(v.state, T + 1).recovery).length, 3);
// Candidate消失(再生成): その枠だけ未決定。他は維持
const regen = cands.filter((c) => c.id !== C.id);
let miss = cv.verifyState(q, { source: src, candidates: regen, now: T });
assert.equal(miss.notices.find((n) => n.key === 'section:c').reason, 'candidate-missing');
assert.ok(cv.getAdopted(miss.state, cv.elementKey('c', 'drums'))); // A採用は維持
assert.ok(cv.getAdopted(miss.state, cv.GLOBAL_KEY));
// 消えた候補への復元は失敗
assert.equal(cv.restoreRecovery(miss.state, 'section:c', { source: src, candidates: regen, now: T }).error, 'candidate-missing');
// Plan構造変更
const sameStruct = cv.checkPlanFingerprint(q, { ...ids, planFingerprint: planFp, now: T });
assert.equal(sameStruct.structureChanged, false);
const chg = cv.checkPlanFingerprint(q, { ...ids, planFingerprint: cv.planStructureFingerprint(s3), now: T });
assert.equal(chg.structureChanged, true);
assert.equal(Object.keys(chg.state.slots).length, 0);
assert.equal(chg.backup.payload.planFingerprint, planFp);
assert.equal(cv.checkPlanFingerprint(cv.createEmptyState(ids), { ...ids, planFingerprint: planFp }).state.planFingerprint, planFp);

// --- store
class Mem { constructor() { this.m = new Map(); } get length() { return this.m.size; } key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
const mem = new Mem();
assert.equal(cv.loadState(mem, ids).status, 'missing');
assert.equal(cv.saveState(mem, q).ok, true);
const lo = cv.loadState(mem, ids);
assert.equal(lo.status, 'ok'); assert.deepEqual(lo.state, JSON.parse(JSON.stringify(q)));
// 別Project/別Planは混ざらない
assert.equal(cv.loadState(mem, { projectId: 'demo-2', planId: 'plan-1' }).status, 'missing');
assert.equal(cv.loadState(mem, { projectId: 'demo-1', planId: 'plan-2' }).status, 'missing');
// 壊れたJSONは別キーへ退避(上書きしない)
mem.setItem(cv.stateKey(ids), '{broken');
const co = cv.loadState(mem, ids, 5);
assert.equal(co.status, 'corrupt'); assert.equal(mem.getItem(co.quarantineKey), '{broken'); assert.equal(mem.getItem(cv.stateKey(ids)), null);
mem.setItem(cv.stateKey(ids), '{broken2');
const co2 = cv.loadState(mem, ids, 5);
assert.notEqual(co2.quarantineKey, co.quarantineKey); assert.equal(mem.getItem(co.quarantineKey), '{broken');
// 新しいschemaは触らない
mem.setItem(cv.stateKey(ids), JSON.stringify({ storageSchemaVersion: 99 }));
assert.equal(cv.loadState(mem, ids).status, 'unsupported'); assert.ok(mem.getItem(cv.stateKey(ids)));
// Journalあり + 補助状態なし → 警告。Journalなし → 通知なし
const journal = [{ type: 'adopted', note: '【収束】ChorusをCへ' }];
assert.equal(cv.diagnoseLoad({ status: 'missing' }, journal), 'warn-missing');
assert.equal(cv.diagnoseLoad({ status: 'missing' }, [{ note: '通常の採用' }]), 'fresh');
assert.equal(cv.diagnoseLoad({ status: 'corrupt' }, []), 'warn-corrupt');
assert.equal(cv.diagnoseLoad({ status: 'ok', state: q }, journal), 'ok');
// 保存失敗は ok:false
const failing = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem() {}, key: () => null, length: 0 };
assert.equal(cv.saveState(failing, q).ok, false);
// 構造backupの保存・検索・期限
const m2 = new Mem();
assert.equal(cv.writeStructureBackup(m2, ids, chg.backup).ok, true);
assert.ok(cv.findStructureBackup(m2, ids, planFp, T + 1));
assert.equal(cv.findStructureBackup(m2, ids, 'other', T + 1), null);
cv.purgeExpiredBackups(m2, ids, T + cv.RECOVERY_RETENTION_MS + 1);
assert.equal(cv.findStructureBackup(m2, ids, planFp, T + 1), null);

console.log('arranger convergence core tests: OK');
