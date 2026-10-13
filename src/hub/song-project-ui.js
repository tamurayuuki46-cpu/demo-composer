import { loadActiveProject } from '../storage/indexeddb-storage.js';
import {
  demoProjectToSongProject,
  mergeDemoChangesIntoSongProject,
  parseProjectJsonToSongProject,
  serializeSongProject,
  songProjectToDemoProject,
} from '../shared/song-project.js';

const SOURCE_KEY = 'demo-composer-song-project-source-v1';
const HANDOFF_KEY = 'music-project-songproject-handoff-v1';
const HANDOFF_KIND = 'music-project-songproject-handoff';
const HANDOFF_VERSION = 1;
let installed = false;

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function safeFileName(value) { return String(value || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

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

function storeSourceSongProject(songProject) {
  try {
    localStorage.setItem(SOURCE_KEY, serializeSongProject(songProject));
    return true;
  } catch {
    return false;
  }
}

function loadSourceSongProject(projectId) {
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const songProject = parseProjectJsonToSongProject(raw);
    return songProject.projectId === projectId ? songProject : null;
  } catch {
    return null;
  }
}

function writeHandoff(songProject, targetApp) {
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({
      kind: HANDOFF_KIND,
      schemaVersion: HANDOFF_VERSION,
      sourceApp: 'demo-composer',
      targetApp,
      createdAt: new Date().toISOString(),
      songProject,
    }));
    return true;
  } catch {
    return false;
  }
}

function readHandoff(targetApp) {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (payload?.kind !== HANDOFF_KIND || payload?.schemaVersion !== HANDOFF_VERSION || payload?.targetApp !== targetApp) return null;
    return { ...payload, songProject: parseProjectJsonToSongProject(JSON.stringify(payload.songProject)) };
  } catch {
    return null;
  }
}

function clearHandoff(targetApp) {
  try {
    const payload = readHandoff(targetApp);
    if (payload) localStorage.removeItem(HANDOFF_KEY);
  } catch {
    // File fallback remains available.
  }
}

