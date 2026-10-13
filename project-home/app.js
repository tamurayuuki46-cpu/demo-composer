import { loadSheetLink, saveSheetLink } from '../src/hub/sheet-link.js';
import {
  loadCompositionSheetHandoff,
  parseCompositionSheetHandoffJson,
  saveCompositionSheetHandoff,
} from '../src/hub/composition-sheet-handoff.js';
import {
  buildWorkflowState,
  hasAnalysis,
  hasArrangement,
  hasComposition,
  lineageLabel,
} from './workflow.js';

let current = null;
const file = document.querySelector('#project-file');
const message = document.querySelector('#message');
const summary = document.querySelector('#summary');
const exportCard = document.querySelector('#export-card');
const workflowCard = document.querySelector('#workflow-card');
const workflowList = document.querySelector('#workflow-list');
const nextAction = document.querySelector('#next-action');
const optionalAnalysis = document.querySelector('#optional-analysis');
const claudeInput = document.querySelector('#claude-link-input');
const claudeOpen = document.querySelector('#claude-link-open');
const claudeClear = document.querySelector('#claude-link-clear');
const claudeMessage = document.querySelector('#claude-link-message');
const sheetJsonFile = document.querySelector('#sheet-json-file');
const sheetJsonStatus = document.querySelector('#sheet-json-status');

function status(id, label, done) {
  const el = document.querySelector(id);
  el.className = done ? 'ok' : 'pending';
  el.textContent = `${label}: ${done ? '✓' : 'in progress'}`;
}

function safeName(v) {
  return String(v || 'song-project').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}

function workflowStatusLabel(statusValue) {
  return ({
    done: '完了',
    pending: '次に進める',
    optional: '任意',
    locked: '前工程待ち',
    external: 'PC工程',
  })[statusValue] || statusValue;
}

function renderWorkflow() {
  const sheetLink = loadSheetLink();
  const sheetHandoff = loadCompositionSheetHandoff();
  const sheetReady = Boolean(sheetLink || sheetHandoff);
  if (!current) {
    workflowCard.hidden = false;
    workflowList.innerHTML = `<li class="workflow-step ${sheetReady ? 'done' : 'pending'}"><strong>1. 作曲シート</strong><span>${sheetHandoff ? '引き継ぎJSON保存済み' : sheetLink ? 'Artifact登録済み' : 'まず曲の方向性を決めます。'}</span></li>`;
    nextAction.textContent = sheetHandoff ? 'Demo Composerで曲を作る' : sheetLink ? '作曲シートを開く' : 'Claude Artifact / 作曲シートを登録する';
    nextAction.removeAttribute('href');
    if (sheetHandoff) nextAction.href = '../';
    else if (sheetLink) nextAction.href = sheetLink;
    optionalAnalysis.hidden = true;
    return;
  }

  const workflow = buildWorkflowState(current, { sheetLinked: sheetReady });
  workflowList.replaceChildren(...workflow.steps.map((step) => {
    const item = document.createElement('li');
    item.className = `workflow-step ${step.status}`;
    const title = document.createElement('strong');
    title.textContent = step.label;
    const meta = document.createElement('span');
    meta.textContent = `${step.role}・${workflowStatusLabel(step.status)}${step.required ? '' : '（任意）'}`;
    item.append(title, meta);
    return item;
  }));

  nextAction.textContent = workflow.nextAction.label;
  nextAction.removeAttribute('href');
  if (workflow.nextAction.id === 'sheet' && sheetLink) nextAction.href = sheetLink;
  else if (workflow.nextAction.href) nextAction.href = workflow.nextAction.href;

  optionalAnalysis.hidden = !workflow.optionalAnalysisSuggested;
  workflowCard.hidden = false;
}

function show(p) {
  document.querySelector('#title').textContent = p.title || 'Untitled';
  document.querySelector('#bpm').textContent = p.basic?.bpm ?? '—';
  document.querySelector('#key').textContent = `${p.basic?.key || '—'} ${p.basic?.scale || ''}`.trim();
  document.querySelector('#schema').textContent = `v${p.schemaVersion}`;
  document.querySelector('#updated').textContent = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—';
  document.querySelector('#lineage').textContent = lineageLabel(p);
  status('#analysis-status', 'Analysis', hasAnalysis(p));
  status('#composition-status', 'Composition', hasComposition(p));
  status('#arrangement-status', 'Arrangement', hasArrangement(p));
  summary.hidden = false;
  exportCard.hidden = false;
  renderWorkflow();
}

function renderClaudeLink({ keepInput = false } = {}) {
  const link = loadSheetLink();
  if (!keepInput) claudeInput.value = link || '';
  claudeOpen.hidden = !link;
  claudeClear.hidden = !link;
  if (link) claudeOpen.href = link;
  else claudeOpen.removeAttribute('href');
  const handoff = loadCompositionSheetHandoff();
  if (handoff) sheetJsonStatus.textContent = `引き継ぎJSON保存済み: ${handoff.title || 'Untitled'}。Demo Composerで初期値を確認できます。`;
  renderWorkflow();
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
    renderWorkflow();
  }
});

sheetJsonFile?.addEventListener('change', async () => {
  const selected = sheetJsonFile.files?.[0];
  if (!selected) return;
  try {
    const handoff = parseCompositionSheetHandoffJson(await selected.text());
    saveCompositionSheetHandoff(handoff);
    sheetJsonStatus.textContent = `「${handoff.title || 'Untitled'}」の作曲シート引き継ぎJSONをこの端末に保存しました。`;
    renderWorkflow();
  } catch (error) {
    sheetJsonStatus.textContent = `作曲シートJSONを読み込めませんでした: ${error.message}`;
  } finally {
    sheetJsonFile.value = '';
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
