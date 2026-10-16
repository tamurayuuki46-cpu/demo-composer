import {
  adoptStructureBackup,
  applySave,
  checkPlanFingerprint,
  createDirtyTracker,
  createEmptyState,
  diagnoseLoad,
  findStructureBackup,
  listRecoveries,
  loadState,
  planStructureFingerprint,
  purgeExpiredRecovery,
  saveState,
  verifyState,
  writeStructureBackup,
  stateKey,
} from '../convergence/index.js';
import { buildThreeCandidates, createArrangerProject } from './core.js';

export const ARRANGER_PLAN_STORAGE_KEY = 'demo-composer-arranger-v0.4';
export const ARRANGER_JOURNAL_STORAGE_KEY = 'demo-composer-arranger-decisions-v0.5';
export const candidatePoolKey = (plan) => `demo-composer-arranger-candidates:${plan.source.projectId}:${plan.id}`;
export const REBASE_BACKUP_PREFIX = 'demo-composer-arranger-rebase-backup-v1';

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

export function convergenceIds(plan, source) {
  if (!plan?.id || !source) throw new Error('収束状態に必要なPlan / sourceがありません。');
  return {
    projectId: source.sourceProjectId ?? plan.source?.projectId ?? 'unknown-project',
    planId: plan.id,
  };
}

export function convergenceWarningFor(diagnosis) {
  if (diagnosis === 'warn-missing' || diagnosis === 'warn-corrupt') return '収束判断が見つかりません';
  if (diagnosis === 'unsupported') return 'この端末の収束判断は新しい形式です。判断を変更せずに開きました。';
  if (diagnosis === 'unavailable') return '収束判断の保存領域を利用できません。書き出し前に確認してください。';
  return null;
}

export function initializeConvergence({ storage, source, candidates, plan, journal = null, now = Date.now() }) {
  const ids = convergenceIds(plan, source);
  const fingerprint = planStructureFingerprint(source);
  let loaded = null;
  try {
    loaded = loadState(storage, ids, now);
    const diagnosis = diagnoseLoad(loaded, journal);
    let convergenceState = loaded.status === 'ok'
      ? loaded.state
      : createEmptyState({ ...ids, planFingerprint: fingerprint });

    const checked = checkPlanFingerprint(convergenceState, { ...ids, planFingerprint: fingerprint, now });
    let backupWrite = null;
    if (checked.backup) backupWrite = writeStructureBackup(storage, ids, checked.backup);
    convergenceState = checked.state;

    const verified = verifyState(convergenceState, { source, candidates, now });
    convergenceState = purgeExpiredRecovery(verified.state, now);
    const structureOffer = findStructureBackup(storage, ids, fingerprint, now);

    return {
      state: convergenceState,
      tracker: createDirtyTracker(),
      validationReady: true,
      diagnosis,
      persistenceAllowed: !['unsupported', 'unavailable'].includes(diagnosis),
      warning: convergenceWarningFor(diagnosis) || verified.message || null,
      recoveries: listRecoveries(convergenceState, now),
      structureChanged: checked.structureChanged,
      structureBackupWrite: backupWrite,
      structureOffer,
      load: loaded,
    };
  } catch (error) {
    try {
      if (loaded?.state) {
        writeStructureBackup(storage, ids, {
          payload: clone(loaded.state),
          createdAt: now,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000,
        });
      }
    } catch { /* backup failure must not keep the gate closed */ }
    const fallback = createEmptyState({ ...ids, planFingerprint: fingerprint });
    return {
      state: fallback,
      tracker: createDirtyTracker(),
      validationReady: true,
      diagnosis: 'validation-error',
      persistenceAllowed: false,
      warning: `収束判断を検証できませんでした: ${error?.message || String(error)}`,
      recoveries: [],
      structureChanged: false,
      structureBackupWrite: null,
      structureOffer: null,
      load: loaded,
      error,
    };
  }
}

function restoreRaw(storage, key, raw) {
  if (raw === null || raw === undefined) storage.removeItem(key);
  else storage.setItem(key, raw);
}

