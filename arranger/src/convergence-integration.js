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
} from '../convergence/index.js';
import { buildThreeCandidates, createArrangerProject, restoreArrangerProject } from './core.js';

export const ARRANGER_PLAN_STORAGE_KEY = 'demo-composer-arranger-v0.4';
export const ARRANGER_JOURNAL_STORAGE_KEY = 'demo-composer-arranger-decisions-v0.5';
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
      warning: convergenceWarningFor(diagnosis) || verified.message || null,
      recoveries: listRecoveries(convergenceState, now),
      structureChanged: checked.structureChanged,
      structureBackupWrite: backupWrite,
      structureOffer,
      load: loaded,
    };
  } catch (error) {
    // validationReady は例外でも開く。読み取れた旧補助状態があれば7日バックアップへ退避する。
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

export function saveArrangerPlan({
  storage,
  source,
  candidates,
  plan,
  convergenceState,
  journal = null,
  tracker,
  validationReady,
  now = Date.now(),
  planStorageKey = ARRANGER_PLAN_STORAGE_KEY,
  journalStorageKey = ARRANGER_JOURNAL_STORAGE_KEY,
}) {
  if (!validationReady) return { ok: false, error: 'validation-not-ready', state: convergenceState, tracker };
  if (!plan || !source || !convergenceState || !tracker) return { ok: false, error: 'missing-save-input', state: convergenceState, tracker };

  const oldPlanRaw = storage.getItem(planStorageKey);
  const oldJournalRaw = storage.getItem(journalStorageKey);
  const applied = applySave(convergenceState, tracker, { source, candidates, now });
  const auxWrite = saveState(storage, applied.state);
  if (!auxWrite.ok) return { ok: false, error: `convergence-save-failed:${auxWrite.error || 'unknown'}`, state: convergenceState, tracker };

  const nextPlan = clone(plan);
  if (journal) nextPlan.decisionJournal = clone(journal);
  try {
    // 補助状態 → Plan → Journal。Journalは常に最後。
    const planText = JSON.stringify(nextPlan);
    storage.setItem(planStorageKey, planText);
    if (storage.getItem(planStorageKey) !== planText) throw new Error('plan-readback-mismatch');
    if (journal) {
      const journalText = JSON.stringify(journal);
      storage.setItem(journalStorageKey, journalText);
      if (storage.getItem(journalStorageKey) !== journalText) throw new Error('journal-readback-mismatch');
    }
  } catch (error) {
    // Plan/Journal失敗時は先に保存した補助状態も旧stateへ戻す。trackerは呼び出し側の旧値を保持する。
    saveState(storage, convergenceState);
    try { restoreRaw(storage, planStorageKey, oldPlanRaw); } catch { /* best effort */ }
    try { restoreRaw(storage, journalStorageKey, oldJournalRaw); } catch { /* best effort */ }
    return { ok: false, error: `plan-save-failed:${error?.message || String(error)}`, state: convergenceState, tracker };
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
  const key = `${REBASE_BACKUP_PREFIX}:${plan?.id || 'unknown'}:${now}`;
  const payload = { plan: clone(plan), convergenceState: clone(convergenceState), tracker: clone(tracker), createdAt: now };
  storage.setItem(key, JSON.stringify(payload));
  return key;
}

function sourceMeta(source) {
  return {
    projectId: source.sourceProjectId,
    revision: source.sourceRevision,
    schemaVersion: source.sourceSchemaVersion,
    appVersion: source.sourceAppVersion,
    title: source.title,
    basic: clone(source.basic),
    sections: clone(source.sections),
  };
}

export function rebaseSameProject({ plan, source, candidate, nextSource, convergenceState, tracker }) {
  if (!plan || !source || !candidate || !nextSource) throw new Error('rebaseに必要なPlan / source / candidateがありません。');
  const oldProjectId = source.sourceProjectId ?? plan.source?.projectId;
  if (String(oldProjectId) !== String(nextSource.sourceProjectId)) throw new Error('別Projectにはrebaseできません。');

  // 未保存のCandidate編集もPlanバックアップへ含める。
  const workingPlan = createArrangerProject(source, candidate, plan);
  const synthetic = clone(workingPlan);
  synthetic.source = sourceMeta(nextSource);
  synthetic.sourceSnapshot = clone(nextSource.sourceSnapshot);
  const restored = restoreArrangerProject(synthetic, nextSource);
  const rebasedCandidate = restored.candidate;
  const rebasedPlan = createArrangerProject(nextSource, rebasedCandidate, plan); // Plan IDを維持

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
  const synthetic = clone(planSnapshot);
  synthetic.source = sourceMeta(source);
  synthetic.sourceSnapshot = clone(source.sourceSnapshot);
  synthetic.arrangement = {
    ...clone(planSnapshot.arrangement),
    id: currentCandidate.id,
    label: currentCandidate.label,
    styleId: currentCandidate.styleId,
    styleName: currentCandidate.styleName,
  };
  const restored = restoreArrangerProject(synthetic, source);
  return restored.candidate;
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
