import { arrangerSession, confirmCurrentPlanExport } from './app.js';
import { buildSongMidi } from './song-midi.js';

const button = document.querySelector('#export-song-midi-btn');

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

button?.addEventListener('click', async () => {
  try {
    if (!await confirmCurrentPlanExport()) return;
    const { source, candidate, carryOver } = arrangerSession.current();
    const bytes = buildSongMidi(source, candidate);
    const filename = `${safeFileName(source.title)}_Song.mid`;
    downloadBytes(bytes, filename);
    const exportedAt = new Date().toISOString();
    await markSongProjectMidiExported(exportedAt);
    flash(carryOver.length ? '未決定項目はDAWで調整してください。' : 'Current Planから5トラックのSong.midを書き出しました。');
  } catch (error) {
    flash(error instanceof Error ? error.message : 'Song.midを書き出せませんでした。', true);
  }
});
