import { generateMusicLabCandidates, adoptMusicLabCandidate } from './music-lab.js';
import { MUSIC_LAB_CATALOG } from './music-lab-catalog.js';
import { THEORY_METHODS, buildTheorySuggestions, theoryAudition } from './reharm-theory.js';
import { adoptSectionFrom, buildChorusCandidates, buildSubtractionCandidates, buildCounterScaleCandidates, leadHandoffCandidate } from './arrangement-tools.js';
import { sectionFeatures } from './feature-ui.js';
import { startPreview } from './preview.js';
import {
  ARRANGER_VERSION,
  STYLE_PROFILES,
  normalizeSourceProject,
  buildThreeCandidates,
  updateCandidateSection,
  mixCandidates,
  candidateCurve,
  detectMelodyCounterCollisions,
  buildReharmSuggestions,
  createArrangerProject,
  summarizeCandidate,
  createPartMidi,
  restoreArrangerProject,
} from './core.js';
import {
  GLOBAL_KEY,
  carryOverList,
  elementKey,
  getAdopted,
  globalFingerprintMap,
  listRecoveries,
  parseSlotKey,
  recordEdit,
  releaseOverride,
  resolveCurrentPlan,
  restoreRecovery,
  sectionKey,
  setCarryOver,
  setDecision,
  slotFingerprint,
} from '../convergence/index.js';
import {
  ARRANGER_JOURNAL_STORAGE_KEY,
  ARRANGER_PLAN_STORAGE_KEY,
  adoptStructureOffer as restoreStructureOffer,
  appendConvergenceJournal,
  applySnapshotToCurrentSource,
  initializeConvergence,
  rebaseSameProject,
  saveArrangerPlan as persistArrangerPlan,
  writeRebaseBackup,
} from './convergence-integration.js';

const STORAGE_KEY = ARRANGER_PLAN_STORAGE_KEY;
const JOURNAL_KEY = ARRANGER_JOURNAL_STORAGE_KEY;
const V03_STORAGE_KEY = 'demo-composer-arranger-v0.3';
const PREVIOUS_STORAGE_KEY = 'demo-composer-arranger-v0.2';
const LEGACY_STORAGE_KEY = 'demo-composer-arranger-v0.1';

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

const state = {
  source: null,
  styleId: 'jpop-band',
  candidates: [],
  selectedIndex: 1,
  arrangerProject: null,
  reharmSuggestions: {},
  features: {},
  previewContext: null,
  convergenceState: null,
  tracker: null,
  validationReady: false,
  convergenceWarning: null,
  convergenceDiagnosis: null,
  structureOffer: null,
  undoSnapshot: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  version: $('#version'), file: $('#project-file'), drop: $('#drop-zone'), sourceSummary: $('#source-summary'),
  collisionSummary: $('#collision-summary'), style: $('#style-select'), generate: $('#generate-btn'),
  previewSection: $('#preview-section'), preview: $('#preview-btn'), stop: $('#stop-btn'), candidateTabs: $('#candidate-tabs'), mixA: $('#mix-a'), mixB: $('#mix-b'),
  mix: $('#mix-btn'), candidateMeta: $('#candidate-meta'), curve: $('#curve'), sections: $('#sections'),
  midiButtons: $('#midi-buttons'), adopt: $('#adopt-btn'), exportBtn: $('#export-btn'), clear: $('#clear-btn'), message: $('#message'),
};

els.version.textContent = ARRANGER_VERSION;
Object.values(STYLE_PROFILES).forEach((profile) => {
  const option = document.createElement('option');
  option.value = profile.id;
  option.textContent = profile.name;
  els.style.append(option);
});
els.style.value = state.styleId;

els.style.addEventListener('change', () => {
  state.styleId = els.style.value;
  if (state.source) generateCandidates();
});
els.generate.addEventListener('click', generateCandidates);
els.preview.addEventListener('click', previewCurrentCandidate);
els.stop.addEventListener('click', stopPreview);
els.mix.addEventListener('click', createMixCandidate);
els.adopt.addEventListener('click', adoptCurrentCandidate);
els.exportBtn.addEventListener('click', exportPlan);
els.clear.addEventListener('click', clearAll);
els.file.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) importFile(file);
});
els.sections.addEventListener('change', handleSectionChange);
els.sections.addEventListener('click', handleSectionClick);
els.midiButtons.addEventListener('click', handleMidiExport);

['dragenter', 'dragover'].forEach((name) => {
  els.drop.addEventListener(name, (event) => {
    event.preventDefault();
    els.drop.classList.add('is-dragging');
  });
});
['dragleave', 'drop'].forEach((name) => {
  els.drop.addEventListener(name, (event) => {
    event.preventDefault();
    els.drop.classList.remove('is-dragging');
  });
});
els.drop.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer.files;
  if (file) importFile(file);
});

function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return clone(state.arrangerProject?.decisionJournal || null);
}

function emitConvergenceChange() {
  window.dispatchEvent(new CustomEvent('arranger-convergence-change'));
}

function currentCandidate() {
  return state.candidates[state.selectedIndex] || null;
}

function ensurePlan(candidate = currentCandidate()) {
  if (!state.source || !candidate) return null;
  if (!state.arrangerProject) state.arrangerProject = createArrangerProject(state.source, candidate, null);
  return state.arrangerProject;
}

function planForCandidate(candidate = currentCandidate()) {
  if (!state.source || !candidate) return state.arrangerProject;
  return createArrangerProject(state.source, candidate, state.arrangerProject);
}

