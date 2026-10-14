import {
  createEmptySongProject,
  mergeSheetChangesIntoSongProject,
  parseProjectJsonToSongProject,
  serializeSongProject,
} from '../../../src/shared/song-project.js';
import { mountSongDataMenu } from '../../../src/shared/song-data-menu.js';

const HANDOFF_KEY = 'music-project-songproject-handoff-v1';
const HANDOFF_KIND = 'music-project-songproject-handoff';
const HANDOFF_VERSION = 1;
const $ = (id) => document.getElementById(id);
const ids = ['scene','reference1','reference2','title','genre','mood','bpm','key','notes'];
const el = Object.fromEntries(ids.map((id) => [id, $(id)]));
let project = createEmptySongProject({ sourceApp: 'composition-sheet', createdFrom: 'new-sheet' });
let songDataMenu = null;

function cleanList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}
function refsFromIntent(intent) {
  return (intent?.references || []).map((item) => {
    if (typeof item === 'string') return item;
    return [item?.artist, item?.title].filter(Boolean).join(' / ') || item?.name || item?.note || '';
  }).filter(Boolean);
}
function requiredState() {
  return { scene: Boolean(el.scene.value.trim()), reference: Boolean(el.reference1.value.trim()) };
}
function refreshRequiredUI(showErrors = false) {
  const state = requiredState();
  const complete = Number(state.scene) + Number(state.reference);
  $('progressText').textContent = `${complete}/2`;
  $('progressBar').style.width = `${complete * 50}%`;
  $('exportButton').disabled = complete !== 2;
  songDataMenu?.setSaveEnabled(complete === 2);
  songDataMenu?.setNextEnabled(complete === 2);
  songDataMenu?.setCurrent(el.title.value.trim() || project.title || '新しい曲');
  const setStatus = (input, status, ok, idle) => {
    input.classList.toggle('invalid', showErrors && !ok);
    status.className = `field-status ${ok ? 'ok' : showErrors ? 'error' : ''}`;
    status.textContent = ok ? '✓ 入力済み' : showErrors ? 'ここは必須です' : idle;
  };
  setStatus(el.scene, $('sceneStatus'), state.scene, '短い一文でもOK');
  setStatus(el.reference1, $('reference1Status'), state.reference, 'まず1曲だけ入れればOK');
}
function showMessage(text, kind = 'ok') {
  const node = $('message');
  node.textContent = text;
  node.className = `message show ${kind}`;
}
function safeFileName(value) {
  return String(value || 'song-project').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}
function formSheet() {
  return {
    title: el.title.value.trim() || project.title || '新しい曲',
    scene: el.scene.value.trim(),
    references: [el.reference1.value.trim(), el.reference2.value.trim()].filter(Boolean),
    genre: el.genre.value.trim() ? [el.genre.value.trim()] : [],
    mood: cleanList(el.mood.value),
    bpm: el.bpm.value ? Number(el.bpm.value) : null,
    key: el.key.value.trim(),
    notes: el.notes.value.trim(),
  };
}
function updateProjectFromForm() {
  project = mergeSheetChangesIntoSongProject(project, formSheet());
  return project;
}
function fillForm(next) {
  project = next;
  const intent = next.intent || {};
  const refs = refsFromIntent(intent);
  el.scene.value = intent.scene || '';
  el.reference1.value = refs[0] || '';
  el.reference2.value = refs[1] || '';
  el.title.value = next.title === 'Untitled Project' ? '' : next.title || '';
  el.genre.value = (intent.genre || []).join(', ');
  el.mood.value = (intent.mood || []).join(', ');
  el.bpm.value = Number.isFinite(Number(next.basic?.bpm)) ? String(next.basic.bpm) : '';
  const key = next.basic?.key || '';
  const scale = next.basic?.scale || '';
  el.key.value = [key, scale].filter(Boolean).join(' ');
  el.notes.value = intent.notes || '';
  refreshRequiredUI();
}
function downloadProject() {
  if (!requiredState().scene || !requiredState().reference) {
    refreshRequiredUI(true);
    showMessage('必須2項目を入力してください。', 'warn');
    return null;
  }
  const next = updateProjectFromForm();
  const text = serializeSongProject(next);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(next.title)}_song_project_v1.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  showMessage('SongProject v1として保存しました。次のアプリでも同じJSONを使えます。');
  songDataMenu?.setCurrent(next.title);
  return next;
}
async function importProject(file) {
  try {
    const next = parseProjectJsonToSongProject(await file.text());
    fillForm(next);
    showMessage(`「${next.title}」を読み込みました。旧形式の場合はSongProject v1へ自動変換されています。`);
    songDataMenu?.setCurrent(next.title);
    songDataMenu?.setStatus(`「${next.title}」を開きました。`, 'success');
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'JSONを読み込めませんでした。', 'warn');
    songDataMenu?.setStatus(error instanceof Error ? error.message : '曲データを開けませんでした。', 'error');
  }
}
function writeHandoff(songProject) {
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({
      kind: HANDOFF_KIND,
      schemaVersion: HANDOFF_VERSION,
      sourceApp: 'composition-sheet',
      targetApp: 'demo-composer',
      createdAt: new Date().toISOString(),
      songProject,
    }));
    return true;
  } catch {
    return false;
  }
}

[el.scene, el.reference1].forEach((node) => node.addEventListener('input', () => refreshRequiredUI()));
el.title.addEventListener('input', () => songDataMenu?.setCurrent(el.title.value.trim() || project.title || '新しい曲'));
$('exportButton').addEventListener('click', downloadProject);
$('importButton').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', () => {
  const file = $('fileInput').files?.[0];
  if (file) importProject(file);
  $('fileInput').value = '';
});

songDataMenu = mountSongDataMenu({
  id: 'composition-sheet-song-data-menu',
  currentLabel: '新しい曲',
  saveEnabled: false,
  nextEnabled: false,
  nextLabel: 'Demo Composerへ進む',
  nextNote: 'JSONを保存して作曲へ渡します',
  onOpen() {
    $('fileInput').click();
    return 'SongProject JSONを選んでください。';
  },
  onSave() {
    const next = downloadProject();
    if (!next) throw new Error('必須2項目を入力してから保存してください。');
    return `「${next.title || '新しい曲'}」を保存しました。`;
  },
  async onNext() {
    const next = downloadProject();
    if (!next) throw new Error('必須2項目を入力してから次へ進んでください。');
    const shared = writeHandoff(next);
    songDataMenu.setStatus(
      shared
        ? '曲データを保存しました。Demo Composerを開きます。'
        : '曲データを保存しました。一時受け渡しが使えないため、Demo Composer右上の「📦 曲データ」から保存したJSONを開いてください。',
      shared ? 'success' : 'neutral',
    );
    await new Promise((resolve) => setTimeout(resolve, 180));
    window.location.href = new URL('../../../?handoff=composition-sheet', window.location.href).href;
  },
});

refreshRequiredUI();
