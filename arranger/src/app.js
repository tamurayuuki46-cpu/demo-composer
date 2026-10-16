import { ConvergenceSession } from './convergence-session.js';
import { mountConvergence } from './convergence-ui.js';
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

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const V03_STORAGE_KEY = 'demo-composer-arranger-v0.3';
const PREVIOUS_STORAGE_KEY = 'demo-composer-arranger-v0.2';
const LEGACY_STORAGE_KEY = 'demo-composer-arranger-v0.1';

const state = {
  source: null,
  styleId: 'jpop-band',
  candidates: [],
  selectedIndex: 1,
  arrangerProject: null,
  reharmSuggestions: {},
  features: {},
  previewContext: null,
};

export const arrangerSession = new ConvergenceSession(state, localStorage, (...args) => flash(...args));
let convergenceUI;
export const confirmCurrentPlanExport = () => convergenceUI.confirmExport();
export function refreshArranger() { renderSource(); renderCandidates(); renderMixControls(); convergenceUI?.render(); }
export function applyCandidateEdit(before, after) { return arrangerSession.applyCandidateEdit(before, after); }
export function applyPlanSnapshot(plan) { arrangerSession.applySnapshot(plan); refreshArranger(); }

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

export async function importFile(file) {
  try {
    stopPreview();
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.arrangerSchemaVersion) {
      restorePlan(data);
      flash(state.source ? '編曲プランを復元しました。' : '旧プランを読み込みました。同じrevisionの元project.jsonを選ぶと編集を再開できます。');
      return true;
    }
    const source = normalizeSourceProject(data);
    if (state.source && state.arrangerProject && state.source.sourceProjectId === source.sourceProjectId) {
      const result = arrangerSession.rebase(source);
      refreshArranger(); renderCollisionSummary();
      flash(result.warning || '同じ曲の更新を反映しました。判断とPlan IDを保持しました。', !!result.warning);
      return true;
    }
    if (state.arrangerProject && !state.arrangerProject.sourceSnapshot && state.arrangerProject.source.projectId === source.sourceProjectId) {
      const restored = restoreArrangerProject(state.arrangerProject, source);
      applyRestored(restored);
      arrangerSession.initialize();
      refreshArranger();
      flash('元project.jsonと旧プランから編集を再開しました。');
      return true;
    }
    arrangerSession.validationReady = false;
    state.source = source;
    state.arrangerProject = null;
    state.reharmSuggestions = {};
    state.features = {};
    renderSource();
    renderCollisionSummary();
    generateCandidates();
    // 成功表示を先に出す。save()が失敗した場合はその警告が最後に残り、成功表示で隠れない。
    flash(`「${state.source.title}」を読み込みました。`);
    // 反映直後に再読み込みしても曲が消えないよう、検証済みなら一度保存する(判断・書き出し前の空白をなくす)。
    if (arrangerSession.validationReady) arrangerSession.save();
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
  if (arrangerSession.validationReady) arrangerSession.save();
  state.candidates = buildThreeCandidates(state.source, state.styleId);
  state.selectedIndex = 1;
  state.reharmSuggestions = {};
  state.features = {};
  if (!arrangerSession.validationReady) arrangerSession.initialize();
  else arrangerSession.save();
  renderCandidates();
  renderMixControls();
}

function currentCandidate() {
  return state.candidates[state.selectedIndex] || null;
}

