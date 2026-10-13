import { createPartMidi, restoreArrangerProject } from './core.js';
import {
  ARRANGER_V05_VERSION,
  createSongMidi,
  createDemoComposerProject,
  buildDrumFillCandidates,
  buildBassApproachCandidates,
  applyPerformanceOverride,
  clearPerformanceOverride,
} from './v05-tools.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const suggestions = new Map();

function safeFileName(value) { return String(value).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }
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
function toast(message, isError = false) {
  const el = document.querySelector('#message');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 4200);
}
function patchVersion(plan) {
  const next = JSON.parse(JSON.stringify(plan));
  next.arrangerVersion = ARRANGER_V05_VERSION;
  next.updatedAt = new Date().toISOString();
  return next;
}
function currentPlan({ adopt = true } = {}) {
  const adoptButton = document.querySelector('#adopt-btn');
  if (adopt) {
    if (!adoptButton || adoptButton.disabled) throw new Error('先にproject.jsonを読み込んで編曲案を用意してください。');
    adoptButton.click();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('現在の編曲案を保存できませんでした。');
  const plan = patchVersion(JSON.parse(raw));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  const restored = restoreArrangerProject(plan);
  if (!restored.source || !restored.candidate) throw new Error('元project.jsonを読み直してください。');
  return { plan, source: restored.source, candidate: restored.candidate };
}
function reimportPlan(plan) {
  const next = patchVersion(plan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  const input = document.querySelector('#project-file');
  try {
    if (!input || typeof DataTransfer === 'undefined') throw new Error('reload');
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(next)], 'arrangement-v0.5.json', { type: 'application/json' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } catch {
    location.reload();
  }
  queueMicrotask(() => updateVersionBadge());
}
function updateVersionBadge() {
  const version = document.querySelector('#version');
  if (version) version.textContent = ARRANGER_V05_VERSION;
  document.documentElement.dataset.arrangerVersion = ARRANGER_V05_VERSION;
}

function injectDawPanel() {
  if (document.querySelector('#v05-daw-panel')) return;
  const midiGrid = document.querySelector('#midi-buttons');
  const midiPanel = midiGrid?.closest('.panel');
  if (!midiPanel) return;
  const panel = document.createElement('section');
  panel.id = 'v05-daw-panel';
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel-title"><span class="step">6</span><div><h2>DAWへ渡す</h2><p>現在の編曲案を1ファイルにまとめるか、Demo Composerへ戻せる複製project.jsonを作ります。</p></div></div>
    <div class="preview-row">
      <button id="song-midi-btn" class="primary">Song.mid 一括出力</button>
      <button id="demo-return-btn" class="secondary">Demo Composer用project.json</button>
    </div>
    <p class="hint">Song.midはType 1でSection Marker、Tempo、4/4、各パートTrackを保持。戻しJSONは元Projectを上書きせず、新しいIDの複製として作成します。</p>
    <a class="text-button" href="../">Demo Composerを開く</a>`;
  midiPanel.after(panel);
  panel.querySelector('#song-midi-btn').addEventListener('click', exportSongMidi);
  panel.querySelector('#demo-return-btn').addEventListener('click', exportDemoProject);
}

function exportSongMidi() {
  try {
    const { source, candidate } = currentPlan();
    const midi = createSongMidi(source, candidate);
    if (!midi) throw new Error('Song.midに書き出せるNoteがありません。');
    downloadBlob(new Blob([midi], { type: 'audio/midi' }), `${safeFileName(source.title)}_Song_${ARRANGER_V05_VERSION}.mid`);
    toast('Song.midを一括書き出ししました。');
  } catch (error) { toast(error.message || 'Song.midを書き出せませんでした。', true); }
}
function exportDemoProject() {
  try {
    const { source, candidate } = currentPlan();
    const project = createDemoComposerProject(source, candidate);
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${safeFileName(project.metadata?.title || source.title)}_project.json`);
    toast('Demo Composerへ読み込める複製project.jsonを書き出しました。');
  } catch (error) { toast(error.message || 'Demo Composer用JSONを書き出せませんでした。', true); }
}

