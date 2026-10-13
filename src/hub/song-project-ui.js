import { loadActiveProject } from '../storage/indexeddb-storage.js';
import {
  demoProjectToSongProject,
  isSongProject,
  serializeSongProject,
  songProjectToDemoProject,
} from '../shared/song-project.js';

let installed = false;

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function safeFileName(value) { return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }

function setStatus(message, isError = false) {
  const status = document.querySelector('#export-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function exportSongProject() {
  try {
    document.querySelector('#save-project')?.click();
    // Save Now / autosave use IndexedDB asynchronously. Give that transaction a short
    // opportunity to finish, then read the same active record used by Project List.
    await delay(120);
    const project = await loadActiveProject();
    if (!project) throw new Error('現在のProjectを端末保存から取得できませんでした。');
    const songProject = demoProjectToSongProject(project);
    downloadText(serializeSongProject(songProject), `${safeFileName(songProject.title)}_song_project_v1.json`);
    setStatus('Song Project v1を書き出しました。');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Song Project v1を書き出せませんでした。', true);
  }
}

async function importSongProject(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!isSongProject(data)) throw new Error('Song Project v1のJSONではありません。');
    const demoProject = songProjectToDemoProject(data);
    const target = document.querySelector('#import-project-file');
    if (!target || typeof DataTransfer !== 'function') throw new Error('このブラウザではSong Project Importを利用できません。');
    const converted = new File([JSON.stringify(demoProject, null, 2)], `${safeFileName(data.title)}_project.json`, { type: 'application/json' });
    const transfer = new DataTransfer();
    transfer.items.add(converted);
    target.files = transfer.files;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    setStatus(`Song Project v1「${data.title}」を既存Project Importへ渡しました。`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Song Project v1を読み込めませんでした。', true);
  }
}

function enhanceExportPanel() {
  const panel = document.querySelector('#export-panel');
  const grid = panel?.querySelector('.export-grid');
  if (!panel || !grid || grid.querySelector('#export-song-project-json')) return;

  const exportButton = document.createElement('button');
  exportButton.id = 'export-song-project-json';
  exportButton.textContent = 'Song Project v1';
  exportButton.addEventListener('click', exportSongProject);
  grid.append(exportButton);

  const importButton = document.createElement('button');
  importButton.id = 'import-song-project-json';
  importButton.className = 'import-button';
  importButton.textContent = 'Song Project v1を読み込む';

  const input = document.createElement('input');
  input.id = 'import-song-project-file';
  input.type = 'file';
  input.accept = '.json,application/json';
  input.hidden = true;
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) importSongProject(file);
    input.value = '';
  });
  importButton.addEventListener('click', () => input.click());

  const importHeading = panel.querySelector('.import-heading');
  if (importHeading) {
    importHeading.insertAdjacentElement('afterend', input);
    input.insertAdjacentElement('afterend', importButton);
  } else {
    panel.append(input, importButton);
  }
}

export function installSongProjectUi() {
  if (installed) return;
  installed = true;
  enhanceExportPanel();
  const screen = document.querySelector('#screen');
  if (!screen) return;
  new MutationObserver(enhanceExportPanel).observe(screen, { childList: true, subtree: true });
}
