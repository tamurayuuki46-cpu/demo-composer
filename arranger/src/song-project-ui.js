import { isSongProject, projectValueToSongProject, serializeSongProject } from '../../src/shared/song-project.js';
import { songProjectToArrangementSourceInput, mergeArrangementChangesIntoSongProject } from './song-project-sync.js';
import { importFile as applyArrangementFile } from './app.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const HANDOFF_KEY = 'music-project-songproject-handoff-v1';
const HANDOFF_KIND = 'music-project-songproject-handoff';
const HANDOFF_VERSION = 1;
const PASSTHROUGH = new WeakSet();
let currentSongProject = null;

const fileInput = document.querySelector('#project-file');
const dropZone = document.querySelector('#drop-zone');
const adoptButton = document.querySelector('#adopt-btn');
const exportSongButton = document.querySelector('#export-song-project-btn');

function flash(message, isError = false) {
  const el = document.querySelector('#message');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.hidden = false;
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => { el.hidden = true; }, 4200);
}

function readPendingHandoff() {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (payload?.kind !== HANDOFF_KIND || payload?.schemaVersion !== HANDOFF_VERSION || payload?.targetApp !== 'arrangement-lab') return null;
    if (!isSongProject(payload.songProject)) return null;
    return payload;
  } catch {
    return null;
  }
}

function clearPendingHandoff() {
  try {
    const payload = readPendingHandoff();
    if (payload) localStorage.removeItem(HANDOFF_KEY);
  } catch {
    // File fallback remains available.
  }
}

function ensureHandoffGuide() {
  if (!dropZone || document.querySelector('#arranger-handoff-guide')) return;
  const pending = readPendingHandoff();
  const requested = new URLSearchParams(window.location.search).get('handoff') === 'demo-composer';
  if (!pending && !requested) return;

  const guide = document.createElement('section');
  guide.id = 'arranger-handoff-guide';
  guide.setAttribute('aria-label', 'Demo Composerからの受け渡し');
  guide.style.cssText = 'margin:0 0 14px;padding:14px;border:1px solid #4255c7;border-radius:16px;background:rgba(58,72,180,.12);';
  guide.innerHTML = `
    <p class="eyebrow" style="margin:0 0 4px">NEXT STEP</p>
    <h3 style="margin:0 0 6px">Demo Composerから続ける</h3>
    <p data-handoff-guide-text style="margin:0 0 12px;line-height:1.55">${pending ? `「${escapeHtml(pending.songProject.title || 'Untitled Project')}」を受け取り待ちです。` : 'Demo Composerで保存したSongProject JSONを読み込んでください。'}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button type="button" data-apply-handoff ${pending ? '' : 'disabled'}>受け取った曲を反映</button>
      <button type="button" data-pick-handoff-file>保存したJSONを選ぶ</button>
    </div>
    <p style="margin:10px 0 0;font-size:.85rem;opacity:.8">反映後は ②A/B/Cを聴く → ③1案選ぶ → ④Section調整 の順で進めます。</p>`;
  dropZone.insertAdjacentElement('beforebegin', guide);
  guide.querySelector('[data-apply-handoff]')?.addEventListener('click', applyPendingHandoff);
  guide.querySelector('[data-pick-handoff-file]')?.addEventListener('click', () => fileInput?.click());
}

function setHandoffBusy(busy) {
  const button = document.querySelector('#arranger-handoff-guide [data-apply-handoff]');
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? '反映中…' : '受け取った曲を反映';
}

function markHandoffReflected(title) {
  const text = document.querySelector('#arranger-handoff-guide [data-handoff-guide-text]');
  if (text) text.textContent = `「${title || 'Untitled Project'}」を反映しました。A/B/Cの準備も完了しています。次は②で聴き比べてください。`;
  const button = document.querySelector('#arranger-handoff-guide [data-apply-handoff]');
  if (button) {
    button.disabled = true;
    button.textContent = '反映済み';
  }
}