function bootConvergence({ preserveTracker = null } = {}) {
  const candidate = currentCandidate();
  const plan = ensurePlan(candidate);
  if (!state.source || !candidate || !plan) {
    state.validationReady = false;
    state.convergenceState = null;
    state.tracker = null;
    emitConvergenceChange();
    return null;
  }
  const boot = initializeConvergence({
    storage: localStorage,
    source: state.source,
    candidates: state.candidates,
    plan,
    journal: loadJournal(),
    now: Date.now(),
  });
  state.convergenceState = boot.state;
  state.tracker = preserveTracker || boot.tracker;
  state.validationReady = boot.validationReady;
  state.convergenceWarning = boot.warning;
  state.convergenceDiagnosis = boot.diagnosis;
  state.structureOffer = boot.structureOffer;
  if (boot.message) flash(boot.message, true);
  emitConvergenceChange();
  return boot;
}

function getResolved() {
  if (!state.source || !state.candidates.length) return null;
  if (!state.convergenceState || !state.validationReady) {
    const candidate = currentCandidate();
    return candidate ? { candidate, provenance: [], tentative: true, tentativeLabel: candidate.label, unresolved: [] } : null;
  }
  return resolveCurrentPlan(state.source, state.candidates, state.convergenceState, {
    defaultCandidateId: currentCandidate()?.id || state.candidates[1]?.id || state.candidates[0]?.id,
  });
}

function getContext() {
  const resolved = getResolved();
  return {
    source: state.source,
    candidates: state.candidates,
    selectedCandidate: currentCandidate(),
    plan: state.arrangerProject,
    convergenceState: state.convergenceState,
    tracker: state.tracker,
    validationReady: state.validationReady,
    warning: state.convergenceWarning,
    diagnosis: state.convergenceDiagnosis,
    structureOffer: state.structureOffer,
    recoveries: state.convergenceState ? listRecoveries(state.convergenceState, Date.now()) : [],
    resolved,
    carryOver: state.convergenceState ? carryOverList(state.convergenceState) : [],
  };
}

function saveArrangerPlan({ plan = null, convergenceState = state.convergenceState, journal = loadJournal(), tracker = state.tracker } = {}) {
  const candidate = currentCandidate();
  const nextPlan = plan || planForCandidate(candidate);
  if (!nextPlan || !state.source || !convergenceState || !tracker) return { ok: false, error: 'missing-save-input' };
  const result = persistArrangerPlan({
    storage: localStorage,
    source: state.source,
    candidates: state.candidates,
    plan: nextPlan,
    convergenceState,
    journal,
    tracker,
    validationReady: state.validationReady,
    now: Date.now(),
  });
  if (result.ok) {
    state.arrangerProject = result.plan;
    state.convergenceState = result.state;
    state.tracker = result.tracker;
    if (result.message) state.convergenceWarning = result.message;
    els.exportBtn.disabled = false;
    emitConvergenceChange();
  }
  return result;
}

function applyCandidateEdit(editor, { render = true } = {}) {
  const before = currentCandidate();
  if (!before) return null;
  const after = editor(before);
  if (!after) return before;
  if (after.id !== before.id) throw new Error('Candidate編集ではIDを変更できません。');
  if (state.validationReady && state.convergenceState && state.tracker) {
    state.tracker = recordEdit(state.tracker, state.convergenceState, { source: state.source, before, after });
  }
  state.candidates[state.selectedIndex] = after;
  if (render) renderCandidates();
  emitConvergenceChange();
  return after;
}

function decisionFingerprint(key, candidate) {
  if (key === GLOBAL_KEY) return globalFingerprintMap(state.source, candidate);
  const info = parseSlotKey(key);
  return slotFingerprint(state.source, candidate, info.sectionId, info.element || null);
}

function rememberUndo() {
  state.undoSnapshot = {
    convergenceState: clone(state.convergenceState),
    tracker: clone(state.tracker),
    plan: clone(state.arrangerProject),
    journal: loadJournal(),
    warning: state.convergenceWarning,
  };
}

function saveConvergenceMutation(nextState, journalText) {
  const journal = appendConvergenceJournal(loadJournal(), journalText, Date.now());
  const prior = {
    convergenceState: clone(state.convergenceState),
    tracker: clone(state.tracker),
    plan: clone(state.arrangerProject),
    journal: loadJournal(),
    warning: state.convergenceWarning,
  };
  const result = saveArrangerPlan({ convergenceState: nextState, journal, tracker: state.tracker });
  if (result.ok) state.undoSnapshot = prior;
  else flash('判断の保存に失敗しました。編集内容は保持しています。', true);
  return result;
}

function decide(key, status, reason = '') {
  const candidate = currentCandidate();
  if (!candidate || !state.convergenceState) return { ok: false, error: 'not-ready' };
  try {
    const options = { reasons: reason ? [reason] : [], now: Date.now() };
    if (status === 'adopted') options.fingerprint = decisionFingerprint(key, candidate);
    const next = setDecision(state.convergenceState, key, candidate.id, status, options);
    return saveConvergenceMutation(next, `【収束】${key} / ${candidate.label} / ${status}${reason ? ` / ${reason}` : ''}`);
  } catch (error) {
    flash(error.message || '判断を記録できませんでした。', true);
    return { ok: false, error: error.message };
  }
}

