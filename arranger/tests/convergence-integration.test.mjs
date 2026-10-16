import assert from 'node:assert/strict';
import { normalizeSourceProject, buildThreeCandidates, createArrangerProject, updateCandidateSection } from '../src/core.js';
import * as cv from '../convergence/index.js';
import {
  ARRANGER_PLAN_STORAGE_KEY,
  ARRANGER_JOURNAL_STORAGE_KEY,
  initializeConvergence,
  saveArrangerPlan,
  rebaseSameProject,
  applySnapshotToCurrentSource,
} from '../src/convergence-integration.js';

class MemoryStorage {
  constructor() { this.map = new Map(); this.failKey = null; }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { if (this.failKey === key) throw new Error(`blocked:${key}`); this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

function rawProject(revision = 1, sections = null) {
  return {
    schemaVersion: 3,
    id: 'song-1',
    revision,
    metadata: { title: 'Integration' },
    basic: { bpm: 120, key: 'C', scale: 'major', timeSignature: '4/4', ppq: 480 },
    structure: { sections: sections || [
      { id: 'verse', kind: 'verse', name: 'A', bars: 2 },
      { id: 'chorus', kind: 'chorus', name: 'サビ', bars: 2, energy: 'high' },
    ] },
    chords: [{ root: 0, quality: 'major', startTick: 0, durationTick: 7680 }],
    tracks: [
      { role: 'melody', midiChannel: 2, notes: [{ pitch: 64, startTick: 0, durationTick: 480, velocity: 100 }] },
      { role: 'drums', midiChannel: 10, notes: [0, 3840].map(startTick => ({ pitch: 36, startTick, durationTick: 120, velocity: 110 })) },
      { role: 'counter', midiChannel: 4, notes: [{ pitch: 72, startTick: 2400, durationTick: 480, velocity: 90 }] },
    ],
  };
}

const source = normalizeSourceProject(rawProject());
const candidates = buildThreeCandidates(source, 'jpop-band');
const B = candidates[1];
const plan = createArrangerProject(source, B, null);
plan.id = 'plan-1';
const storage = new MemoryStorage();
const now = 1000;

// validationReady前は中央保存しない。
let aux = cv.createEmptyState({ projectId: 'song-1', planId: plan.id, planFingerprint: cv.planStructureFingerprint(source) });
let tracker = cv.createDirtyTracker();
let result = saveArrangerPlan({ storage, source, candidates, plan, convergenceState: aux, journal: null, tracker, validationReady: false, now });
assert.equal(result.ok, false);
assert.equal(result.error, 'validation-not-ready');
assert.equal(storage.getItem(ARRANGER_PLAN_STORAGE_KEY), null);

// 起動検証はmissingでもreadyになる。全体判断を作って保存できる。
const boot = initializeConvergence({ storage, source, candidates, plan, journal: null, now });
assert.equal(boot.validationReady, true);
assert.equal(boot.diagnosis, 'fresh');
aux = cv.setDecision(boot.state, cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(source, B), now });
tracker = boot.tracker;
const journal = { version: 1, entries: [{ reason: '【収束】Bを採用' }] };
result = saveArrangerPlan({ storage, source, candidates, plan, convergenceState: aux, journal, tracker, validationReady: true, now: now + 1 });
assert.equal(result.ok, true);
assert.ok(storage.getItem(ARRANGER_PLAN_STORAGE_KEY));
assert.ok(storage.getItem(ARRANGER_JOURNAL_STORAGE_KEY));

// 共通入口でdirtyを記録し、保存時にfingerprintを更新する。
const before = B;
const after = updateCandidateSection(before, 'chorus', { enabled: { drums: false } });
let dirty = cv.recordEdit(result.tracker, result.state, { source, before, after });
assert.ok(cv.dirtyKeys(dirty).includes('global:chorus'));
const editedCandidates = [candidates[0], after, candidates[2]];
const editedPlan = createArrangerProject(source, after, plan);
const savedEdit = saveArrangerPlan({ storage, source, candidates: editedCandidates, plan: editedPlan, convergenceState: result.state, journal, tracker: dirty, validationReady: true, now: now + 2 });
assert.equal(savedEdit.ok, true);
assert.equal(cv.dirtyKeys(savedEdit.tracker).length, 0);
assert.equal(savedEdit.externalChanges.length, 0);

// 共通入口を通らない変更は外部変更としてRecoveryへ送られる。
const external = updateCandidateSection(after, 'verse', { enabled: { drums: false } });
const externalCandidates = [candidates[0], external, candidates[2]];
const externalSave = saveArrangerPlan({ storage, source, candidates: externalCandidates, plan: createArrangerProject(source, external, plan), convergenceState: savedEdit.state, journal, tracker: savedEdit.tracker, validationReady: true, now: now + 3 });
assert.equal(externalSave.ok, true);
assert.ok(externalSave.externalChanges.some((item) => item.key === 'global:verse'));

// Journal保存失敗時は補助状態とtrackerを採用せず、Planも旧値へ戻す。
const rollbackStorage = new MemoryStorage();
const rollbackBoot = initializeConvergence({ storage: rollbackStorage, source, candidates, plan, journal: null, now });
let rollbackState = cv.setDecision(rollbackBoot.state, cv.GLOBAL_KEY, B.id, 'adopted', { fingerprint: cv.globalFingerprintMap(source, B), now });
const first = saveArrangerPlan({ storage: rollbackStorage, source, candidates, plan, convergenceState: rollbackState, journal, tracker: rollbackBoot.tracker, validationReady: true, now });
assert.equal(first.ok, true);
const oldPlanRaw = rollbackStorage.getItem(ARRANGER_PLAN_STORAGE_KEY);
const changed = updateCandidateSection(B, 'chorus', { enabled: { counter: false } });
const changedTracker = cv.recordEdit(first.tracker, first.state, { source, before: B, after: changed });
rollbackStorage.failKey = ARRANGER_JOURNAL_STORAGE_KEY;
const failed = saveArrangerPlan({ storage: rollbackStorage, source, candidates: [candidates[0], changed, candidates[2]], plan: createArrangerProject(source, changed, plan), convergenceState: first.state, journal: { version: 1, entries: [{ reason: '【収束】fail' }] }, tracker: changedTracker, validationReady: true, now: now + 4 });
assert.equal(failed.ok, false);
assert.deepEqual(failed.state, first.state);
assert.deepEqual(failed.tracker, changedTracker);
assert.equal(rollbackStorage.getItem(ARRANGER_PLAN_STORAGE_KEY), oldPlanRaw);
rollbackStorage.failKey = null;

// same-project rebaseはPlan ID、Candidate ID、未保存dirty trackerを維持し、新sourceへ更新する。
const nextSource = normalizeSourceProject(rawProject(2));
const rebased = rebaseSameProject({ plan: editedPlan, source, candidate: after, nextSource, convergenceState: savedEdit.state, tracker: dirty });
assert.equal(rebased.plan.id, plan.id);
assert.equal(rebased.candidate.id, after.id);
assert.equal(rebased.source.sourceRevision, 2);
assert.deepEqual(rebased.tracker, dirty);
assert.ok(rebased.candidates.some((candidate) => candidate.id === after.id));

// snapshot復元はsnapshot側sourceへ巻き戻さず、現在sourceにCandidate部分だけ適用する。
const snapshotPlan = createArrangerProject(source, updateCandidateSection(after, 'chorus', { enabled: { bass: false } }), plan);
const restoredCandidate = applySnapshotToCurrentSource({ planSnapshot: snapshotPlan, source: nextSource, currentCandidate: rebased.candidate });
assert.equal(restoredCandidate.id, rebased.candidate.id);
assert.equal(restoredCandidate.sections.length, nextSource.sections.length);
assert.equal(nextSource.sourceRevision, 2);

console.log('Arrangement Lab convergence integration tests: OK');
