import {
  DIVERGENCE_AXES,
  branchDivergence,
  branchTree,
  createDivergenceSession,
  freezeDivergenceBranch,
  getDivergenceNode,
  keepDivergenceBranch,
  restoreDivergenceSnapshot,
  selectDivergenceNode,
  setDivergenceDistance,
  setDivergenceLocks,
  snapshotDivergence,
} from '../../src/core/divergence.js';
import {
  ARRANGER_VERSION,
  STYLE_PROFILES,
  createArrangerProject,
  normalizeSourceProject,
  restoreArrangerProject,
  summarizeCandidate,
} from './core.js';
import { arrangementDivergenceTransform, createArrangementDivergenceSeed } from './divergence.js';
import { startPreview } from './preview.js';

const STORAGE_KEY = 'demo-composer-arranger-v0.4';
const SESSION_PREFIX = 'arrangement-lab:divergence:v1:';
const app = document.querySelector('#arranger-divergence-app');
let source = null;
let session = null;
let styleId = 'jpop-band';
let status = '';
let stopPreview = null;

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function sessionKey() { return `${SESSION_PREFIX}${source?.sourceProjectId ?? source?.title ?? 'none'}:${source?.sourceRevision ?? 0}`; }
function saveSession() {
  if (!source || !session) return;
  try { sessionStorage.setItem(sessionKey(), JSON.stringify(session)); } catch {}
}
function loadSession() {
  try {
    const raw = sessionStorage.getItem(sessionKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? parsed : null;
  } catch { return null; }
}
function stopAudio() {
  if (stopPreview) { try { stopPreview(); } catch {} stopPreview = null; }
}
function summaryHtml() {
  if (!source) return '';
  return `<div class="import-summary">
    <div><span>曲名</span><strong>${escapeHtml(source.title)}</strong></div>
    <div><span>BPM</span><strong>${source.basic.bpm}</strong></div>
    <div><span>Key</span><strong>${escapeHtml(source.basic.key)} ${escapeHtml(source.basic.scale)}</strong></div>
    <div><span>Section</span><strong>${source.sections.length}</strong></div>
  </div>`;
}
function nodeAxes(node) {
  if (!node.changedAxes?.length) return '元案';
  return DIVERGENCE_AXES.filter((axis) => node.changedAxes.includes(axis.id)).map((axis) => axis.label).join(' / ');
}
function nodeCard(node) {
  const active = node.id === session.activeNodeId;
  return `<article class="branch-card ${active ? 'active' : ''}">
    <span class="eyebrow">${node.frozen ? 'Freeze' : node.kept ? 'Keep' : 'Branch'}</span>
    <h3>${escapeHtml(node.label)}</h3>
    <p>${escapeHtml(node.meta?.summary ?? node.payload?.description ?? '')}</p>
    <dl>
      <div><dt>Distance</dt><dd>${node.distance || 'Seed'}</dd></div>
      <div><dt>変更軸</dt><dd>${escapeHtml(nodeAxes(node))}</dd></div>
      <div><dt>密度</dt><dd>${escapeHtml(summarizeCandidate(node.payload))}</dd></div>
      <div><dt>Seed</dt><dd class="seed-code">${escapeHtml(node.seedValue)}</dd></div>
    </dl>
    <div class="branch-actions">
      <button data-select="${escapeHtml(node.id)}" class="secondary">${active ? '選択中' : '選ぶ'}</button>
      <button data-preview="${escapeHtml(node.id)}" class="secondary">▶ 試聴</button>
      <button data-keep="${escapeHtml(node.id)}" class="secondary" ${node.kept ? 'disabled' : ''}>Keep</button>
      <button data-branch="${escapeHtml(node.id)}" class="secondary">この案からBranch</button>
    </div>
  </article>`;
}
function treeHtml() {
  return branchTree(session).map((item) => `<button class="secondary ${item.id === session.activeNodeId ? 'active' : ''}" data-select="${escapeHtml(item.id)}" style="--depth:${item.depth}"><span>${item.frozen ? '❄' : item.kept ? '◆' : '◇'}</span><strong>${escapeHtml(item.label)}</strong><small>D${item.distance || 0}</small></button>`).join('');
}
function snapshotsHtml() {
  const values = Object.values(session.snapshots ?? {});
  if (!values.length) return '<p class="muted">Snapshotはまだありません。</p>';
  return values.map((item) => `<div class="snapshot-row"><span><strong>${escapeHtml(item.label)}</strong><br><small class="seed-code">${escapeHtml(item.seedValue)}</small></span><button class="secondary" data-restore="${escapeHtml(item.id)}">Restore</button></div>`).join('');
}

function render() {
  if (!source || !session) {
    app.innerHTML = `<section class="panel divergence-panel"><h2>Seedを読み込む</h2><p>Demo Composerのproject.json / Song Project互換データ、または既存の編曲プランJSONを選びます。元ファイルは変更しません。</p><label class="drop-zone"><input id="seed-file" type="file" accept="application/json,.json,.txt"><strong>Seedファイルを選ぶ</strong><span>発散は読み込み後に始まります</span></label><p class="status-line">${escapeHtml(status)}</p></section>`;
    document.querySelector('#seed-file')?.addEventListener('change', async (event) => {
      const [file] = event.target.files;
      if (file) await importSeed(file);
    });
    return;
  }

  const active = getDivergenceNode(session);
  const children = active.childIds?.map((id) => session.nodes[id]) ?? [];
  const visible = children.length ? children : active.id === 'root' ? [] : [active];
  const hasBranches = Object.keys(session.nodes).length > 1;
  app.innerHTML = `
    <section class="panel divergence-panel">
      <h2>1. Seed（元案）</h2>
      ${summaryHtml()}
      <div class="seed-row">
        <label class="field"><span>Seed値（再現用）</span><input id="seed-value" value="${escapeHtml(session.seedValue)}" ${hasBranches ? 'readonly' : ''}></label>
        <label class="field"><span>基準Style</span><select id="style-id" ${hasBranches ? 'disabled' : ''}>${Object.values(STYLE_PROFILES).map((profile) => `<option value="${profile.id}" ${profile.id === styleId ? 'selected' : ''}>${escapeHtml(profile.name)}</option>`).join('')}</select></label>
      </div>
      <p class="responsibility-note"><strong>責務境界：</strong>Arrangement Labは主旋律そのものを作り替えません。主旋律は常にSourceを参照し、編曲要素だけを発散します。</p>
    </section>
    <section class="panel divergence-panel">
      <h2>2. Lock（固定）</h2>
      <div class="lock-grid">
        ${DIVERGENCE_AXES.map((axis) => {
          const fixedMelody = axis.id === 'melody';
          return `<label class="lock-card"><input type="checkbox" data-lock="${axis.id}" ${fixedMelody || session.locks[axis.id] ? 'checked' : ''} ${fixedMelody ? 'disabled' : ''}><span><strong>${escapeHtml(axis.label)}${fixedMelody ? '（常に固定）' : ''}</strong><small>${fixedMelody ? '作曲責務はDemo Composerに残す' : escapeHtml(axis.description)}</small></span></label>`;
        }).join('')}
      </div>
    </section>
    <section class="panel divergence-panel">
      <h2>3. Divergence Distance（発散距離） <strong>${session.distance}/5</strong></h2>
      <div class="distance-row"><span>近い</span><input id="distance" type="range" min="1" max="5" step="1" value="${session.distance}"><span>遠い</span></div>
      <p class="muted">Distanceが上がるほど、対象Section数・リハモの大胆さ・密度差・楽器構成の差を広げます。</p>
      <div class="action-row"><button id="generate" class="primary">Generate Branches（5案）</button><button id="snapshot" class="secondary">Snapshot</button><button id="freeze" class="secondary">Freeze → 通常比較へ</button></div>
      <p class="status-line">${escapeHtml(status)}</p>
    </section>
    <section class="panel divergence-panel"><h2>4. Branches（派生案）</h2><p class="muted">発散中は点数や順位を付けません。まず試聴して、残したい案だけKeepします。</p><div class="branch-grid">${visible.length ? visible.map(nodeCard).join('') : '<p class="muted">Generate Branchesで5案を作ります。</p>'}</div></section>
    <section class="panel divergence-panel"><h2>5. Branch Tree（派生履歴）</h2><div class="tree">${treeHtml()}</div></section>
    <section class="panel divergence-panel"><h2>6. Snapshot / Restore</h2><div class="snapshot-list">${snapshotsHtml()}</div></section>`;
  bind();
}

async function importSeed(file) {
  try {
    stopAudio();
    const data = JSON.parse(await file.text());
    let seedCandidate;
    if (data?.arrangerSchemaVersion) {
      const restored = restoreArrangerProject(data);
      if (!restored.source || !restored.candidate) throw new Error('この編曲プランだけでは元曲を復元できません。sourceSnapshot付きJSONを使ってください。');
      source = restored.source;
      seedCandidate = restored.candidate;
      styleId = seedCandidate.styleId || styleId;
    } else {
      source = normalizeSourceProject(data);
      seedCandidate = createArrangementDivergenceSeed(source, { styleId });
    }
    session = loadSession() ?? createDivergenceSession(seedCandidate, {
      seedValue: `arr-${source.sourceProjectId ?? source.title}-${source.sourceRevision ?? 0}`,
      locks: { melody: true },
      distance: 3,
      mode: 'arranger',
      constraints: { key: source.basic.key, bpm: source.basic.bpm, genre: source.genre, mood: source.mood },
    });
    session = setDivergenceLocks(session, { ...session.locks, melody: true });
    status = 'Seedを読み込みました。元曲と元ファイルは変更していません。';
    saveSession(); render();
  } catch (error) {
    source = null; session = null; status = error instanceof Error ? error.message : 'Seedを読み込めませんでした。'; render();
  }
}

function syncControls() {
  const locks = { melody: true };
  document.querySelectorAll('[data-lock]').forEach((input) => { locks[input.dataset.lock] = input.dataset.lock === 'melody' ? true : input.checked; });
  session = setDivergenceLocks(session, locks);
  session = setDivergenceDistance(session, Number(document.querySelector('#distance')?.value ?? session.distance));
  const seedInput = document.querySelector('#seed-value');
  const style = document.querySelector('#style-id')?.value ?? styleId;
  if (Object.keys(session.nodes).length === 1 && (seedInput?.value.trim() !== session.seedValue || style !== styleId)) {
    styleId = style;
    const seedCandidate = createArrangementDivergenceSeed(source, { styleId });
    session = createDivergenceSession(seedCandidate, { seedValue: seedInput?.value.trim(), locks, distance: session.distance, mode: 'arranger', constraints: clone(session.constraints) });
  }
}
function generateFrom(parentId) {
  syncControls();
  const result = branchDivergence(session, { parentId, count: 5, distance: session.distance, locks: session.locks, operation: parentId === 'root' ? 'generate' : 'mutate', labelPrefix: parentId === 'root' ? 'Arrangement' : 'Mutate', transform(candidate, context) { return arrangementDivergenceTransform(candidate, context, { source }); } });
  session = result.session;
  status = `${getDivergenceNode(session, parentId).label}から${result.branches.length}案を作りました。`;
  saveSession(); render();
}
async function previewNode(nodeId) {
  stopAudio();
  const node = getDivergenceNode(session, nodeId);
  session = selectDivergenceNode(session, nodeId);
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) throw new Error('このブラウザではWeb Audioを利用できません。');
  const ctx = new AudioContextClass({ latencyHint: 'playback' });
  stopPreview = startPreview(ctx, source, node.payload, 0, () => { stopPreview = null; });
  status = `${node.label}を簡易試聴中です。まだ採用していません。`;
  saveSession(); render();
}
function freezeActive() {
  stopAudio();
  const frozen = freezeDivergenceBranch(session);
  session = frozen.session;
  const plan = createArrangerProject(source, frozen.project);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); } catch {}
  status = `${frozen.node.label}をFreezeしました。通常のArrangement Labを開くと、この編曲プランを比較・採用できます。`;
  saveSession(); render();
}
function bind() {
  document.querySelector('#distance')?.addEventListener('input', (event) => { session = setDivergenceDistance(session, Number(event.target.value)); saveSession(); render(); });
  document.querySelectorAll('[data-lock]').forEach((input) => input.addEventListener('change', () => { syncControls(); saveSession(); render(); }));
  document.querySelector('#seed-value')?.addEventListener('change', () => { syncControls(); saveSession(); render(); });
  document.querySelector('#style-id')?.addEventListener('change', () => { syncControls(); saveSession(); render(); });
  document.querySelector('#generate')?.addEventListener('click', () => { try { generateFrom(session.activeNodeId); } catch (error) { status = error instanceof Error ? error.message : 'Branch生成に失敗しました。'; render(); } });
  document.querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => { stopAudio(); session = selectDivergenceNode(session, button.dataset.select); status = `${getDivergenceNode(session).label}を選択しました。`; saveSession(); render(); }));
  document.querySelectorAll('[data-preview]').forEach((button) => button.addEventListener('click', async () => { try { await previewNode(button.dataset.preview); } catch (error) { status = error instanceof Error ? error.message : '試聴できませんでした。'; render(); } }));
  document.querySelectorAll('[data-keep]').forEach((button) => button.addEventListener('click', () => { session = keepDivergenceBranch(session, button.dataset.keep); status = `${getDivergenceNode(session).label}をKeepしました。`; saveSession(); render(); }));
  document.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => { try { session = keepDivergenceBranch(session, button.dataset.branch); generateFrom(button.dataset.branch); } catch (error) { status = error instanceof Error ? error.message : '再Branchできませんでした。'; render(); } }));
  document.querySelector('#snapshot')?.addEventListener('click', () => { const result = snapshotDivergence(session, `${getDivergenceNode(session).label} / Round ${session.branchRound}`); session = result.session; status = `${result.snapshot.label}を保存しました。`; saveSession(); render(); });
  document.querySelectorAll('[data-restore]').forEach((button) => button.addEventListener('click', () => { stopAudio(); session = restoreDivergenceSnapshot(session, button.dataset.restore); status = 'Snapshotを復元しました。'; saveSession(); render(); }));
  document.querySelector('#freeze')?.addEventListener('click', freezeActive);
}

render();