function release(key) {
  if (!state.convergenceState || key === GLOBAL_KEY) return { ok: false, error: 'invalid-scope' };
  try {
    const next = releaseOverride(state.convergenceState, key, Date.now());
    return saveConvergenceMutation(next, `【収束】上書き解除 / ${key}`);
  } catch (error) {
    flash(error.message || '上書きを解除できませんでした。', true);
    return { ok: false, error: error.message };
  }
}

function carryOver(key) {
  if (!state.convergenceState) return { ok: false, error: 'not-ready' };
  const next = setCarryOver(state.convergenceState, key, { note: 'DAWで決める', now: Date.now() });
  return saveConvergenceMutation(next, `【収束】DAWで決める / ${key}`);
}

function restoreRecoveryDecision(key) {
  if (!state.convergenceState) return { ok: false, error: 'not-ready' };
  const restored = restoreRecovery(state.convergenceState, key, { source: state.source, candidates: state.candidates, now: Date.now() });
  if (!restored.ok) return restored;
  return saveConvergenceMutation(restored.state, restored.journalText);
}

function adoptStructureRecovery() {
  const restored = restoreStructureOffer({ offer: state.structureOffer, source: state.source, candidates: state.candidates, now: Date.now() });
  if (!restored.ok) return restored;
  const result = saveConvergenceMutation(restored.state, '【収束】以前の構成判断を復元');
  if (result.ok) state.structureOffer = null;
  return result;
}

function undoConvergence() {
  const snapshot = state.undoSnapshot;
  if (!snapshot) return { ok: false, error: 'no-undo' };
  const result = saveArrangerPlan({
    plan: snapshot.plan || planForCandidate(),
    convergenceState: snapshot.convergenceState,
    journal: snapshot.journal,
    tracker: snapshot.tracker,
  });
  if (result.ok) {
    state.convergenceWarning = snapshot.warning;
    state.undoSnapshot = null;
    emitConvergenceChange();
  }
  return result;
}

function scopeOptions() {
  const options = [{ key: GLOBAL_KEY, label: '曲全体' }];
  for (const section of state.source?.sections || []) {
    options.push({ key: sectionKey(section.id), label: `${section.name} / Section` });
    options.push({ key: elementKey(section.id, 'counter'), label: `${section.name} / 裏メロ` });
    options.push({ key: elementKey(section.id, 'drums'), label: `${section.name} / Drums` });
  }
  return options;
}

function selectedContext({ save = false, journal = loadJournal() } = {}) {
  const candidate = currentCandidate();
  if (!candidate || !state.source) throw new Error('先にproject.jsonを読み込んで編曲案を用意してください。');
  const plan = planForCandidate(candidate);
  if (save) {
    const result = saveArrangerPlan({ plan, journal });
    if (!result.ok) flash('端末保存には失敗しましたが、現在の案はこのまま利用できます。', true);
  }
  return { plan, source: state.source, candidate, saveResult: null };
}

function currentPlanContext({ save = false, journal = loadJournal() } = {}) {
  const resolved = getResolved();
  if (!resolved?.candidate || !state.source) throw new Error('先にproject.jsonを読み込んで編曲案を用意してください。');
  const selectedPlan = planForCandidate(currentCandidate());
  let saveResult = null;
  if (save) {
    saveResult = saveArrangerPlan({ plan: selectedPlan, journal });
    if (!saveResult.ok) flash('端末保存には失敗しましたが、書き出しは続行できます。', true);
  }
  const exportPlan = createArrangerProject(state.source, resolved.candidate, state.arrangerProject);
  exportPlan.arrangement = clone(resolved.candidate);
  exportPlan.selectedCandidateId = resolved.candidate.id;
  if (journal) exportPlan.decisionJournal = clone(journal);
  exportPlan.convergenceCarryOver = state.convergenceState ? carryOverList(state.convergenceState) : [];
  return { plan: exportPlan, source: state.source, candidate: resolved.candidate, resolved, saveResult };
}

function savePlanWithJournal(planLike, journal = planLike?.decisionJournal || loadJournal()) {
  const plan = planForCandidate(currentCandidate());
  if (journal) plan.decisionJournal = clone(journal);
  return saveArrangerPlan({ plan, journal });
}

function applyPlanSnapshotBridge(planSnapshot) {
  try {
    const before = currentCandidate();
    if (!before) throw new Error('現在の候補がありません。');
    const after = applySnapshotToCurrentSource({ planSnapshot, source: state.source, currentCandidate: before });
    applyCandidateEdit(() => after, { render: true });
    const journal = planSnapshot?.decisionJournal || loadJournal();
    const result = saveArrangerPlan({ plan: planForCandidate(after), journal });
    if (!result.ok) flash('復元内容は画面に保持しました。端末保存だけ失敗しています。', true);
    return { ...result, candidate: after };
  } catch (error) {
    flash(error.message || 'snapshotを復元できませんでした。', true);
    return { ok: false, error: error.message };
  }
}

