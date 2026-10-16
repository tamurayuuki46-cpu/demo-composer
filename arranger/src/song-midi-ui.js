import { restoreArrangerProject } from './core.js';
import { buildSongMidi } from './song-midi.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const button = document.querySelector('#export-song-midi-btn');
const convergence = () => window.__arrangerConvergence || null;

function flash(message, isError = false) {
  const el = document.querySelector('#message');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.hidden = false;
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => { el.hidden = true; }, 4200);
}

function safeFileName(value) {
  return String(value || 'Song').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}

function downloadBytes(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function markSongProjectMidiExported(exportedAt) {
  try {
    const { getSheetSongProject } = await import('./song-project-ui.js');
    const project = getSheetSongProject?.();
    if (!project) return;
    project.export = { ...(project.export || {}), lastSongMidiAt: exportedAt };
    project.updatedAt = exportedAt;
  } catch {
    // Song.mid itself was already generated successfully. JSON export remains usable even if
    // this optional in-memory progress marker cannot be updated in an older browser.
  }
}

async function currentSongContext() {
  const api = convergence();
  if (api?.prepareExport && !(await api.prepareExport())) return null;
  if (api?.currentPlanContext) return api.currentPlanContext({ save: true, journal: api.loadJournal?.() || null });

  const savedText = localStorage.getItem(STORAGE_KEY);
  if (!savedText) throw new Error('先に編曲案を保存してください。');
  const saved = JSON.parse(savedText);
  const { source, candidate } = restoreArrangerProject(saved);
  if (!source || !candidate) throw new Error('採用済み編曲案からSong.midを復元できませんでした。');
  return { source, candidate, plan: saved };
}

button?.addEventListener('click', async () => {
  try {
    const context = await currentSongContext();
    if (!context) return;
    const { source, candidate } = context;
    const bytes = buildSongMidi(source, candidate);
    const filename = `${safeFileName(source.title)}_Song.mid`;
    downloadBytes(bytes, filename);
    const exportedAt = new Date().toISOString();
    await markSongProjectMidiExported(exportedAt);
    const carryOver = convergence()?.getContext?.()?.carryOver || [];
    flash(carryOver.length
      ? 'Current PlanのSong.midを書き出しました。「DAWで決める」メモはMIDI単体には入らないためDAW ZIPも確認してください。'
      : '画面のCurrent Planと同じ5トラックのSong.midを書き出しました。');
  } catch (error) {
    flash(error instanceof Error ? error.message : 'Song.midを書き出せませんでした。', true);
  }
});
