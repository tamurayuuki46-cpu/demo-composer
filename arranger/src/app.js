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
} from './core.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.2';
const LEGACY_STORAGE_KEY = 'demo-composer-arranger-v0.1';

const state = {
  source: null,
  styleId: 'jpop-band',
  candidates: [],
  selectedIndex: 1,
  arrangerProject: null,
  reharmSuggestions: {},
  previewContext: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  version: $('#version'), file: $('#project-file'), drop: $('#drop-zone'), sourceSummary: $('#source-summary'),
  collisionSummary: $('#collision-summary'), style: $('#style-select'), generate: $('#generate-btn'),
  preview: $('#preview-btn'), stop: $('#stop-btn'), candidateTabs: $('#candidate-tabs'), mixA: $('#mix-a'), mixB: $('#mix-b'),
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

async function importFile(file) {
  try {
    stopPreview();
    const text = await file.text();
    state.source = normalizeSourceProject(JSON.parse(text));
    state.arrangerProject = null;
    state.reharmSuggestions = {};
    renderSource();
    renderCollisionSummary();
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
  renderCandidates();
  renderMixControls();
}

function currentCandidate() {
  return state.candidates[state.selectedIndex] || null;
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
      renderCandidates();
      renderMixControls();
    });
    els.candidateTabs.append(button);
  });

  const candidate = currentCandidate();
  const hasCandidate = Boolean(candidate);
  els.preview.disabled = !hasCandidate;
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
  const options = state.candidates.slice(0, 6).map((candidate, index) => `<option value="${index}">${escapeHtml(candidate.label)}</option>`).join('');
  els.mixA.innerHTML = options;
  els.mixB.innerHTML = options;
  els.mixA.value = '0';
  els.mixB.value = state.candidates.length > 2 ? '2' : '1';
}

