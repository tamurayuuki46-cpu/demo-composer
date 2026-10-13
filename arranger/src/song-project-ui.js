import { isSongProject, serializeSongProject } from '../../src/shared/song-project.js';
import { songProjectToArrangementSourceInput, mergeArrangementChangesIntoSongProject } from './song-project-sync.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const PASSTHROUGH = new WeakSet();
let currentSongProject = null;

const fileInput = document.querySelector('#project-file');
const dropZone = document.querySelector('#drop-zone');
const adoptButton = document.querySelector('#adopt-btn');
const exportSongButton = document.querySelector('#export-song-project-btn');

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function flash(message, isError = false) {
  const el = document.querySelector('#message');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.hidden = false;
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => { el.hidden = true; }, 4200);
}

function replaceInputFile(file) {
  if (typeof DataTransfer !== 'function') throw new Error('このブラウザではSongProjectのファイル変換を利用できません。');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  PASSTHROUGH.add(file);
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

async function routeFile(file) {
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); } catch {
    PASSTHROUGH.add(file);
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (!isSongProject(data)) {
    PASSTHROUGH.add(file);
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  currentSongProject = clone(data);
  const demoInput = songProjectToArrangementSourceInput(currentSongProject);
  const converted = new File(
    [JSON.stringify(demoInput, null, 2)],
    `${safeFileName(currentSongProject.title)}_arrangement_input.json`,
    { type: 'application/json' }
  );
  exportSongButton.disabled = false;
  replaceInputFile(converted);
  flash(`Song Project v${currentSongProject.schemaVersion}「${currentSongProject.title}」をArrangement Labへ読み込みました。`);
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
  // app.js stores the adopted Arrangement synchronously in its own click handler.
  // This callback may run first because the bridge is loaded first, so defer one task.
  window.setTimeout(syncAdoptedArrangement, 0);
});

exportSongButton?.addEventListener('click', () => {
  if (!currentSongProject) {
    flash('先にSong Project v1を読み込んでください。', true);
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
  flash('Arrangementの変更を保持したSong Project v1を書き出しました。');
});

function safeFileName(value) {
  return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}
