import { loadActiveProject } from '../storage/indexeddb-storage.js';
import {
  demoProjectToSongProject,
  mergeDemoChangesIntoSongProject,
  parseProjectJsonToSongProject,
  serializeSongProject,
} from '../shared/song-project.js';
import { mountSongDataMenu } from '../shared/song-data-menu.js';

const SOURCE_KEY = 'demo-composer-song-project-source-v1';
const HANDOFF_KEY = 'music-project-songproject-handoff-v1';
const HANDOFF_KIND = 'music-project-songproject-handoff';
const HANDOFF_VERSION = 1;

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function safeFileName(value) { return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }

function downloadSongProject(songProject) {
  const blob = new Blob([serializeSongProject(songProject)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFileName(songProject.title)}_song_project_v1.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function readSource(projectId) {
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const source = parseProjectJsonToSongProject(raw);
    return source.projectId === projectId ? source : null;
  } catch {
    return null;
  }
}

function writeSource(songProject) {
  try { localStorage.setItem(SOURCE_KEY, serializeSongProject(songProject)); } catch {}
}

function writeHandoff(songProject, targetApp, sourceApp = 'demo-composer') {
  localStorage.setItem(HANDOFF_KEY, JSON.stringify({
    kind: HANDOFF_KIND,
    schemaVersion: HANDOFF_VERSION,
    sourceApp,
    targetApp,
    createdAt: new Date().toISOString(),
    songProject,
  }));
}

async function getCurrentSongProject() {
  document.querySelector('#save-project')?.click();
  await delay(120);
  const project = await loadActiveProject();
  if (!project) throw new Error('現在の曲を取得できませんでした。先にProjectを作成してください。');
  const source = readSource(project.id);
  const songProject = source ? mergeDemoChangesIntoSongProject(source, project) : demoProjectToSongProject(project);
  writeSource(songProject);
  return songProject;
}

async function applyImportedSongProject(songProject) {
  writeHandoff(songProject, 'demo-composer', 'song-data-menu');
  document.querySelector('.nav-btn[data-screen="hub"]')?.click();
  for (let i = 0; i < 12; i += 1) {
    await delay(50);
    const button = document.querySelector('#handoff-import-song');
    if (button) {
      button.click();
      return;
    }
  }
  throw new Error('曲データの受け取り画面を開けませんでした。Hubからもう一度お試しください。');
}

const picker = document.createElement('input');
picker.type = 'file';
picker.accept = '.json,application/json';
picker.hidden = true;
picker.setAttribute('aria-hidden', 'true');
document.body.append(picker);

let controller;
picker.addEventListener('change', async () => {
  const selected = picker.files?.[0];
  picker.value = '';
  if (!selected) return;
  try {
    const songProject = parseProjectJsonToSongProject(await selected.text());
    await applyImportedSongProject(songProject);
    controller?.setCurrent(songProject.title);
    controller?.setStatus(`「${songProject.title || 'Untitled Project'}」を開きました。`, 'success');
  } catch (error) {
    controller?.setStatus(error?.message || '曲データを開けませんでした。', 'error');
  }
});

controller = mountSongDataMenu({
  id: 'demo-composer-song-data-menu',
  currentLabel: document.querySelector('.topbar h1')?.textContent || '現在のProject',
  nextLabel: 'Arrangement Labへ進む',
  nextNote: 'JSONを保存して編曲へ渡します',
  onOpen() {
    picker.click();
    return 'SongProject JSONを選んでください。';
  },
  async onSave() {
    const songProject = await getCurrentSongProject();
    downloadSongProject(songProject);
    controller.setCurrent(songProject.title);
    return `「${songProject.title || 'Untitled Project'}」を保存しました。`;
  },
  async onNext() {
    const songProject = await getCurrentSongProject();
    downloadSongProject(songProject);
    writeHandoff(songProject, 'arrangement-lab');
    controller.setCurrent(songProject.title);
    controller.setStatus('曲データを保存しました。Arrangement Labを開きます。', 'success');
    await delay(180);
    window.location.href = new URL('/demo-composer/arranger/?handoff=demo-composer', window.location.origin).href;
  },
});

const titleObserver = new MutationObserver(() => {
  const title = document.querySelector('.topbar h1')?.textContent;
  if (title) controller.setCurrent(title);
});
const titleNode = document.querySelector('.topbar h1');
if (titleNode) titleObserver.observe(titleNode, { childList: true, characterData: true, subtree: true });