function performanceBlock(sectionId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'reharm-block v05-note-generator';
  wrapper.dataset.v05Section = sectionId;
  wrapper.innerHTML = `
    <div class="reharm-head">
      <div><strong>実Note生成</strong><span>Drum Fill / Bass Approachを3案から選択</span></div>
    </div>
    <div class="preview-row">
      <button class="mini secondary" data-v05-action="drum-show" data-section="${sectionId}">Drum Fill 3案</button>
      <button class="mini secondary" data-v05-action="bass-show" data-section="${sectionId}">Bass Approach 3案</button>
    </div>
    <div class="v05-choice-area"></div>
    <div class="preview-row v05-clear-row">
      <button class="text-button" data-v05-action="clear-drums" data-section="${sectionId}">生成Drumsを解除</button>
      <button class="text-button" data-v05-action="clear-bass" data-section="${sectionId}">生成Bassを解除</button>
    </div>`;
  return wrapper;
}
function injectPerformanceBlocks() {
  for (const card of document.querySelectorAll('.section-card')) {
    if (card.querySelector('.v05-note-generator')) continue;
    const density = card.querySelector('[data-action="density"][data-section]');
    const sectionId = density?.dataset.section;
    if (!sectionId) continue;
    const block = performanceBlock(sectionId);
    const transition = card.querySelector('.transition');
    if (transition) transition.before(block); else card.append(block);
    renderPerformanceChoices(sectionId);
  }
}
function renderPerformanceChoices(sectionId) {
  const area = document.querySelector(`[data-v05-section="${CSS.escape(sectionId)}"] .v05-choice-area`);
  if (!area) return;
  const entry = suggestions.get(sectionId);
  if (!entry) { area.innerHTML = '<p class="hint">候補を作ってから選択します。既存の同パートOverrideがある場合は、採用時にバックアップして置き換えます。</p>'; return; }
  if (!entry.choices.length) { area.innerHTML = '<p class="hint">このSectionでは候補を作れません。Bass Approachは2つ以上のコード変化が必要です。</p>'; return; }
  area.innerHTML = `<div class="reharm-options">${entry.choices.map((choice, index) => `
    <button class="reharm-option" data-v05-action="apply" data-section="${sectionId}" data-option="${index}">
      <strong>${escapeHtml(choice.label)}</strong><span>${escapeHtml(choice.description)}</span><small>${choice.notes.length} notes</small>
    </button>`).join('')}</div>`;
}
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function showPerformanceChoices(sectionId, part) {
  try {
    const { source, candidate } = currentPlan();
    const choices = part === 'drums' ? buildDrumFillCandidates(source, candidate, sectionId) : buildBassApproachCandidates(source, candidate, sectionId);
    suggestions.set(sectionId, { part, choices });
    renderPerformanceChoices(sectionId);
  } catch (error) { toast(error.message || '実Note候補を作れませんでした。', true); }
}
function applyPerformanceChoice(sectionId, option) {
  try {
    const entry = suggestions.get(sectionId);
    const choice = entry?.choices?.[option];
    if (!choice) throw new Error('候補を作り直してください。');
    const { plan } = currentPlan();
    reimportPlan(applyPerformanceOverride(plan, sectionId, choice));
    suggestions.delete(sectionId);
    toast(`${choice.label}をSectionへ適用しました。`);
  } catch (error) { toast(error.message || '実Note候補を適用できませんでした。', true); }
}
function clearPerformance(sectionId, part) {
  try {
    const { plan } = currentPlan();
    const next = clearPerformanceOverride(plan, sectionId, part);
    reimportPlan(next);
    suggestions.delete(sectionId);
    toast(`${part}の自動生成Overrideを解除しました。`);
  } catch (error) { toast(error.message || '生成Overrideを解除できませんでした。', true); }
}
function handlePerformanceClick(event) {
  const button = event.target.closest('[data-v05-action]');
  if (!button) return;
  const sectionId = button.dataset.section;
  if (button.dataset.v05Action === 'drum-show') showPerformanceChoices(sectionId, 'drums');
  else if (button.dataset.v05Action === 'bass-show') showPerformanceChoices(sectionId, 'bass');
  else if (button.dataset.v05Action === 'apply') applyPerformanceChoice(sectionId, Number(button.dataset.option));
  else if (button.dataset.v05Action === 'clear-drums') clearPerformance(sectionId, 'drums');
  else if (button.dataset.v05Action === 'clear-bass') clearPerformance(sectionId, 'bass');
}

function interceptLegacyExports() {
  const exportButton = document.querySelector('#export-btn');
  exportButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      const { plan, source } = currentPlan();
      downloadBlob(new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' }), `${safeFileName(source.title)}_arrangement_${ARRANGER_V05_VERSION}.json`);
      toast('編曲プランJSONを書き出しました。');
    } catch (error) { toast(error.message || '編曲プランを書き出せませんでした。', true); }
  }, true);

  const midiGrid = document.querySelector('#midi-buttons');
  midiGrid?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-part]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      const { source, candidate } = currentPlan();
      const midi = createPartMidi(source, candidate, button.dataset.part);
      if (!midi) throw new Error(`${button.dataset.part} に書き出せるNoteがありません。`);
      downloadBlob(new Blob([midi], { type: 'audio/midi' }), `${safeFileName(source.title)}_${button.dataset.part}_arranged_${ARRANGER_V05_VERSION}.mid`);
      toast(`${button.dataset.part}.mid を書き出しました。`);
    } catch (error) { toast(error.message || 'MIDIを書き出せませんでした。', true); }
  }, true);

  const adopt = document.querySelector('#adopt-btn');
  adopt?.addEventListener('click', () => queueMicrotask(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(patchVersion(JSON.parse(raw))));
    } catch { /* keep the app's original save behavior */ }
  }), true);
}

function init() {
  updateVersionBadge();
  injectDawPanel();
  injectPerformanceBlocks();
  interceptLegacyExports();
  document.addEventListener('click', handlePerformanceClick);
  const sections = document.querySelector('#sections');
  if (sections) new MutationObserver(() => { injectPerformanceBlocks(); updateVersionBadge(); }).observe(sections, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else queueMicrotask(init);
