const UI_VERSION = 'v0.13-dev';
const MODE_KEY = 'arrangement-lab-ui-mode-v0.6';
const MODES = new Set(['beginner', 'explore']);

const STEPS = [
  { selector: '#step-import', label: '① 読み込む', next: '曲のJSONを開く（1小節のコード / メロディだけでもOK）' },
  { selector: '#step-direction', label: '② 聴く', next: 'A / B / Cを順番に聴く' },
  { selector: '#step-compare', label: '③ 選ぶ', next: '残したい案を1つ選ぶ' },
  { selector: '#step-section', label: '④ Section調整', next: '調整後に「このSectionを試聴」。リハモは聴いてから採用' },
  { selector: '#v05-decision-panel', label: '⑤ 記録', next: '判断を1つメモする' },
  { selector: '#step-daw', label: '⑥ DAWへ', next: 'MIDI / ZIPを書き出してCubasis・Cubaseへ渡す' },
];

let mode = readMode();
let currentStep = 0;
let scrollQueued = false;
let mutationQueued = false;
let versionObserver = null;

function readMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return MODES.has(saved) ? saved : 'beginner';
  } catch {
    return 'beginner';
  }
}

function saveMode(next) {
  try { localStorage.setItem(MODE_KEY, next); } catch {}
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

function enforceVersion() {
  const version = document.querySelector('#version');
  setText(version, UI_VERSION);
  document.documentElement.dataset.arrangerUiVersion = UI_VERSION;
}

function guardVersion() {
  const version = document.querySelector('#version');
  if (!version || versionObserver) return;
  versionObserver = new MutationObserver(() => {
    if (version.textContent !== UI_VERSION) enforceVersion();
  });
  versionObserver.observe(version, { childList: true, characterData: true, subtree: true });
  enforceVersion();
}

function guideMarkup() {
  return `
    <section id="beginner-guide" class="beginner-guide" aria-label="Arrangement Labの使い方">
      <div class="beginner-guide-head">
        <div>
          <p class="eyebrow">GUIDED FLOW</p>
          <h2>迷ったら、この順番だけ</h2>
        </div>
        <div class="mode-switch" role="group" aria-label="表示モード">
          <button type="button" data-arranger-mode="beginner">初心者モード</button>
          <button type="button" data-arranger-mode="explore">もっと試す</button>
        </div>
      </div>
      <div class="next-action-card">
        <span>次にやること</span>
        <strong id="beginner-next-action">${escapeHtml(STEPS[0].next)}</strong>
      </div>
      <p class="beginner-guide-note">1小節だけでも試せます。コードだけならそのコードからA/B/Cとリハモ3案を作れます。コードが無い1小節メロディには仮コードを付けます。④では調整後のSectionやリハモ候補を採用前に試聴できます。仮決めでOK。いつでも「前へ」で戻って直せます。</p>
    </section>`;
}

function navMarkup() {
  return `
    <nav id="beginner-bottom-nav" class="beginner-bottom-nav" aria-label="初心者フローナビ">
      <button type="button" id="beginner-prev" class="secondary">← 前へ</button>
      <button type="button" id="beginner-step-label" class="beginner-step-label" aria-label="現在の工程">① 読み込む</button>
      <button type="button" id="beginner-next" class="primary">次へ →</button>
    </nav>`;
}

function injectGuide() {
  if (!document.querySelector('#beginner-guide')) {
    const header = document.querySelector('.app-header');
    header?.insertAdjacentHTML('afterend', guideMarkup());
  }
  if (!document.querySelector('#beginner-bottom-nav')) {
    document.body.insertAdjacentHTML('beforeend', navMarkup());
  }

  document.querySelectorAll('[data-arranger-mode]').forEach((button) => {
    if (button.dataset.beginnerBound) return;
    button.dataset.beginnerBound = 'true';
    button.addEventListener('click', () => setMode(button.dataset.arrangerMode));
  });
  const prev = document.querySelector('#beginner-prev');
  const next = document.querySelector('#beginner-next');
  const label = document.querySelector('#beginner-step-label');
  if (prev && !prev.dataset.beginnerBound) {
    prev.dataset.beginnerBound = 'true';
    prev.addEventListener('click', () => goToStep(currentStep - 1));
  }
  if (next && !next.dataset.beginnerBound) {
    next.dataset.beginnerBound = 'true';
    next.addEventListener('click', () => goToStep(currentStep + 1));
  }
  if (label && !label.dataset.beginnerBound) {
    label.dataset.beginnerBound = 'true';
    label.addEventListener('click', () => goToStep(currentStep));
  }
}

function setMode(next, { persist = true } = {}) {
  mode = MODES.has(next) ? next : 'beginner';
  document.documentElement.dataset.arrangerMode = mode;
  if (persist) saveMode(mode);
  document.querySelectorAll('[data-arranger-mode]').forEach((button) => {
    const active = button.dataset.arrangerMode === mode;
    button.classList.toggle('is-active', active);
    if (button.getAttribute('aria-pressed') !== String(active)) button.setAttribute('aria-pressed', String(active));
  });
  const sectionToggle = document.querySelector('#section-more-toggle');
  const toggleText = mode === 'beginner' ? 'もっと試す（高度な編曲）' : '初心者モードへ戻る';
  setText(sectionToggle, toggleText);
  updateNextAction();
}

function ensureSectionModeButton() {
  const panel = document.querySelector('#step-section');
  const title = panel?.querySelector('.panel-title');
  if (!panel || !title || panel.querySelector('#section-more-toggle')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'section-more-toggle';
  button.className = 'secondary section-more-toggle';
  button.textContent = mode === 'beginner' ? 'もっと試す（高度な編曲）' : '初心者モードへ戻る';
  button.addEventListener('click', () => setMode(mode === 'beginner' ? 'explore' : 'beginner'));
  title.after(button);
}

function bindEmptyStateButton(empty) {
  const button = empty?.querySelector('[data-go-step]');
  if (!button || button.dataset.beginnerBound) return;
  button.dataset.beginnerBound = 'true';
  button.addEventListener('click', () => goToStep(Number(button.dataset.goStep || 0)));
}

function ensureSectionEmptyState() {
  const sections = document.querySelector('#sections');
  if (!sections) return;
  const hasCards = Boolean(sections.querySelector('.section-card'));
  let empty = sections.querySelector('[data-section-empty]');
  if (hasCards) {
    empty?.remove();
    const panel = document.querySelector('#step-section');
    if (panel && !panel.querySelector('[data-beginner-section-hint]')) {
      const hint = document.createElement('p');
      hint.className = 'beginner-section-hint';
      hint.dataset.beginnerSectionHint = 'true';
      hint.textContent = '初心者モードは、まず1つのSectionだけ触ればOK。調整したら「このSectionを試聴」。リハモは「3案を提案」→「試聴」→「採用」の順で比べられます。';
      sections.before(hint);
    }
    return;
  }
  document.querySelector('[data-beginner-section-hint]')?.remove();
  if (!empty) {
    empty = document.createElement('div');
    empty.className = 'section-empty-state';
    empty.dataset.sectionEmpty = 'true';
    empty.innerHTML = '<strong>④はまだ準備中です</strong><p>まず①で曲を読み込み、②でA / B / Cを作ると、ここにSectionカードが表示されます。</p><button type="button" class="secondary" data-go-step="0">① 曲を読み込むへ</button>';
    sections.append(empty);
  }
  bindEmptyStateButton(empty);
}

function cleanInjectedHeadings() {
  const decisionTitle = document.querySelector('#v05-decision-panel .panel-title h2');
  if (decisionTitle?.textContent?.startsWith('⑤ ')) decisionTitle.textContent = decisionTitle.textContent.replace(/^⑤\s*/, '');
}

function stepNodes() {
  return STEPS.map((step) => document.querySelector(step.selector));
}

function clampStep(index) {
  return Math.max(0, Math.min(STEPS.length - 1, Number(index) || 0));
}

function goToStep(index) {
  currentStep = clampStep(index);
  const nodes = stepNodes();
  let target = nodes[currentStep];
  if (!target) {
    const direction = index >= currentStep ? 1 : -1;
    for (let i = currentStep; i >= 0 && i < nodes.length; i += direction) {
      if (nodes[i]) { currentStep = i; target = nodes[i]; break; }
    }
  }
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateNav();
}

function updateNextAction() {
  const nextAction = document.querySelector('#beginner-next-action');
  if (!nextAction) return;
  const base = STEPS[currentStep]?.next || STEPS[0].next;
  const text = mode === 'explore' && currentStep === 3
    ? `${base}。必要なら50手法・実Note生成まで開く`
    : base;
  setText(nextAction, text);
}

function updateNav() {
  currentStep = clampStep(currentStep);
  const prev = document.querySelector('#beginner-prev');
  const next = document.querySelector('#beginner-next');
  const label = document.querySelector('#beginner-step-label');
  if (prev) prev.disabled = currentStep === 0;
  if (next) {
    next.disabled = currentStep === STEPS.length - 1;
    setText(next, currentStep === STEPS.length - 1 ? 'DAWへ書き出す' : '次へ →');
  }
  setText(label, STEPS[currentStep].label);
  updateNextAction();
}

function updateCurrentFromScroll() {
  scrollQueued = false;
  const anchor = window.scrollY + Math.min(window.innerHeight * 0.36, 300);
  const nodes = stepNodes();
  let found = 0;
  nodes.forEach((node, index) => {
    if (node && node.offsetTop <= anchor) found = index;
  });
  if (found !== currentStep) {
    currentStep = found;
    updateNav();
  }
}

function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updateCurrentFromScroll);
}

function refreshDynamicUi() {
  mutationQueued = false;
  enforceVersion();
  ensureSectionModeButton();
  ensureSectionEmptyState();
  cleanInjectedHeadings();
  setMode(mode, { persist: false });
  updateNav();
}

function queueDynamicRefresh() {
  if (mutationQueued) return;
  mutationQueued = true;
  queueMicrotask(refreshDynamicUi);
}

function init() {
  injectGuide();
  guardVersion();
  setMode(mode, { persist: false });
  ensureSectionModeButton();
  ensureSectionEmptyState();
  cleanInjectedHeadings();
  updateNav();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  const sections = document.querySelector('#sections');
  if (sections) {
    const observer = new MutationObserver(queueDynamicRefresh);
    observer.observe(sections, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else queueMicrotask(init);