function handleSameProjectRebase(nextSource) {
  const plan = state.arrangerProject;
  const candidate = currentCandidate() || clone(plan?.arrangement);
  if (!plan || !candidate) return false;
  const oldSource = state.source || nextSource;
  try {
    writeRebaseBackup(localStorage, { plan: planForCandidate(candidate) || plan, convergenceState: state.convergenceState, tracker: state.tracker, now: Date.now() });
    const rebased = rebaseSameProject({
      plan,
      source: oldSource,
      candidate,
      nextSource,
      convergenceState: state.convergenceState,
      tracker: state.tracker,
    });
    state.source = rebased.source;
    state.arrangerProject = rebased.plan;
    state.candidates = rebased.candidates;
    state.selectedIndex = rebased.selectedIndex;
    state.styleId = rebased.candidate.styleId || state.styleId;
    els.style.value = state.styleId;
    state.reharmSuggestions = {};
    state.features = {};
    renderSource(); renderCollisionSummary(); renderCandidates(); renderMixControls();
    bootConvergence({ preserveTracker: rebased.tracker });
    const verified = saveArrangerPlan({ plan: rebased.plan, tracker: state.tracker });
    if (!verified.ok) flash('rebase後の内容は画面に保持しています。保存だけ失敗しました。', true);
    else flash('Demo Composerの更新を取り込み、Plan IDと収束判断を維持しました。');
    return true;
  } catch (error) {
    flash(error.message || '同じProjectの更新を取り込めませんでした。', true);
    return false;
  }
}

window.__arrangerConvergence = {
  getContext,
  scopeOptions,
  decide,
  release,
  carryOver,
  restoreRecovery: restoreRecoveryDecision,
  adoptStructureOffer: adoptStructureRecovery,
  undo: undoConvergence,
  loadJournal,
  selectedContext,
  currentPlanContext,
  saveCurrent: ({ journal = loadJournal() } = {}) => saveArrangerPlan({ plan: planForCandidate(), journal }),
  savePlanWithJournal,
  applyPlanSnapshot: applyPlanSnapshotBridge,
};

export async function importFile(file) {
  try {
    stopPreview();
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.arrangerSchemaVersion) {
      restorePlan(data);
      flash(state.source ? '編曲プランを復元しました。' : '旧プランを読み込みました。同じProjectの元project.jsonを選ぶと編集を再開できます。');
      return true;
    }
    const source = normalizeSourceProject(data);
    if (state.arrangerProject && String(state.arrangerProject.source?.projectId) === String(source.sourceProjectId)) {
      if (handleSameProjectRebase(source)) return true;
    }
    state.source = source;
    state.arrangerProject = null;
    state.convergenceState = null;
    state.tracker = null;
    state.validationReady = false;
    state.convergenceWarning = null;
    state.structureOffer = null;
    state.reharmSuggestions = {};
    state.features = {};
    renderSource();
    renderCollisionSummary();
    generateCandidates();
    flash(`「${state.source.title}」を読み込みました。`);
    return true;
  } catch (error) {
    flash(error.message || '読み込みに失敗しました。', true);
    return false;
  }
}

function renderSource() {
  if (!state.source) {
    els.sourceSummary.innerHTML = '<p class="muted">Demo Composerのproject.jsonを読み込むと、ここに曲情報が出ます。</p>';
    return;
  }
  const s = state.source;
  els.previewSection.innerHTML = s.sections.map((section) => `<option value="${section.startTick}">${escapeHtml(section.name)}から</option>`).join('');
  const bars = s.sections.reduce((sum, section) => sum + section.bars, 0);
  els.sourceSummary.innerHTML = `
    <div class="summary-grid">
      <div><span>曲名</span><strong>${escapeHtml(s.title)}</strong></div>
      <div><span>BPM</span><strong>${s.basic.bpm}</strong></div>
      <div><span>Key</span><strong>${escapeHtml(s.basic.key)} ${escapeHtml(s.basic.scale)}</strong></div>
      <div><span>構成</span><strong>${s.sections.length} Section / ${bars} bars</strong></div>
      <div><span>コード</span><strong>${s.chords.length}</strong></div>
      <div><span>Track</span><strong>${s.tracks.length}</strong></div>
    </div>`;
}

function renderCollisionSummary() {
  if (!state.source) {
    els.collisionSummary.innerHTML = '';
    return;
  }
  const counterTrack = state.source.tracks.find((track) => track.role === 'counter');
  if (!counterTrack?.notes?.length) {
    els.collisionSummary.innerHTML = '<p class="muted">主旋律×裏メロ衝突チェック：裏メロNoteがまだありません。</p>';
    return;
  }
  const collisions = detectMelodyCounterCollisions(state.source);
  const total = collisions.reduce((sum, item) => sum + item.count, 0);
  const risky = collisions.filter((item) => item.count > 0);
  els.collisionSummary.innerHTML = `
    <div class="analysis-head"><strong>主旋律×裏メロ 衝突チェック</strong><span class="status ${total ? 'warn' : 'ok'}">${total ? `${total}箇所` : 'OK'}</span></div>
    <p>${total ? '同時発音かつ半音〜全音以内の近接を検出しました。' : '近接衝突は検出されませんでした。'}</p>
    ${risky.length ? `<div class="collision-list">${risky.map((item) => `<span>${escapeHtml(item.sectionName)}: ${item.count}</span>`).join('')}</div>` : ''}`;
}

function generateCandidates() {
  if (!state.source) {
    flash('先にDemo Composerのproject.jsonを読み込んでください。', true);
    return;
  }
  stopPreview();
  state.candidates = buildThreeCandidates(state.source, state.styleId);
  state.selectedIndex = 1;
  state.reharmSuggestions = {};
  state.features = {};
  ensurePlan(currentCandidate());
  renderCandidates();
  renderMixControls();
  bootConvergence();
}

