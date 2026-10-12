import {
  ARRANGER_VERSION,
  STYLE_PROFILES,
  normalizeSourceProject,
  buildThreeCandidates,
  createArrangerProject,
  summarizeCandidate,
} from './core.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.1';

const state = {
  source: null,
  styleId: 'jpop-band',
  candidates: [],
  selectedIndex: 1,
  arrangerProject: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  version: $('#version'),
  file: $('#project-file'),
  drop: $('#drop-zone'),
  sourceSummary: $('#source-summary'),
  style: $('#style-select'),
  generate: $('#generate-btn'),
  candidateTabs: $('#candidate-tabs'),
  candidateMeta: $('#candidate-meta'),
  sections: $('#sections'),
  adopt: $('#adopt-btn'),
  exportBtn: $('#export-btn'),
  clear: $('#clear-btn'),
  message: $('#message'),
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
els.adopt.addEventListener('click', adoptCurrentCandidate);
els.exportBtn.addEventListener('click', exportPlan);
els.clear.addEventListener('click', clearAll);
els.file.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) importFile(file);
});

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

async function importFile(file) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    state.source = normalizeSourceProject(json);
    state.arrangerProject = null;
    renderSource();
    generateCandidates();
    flash(`「${state.source.title}」を読み込みました。`);
  } catch (error) {
    flash(error.message || '読み込みに失敗しました。', true);
  }
}

function renderSource() {
  if (!state.source) {
    els.sourceSummary.innerHTML = '<p class="muted">Demo Composerのproject.jsonを読み込むと、ここに曲情報が出ます。</p>';
    return;
  }
  const s = state.source;
  const bars = s.sections.reduce((sum, section) => sum + section.bars, 0);
  els.sourceSummary.innerHTML = `
    <div class="summary-grid">
      <div><span>曲名</span><strong>${escapeHtml(s.title)}</strong></div>
      <div><span>BPM</span><strong>${s.basic.bpm}</strong></div>
      <div><span>Key</span><strong>${escapeHtml(s.basic.key)} ${escapeHtml(s.basic.scale)}</strong></div>
      <div><span>構成</span><strong>${s.sections.length} Section / ${bars} bars</strong></div>
    </div>`;
}

function generateCandidates() {
  if (!state.source) {
    flash('先にDemo Composerのproject.jsonを読み込んでください。', true);
    return;
  }
  state.candidates = buildThreeCandidates(state.source, state.styleId);
  state.selectedIndex = 1;
  renderCandidates();
}

function renderCandidates() {
  els.candidateTabs.innerHTML = '';
  state.candidates.forEach((candidate, index) => {
    const button = document.createElement('button');
    button.className = `candidate-tab ${index === state.selectedIndex ? 'is-active' : ''}`;
    button.innerHTML = `<strong>${candidate.label}</strong><small>${summarizeCandidate(candidate)}</small>`;
    button.addEventListener('click', () => {
      state.selectedIndex = index;
      renderCandidates();
    });
    els.candidateTabs.append(button);
  });

  const candidate = state.candidates[state.selectedIndex];
  if (!candidate) {
    els.candidateMeta.innerHTML = '<p class="muted">候補はまだありません。</p>';
    els.sections.innerHTML = '';
    return;
  }

  els.candidateMeta.innerHTML = `
    <div>
      <span class="eyebrow">${escapeHtml(candidate.styleName)}</span>
      <h2>${escapeHtml(candidate.label)}</h2>
      <p>${escapeHtml(candidate.description)}</p>
    </div>`;

  els.sections.innerHTML = candidate.sections.map((section, index) => sectionCard(section, index)).join('');
}

function sectionCard(section, index) {
  const densityLabel = { thin: '薄い', standard: '標準', full: '厚い' }[section.density];
  const roleRows = Object.entries(section.roles).map(([key, value]) => {
    const labels = { drums: 'Drums', bass: 'Bass', harmony: 'Harmony', counter: '裏メロ', color: '色付け' };
    return `<div class="role-row"><span>${labels[key]}</span><strong>${escapeHtml(value)}</strong></div>`;
  }).join('');

  return `
    <article class="section-card">
      <div class="section-head">
        <div><span class="eyebrow">${index + 1}. ${escapeHtml(section.kind)}</span><h3>${escapeHtml(section.sectionName)}</h3></div>
        <div class="chips"><span>${section.bars} bars</span><span>${escapeHtml(section.energy)}</span><span>${densityLabel}</span></div>
      </div>
      <div class="roles">${roleRows}</div>
      <div class="transition"><span>次へのつなぎ</span><strong>${escapeHtml(section.transition)}</strong></div>
    </article>`;
}

function adoptCurrentCandidate() {
  const candidate = state.candidates[state.selectedIndex];
  if (!state.source || !candidate) {
    flash('採用する候補がありません。', true);
    return;
  }
  state.arrangerProject = createArrangerProject(state.source, candidate, state.arrangerProject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.arrangerProject));
  els.exportBtn.disabled = false;
  flash(`${candidate.label} を採用して端末に保存しました。`);
}

function exportPlan() {
  if (!state.arrangerProject) {
    flash('先に編曲案を採用してください。', true);
    return;
  }
  const blob = new Blob([JSON.stringify(state.arrangerProject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (state.arrangerProject.source.title || 'untitled').replace(/[\\/:*?"<>|]+/g, '_');
  a.href = url;
  a.download = `${safeTitle}_arrangement_v0.1.json`;
  a.click();
  URL.revokeObjectURL(url);
  flash('編曲プランJSONを書き出しました。');
}

function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  state.source = null;
  state.candidates = [];
  state.arrangerProject = null;
  state.selectedIndex = 1;
  els.file.value = '';
  els.exportBtn.disabled = true;
  renderSource();
  renderCandidates();
  flash('端末内の編曲プランを消去しました。元のDemo Composerデータは変更していません。');
}

function restoreSavedPlan() {
  const text = localStorage.getItem(STORAGE_KEY);
  if (!text) return;
  try {
    const saved = JSON.parse(text);
    state.arrangerProject = saved;
    els.exportBtn.disabled = false;
    flash(`前回の採用プラン「${saved.source?.title || 'Untitled'}」が端末に残っています。JSONとして書き出せます。`);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
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
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

renderSource();
renderCandidates();
restoreSavedPlan();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
