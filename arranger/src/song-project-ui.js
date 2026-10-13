import { isSongProject, serializeSongProject } from '../../src/shared/song-project.js';
import { restoreArrangerProject } from './core.js';
import { createDemoComposerProject } from './v05-tools.js';
import {
  createArrangementForkSongProject,
  songProjectToArrangementSourceInput,
  mergeArrangementChangesIntoSongProject,
} from './song-project-sync.js';

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
    currentSongProject = null;
    PASSTHROUGH.add(file);
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (!isSongProject(data)) {
    currentSongProject = null;
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
  downloadSongProject(currentSongProject, `${safeFileName(currentSongProject.title)}_song_project_v1.json`);
  flash('Arrangementの変更を保持したSong Project v1を書き出しました。');
});

function buildCurrentArrangementFork() {
  if (!currentSongProject) throw new Error('Lineage付きForkにはSong Project v1を先に読み込んでください。');
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) throw new Error('先に編曲案を採用してください。');
  const plan = JSON.parse(saved);
  const restored = restoreArrangerProject(plan);
  if (!restored.source || !restored.candidate) throw new Error('編曲案を復元できません。元SongProjectを読み直してください。');
  currentSongProject = mergeArrangementChangesIntoSongProject(currentSongProject, plan);
  const arrangedDemoProject = createDemoComposerProject(restored.source, restored.candidate);
  return createArrangementForkSongProject(currentSongProject, arrangedDemoProject, {
    title: `${currentSongProject.title} Arrangement Fork`,
    forkReason: 'Arrangement Labで採用した編曲を新しい作曲Projectとして続ける',
  });
}

// v0.5 UIが後から作るForkボタンをcaptureし、SongProject入力時だけ
// lineage-aware SongProject Forkへ昇格する。legacy project.json入力時は既存handlerをそのまま使う。
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('#demo-return-btn');
  if (!button || !currentSongProject) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    const fork = buildCurrentArrangementFork();
    downloadSongProject(fork, `${safeFileName(fork.title)}_song_project_v1.json`);
    flash(`元Projectを上書きせず、Lineage付きFork「${fork.title}」を書き出しました。`);
  } catch (error) {
    flash(error.message || 'Lineage付きForkを書き出せませんでした。', true);
  }
}, true);

function downloadSongProject(songProject, filename) {
  const blob = new Blob([serializeSongProject(songProject)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function safeFileName(value) {
  return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}
