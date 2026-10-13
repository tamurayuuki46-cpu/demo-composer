import { loadSheetLink, saveSheetLink } from '../src/hub/sheet-link.js';

let current = null;
const file = document.querySelector('#project-file');
const message = document.querySelector('#message');
const summary = document.querySelector('#summary');
const exportCard = document.querySelector('#export-card');
const claudeInput = document.querySelector('#claude-link-input');
const claudeOpen = document.querySelector('#claude-link-open');
const claudeClear = document.querySelector('#claude-link-clear');
const claudeMessage = document.querySelector('#claude-link-message');

function hasAnalysis(p) {
  const a = p.analysis || {};
  return Boolean((a.keyCandidates?.length) || (a.chordCandidates?.length) || a.degreeAnalysis || a.melodyAnalysis || a.bassAnalysis || a.rhythmAnalysis);
}

function hasComposition(p) {
  const c = p.composition || {};
  return Boolean((c.chords?.length) || (c.melody?.length) || (c.counterMelody?.length) || (c.bass?.length) || (c.drums?.length) || (c.sections?.length));
}

function hasArrangement(p) {
  const a = p.arrangement || {};
  return Boolean((a.reharmonization?.length) || (a.voicing?.length) || (a.density?.length) || (a.instruments?.length) || a.selectedAlternatives || (a.decisions?.length));
}

function status(id, label, done) {
  const el = document.querySelector(id);
  el.className = done ? 'ok' : 'pending';
  el.textContent = `${label}: ${done ? '✓' : 'in progress'}`;
}

function safeName(v) {
  return String(v || 'song-project').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}

function show(p) {
  document.querySelector('#title').textContent = p.title || 'Untitled';
  document.querySelector('#bpm').textContent = p.basic?.bpm ?? '—';
  document.querySelector('#key').textContent = `${p.basic?.key || '—'} ${p.basic?.scale || ''}`.trim();
  document.querySelector('#schema').textContent = `v${p.schemaVersion}`;
  document.querySelector('#updated').textContent = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—';
  status('#analysis-status', 'Analysis', hasAnalysis(p));
  status('#composition-status', 'Composition', hasComposition(p));
  status('#arrangement-status', 'Arrangement', hasArrangement(p));
  summary.hidden = false;
  exportCard.hidden = false;
}

function renderClaudeLink({ keepInput = false } = {}) {
  const link = loadSheetLink();
  if (!keepInput) claudeInput.value = link || '';
  claudeOpen.hidden = !link;
  claudeClear.hidden = !link;
  if (link) claudeOpen.href = link;
  else claudeOpen.removeAttribute('href');
}

file.addEventListener('change', async () => {
  const selected = file.files?.[0];
  if (!selected) return;
  try {
    const p = JSON.parse(await selected.text());
    if (p?.kind !== 'song-project' || p?.schemaVersion !== 1) throw new Error('Song Project v1ではありません。');
    current = p;
    show(p);
    message.textContent = 'Song Project v1を読み込みました。';
  } catch (error) {
    current = null;
    summary.hidden = true;
    exportCard.hidden = true;
    message.textContent = `読み込み失敗: ${error.message}`;
  }
});

document.querySelector('#backup').addEventListener('click', () => {
  if (!current) return;
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(current, null, 2)}\n`], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName(current.title)}_song_project_v1_backup.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
});

document.querySelector('#claude-link-save').addEventListener('click', () => {
  const raw = claudeInput.value;
  const link = saveSheetLink(raw);
  if (!raw.trim()) {
    claudeMessage.textContent = 'リンクが空です。claude.ai のリンクを貼ってください。';
  } else if (!link) {
    claudeMessage.textContent = 'https://claude.ai/ のリンクだけ保存できます。';
  } else {
    claudeInput.value = link;
    claudeMessage.textContent = 'Claudeリンクをこの端末に保存しました。';
  }
  renderClaudeLink({ keepInput: !link && Boolean(raw.trim()) });
});

claudeClear.addEventListener('click', () => {
  saveSheetLink('');
  claudeInput.value = '';
  claudeMessage.textContent = 'Claudeリンクをこの端末から消しました。';
  renderClaudeLink();
});

renderClaudeLink();