function createMixCandidate() {
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
        <div class="chips"><span>${section.bars} bars</span><span>${escapeHtml(section.energy)}</span><span>${densityLabel}</span></div>
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
      </div>
      <div class="roles">${roleRows}</div>
      <div class="reharm-block">
        <div class="reharm-head"><div><strong>リハモ</strong><span>${selectedReharm ? `採用: ${escapeHtml(selectedReharm.label)}` : '元コードを保持'}</span></div>
          <button class="mini secondary" data-action="reharm-show" data-section="${escapeAttr(section.sectionId)}">3案を提案</button>
        </div>
        ${suggestions.length ? `<div class="reharm-options">${suggestions.map((item) => `
          <button class="reharm-option ${selectedReharm?.id === item.id ? 'selected' : ''}" data-action="reharm-apply" data-section="${escapeAttr(section.sectionId)}" data-reharm="${item.id}">
            <strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span><small>${escapeHtml(item.display)}</small>
          </button>`).join('')}</div>` : ''}
        ${selectedReharm ? `<button class="text-button" data-action="reharm-clear" data-section="${escapeAttr(section.sectionId)}">リハモを解除</button>` : ''}
      </div>
      <div class="transition"><span>次へのつなぎ</span><strong>${escapeHtml(section.transition)}</strong></div>
    </article>`;
}

function handleSectionChange(event) {
  const target = event.target;
  const sectionId = target.dataset.section;
  const candidate = currentCandidate();
  if (!candidate || !sectionId) return;
  if (target.dataset.action === 'density') {
    state.candidates[state.selectedIndex] = updateCandidateSection(candidate, sectionId, { density: target.value });
    renderCandidates();
  } else if (target.dataset.action === 'toggle') {
    const role = target.dataset.role;
    state.candidates[state.selectedIndex] = updateCandidateSection(candidate, sectionId, { enabled: { [role]: target.checked } });
    renderCandidates();
  }
}

function handleSectionClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !state.source) return;
  const sectionId = button.dataset.section;
  const action = button.dataset.action;
  if (action === 'reharm-show') {
    state.reharmSuggestions[sectionId] = buildReharmSuggestions(state.source, sectionId);
    if (!state.reharmSuggestions[sectionId].length) flash('このSectionにはコードがありません。', true);
    renderCandidates();
    return;
  }
  const candidate = currentCandidate();
  if (!candidate) return;
  if (action === 'reharm-apply') {
    const list = state.reharmSuggestions[sectionId] || buildReharmSuggestions(state.source, sectionId);
    const selected = list.find((item) => item.id === button.dataset.reharm);
    if (!selected) return;
    state.candidates[state.selectedIndex] = updateCandidateSection(candidate, sectionId, { reharmonization: selected });
    renderCandidates();
    flash(`${selected.label}リハモを採用しました。元project.jsonは変更していません。`);
  } else if (action === 'reharm-clear') {
    state.candidates[state.selectedIndex] = updateCandidateSection(candidate, sectionId, { reharmonization: null });
    renderCandidates();
  }
}

async function previewCurrentCandidate() {
  const candidate = currentCandidate();
  if (!state.source || !candidate) return;
  stopPreview();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    flash('このブラウザでは簡易試聴を利用できません。', true);
    return;
  }
  const ctx = new AudioCtx();
  state.previewContext = ctx;
  els.stop.disabled = false;
  try { await ctx.resume(); } catch {}
  const start = ctx.currentTime + 0.05;
  const secondsPerTick = 60 / state.source.basic.bpm / state.source.basic.ppq;
  const maxSeconds = 16;
  const maxTick = Math.floor(maxSeconds / secondsPerTick);

  const melody = state.source.tracks.find((track) => track.role === 'melody')?.notes || [];
  scheduleNotes(ctx, melody.filter((note) => note.startTick < maxTick), start, secondsPerTick, 'triangle', 0.035);

  for (const sourceSection of state.source.sections) {
    if (sourceSection.startTick >= maxTick) break;
    const arrSection = candidate.sections.find((section) => section.sectionId === sourceSection.id);
    if (!arrSection) continue;
    let chords = state.source.chords.filter((chord) => chord.startTick >= sourceSection.startTick && chord.startTick < sourceSection.endTick && chord.startTick < maxTick);
    if (arrSection.reharmonization?.chords?.length) chords = arrSection.reharmonization.chords.filter((chord) => chord.startTick < maxTick);
    if (arrSection.enabled.harmony) {
      chords.forEach((chord) => {
        const root = 48 + ((chord.root % 12) + 12) % 12;
        const intervals = chord.quality?.includes('minor') ? [0, 3, 7] : [0, 4, 7];
        const count = arrSection.density === 'thin' ? 2 : 3;
        intervals.slice(0, count).forEach((interval) => scheduleTone(ctx, root + interval, start + chord.startTick * secondsPerTick, Math.min(1.2, chord.durationTick * secondsPerTick * .8), 'sine', .018));
      });
    }
    if (arrSection.enabled.bass) {
      chords.forEach((chord) => scheduleTone(ctx, 36 + (((chord.root % 12) + 12) % 12), start + chord.startTick * secondsPerTick, Math.min(.8, chord.durationTick * secondsPerTick * .6), 'square', .018));
    }
    if (arrSection.enabled.counter) {
      const counter = state.source.tracks.find((track) => track.role === 'counter')?.notes || [];
      scheduleNotes(ctx, counter.filter((note) => note.startTick >= sourceSection.startTick && note.startTick < Math.min(sourceSection.endTick, maxTick)), start, secondsPerTick, 'sawtooth', .014);
    }
    if (arrSection.enabled.drums) {
      const beat = state.source.basic.ppq;
      for (let tick = sourceSection.startTick; tick < Math.min(sourceSection.endTick, maxTick); tick += beat) {
        scheduleTone(ctx, tick % (beat * 4) === 0 ? 48 : 60, start + tick * secondsPerTick, .045, 'square', .012);
      }
    }
  }
  const finishMs = Math.min(maxSeconds, maxTick * secondsPerTick) * 1000 + 300;
  window.setTimeout(() => {
    if (state.previewContext === ctx) stopPreview();
  }, finishMs);
  flash(`${candidate.label} を簡易試聴しています。`);
}

function scheduleNotes(ctx, notes, start, secondsPerTick, type, gain) {
  notes.slice(0, 140).forEach((note) => scheduleTone(ctx, note.pitch, start + note.startTick * secondsPerTick, Math.max(.04, note.durationTick * secondsPerTick), type, gain));
}
function scheduleTone(ctx, pitch, when, duration, type, level) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = 440 * (2 ** ((pitch - 69) / 12));
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.03, duration));
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + Math.max(0.05, duration) + 0.02);
}
function stopPreview() {
  const ctx = state.previewContext;
  state.previewContext = null;
  els.stop.disabled = true;
  if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
}

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
  downloadBlob(new Blob([midi], { type: 'audio/midi' }), `${safeTitle}_${part}_arranged_v0.2.mid`);
  flash(`${part}.mid を書き出しました。`);
}

function adoptCurrentCandidate() {
  const candidate = currentCandidate();
  if (!state.source || !candidate) {
    flash('採用する候補がありません。', true);
    return;
  }
  state.arrangerProject = createArrangerProject(state.source, candidate, state.arrangerProject);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.arrangerProject));
    els.exportBtn.disabled = false;
    flash(`${candidate.label} を採用して端末に保存しました。`);
  } catch {
    flash('端末への保存に失敗しました。JSON書き出しは利用できます。', true);
    els.exportBtn.disabled = false;
  }
}

function exportPlan() {
  if (!state.arrangerProject) {
    const candidate = currentCandidate();
    if (!state.source || !candidate) {
      flash('先に編曲案を用意してください。', true);
      return;
    }
    state.arrangerProject = createArrangerProject(state.source, candidate, null);
  }
  const blob = new Blob([JSON.stringify(state.arrangerProject, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(state.arrangerProject.source.title || 'untitled')}_arrangement_v0.2.json`);
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
  stopPreview();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  state.source = null;
  state.candidates = [];
  state.arrangerProject = null;
  state.selectedIndex = 1;
  state.reharmSuggestions = {};
  els.file.value = '';
  els.exportBtn.disabled = true;
  els.preview.disabled = true;
  renderSource();
  renderCollisionSummary();
  renderCandidates();
  renderMixControls();
  flash('端末内の編曲プランを消去しました。元のDemo Composerデータは変更していません。');
}

function restoreSavedPlan() {
  const text = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!text) return;
  try {
    const saved = JSON.parse(text);
    state.arrangerProject = saved;
    els.exportBtn.disabled = false;
    flash(`前回の採用プラン「${saved.source?.title || 'Untitled'}」が端末に残っています。JSONとして書き出せます。`);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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

renderSource();
renderCollisionSummary();
renderCandidates();
renderMixControls();
restoreSavedPlan();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