// rollback失敗を握りつぶさず、失敗したkeyを返す(UIで別文言を出すため)。
function rollbackAll(storage, entries) {
  const failed = [];
  for (const [key, raw] of entries) {
    try { restoreRaw(storage, key, raw); } catch { failed.push(key); }
  }
  return failed;
}

export function saveArrangerPlan({
  storage,
  source,
  candidates,
  plan,
  convergenceState,
  journal = null,
  tracker,
  validationReady,
  persistenceAllowed = true,
  now = Date.now(),
  planStorageKey = ARRANGER_PLAN_STORAGE_KEY,
  journalStorageKey = ARRANGER_JOURNAL_STORAGE_KEY,
}) {
  if (!validationReady) return { ok: false, error: 'validation-not-ready', state: convergenceState, tracker };
  if (!persistenceAllowed) return { ok: false, error: 'convergence-persistence-blocked', state: convergenceState, tracker };
  if (!plan || !source || !convergenceState || !tracker) return { ok: false, error: 'missing-save-input', state: convergenceState, tracker };

  let oldPlanRaw, oldJournalRaw, oldPoolRaw, oldAuxRaw, applied;
  const poolKey = candidatePoolKey(plan), auxKey = stateKey(convergenceState);
  try {
    oldPlanRaw = storage.getItem(planStorageKey);
    oldJournalRaw = storage.getItem(journalStorageKey);
    oldPoolRaw = storage.getItem(poolKey);
    oldAuxRaw = storage.getItem(auxKey);
    applied = applySave(convergenceState, tracker, { source, candidates, now });
    const poolText = JSON.stringify(candidates);
    storage.setItem(poolKey, poolText);
    if (storage.getItem(poolKey) !== poolText) throw new Error('candidate-readback-mismatch');
  } catch (error) {
    const rollbackFailed = rollbackAll(storage, [[poolKey, oldPoolRaw]]);
    return { ok: false, error: String(error), rollbackFailed, state: convergenceState, tracker };
  }
  const auxWrite = saveState(storage, applied.state);
  if (!auxWrite.ok) {
    const rollbackFailed = rollbackAll(storage, [[poolKey, oldPoolRaw], [auxKey, oldAuxRaw]]);
    return { ok: false, error: `convergence-save-failed:${auxWrite.error || 'unknown'}`, rollbackFailed, state: convergenceState, tracker };
  }

  const nextPlan = clone(plan);
  if (journal) nextPlan.decisionJournal = clone(journal);
  try {
    const planText = JSON.stringify(nextPlan);
    storage.setItem(planStorageKey, planText);
    if (storage.getItem(planStorageKey) !== planText) throw new Error('plan-readback-mismatch');
    if (journal) {
      const journalText = JSON.stringify(journal);
      storage.setItem(journalStorageKey, journalText);
      if (storage.getItem(journalStorageKey) !== journalText) throw new Error('journal-readback-mismatch');
    }
  } catch (error) {
    const rollbackFailed = rollbackAll(storage, [[auxKey, oldAuxRaw], [poolKey, oldPoolRaw], [planStorageKey, oldPlanRaw], [journalStorageKey, oldJournalRaw]]);
    return { ok: false, error: `plan-save-failed:${error?.message || String(error)}`, rollbackFailed, state: convergenceState, tracker };
  }

  return {
    ok: true,
    plan: nextPlan,
    state: applied.state,
    tracker: applied.tracker,
    refreshed: applied.refreshed,
    externalChanges: applied.externalChanges,
    message: applied.message,
  };
}

export function appendConvergenceJournal(journal, text, now = Date.now()) {
  const at = new Date(now).toISOString();
  const next = clone(journal) || { version: 1, createdAt: at, entries: [] };
  if (!Array.isArray(next.entries)) next.entries = [];
  next.entries.push({
    id: `convergence-${now}-${next.entries.length + 1}`,
    at,
    status: 'convergence',
    statusLabel: '収束',
    sectionId: null,
    sectionName: '収束モード',
    reason: String(text).startsWith('【収束】') ? String(text) : `【収束】${text}`,
  });
  next.updatedAt = at;
  return next;
}