function renderCandidates() {
  els.candidateTabs.innerHTML = '';
  state.candidates.forEach((candidate, index) => {
    const button = document.createElement('button');
    button.className = `candidate-tab ${index === state.selectedIndex ? 'is-active' : ''}`;
    button.innerHTML = `<strong>${escapeHtml(candidate.label)}</strong><small>${escapeHtml(summarizeCandidate(candidate))}</small>`;
    button.addEventListener('click', () => {
      stopPreview();
      state.selectedIndex = index;
      state.features = {};
      renderCandidates();
      renderMixControls();
      emitConvergenceChange();
    });
    els.candidateTabs.append(button);
  });

  const candidate = currentCandidate();
  const hasCandidate = Boolean(candidate);
  els.preview.disabled = !hasCandidate;
  els.adopt.disabled = !hasCandidate;
  els.exportBtn.disabled = !hasCandidate && !state.arrangerProject;
  els.mix.disabled = state.candidates.length < 2;
  if (!candidate) {
    els.candidateMeta.innerHTML = '<p class="muted">候補はまだありません。</p>';
    els.sections.innerHTML = '';
    els.curve.innerHTML = '';
    return;
  }

  els.candidateMeta.innerHTML = `
    <div><span class="eyebrow">${escapeHtml(candidate.styleName)}</span><h2>${escapeHtml(candidate.label)}</h2><p>${escapeHtml(candidate.description)}</p></div>`;
  renderCurve(candidate);
  els.sections.innerHTML = candidate.sections.map((section, index) => sectionCard(section, index)).join('');
}