function dispatchOriginal(file) {
  PASSTHROUGH.add(file);
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

function isLegacyDemoProject(data) {
  return Boolean(data && typeof data === 'object' && Number.isInteger(data.schemaVersion) && data.basic && data.structure);
}

function needsCanonicalConversion(data) {
  return isSongProject(data) || data?.kind === 'composition-sheet-handoff' || (data?.format === 'demo-composer-project' && data?.sheet);
}

async function routeFile(file) {
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); } catch {
    currentSongProject = null;
    exportSongButton.disabled = true;
    dispatchOriginal(file);
    return;
  }

  if (isLegacyDemoProject(data)) {
    currentSongProject = projectValueToSongProject(data);
    exportSongButton.disabled = false;
    dispatchOriginal(file);
    flash(`旧Demo Project「${currentSongProject.title}」をそのまま読み込み、共通SongProject v1へ紐づけました。`);
    return;
  }

  if (!needsCanonicalConversion(data)) {
    currentSongProject = null;
    exportSongButton.disabled = true;
    dispatchOriginal(file);
    return;
  }

  let receivedSongProject;
  try {
    receivedSongProject = projectValueToSongProject(data);
  } catch {
    currentSongProject = null;
    exportSongButton.disabled = true;
    dispatchOriginal(file);
    return;
  }

  const demoInput = songProjectToArrangementSourceInput(receivedSongProject);
  const converted = new File(
    [JSON.stringify(demoInput, null, 2)],
    `${safeFileName(receivedSongProject.title)}_arrangement_input.json`,
    { type: 'application/json' }
  );
  if (!await applyArrangementFile(converted)) throw new Error('曲を反映できませんでした。曲の構成・拍子を確認し、保存したJSONから再試行してください。');
  currentSongProject = receivedSongProject;
  exportSongButton.disabled = false;
  flash(`共通SongProject v${currentSongProject.schemaVersion}「${currentSongProject.title}」をArrangement Labへ読み込み、A/B/Cを準備しました。`);
  markHandoffReflected(currentSongProject.title);
}

async function applyPendingHandoff() {
  const pending = readPendingHandoff();
  if (!pending) {
    fileInput?.click();
    return;
  }
  setHandoffBusy(true);
  try {
    const file = new File(
      [JSON.stringify(pending.songProject, null, 2)],
      `${safeFileName(pending.songProject.title)}_song_project_v1.json`,
      { type: 'application/json' }
    );
    await routeFile(file);
    clearPendingHandoff();
  } catch (error) {
    setHandoffBusy(false);
    flash(error.message || '受け取ったSongProjectの反映に失敗しました。保存したJSONから読み込んでください。', true);
  }
}

fileInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file || PASSTHROUGH.has(file)) return;
  event.stopImmediatePropagation();
  routeFile(file).catch((error) => flash(error.message || 'SongProjectの読み込みに失敗しました。', true));
}, true);

dropZone?.addEventListener('drop', (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  routeFile(file).catch((error) => flash(error.message || 'SongProjectの読み込みに失敗しました。', true));
}, true);

function syncAdoptedArrangement() {
  if (!currentSongProject) return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const arrangerProject = JSON.parse(saved);
    currentSongProject = mergeArrangementChangesIntoSongProject(currentSongProject, arrangerProject);
    exportSongButton.disabled = false;
  } catch (error) {
    flash(error.message || 'SongProjectへの編曲書き戻しに失敗しました。', true);
  }
}

adoptButton?.addEventListener('click', () => {
  window.setTimeout(syncAdoptedArrangement, 0);
});

exportSongButton?.addEventListener('click', () => {
  if (!currentSongProject) {
    flash('先に曲のJSONを読み込んでください。', true);
    return;
  }
  syncAdoptedArrangement();
  const blob = new Blob([serializeSongProject(currentSongProject)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(currentSongProject.title)}_song_project_v1.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  flash('Arrangementの変更を保持した共通SongProject v1を書き出しました。');
});

function safeFileName(value) {
  return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

ensureHandoffGuide();

export function getSheetSongProject(){return currentSongProject;}
