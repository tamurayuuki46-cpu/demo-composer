const ORIGIN_LABEL = { global: '全体', section: 'Section', element: '個別', default: '仮案' };
let selectedReason = '余白';

const bridge = () => window.__arrangerConvergence || null;
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function installStyle() {
  if (document.querySelector('#convergence-style')) return;
  const style = document.createElement('style');
  style.id = 'convergence-style';
  style.textContent = `
    body{padding-bottom:calc(176px + env(safe-area-inset-bottom,0px))}
    .convergence-bar{position:fixed;z-index:60;left:0;right:0;bottom:0;background:rgba(15,23,42,.97);border-top:1px solid rgba(148,163,184,.35);padding:8px max(10px,env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-right));box-shadow:0 -8px 24px rgba(0,0,0,.22)}
    .convergence-inner{max-width:760px;margin:0 auto;display:grid;gap:7px}.convergence-head{display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:.78rem}.convergence-head strong{font-size:.86rem}.convergence-head span{opacity:.75}
    .convergence-scope-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.convergence-scope-row select,.convergence-scope-row button{min-height:38px}.convergence-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.convergence-actions button{min-height:48px;font-weight:800}.convergence-actions [data-status="hold"]{border-style:dashed}
    .convergence-reasons{display:flex;gap:6px;overflow:auto;padding-bottom:1px}.convergence-reasons button{white-space:nowrap;min-height:32px;padding:4px 10px}.convergence-reasons button.is-selected{outline:2px solid currentColor}
    .convergence-notice{position:fixed;z-index:61;left:10px;right:10px;bottom:calc(180px + env(safe-area-inset-bottom,0px));max-width:740px;margin:auto;display:grid;gap:6px}.convergence-notice-row{display:flex;gap:8px;align-items:center;justify-content:space-between;background:#fff7ed;color:#7c2d12;border:1px solid #fed7aa;border-radius:12px;padding:8px 10px;font-size:.78rem;box-shadow:0 5px 16px rgba(0,0,0,.12)}.convergence-notice-row button{min-height:34px;white-space:nowrap}
    .convergence-modal{position:fixed;z-index:80;inset:0;background:rgba(2,6,23,.74);display:grid;place-items:end center;padding:16px}.convergence-sheet{width:min(720px,100%);max-height:82vh;overflow:auto;background:#fff;color:#111827;border-radius:18px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.35)}.convergence-sheet h2{margin:0 0 6px}.convergence-sheet-list{display:grid;gap:8px;margin:12px 0}.convergence-sheet-item{border:1px solid #d1d5db;border-radius:12px;padding:10px}.convergence-sheet-item strong{display:block;margin-bottom:8px}.convergence-sheet-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}.convergence-sheet-footer{display:flex;gap:8px;justify-content:flex-end;position:sticky;bottom:0;background:#fff;padding-top:10px}
    .convergence-undo{position:fixed;z-index:90;left:50%;transform:translateX(-50%);bottom:calc(190px + env(safe-area-inset-bottom,0px));background:#111827;color:#fff;border-radius:999px;padding:8px 10px 8px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 22px rgba(0,0,0,.28)}.convergence-undo button{min-height:34px}
    @media(min-width:700px){body{padding-bottom:150px}.convergence-notice{bottom:154px}.convergence-undo{bottom:162px}.convergence-modal{place-items:center}}
  `;
  document.head.append(style);
}

function scopeOptions() {
  try { return bridge()?.scopeOptions?.() || [{ key: 'global', label: '曲全体' }]; }
  catch { return [{ key: 'global', label: '曲全体' }]; }
}

function selectedScopeKey() { return document.querySelector('#convergence-scope')?.value || 'global'; }

function provenanceFor(context, key) {
  if (!context?.resolved) return '由来: -';
  if (key === 'global') return context.resolved.tentative ? '由来: 仮案' : '由来: 全体判断';
  if (key.startsWith('section:')) {
    const sid = key.slice(8); const row = context.resolved.provenance?.find((item) => item.sectionId === sid);
    return `由来: ${ORIGIN_LABEL[row?.base?.origin] || row?.base?.origin || '-'}`;
  }
  if (key.startsWith('element:')) {
    const rest = key.slice(8), cut = rest.lastIndexOf(':'), sid = rest.slice(0, cut), element = rest.slice(cut + 1);
    const row = context.resolved.provenance?.find((item) => item.sectionId === sid), origin = row?.elements?.[element]?.origin;
    return `由来: ${ORIGIN_LABEL[origin] || origin || '-'}`;
  }
  return '由来: -';
}