function renderCandidates() {
  convergenceUI?.render();
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
    applyCandidateEdit(candidate, updateCandidateSection(candidate,sectionId,{decisionNote:target.value.slice(0,400)})); return;
  }
  if (target.dataset.action === 'density') {
    applyCandidateEdit(candidate, updateCandidateSection(candidate, sectionId, { density: target.value }));
    renderCandidates();
  } else if (target.dataset.action === 'toggle') {
    const role = target.dataset.role;
    applyCandidateEdit(candidate, updateCandidateSection(candidate, sectionId, { enabled: { [role]: target.checked } }));
    renderCandidates();
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
    applyCandidateEdit(candidate, updateCandidateSection(candidate, sectionId, { reharmonization: selected }));
    renderCandidates();
    flash(`${selected.label}リハモを採用しました。元project.jsonは変更していません。`);
  } else if (action === 'reharm-clear') {
    applyCandidateEdit(candidate, updateCandidateSection(candidate, sectionId, { reharmonization: null }));
    renderCandidates();
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
  const install = candidate => { applyCandidateEdit(current, adoptSectionFrom(current,candidate,sectionId)); renderCandidates(); };
  const preview = (candidate,label,parts) => playSketch({source:state.source,candidate,startTick:section.startTick,endTick:section.endTick,parts},label);
  try {
    if (action.startsWith('music-')) {
      if(action === 'music-generate') {
        const select=els.sections.querySelector(`[data-action="music-method"][data-section="${CSS.escape(sectionId)}"]`);
        features.musicMethod=select.value;features.musicChoices=generateMusicLabCandidates(state.source,current,sectionId,select.value); renderCandidates();
      } else {
        const choice=features.musicChoices?.[index]; if(!choice?.available)return true;
        const candidate=adoptMusicLabCandidate(current,choice);
        if(action === 'music-apply') { applyCandidateEdit(current,candidate);renderCandidates();flash('対象Sectionへ採用しました。保存するには下の「この案を採用」を押してください。'); }
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
  const candidate = currentCandidate();
  if (!state.source || !candidate) return;
  return playSketch({ source:state.source, candidate, startTick:Number(els.previewSection.value)||0 },candidate.label);
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
  const candidate = currentCandidate();
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
  if (!currentCandidate() || !arrangerSession.validationReady) return;
  const saved = arrangerSession.decide('global', 'adopted');
  refreshArranger();
  if (!saved?.ok) return;
  els.exportBtn.disabled = false;
  flash(`${currentCandidate().label} を全体へ採用しました。`);
}

function exportPlan() {
  const candidate = currentCandidate();
  if (state.source && candidate) state.arrangerProject = createArrangerProject(state.source, candidate, state.arrangerProject);
  if (!state.arrangerProject) { flash('先に編曲案を用意してください。', true); return; }
  const blob = new Blob([JSON.stringify(state.arrangerProject, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(state.arrangerProject.source.title || 'untitled')}_arrangement_${ARRANGER_VERSION}.json`);
  flash('編曲プランJSONを書き出しました。');
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
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(V03_STORAGE_KEY);
  localStorage.removeItem(PREVIOUS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  arrangerSession.validationReady = false;
  arrangerSession.state = null;
  state.source = null;
  state.candidates = [];
  state.arrangerProject = null;
  state.selectedIndex = 1;
  state.reharmSuggestions = {};
  state.features = {};
  els.file.value = '';
  els.exportBtn.disabled = true;
  els.preview.disabled = true;
  renderSource();
  renderCollisionSummary();
  renderCandidates();
  renderMixControls();
  flash('端末内の編曲プランを消去しました。元のDemo Composerデータは変更していません。');
}

function applyRestored({ source, candidate }) {
  state.source = source;
  state.candidates = candidate ? [candidate] : [];
  state.selectedIndex = 0;
  state.reharmSuggestions = {};
  state.features = {};
  if (candidate) { state.styleId = candidate.styleId; els.style.value = state.styleId; }
  renderSource(); renderCollisionSummary(); renderCandidates(); renderMixControls();
}
function restorePlan(saved) {
  arrangerSession.validationReady = false;
  const restored = restoreArrangerProject(saved);
  state.arrangerProject = saved;
  applyRestored(restored);
  arrangerSession.initialize({ restorePool: true });
  refreshArranger();
  els.exportBtn.disabled = false;
}
function restoreSavedPlan() {
  try {
    const text = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(V03_STORAGE_KEY) || localStorage.getItem(PREVIOUS_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!text) return;
    restorePlan(JSON.parse(text));
    flash(state.source ? '前回の採用プランを復元しました。' : '旧プランを保持しています。同じrevisionの元project.jsonで編集を再開できます。');
  } catch {
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
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function escapeAttr(value) { return escapeHtml(value); }

convergenceUI = mountConvergence(arrangerSession, { changed: refreshArranger, preview: ({ source, candidate }) => playSketch({ source, candidate }, 'Current Plan') });
renderSource();
renderCollisionSummary();
renderCandidates();
renderMixControls();
restoreSavedPlan();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`./sw.js?build=${encodeURIComponent(new URL(import.meta.url).searchParams.get('build') || ARRANGER_VERSION)}`, { updateViaCache: 'none' }).catch(() => {}));
}