export function writeRebaseBackup(storage, { plan, convergenceState, tracker, now = Date.now() }) {
  const baseKey = `${REBASE_BACKUP_PREFIX}:${plan?.id || 'unknown'}:${now}`;
  let key = baseKey, suffix = 1;
  while (storage.getItem(key) !== null) key = `${baseKey}-${suffix++}`;
  const payload = { plan: clone(plan), convergenceState: clone(convergenceState), tracker: clone(tracker), createdAt: now };
  storage.setItem(key, JSON.stringify(payload));
  return key;
}

function rebaseCandidateToSource(planSnapshot, source, currentCandidate) {
  const saved = clone(planSnapshot?.arrangement || currentCandidate);
  const generated = buildThreeCandidates(source, currentCandidate.styleId || saved?.styleId || 'jpop-band');
  const template = generated.find((item) => item.id === currentCandidate.id)
    || generated.find((item) => item.id === saved?.id)
    || generated[1]
    || generated[0];
  if (!template) throw new Error('現在source用のCandidateを作れませんでした。');

  const savedBySection = new Map((saved?.sections || []).map((section) => [section.sectionId, section]));
  const templateBySection = new Map((template.sections || []).map((section) => [section.sectionId, section]));
  const sections = source.sections.map((sourceSection) => {
    const prior = savedBySection.get(sourceSection.id);
    const fallback = templateBySection.get(sourceSection.id);
    const section = clone(prior || fallback);
    if (!section) throw new Error(`Section ${sourceSection.id} をrebaseできませんでした。`);
    return {
      ...section,
      sectionId: sourceSection.id,
      sectionName: sourceSection.name,
      kind: sourceSection.kind,
      bars: sourceSection.bars,
      energy: sourceSection.energy,
    };
  });

  return {
    ...clone(template),
    ...saved,
    id: currentCandidate.id,
    label: currentCandidate.label,
    styleId: currentCandidate.styleId,
    styleName: currentCandidate.styleName,
    sections,
  };
}

export function rebaseSameProject({ plan, source, candidate, nextSource, convergenceState, tracker }) {
  if (!plan || !source || !candidate || !nextSource) throw new Error('rebaseに必要なPlan / source / candidateがありません。');
  const oldProjectId = source.sourceProjectId ?? plan.source?.projectId;
  if (String(oldProjectId) !== String(nextSource.sourceProjectId)) throw new Error('別Projectにはrebaseできません。');

  const workingPlan = createArrangerProject(source, candidate, plan);
  const rebasedCandidate = rebaseCandidateToSource(workingPlan, nextSource, candidate);
  const rebasedPlan = createArrangerProject(nextSource, rebasedCandidate, plan);
  const candidates = buildThreeCandidates(nextSource, rebasedCandidate.styleId || 'jpop-band');
  const matchingIndex = candidates.findIndex((item) => item.id === rebasedCandidate.id);
  let selectedIndex;
  if (matchingIndex >= 0) {
    candidates[matchingIndex] = rebasedCandidate;
    selectedIndex = matchingIndex;
  } else {
    candidates.push(rebasedCandidate);
    selectedIndex = candidates.length - 1;
  }

  return {
    plan: rebasedPlan,
    source: nextSource,
    candidate: rebasedCandidate,
    candidates,
    selectedIndex,
    tracker: clone(tracker) || createDirtyTracker(),
    convergenceState: clone(convergenceState),
    backup: { plan: workingPlan, convergenceState: clone(convergenceState), tracker: clone(tracker) },
  };
}

export function applySnapshotToCurrentSource({ planSnapshot, source, currentCandidate }) {
  if (!planSnapshot?.arrangement || !source || !currentCandidate) throw new Error('snapshot復元に必要なデータがありません。');
  return rebaseCandidateToSource(planSnapshot, source, currentCandidate);
}

export function adoptStructureOffer({ offer, source, candidates, now = Date.now() }) {
  if (!offer?.backup) return { ok: false, error: 'not-found' };
  return adoptStructureBackup(offer.backup, {
    source,
    candidates,
    planFingerprint: planStructureFingerprint(source),
    now,
  });
}