function renderNotices(context) {
  const box = document.querySelector('#convergence-notice');
  if (!box) return;
  const rows = [];
  if (context?.warning) rows.push(`<div class="convergence-notice-row"><span>${escapeHtml(context.warning)}</span><button type="button" class="secondary" data-convergence-warning>確認</button></div>`);
  if (context?.structureOffer) rows.push('<div class="convergence-notice-row"><span>以前の構成と一致する判断バックアップがあります。</span><button type="button" class="secondary" data-convergence-structure>元の判断を確認</button></div>');
  for (const rec of (context?.recoveries || []).slice(0, 3)) {
    rows.push(`<div class="convergence-notice-row"><span>判断をRecoveryへ退避: ${escapeHtml(rec.key)}</span><button type="button" class="secondary" data-convergence-recovery="${escapeHtml(rec.key)}">元の判断のまま採用</button></div>`);
  }
  box.innerHTML = rows.join('');
  box.hidden = rows.length === 0;
}

export function refreshConvergenceUI() {
  const api = bridge();
  if (!api) return;
  const context = api.getContext?.();
  const select = document.querySelector('#convergence-scope');
  if (select) {
    const current = select.value || 'global';
    const opts = scopeOptions();
    select.innerHTML = opts.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`).join('');
    select.value = opts.some((item) => item.key === current) ? current : 'global';
  }
  const label = document.querySelector('#convergence-current-label');
  if (label) label.textContent = context?.resolved?.tentativeLabel || 'Current Plan';
  const provenance = document.querySelector('#convergence-provenance');
  if (provenance) provenance.textContent = provenanceFor(context, selectedScopeKey());
  const release = document.querySelector('#convergence-release');
  if (release) release.hidden = selectedScopeKey() === 'global';
  renderNotices(context);
}

function showUndo(message = '判断を更新しました') {
  document.querySelector('#convergence-undo')?.remove();
  const el = document.createElement('div');
  el.id = 'convergence-undo'; el.className = 'convergence-undo';
  el.innerHTML = `<span>${escapeHtml(message)}</span><button type="button" class="secondary">元に戻す</button>`;
  document.body.append(el);
  const timer = setTimeout(() => el.remove(), 5200);
  el.querySelector('button').addEventListener('click', () => {
    clearTimeout(timer);
    const result = bridge()?.undo?.();
    el.remove();
    if (!result?.ok) window.dispatchEvent(new CustomEvent('arranger-convergence-message', { detail: { message: 'Undoできませんでした。', error: true } }));
    refreshConvergenceUI();
  });
}

async function handleDecision(status) {
  const result = bridge()?.decide?.(selectedScopeKey(), status, selectedReason);
  if (result?.ok) showUndo(status === 'adopted' ? '採用を記録しました' : status === 'hold' ? 'まだ迷うを記録しました' : '不採用を記録しました');
  refreshConvergenceUI();
}

function modalBase(title, bodyHtml) {
  const overlay = document.createElement('div'); overlay.className = 'convergence-modal';
  overlay.innerHTML = `<div class="convergence-sheet" role="dialog" aria-modal="true"><h2>${escapeHtml(title)}</h2>${bodyHtml}</div>`;
  document.body.append(overlay); return overlay;
}

function confirmWarning(context) {
  if (!context?.warning) return Promise.resolve(true);
  return new Promise((resolve) => {
    const overlay = modalBase('収束判断の確認', `<p>${escapeHtml(context.warning)}</p><p>現在のCurrent Planは表示できますが、補助状態が欠けている可能性があります。内容を確認してから書き出してください。</p><div class="convergence-sheet-footer"><button type="button" class="secondary" data-cancel>戻る</button><button type="button" class="primary" data-continue>確認して続ける</button></div>`);
    overlay.querySelector('[data-cancel]').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('[data-continue]').addEventListener('click', () => { overlay.remove(); resolve(true); });
  });
}

function unresolvedLabel(item) {
  const options = scopeOptions();
  return options.find((row) => row.key === item.key)?.label || item.key;
}

function resolveUnresolvedForExport() {
  return new Promise((resolve) => {
    const overlay = modalBase('書き出し前の未決定', '<p>未決定の項目だけ、Labで決めるかDAWへ持ち越すか選びます。</p><div class="convergence-sheet-list"></div><div class="convergence-sheet-footer"><button type="button" class="secondary" data-cancel>書き出しをやめる</button><button type="button" class="primary" data-continue disabled>書き出しを続ける</button></div>');
    const list = overlay.querySelector('.convergence-sheet-list'), continueButton = overlay.querySelector('[data-continue]');
    const render = () => {
      const unresolved = bridge()?.getContext?.()?.resolved?.unresolved || [];
      if (!unresolved.length) {
        list.innerHTML = '<p>未決定項目はありません。DAW持ち越し内容を含めて書き出せます。</p>';
        continueButton.disabled = false;
        return;
      }
      continueButton.disabled = true;
      list.innerHTML = unresolved.map((item) => `<div class="convergence-sheet-item" data-unresolved="${escapeHtml(item.key)}"><strong>${escapeHtml(unresolvedLabel(item))}</strong><div class="convergence-sheet-buttons"><button type="button" class="secondary" data-lab="${escapeHtml(item.key)}">Labで決める</button><button type="button" class="primary" data-daw="${escapeHtml(item.key)}">DAWで決める</button></div></div>`).join('');
      list.querySelectorAll('[data-lab]').forEach((button) => button.addEventListener('click', () => {
        const select = document.querySelector('#convergence-scope'); if (select) select.value = button.dataset.lab;
        overlay.remove(); refreshConvergenceUI(); document.querySelector('#convergence-bar')?.scrollIntoView?.({ block: 'end' }); resolve(false);
      }));
      list.querySelectorAll('[data-daw]').forEach((button) => button.addEventListener('click', () => {
        const result = bridge()?.carryOver?.(button.dataset.daw);
        if (result?.ok) render(); else refreshConvergenceUI();
      }));
    };
    overlay.querySelector('[data-cancel]').addEventListener('click', () => { overlay.remove(); resolve(false); });
    continueButton.addEventListener('click', () => { overlay.remove(); resolve(true); });
    render();
  });
}

export async function prepareConvergenceExport() {
  const context = bridge()?.getContext?.();
  if (!(await confirmWarning(context))) return false;
  const unresolved = bridge()?.getContext?.()?.resolved?.unresolved || [];
  if (!unresolved.length) return true;
  return resolveUnresolvedForExport();
}

function inject() {
  if (document.querySelector('#convergence-bar')) return;
  installStyle();
  const notice = document.createElement('div'); notice.id = 'convergence-notice'; notice.className = 'convergence-notice'; notice.hidden = true; document.body.append(notice);
  const bar = document.createElement('div'); bar.id = 'convergence-bar'; bar.className = 'convergence-bar';
  bar.innerHTML = `<div class="convergence-inner"><div class="convergence-head"><strong id="convergence-current-label">仮:B（未決定）</strong><span id="convergence-provenance">由来: 仮案</span></div><div class="convergence-scope-row"><select id="convergence-scope" aria-label="判断対象"><option value="global">曲全体</option></select><button id="convergence-release" type="button" class="secondary" hidden>上書き解除</button></div><div class="convergence-reasons" aria-label="定型理由"><button type="button" class="secondary is-selected" data-reason="余白">余白</button><button type="button" class="secondary" data-reason="つながり">つながり</button><button type="button" class="secondary" data-reason="主役が明確">主役が明確</button><button type="button" class="secondary" data-reason="落差">落差</button></div><div class="convergence-actions"><button type="button" class="primary" data-status="adopted">採用</button><button type="button" class="secondary" data-status="hold">まだ迷う</button><button type="button" class="secondary" data-status="rejected">不採用</button></div></div>`;
  document.body.append(bar);

  bar.querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', () => handleDecision(button.dataset.status)));
  bar.querySelectorAll('[data-reason]').forEach((button) => button.addEventListener('click', () => {
    selectedReason = button.dataset.reason;
    bar.querySelectorAll('[data-reason]').forEach((row) => row.classList.toggle('is-selected', row === button));
  }));
  bar.querySelector('#convergence-scope').addEventListener('change', refreshConvergenceUI);
  bar.querySelector('#convergence-release').addEventListener('click', () => {
    const result = bridge()?.release?.(selectedScopeKey()); if (result?.ok) showUndo('上書きを解除しました'); refreshConvergenceUI();
  });
  notice.addEventListener('click', (event) => {
    const recovery = event.target.closest('[data-convergence-recovery]');
    if (recovery) { const result = bridge()?.restoreRecovery?.(recovery.dataset.convergenceRecovery); if (result?.ok) showUndo('元の判断を採用しました'); refreshConvergenceUI(); return; }
    if (event.target.closest('[data-convergence-structure]')) { const result = bridge()?.adoptStructureOffer?.(); if (result?.ok) showUndo('以前の構成判断を復元しました'); refreshConvergenceUI(); return; }
    if (event.target.closest('[data-convergence-warning]')) prepareConvergenceExport();
  });

  const api = bridge();
  if (api) api.prepareExport = prepareConvergenceExport;
  window.addEventListener('arranger-convergence-change', refreshConvergenceUI);
  const sections = document.querySelector('#sections');
  if (sections) new MutationObserver(() => queueMicrotask(refreshConvergenceUI)).observe(sections, { childList: true, subtree: true });
  refreshConvergenceUI();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject, { once: true }); else queueMicrotask(inject);
