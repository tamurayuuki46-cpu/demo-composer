// Browser-independent integration boundary. All UI writers share this session.
import * as cv from '../convergence/index.js';
import { createArrangerProject } from './core.js';
import { ensureDecisionJournal } from './v05-workflow.js';
import {
  initializeConvergence, saveArrangerPlan, appendConvergenceJournal,
  applySnapshotToCurrentSource, writeRebaseBackup, candidatePoolKey, adoptStructureOffer,
} from './convergence-integration.js';

const clone = (v) => v == null ? v : JSON.parse(JSON.stringify(v));
export class ConvergenceSession {
  constructor(model, storage, notify = () => {}) {
    this.model = model;
    this.storage = storage;
    this.notify = notify;
    this.validationReady = false;
    this.state = null;
    this.tracker = cv.createDirtyTracker();
    this.warning = null;
    this.structureOffer = null;
    this.undo = null;
    this.readOnlyAux = false;
  }
  get selected() { return this.model.candidates[this.model.selectedIndex]; }
  makePlan(candidate = this.selected) {
    const plan = createArrangerProject(this.model.source, candidate, this.model.arrangerProject);
    plan.decisionJournal = clone(this.model.arrangerProject?.decisionJournal) || ensureDecisionJournal(plan, candidate);
    return plan;
  }
  initialize({ restorePool = false } = {}) {
    this.validationReady = false;
    this.undo = null;
    if (!this.model.source || !this.selected) return;
    this.model.arrangerProject ||= this.makePlan();
    if (restorePool) {
      try {
        const pool = JSON.parse(this.storage.getItem(candidatePoolKey(this.model.arrangerProject)) || 'null');
        if (Array.isArray(pool) && pool.length && pool.every(c => c?.id && this.model.source.sections.every(s => c.sections?.some(p => p.sectionId === s.id && p.bars === s.bars)))) {
          const id = this.selected.id;
          this.model.candidates = pool;
          this.model.selectedIndex = Math.max(0, pool.findIndex(c => c.id === id));
        }
      } catch { /* verifyState will expose missing referenced candidates */ }
    }
    const result = initializeConvergence({ storage: this.storage, source: this.model.source, candidates: this.model.candidates,
      plan: this.model.arrangerProject, journal: this.model.arrangerProject.decisionJournal });
    this.state = result.state;
    this.tracker = result.tracker;
    this.validationReady = result.validationReady;
    this.warning = result.warning;
    this.structureOffer = result.structureOffer;
    this.readOnlyAux = !result.persistenceAllowed;
    if (this.warning) this.notify(this.warning, true);
  }
  applyCandidateEdit(before, after) {
    if (!this.validationReady) throw new Error('収束判断を検証中です。');
    if (before.id !== after.id) throw new Error('候補の追加・切替は編集入口で処理できません。');
    const index = this.model.candidates.findIndex(c => c.id === before.id);
    if (index < 0) throw new Error('編集する候補が見つかりません。');
    const tracker = cv.recordEdit(this.tracker, this.state, { source: this.model.source, before, after });
    this.model.candidates[index] = after;
    this.tracker = tracker;
    return after;
  }
  save({ plan = this.makePlan(), journal = plan.decisionJournal } = {}) {
    if (this.readOnlyAux) return { ok: false, error: 'unsupported-state' };
    const result = saveArrangerPlan({ storage: this.storage, source: this.model.source, candidates: this.model.candidates,
      plan, convergenceState: this.state, journal, tracker: this.tracker, validationReady: this.validationReady,
      persistenceAllowed: !this.readOnlyAux });
    // Candidate edits remain usable in memory for Export even if storage fails.
    this.model.arrangerProject = { ...plan, decisionJournal: clone(journal) };
    if (result.ok) {
      this.state = result.state;
      this.tracker = result.tracker;
      if (result.message) this.notify(result.message, true);
    } else {
      this.notify('端末への保存に失敗しました。JSON / MIDI書き出しは利用できます。', true);
      this.notifyRollbackFailure(result);
    }
    return result;
  }
  current({ save = true } = {}) {
    if (!this.validationReady || !this.selected) throw new Error('先に曲と編曲案を用意してください。');
    if (save) this.save(); // implicit saves (comparison, Drum Fill, Export) share the same path.
    const result = cv.resolveCurrentPlan(this.model.source, this.model.candidates, this.state, { defaultCandidateId: this.model.candidates[1]?.id || this.selected.id });
    const plan = this.makePlan(result.candidate);
    return { ...result, plan, source: this.model.source, carryOver: cv.carryOverList(this.state) };
  }
  editable({ save = true } = {}) {
    if (save) this.save();
    return { plan: this.makePlan(), source: this.model.source, candidate: this.selected };
  }
  mutate(nextState, text) {
    if (!this.validationReady || this.readOnlyAux) throw new Error('収束判断は現在変更できません。');
    const previous = {
      state: this.state,
      tracker: this.tracker,
      journal: clone(this.model.arrangerProject?.decisionJournal),
      plan: this.model.arrangerProject,
    };
    const plan = this.makePlan();
    const journal = appendConvergenceJournal(plan.decisionJournal, text);
    plan.decisionJournal = journal;
    const result = saveArrangerPlan({
      storage: this.storage,
      source: this.model.source,
      candidates: this.model.candidates,
      plan,
      convergenceState: nextState,
      journal,
      tracker: this.tracker,
      validationReady: this.validationReady,
      persistenceAllowed: !this.readOnlyAux,
    });
    if (!result.ok) {
      this.notify('判断を保存できませんでした。元の判断とdirty状態を保持します。', true);
      this.notifyRollbackFailure(result);
      return result;
    }
    this.undo = { state: previous.state, tracker: previous.tracker, journal: previous.journal, plan: previous.plan };
    this.state = result.state;
    this.tracker = result.tracker;
    this.model.arrangerProject = result.plan;
    if (result.message) this.notify(result.message, true);
    return result;
  }
  decide(key, status, reasons = []) {
    const info = cv.parseSlotKey(key), candidate = this.selected;
    const fingerprint = key === cv.GLOBAL_KEY ? cv.globalFingerprintMap(this.model.source, candidate)
      : cv.slotFingerprint(this.model.source, candidate, info.sectionId, info.element || null);
    return this.mutate(cv.setDecision(this.state, key, candidate.id, status, { fingerprint, reasons, now: Date.now() }), `${key} / ${candidate.label}: ${status}${reasons.length ? ` (${reasons.join(' / ')})` : ''}`);
  }
  release(key) { return this.mutate(cv.releaseOverride(this.state, key, Date.now()), `${key} 上書き解除`); }
  carry(key) { return this.mutate(cv.setCarryOver(this.state, key, { now: Date.now() }), `${key} DAWで決める`); }
  notifyRollbackFailure(result) {
    if (result?.rollbackFailed?.length) this.notify('保存の巻き戻しにも失敗しました。端末内の保存が不整合の可能性があります。JSON書き出しで退避してください。', true);
  }
  undoDecision() {
    if (!this.undo) return { ok: false, error: 'no-undo' };
    const snapshot = this.undo;
    // 判断後に記録されたdirtyを落とさない(落とすと正規編集が外部変更Recoveryになる)。
    const mergedTracker = { dirty: { ...(this.tracker?.dirty || {}), ...(snapshot.tracker?.dirty || {}) } };
    const plan = this.makePlan();
    plan.decisionJournal = clone(snapshot.journal);
    const result = saveArrangerPlan({
      storage: this.storage,
      source: this.model.source,
      candidates: this.model.candidates,
      plan,
      convergenceState: snapshot.state,
      journal: snapshot.journal,
      tracker: mergedTracker,
      validationReady: this.validationReady,
      persistenceAllowed: !this.readOnlyAux,
    });
    if (!result.ok) {
      this.notify('Undoを保存できませんでした。現在の判断を保持します。', true);
      this.notifyRollbackFailure(result);
      return result;
    }
    this.state = result.state;
    this.tracker = result.tracker;
    this.model.arrangerProject = result.plan;
    this.undo = null;
    return result;
  }
  recover(key) {
    const result = key === 'structure' ? adoptStructureOffer({ offer: this.structureOffer, source: this.model.source, candidates: this.model.candidates })
      : cv.restoreRecovery(this.state, key, { source: this.model.source, candidates: this.model.candidates, now: Date.now() });
    if (!result.ok) throw new Error(`判断を復元できません: ${result.error}`);
    const saved = this.mutate(result.state, result.journalText || '【収束】元の構造の判断を復元');
    if (saved.ok && key === 'structure') this.structureOffer = null;
    return saved;
  }
  applySnapshot(planSnapshot) {
    const after = applySnapshotToCurrentSource({ planSnapshot, source: this.model.source, currentCandidate: this.selected });
    this.applyCandidateEdit(this.selected, after);
    const plan = this.makePlan();
    if (planSnapshot.decisionJournal) plan.decisionJournal = clone(planSnapshot.decisionJournal);
    return this.save({ plan });
  }
  rebase(nextSource) {
    const source = this.model.source;
    if (String(source.sourceProjectId) !== String(nextSource.sourceProjectId)) throw new Error('別の曲へrebaseできません。');
    // Backup must succeed before altering the working song. Keep all candidates and pending edits.
    const backupKey = writeRebaseBackup(this.storage, { plan: this.makePlan(), convergenceState: this.state, tracker: this.tracker });
    this.storage.setItem(`${backupKey}:candidates`, JSON.stringify(this.model.candidates));
    const applied = cv.applySave(this.state, this.tracker, { source, candidates: this.model.candidates, now: Date.now() });
    const previousIds = source.sections.map(s => s.id), nextIds = nextSource.sections.map(s => s.id);
    const candidates = this.model.candidates.map(candidate => applySnapshotToCurrentSource({ planSnapshot: this.makePlan(candidate), source: nextSource, currentCandidate: candidate }));
    this.model.source = nextSource;
    this.model.candidates = candidates;
    this.model.arrangerProject = this.makePlan();
    this.validationReady = false;
    try {
      const checked = cv.checkPlanFingerprint(applied.state, { projectId: applied.state.projectId, planId: applied.state.planId, planFingerprint: cv.planStructureFingerprint(nextSource), now: Date.now() });
      if (checked.backup) cv.writeStructureBackup(this.storage, applied.state, checked.backup);
      this.state = cv.purgeExpiredRecovery(cv.verifyState(checked.state, { source: nextSource, candidates, now: Date.now() }).state, Date.now());
      this.warning = checked.structureChanged ? `構成変更: 追加 ${nextIds.filter(id => !previousIds.includes(id)).length} / 削除 ${previousIds.filter(id => !nextIds.includes(id)).length}。元の判断は退避しました。` : null;
      this.structureOffer = cv.findStructureBackup(this.storage, this.state, cv.planStructureFingerprint(nextSource), Date.now());
      this.tracker = cv.createDirtyTracker();
    } catch (error) {
      this.state = cv.createEmptyState({ projectId: source.sourceProjectId, planId: this.model.arrangerProject.id, planFingerprint: cv.planStructureFingerprint(nextSource) });
      this.warning = `収束判断を検証できませんでした: ${error.message}`;
    } finally { this.validationReady = true; }
    if (Number(nextSource.sourceRevision) < Number(source.sourceRevision)) this.warning = '古いrevisionのファイルを読み込みました。元のPlanと判断はバックアップ済みです。';
    const persisted = this.save();
    if (!persisted.ok) this.notify('rebase結果は画面に保持しています。端末保存だけ失敗しました。', true);
    return { backupKey, warning: this.warning, save: persisted };
  }
}