function renderCurve(candidate) {
  const points = candidateCurve(candidate);
  els.curve.innerHTML = `
    <div class="curve-head"><strong>盛り上がり / 密度 / 楽器数</strong><span>Section比較</span></div>
    <div class="curve-list">
      ${points.map((point) => `
        <div class="curve-row">
          <span class="curve-name">${escapeHtml(point.name)}</span>
          <div class="curve-bars">
            <span class="curve-bar energy" style="--v:${point.energy}">E${point.energy}</span>
            <span class="curve-bar density" style="--v:${point.density}">D${point.density}</span>
            <span class="curve-bar instruments" style="--v:${Math.max(1, point.instruments)}">${point.instruments} inst</span>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderMixControls() {
  const options = state.candidates.map((candidate, index) => `<option value="${index}">${escapeHtml(candidate.label)}</option>`).join('');
  els.mixA.innerHTML = options;
  els.mixB.innerHTML = options;
  els.mixA.value = '0';
  els.mixB.value = state.candidates.length > 2 ? '2' : '1';
}

function createMixCandidate() {
  stopPreview();
  const a = state.candidates[Number(els.mixA.value)];
  const b = state.candidates[Number(els.mixB.value)];
  if (!a || !b || a === b) {
    flash('異なる2案を選んでください。', true);
    return;
  }
  try {
    const mixed = mixCandidates(a, b);
    state.candidates.push(mixed);
    state.selectedIndex = state.candidates.length - 1;
    renderCandidates();
    renderMixControls();
    if (state.convergenceState) bootConvergence({ preserveTracker: state.tracker });
    flash(`${a.label} と ${b.label} をMixしました。`);
  } catch (error) {
    flash(error.message || 'Mixに失敗しました。', true);
  }
}

function sectionCard(section, index) {
  const densityLabel = { thin: '薄い', standard: '標準', full: '厚い' }[section.density];
  const roleLabels = { drums: 'Drums', bass: 'Bass', harmony: 'Harmony', counter: '裏メロ', color: '色付け' };
  const toggles = Object.keys(roleLabels).map((role) => `
    <label class="toggle-chip ${section.enabled?.[role] ? 'on' : ''}">
      <input type="checkbox" data-action="toggle" data-section="${escapeAttr(section.sectionId)}" data-role="${role}" ${section.enabled?.[role] ? 'checked' : ''}>
      ${roleLabels[role]}
    </label>`).join('');
  const roleRows = Object.entries(section.roles).map(([key, value]) => `
    <div class="role-row"><span>${roleLabels[key]}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  const selectedReharm = section.reharmonization;
  const suggestions = state.reharmSuggestions[section.sectionId] || [];
  return `
    <article class="section-card">
      <div class="section-head">
        <div><span class="eyebrow">${index + 1}. ${escapeHtml(section.kind)}</span><h3>${escapeHtml(section.sectionName)}</h3></div>
        <div class="chips"><span>${escapeHtml(section.bars)} bars</span><span>${escapeHtml(section.energy)}</span><span>${densityLabel}</span></div>
      </div>
      <div class="section-controls">
        <label class="field compact"><span>密度</span>
          <select data-action="density" data-section="${escapeAttr(section.sectionId)}">
            <option value="thin" ${section.density === 'thin' ? 'selected' : ''}>薄い</option>
            <option value="standard" ${section.density === 'standard' ? 'selected' : ''}>標準</option>
            <option value="full" ${section.density === 'full' ? 'selected' : ''}>厚い</option>
          </select>
        </label>
        <div class="toggle-row">${toggles}</div>
        <button class="section-preview secondary" data-action="section-preview" data-section="${escapeAttr(section.sectionId)}">▶ このSectionを試聴</button>
      </div>
      <div class="roles">${roleRows}</div>
      <div class="reharm-block">
        <div class="reharm-head"><div><strong>リハモ</strong><span>${selectedReharm ? `採用: ${escapeHtml(selectedReharm.label)}` : '元コードを保持'}</span></div>
          <button class="mini secondary" data-action="reharm-show" data-section="${escapeAttr(section.sectionId)}">3案を提案</button>
        </div>
        ${suggestions.length ? `<div class="reharm-options">${suggestions.map((item) => `
          <div class="reharm-option ${selectedReharm?.id === item.id ? 'selected' : ''}">
            <strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span><small>${escapeHtml(item.display)}</small>
            <div class="reharm-actions">
              <button class="mini secondary" data-action="reharm-preview" data-section="${escapeAttr(section.sectionId)}" data-reharm="${item.id}">▶ 試聴</button>
              <button class="mini" data-action="reharm-apply" data-section="${escapeAttr(section.sectionId)}" data-reharm="${item.id}">採用</button>
            </div>
          </div>`).join('')}</div>` : ''}
        ${selectedReharm ? `<button class="text-button" data-action="reharm-clear" data-section="${escapeAttr(section.sectionId)}">リハモを解除</button>` : ''}
      </div>
${sectionFeatures(state.source,currentCandidate(),state.candidates,section,state.features[section.sectionId])}
      <div class="transition"><span>次へのつなぎ</span><strong>${escapeHtml(section.transition)}</strong></div>
    </article>`;
}

function handleSectionChange(event) {
  const target = event.target;
  const sectionId = target.dataset.section;
  const candidate = currentCandidate();
  if (!candidate || !sectionId) return;
  stopPreview();
  if (target.dataset.action === 'music-category' || target.dataset.action === 'music-method') {
    const features=state.features[sectionId] ||= {}; features.open=true; features.musicChoices=[];
    if(target.dataset.action === 'music-category') { features.musicCategory=target.value; features.musicMethod=MUSIC_LAB_CATALOG.find(m=>m.category===target.value)?.id; }
    else features.musicMethod=target.value;
    renderCandidates(); return;
  }
  if (target.dataset.sectionField === 'method') { state.features[sectionId] = { ...state.features[sectionId], method: target.value }; return; }
  if (target.dataset.action === 'decision-note') {
    applyCandidateEdit((before) => updateCandidateSection(before,sectionId,{decisionNote:target.value.slice(0,400)}), { render: false }); return;
  }
  if (target.dataset.action === 'density') {
    applyCandidateEdit((before) => updateCandidateSection(before, sectionId, { density: target.value }));
  } else if (target.dataset.action === 'toggle') {
    const role = target.dataset.role;
    applyCandidateEdit((before) => updateCandidateSection(before, sectionId, { enabled: { [role]: target.checked } }));
  }
}

function sectionBounds(sectionId) {
  return state.source?.sections.find((section) => section.id === sectionId) || null;
}

function previewSectionCandidate(candidate, sectionId, label) {
  const section = sectionBounds(sectionId);
  if (!section || !candidate) return;
  return playSketch({
    source: state.source,
    candidate,
    startTick: section.startTick,
    endTick: section.endTick,
  }, label);
}

function handleSectionClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !state.source) return;
  const sectionId = button.dataset.section;
  const action = button.dataset.action;
  stopPreview();
  if (handleFeatureAction(button)) return;
  if (action === 'reharm-show') {
    state.reharmSuggestions[sectionId] = buildReharmSuggestions(state.source, sectionId);
    if (!state.reharmSuggestions[sectionId].length) flash('このSectionにはコードがありません。', true);
    renderCandidates();
    return;
  }
  const candidate = currentCandidate();
  if (!candidate) return;
  if (action === 'section-preview') {
    previewSectionCandidate(candidate, sectionId, '現在のSection調整');
  } else if (action === 'reharm-preview') {
    const list = state.reharmSuggestions[sectionId] || buildReharmSuggestions(state.source, sectionId);
    const selected = list.find((item) => item.id === button.dataset.reharm);
    if (!selected) return;
    const auditionCandidate = updateCandidateSection(candidate, sectionId, { reharmonization: selected });
    previewSectionCandidate(auditionCandidate, sectionId, `${selected.label}リハモ`);
  } else if (action === 'reharm-apply') {
    const list = state.reharmSuggestions[sectionId] || buildReharmSuggestions(state.source, sectionId);
    const selected = list.find((item) => item.id === button.dataset.reharm);
    if (!selected) return;
    applyCandidateEdit((before) => updateCandidateSection(before, sectionId, { reharmonization: selected }));
    flash(`${selected.label}リハモを採用しました。元project.jsonは変更していません。`);
  } else if (action === 'reharm-clear') {
    applyCandidateEdit((before) => updateCandidateSection(before, sectionId, { reharmonization: null }));
  }
}

function handleFeatureAction(button) {
  const action = button.dataset.action, sectionId = button.dataset.section;
  if (!/^(music-|section-adopt|chorus-|subtract-|theory-|counter-|lead-|rest-)/.test(action)) return false;
  const current = currentCandidate();
  if (!current) return true;
  const section = state.source.sections.find(s=>s.id===sectionId);
  if (!section) return true;
  const features = state.features[sectionId] ||= {};
  features.open = true;
  const index = Number(button.dataset.option), mode = button.dataset.mode;
  const install = candidate => { applyCandidateEdit((before) => adoptSectionFrom(before,candidate,sectionId)); };
  const preview = (candidate,label,parts) => playSketch({source:state.source,candidate,startTick:section.startTick,endTick:section.endTick,parts},label);
  try {
    if (action.startsWith('music-')) {
      if(action === 'music-generate') {
        const select=els.sections.querySelector(`[data-action="music-method"][data-section="${CSS.escape(sectionId)}"]`);
        features.musicMethod=select.value;features.musicChoices=generateMusicLabCandidates(state.source,current,sectionId,select.value); renderCandidates();
      } else {
        const choice=features.musicChoices?.[index]; if(!choice?.available)return true;
        const candidate=adoptMusicLabCandidate(current,choice);
        if(action === 'music-apply') { applyCandidateEdit(() => candidate);flash('対象Sectionへ採用しました。保存は下の採用ボタンまたは収束判断から行えます。'); }
        else if(action === 'music-original' || action === 'music-preview') {
          const target=state.source.sections.find(s=>s.id===choice.auditionSectionId);
          playSketch({source:state.source,candidate:action === 'music-original'?current:candidate,startTick:target.startTick,endTick:target.endTick},action === 'music-original'?'現在の案':choice.label);
        } else if(action === 'music-midi') {
          const select=els.sections.querySelector(`[data-music-part="${index}"][data-section="${CSS.escape(sectionId)}"]`),part=select.value;
          const midi=createPartMidi(state.source,candidate,part);
          if(midi)downloadBlob(new Blob([midi],{type:'audio/midi'}),`${safeFileName(choice.label)}_${part}_${ARRANGER_VERSION}.mid`);else flash('このパートには出力するNoteがありません。',true);
        }
      }
    } else if (action === 'section-adopt') {
      const select = els.sections.querySelector(`[data-section-field="donor"][data-section="${CSS.escape(sectionId)}"]`);
      install(state.candidates[Number(select.value)]); flash('このSectionだけ採用しました。');
    } else if (action === 'chorus-show') { features.chorus = buildChorusCandidates(state.source,current,sectionId); renderCandidates(); }
    else if (action === 'subtract-show') { features.subtract = buildSubtractionCandidates(state.source,current,sectionId); renderCandidates(); }
    else if (action === 'theory-show') {
      const select = els.sections.querySelector(`[data-section-field="method"][data-section="${CSS.escape(sectionId)}"]`);
      features.method=select.value;
      features.theory=buildTheorySuggestions(state.source,sectionId,features.method); renderCandidates();
    } else if (action === 'counter-show') { features.counter=buildCounterScaleCandidates(state.source,current,sectionId);renderCandidates(); }
    else if (action === 'theory-preview') {
      const suggestion=features.theory?.[index]; if(suggestion?.available) playSketch(theoryAudition(state.source,current,sectionId,suggestion,mode),`${suggestion.label}: ${{original:'元',candidate:'候補',guide:'特徴音',bass:'元ベース'}[mode]}`);
    } else if (action === 'theory-apply') {
      const suggestion=features.theory?.[index]; if(suggestion?.available)install(updateCandidateSection(current,sectionId,{reharmonization:suggestion}));
    } else if (action === 'lead-apply') { install(leadHandoffCandidate(current,sectionId,mode)); }
    else if (action === 'rest-clear') { install(updateCandidateSection(current,sectionId,{restPolicy:'none',leadRole:null,reason:''})); }
    else if (action === 'counter-clear') { install(updateCandidateSection(current,sectionId,{counterArrangement:null,restPolicy:'none'})); }
    else {
      const group=action.split('-')[0], choice=features[group]?.[index];
      if(choice) {
        const candidate=adoptSectionFrom(current,choice.candidate||choice,sectionId);
        if(action.endsWith('-apply'))install(candidate);
        else if(action.endsWith('-preview'))preview(candidate,choice.label);
        else if(action === 'counter-midi') {
          const midi=createPartMidi(state.source,candidate,'counter');
          if(midi)downloadBlob(new Blob([midi],{type:'audio/midi'}),`${safeFileName(choice.label)}_counter_${ARRANGER_VERSION}.mid`);
          else flash('休み指定により出力する裏メロNoteがありません。',true);
        }
      }
    }
  } catch(error) { flash(error.message || '編曲案を処理できませんでした。',true); }
  return true;
}

async function previewCurrentCandidate() {
  const resolved = getResolved();
  const candidate = resolved?.candidate || currentCandidate();
  if (!state.source || !candidate) return;
  return playSketch({ source:state.source, candidate, startTick:Number(els.previewSection.value)||0 },resolved?.tentativeLabel || candidate.label);
}
async function playSketch(sketch,label) {
  stopPreview();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { flash('このブラウザでは簡易試聴を利用できません。', true); return; }
  let ctx;
  try {
    ctx = new AudioCtx();
    state.previewContext = ctx;
    els.stop.disabled = false;
    await ctx.resume();
    if (state.previewContext !== ctx) return;
    if (ctx.state !== 'running') throw new Error('音声を開始できません。もう一度試聴を押してください。');
    state.stopAudio = startPreview(ctx, sketch.source, sketch.candidate, sketch.startTick || 0, stopPreview, sketch);
    flash(`${label} を最大16秒、簡易試聴します。`);
  } catch (error) {
    if (state.previewContext === ctx) { stopPreview(); flash(error.message || '音声を開始できませんでした。', true); }
  }
}
function stopPreview() {
  const ctx = state.previewContext;
  state.previewContext = null;
  state.stopAudio?.(); state.stopAudio = null;
  els.stop.disabled = true;
  if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPreview(); });
window.addEventListener('pagehide', stopPreview);
els.previewSection.addEventListener('change', stopPreview);

function handleMidiExport(event) {
  const button = event.target.closest('button[data-part]');
  if (!button) return;
  const candidate = getResolved()?.candidate || currentCandidate();
  if (!state.source || !candidate) {
    flash('先に曲と編曲案を用意してください。', true);
    return;
  }
  const part = button.dataset.part;
  const midi = createPartMidi(state.source, candidate, part);
  if (!midi) {
    flash(`${part} に書き出せるNoteがありません。`, true);
    return;
  }
  const safeTitle = safeFileName(state.source.title || 'untitled');
  downloadBlob(new Blob([midi], { type: 'audio/midi' }), `${safeTitle}_${part}_arranged_${ARRANGER_VERSION}.mid`);
  flash(`${part}.mid を書き出しました。`);
}

function adoptCurrentCandidate() {
  const candidate = currentCandidate();
  if (!state.source || !candidate) {
    flash('採用する候補がありません。', true);
    return;
  }
  const plan = planForCandidate(candidate);
  const result = saveArrangerPlan({ plan });
  if (result.ok) flash(`${candidate.label} を採用して端末に保存しました。`);
  else {
    flash('端末への保存に失敗しました。JSON書き出しは利用できます。', true);
    els.exportBtn.disabled = false;
  }
}

function exportPlan() {
  let context;
  try { context = currentPlanContext({ save: true }); }
  catch (error) { flash(error.message || '先に編曲案を用意してください。', true); return; }
  const blob = new Blob([JSON.stringify(context.plan, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(context.plan.source.title || 'untitled')}_arrangement_${ARRANGER_VERSION}.json`);
  flash(context.saveResult?.ok === false ? '端末保存は失敗しましたが、Current Plan JSONを書き出しました。' : 'Current Planの編曲プランJSONを書き出しました。', context.saveResult?.ok === false);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
function safeFileName(value) { return String(value).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }

function clearAll() {
  if (!window.confirm('保存した編曲プランを消去しますか？必要なら先にJSONを書き出してください。')) return;
  stopPreview();
  const planId = state.arrangerProject?.id;
  const projectId = state.source?.sourceProjectId ?? state.arrangerProject?.source?.projectId;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(JOURNAL_KEY);
  localStorage.removeItem(V03_STORAGE_KEY);
  localStorage.removeItem(PREVIOUS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  if (planId != null && projectId != null) {
    const prefix = `demo-composer-arranger-convergence-v1:${projectId}:${planId}`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (key?.startsWith(prefix)) keys.push(key); }
    keys.forEach((key) => localStorage.removeItem(key));
  }
  state.source = null;
  state.candidates = [];
  state.arrangerProject = null;
  state.selectedIndex = 1;
  state.reharmSuggestions = {};
  state.features = {};
  state.convergenceState = null;
  state.tracker = null;
  state.validationReady = false;
  state.convergenceWarning = null;
  state.convergenceDiagnosis = null;
  state.structureOffer = null;
  state.undoSnapshot = null;
  els.file.value = '';
  els.exportBtn.disabled = true;
  els.preview.disabled = true;
  renderSource();
  renderCollisionSummary();
  renderCandidates();
  renderMixControls();
  emitConvergenceChange();
  flash('端末内の編曲プランと収束判断を消去しました。元のDemo Composerデータは変更していません。');
}

function applyRestored({ source, candidate }) {
  state.source = source;
  if (candidate && source) {
    const base = buildThreeCandidates(source, candidate.styleId || 'jpop-band');
    const match = base.findIndex((item) => item.id === candidate.id);
    if (match >= 0) { base[match] = candidate; state.selectedIndex = match; }
    else { base.push(candidate); state.selectedIndex = base.length - 1; }
    state.candidates = base;
  } else {
    state.candidates = candidate ? [candidate] : [];
    state.selectedIndex = 0;
  }
  state.reharmSuggestions = {};
  state.features = {};
  if (candidate) { state.styleId = candidate.styleId; els.style.value = state.styleId; }
  renderSource(); renderCollisionSummary(); renderCandidates(); renderMixControls();
}
function restorePlan(saved) {
  const restored = restoreArrangerProject(saved);
  state.arrangerProject = saved;
  applyRestored(restored);
  els.exportBtn.disabled = false;
  if (state.source && currentCandidate()) bootConvergence();
}
function restoreSavedPlan() {
  try {
    const text = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(V03_STORAGE_KEY) || localStorage.getItem(PREVIOUS_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!text) return;
    restorePlan(JSON.parse(text));
    flash(state.source ? '前回の採用プランと収束判断を復元しました。' : '旧プランを保持しています。同じProjectの元project.jsonで編集を再開できます。');
  } catch {
    state.validationReady = true;
    state.convergenceWarning = '保存プランを読み込めませんでした。保存データは消去せず保持しています。';
    emitConvergenceChange();
    flash('保存プランを読み込めませんでした。保存データは消去せず保持しています。', true);
  }
}

function flash(message, isError = false) {
  els.message.textContent = message;
  els.message.classList.toggle('is-error', isError);
  els.message.hidden = false;
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => { els.message.hidden = true; }, 4200);
}
window.addEventListener('arranger-convergence-message', (event) => flash(event.detail?.message || '', Boolean(event.detail?.error)));
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function escapeAttr(value) { return escapeHtml(value); }

renderSource();
renderCollisionSummary();
renderCandidates();
renderMixControls();
restoreSavedPlan();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`./sw.js?build=${encodeURIComponent(new URL(import.meta.url).searchParams.get('build') || ARRANGER_VERSION)}`, { updateViaCache: 'none' }).catch(() => {}));
}