function ensureGuideStyles() {
  if (document.querySelector('#song-project-handoff-style')) return;
  const style = document.createElement('style');
  style.id = 'song-project-handoff-style';
  style.textContent = `
    .song-project-handoff{margin:0 0 16px;padding:14px;border:1px solid #4255c7;border-radius:16px;background:rgba(58,72,180,.10)}
    .song-project-handoff h4{margin:0 0 6px}.song-project-handoff p{margin:6px 0;line-height:1.55}
    .song-project-handoff ol{margin:10px 0;padding-left:22px;display:grid;gap:5px}.song-project-handoff-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    .song-project-handoff .handoff-primary{background:#4f46e5;color:#fff;border-color:#6366f1;font-weight:800}.song-project-handoff .handoff-status{font-size:.86rem;color:var(--muted,#777)}
    @media(max-width:560px){.song-project-handoff-actions{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

function handoffGuideHtml(pending) {
  const pendingText = pending
    ? `MIDI Analyzerから「${escapeHtml(pending.songProject.title || 'Untitled Project')}」を受け取り待ちです。`
    : '前のアプリで保存したSongProjectを読み込み、作曲後はArrangement Labへ渡せます。';
  return `
    <section class="song-project-handoff" id="song-project-handoff-guide" aria-label="曲データの受け渡し">
      <h4>曲データの受け渡し</h4>
      <p>${pendingText}</p>
      <ol>
        <li>前のアプリから受け取る</li>
        <li>Demo Composerで曲を作る</li>
        <li>Arrangement Labへ渡す</li>
      </ol>
      <div class="song-project-handoff-actions">
        <button type="button" id="handoff-import-song" class="handoff-primary">${pending ? '受け取った曲を反映' : '前のアプリから受け取る'}</button>
        <button type="button" id="handoff-export-arranger" class="handoff-primary">Arrangement Labへ渡す</button>
        <button type="button" id="handoff-open-arranger" disabled>Arrangement Labを開く</button>
        <button type="button" id="handoff-import-file">保存したJSONを選ぶ</button>
      </div>
      <p class="handoff-status" id="handoff-guide-status">JSONはバックアップとして端末にも保存します。同じChromeなら次のアプリへ一時受け渡しも行います。</p>
    </section>`;
}

function updateGuideStatus(message) {
  const status = document.querySelector('#handoff-guide-status');
  if (status) status.textContent = message;
}

async function currentSongProject() {
  document.querySelector('#save-project')?.click();
  await delay(120);
  const project = await loadActiveProject();
  if (!project) throw new Error('現在のProjectを端末保存から取得できませんでした。');
  const source = loadSourceSongProject(project.id);
  const songProject = source
    ? mergeDemoChangesIntoSongProject(source, project)
    : demoProjectToSongProject(project);
  storeSourceSongProject(songProject);
  return songProject;
}

async function exportSongProject({ forArrangement = false } = {}) {
  try {
    const songProject = await currentSongProject();
    downloadText(serializeSongProject(songProject), `${safeFileName(songProject.title)}_song_project_v1.json`);
    if (forArrangement) {
      const shared = writeHandoff(songProject, 'arrangement-lab');
      const openButton = document.querySelector('#handoff-open-arranger');
      if (openButton) openButton.disabled = false;
      const message = shared
        ? '曲データを保存しました。次に「Arrangement Labを開く」を押してください。同じChromeなら受け取り候補が表示されます。'
        : '曲データを保存しました。Arrangement Labを開き、保存したJSONを選んでください。';
      setStatus(message);
      updateGuideStatus(message);
    } else {
      setStatus('共通SongProject v1を書き出しました。');
    }
    return songProject;
  } catch (error) {
    const message = error instanceof Error ? error.message : '共通SongProjectを書き出せませんでした。';
    setStatus(message, true);
    updateGuideStatus(message);
    return null;
  }
}

async function importSongProjectData(data, { fromHandoff = false } = {}) {
  const demoProject = songProjectToDemoProject(data);
  const target = document.querySelector('#import-project-file');
  if (!target || typeof DataTransfer !== 'function') throw new Error('このブラウザではSongProject Importを利用できません。');
  storeSourceSongProject(data);
  const converted = new File([JSON.stringify(demoProject, null, 2)], `${safeFileName(data.title)}_project.json`, { type: 'application/json' });
  const transfer = new DataTransfer();
  transfer.items.add(converted);
  target.files = transfer.files;
  target.dispatchEvent(new Event('change', { bubbles: true }));
  if (fromHandoff) clearHandoff('demo-composer');
  const message = `「${data.title}」をDemo Composerへ反映しました。曲名 / BPM / Keyを確認してから作曲を続けてください。`;
  setStatus(message);
  updateGuideStatus(message);
  window.setTimeout(enhanceExportPanel, 0);
}

async function importSongProject(file) {
  try {
    const data = parseProjectJsonToSongProject(await file.text());
    await importSongProjectData(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Project JSONを読み込めませんでした。';
    setStatus(message, true);
    updateGuideStatus(message);
  }
}

async function applyPendingHandoff() {
  const pending = readHandoff('demo-composer');
  if (!pending) {
    document.querySelector('#import-song-project-file')?.click();
    return;
  }
  try {
    await importSongProjectData(pending.songProject, { fromHandoff: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '受け取った曲データを反映できませんでした。';
    setStatus(message, true);
    updateGuideStatus(`${message} 保存したJSONから読み込むこともできます。`);
  }
}

function openArrangementLab() {
  const target = new URL('/demo-composer/arranger/?handoff=demo-composer', window.location.origin);
  window.location.href = target.href;
}

function revealPendingHandoff() {
  const pending = readHandoff('demo-composer');
  const requested = new URLSearchParams(window.location.search).get('handoff') === 'midi-analyzer';
  if (!pending && !requested) return;
  const panel = document.querySelector('#export-panel');
  const toggle = document.querySelector('#toggle-export');
  if (panel?.hidden && toggle) toggle.click();
}

function enhanceExportPanel() {
  const panel = document.querySelector('#export-panel');
  const grid = panel?.querySelector('.export-grid');
  if (!panel || !grid) return;
  ensureGuideStyles();

  let input = panel.querySelector('#import-song-project-file');
  if (!input) {
    input = document.createElement('input');
    input.id = 'import-song-project-file';
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) importSongProject(file);
      input.value = '';
    });
    panel.append(input);
  }

  let guide = panel.querySelector('#song-project-handoff-guide');
  if (!guide) {
    const pending = readHandoff('demo-composer');
    panel.querySelector('h3')?.insertAdjacentHTML('afterend', handoffGuideHtml(pending));
    guide = panel.querySelector('#song-project-handoff-guide');
    guide?.querySelector('#handoff-import-song')?.addEventListener('click', applyPendingHandoff);
    guide?.querySelector('#handoff-import-file')?.addEventListener('click', () => input.click());
    guide?.querySelector('#handoff-export-arranger')?.addEventListener('click', () => exportSongProject({ forArrangement: true }));
    guide?.querySelector('#handoff-open-arranger')?.addEventListener('click', openArrangementLab);
  }

  if (!grid.querySelector('#export-song-project-json')) {
    const exportButton = document.createElement('button');
    exportButton.id = 'export-song-project-json';
    exportButton.textContent = 'SongProject v1（詳細）';
    exportButton.addEventListener('click', () => exportSongProject());
    grid.append(exportButton);
  }

  if (!panel.querySelector('#import-song-project-json')) {
    const importButton = document.createElement('button');
    importButton.id = 'import-song-project-json';
    importButton.className = 'import-button';
    importButton.textContent = 'SongProject JSONを読み込む';
    importButton.addEventListener('click', () => input.click());
    const importHeading = panel.querySelector('.import-heading');
    if (importHeading) importHeading.insertAdjacentElement('afterend', importButton);
    else panel.append(importButton);
  }

  revealPendingHandoff();
}

export function installSongProjectUi() {
  if (installed) return;
  installed = true;
  enhanceExportPanel();
  const screen = document.querySelector('#screen');
  if (!screen) return;
  new MutationObserver(enhanceExportPanel).observe(screen, { childList: true, subtree: true });
}
