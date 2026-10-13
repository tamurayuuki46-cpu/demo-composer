import {
  clearCompositionSheetHandoff,
  loadCompositionSheetHandoff,
  sheetInitialValues,
} from './composition-sheet-handoff.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function listText(values) {
  return Array.isArray(values) && values.length ? values.join(' / ') : '—';
}

function summaryHtml(handoff) {
  const sheet = handoff.sheet;
  const references = sheet.references.map((item) => [item.title, item.artist].filter(Boolean).join(' / ')).filter(Boolean);
  const vocal = sheet.vocal;
  return `
    <section class="sheet-handoff-card" data-composition-sheet-handoff>
      <h3>作曲シート引き継ぎ</h3>
      <p class="hint">Claude Artifactで決めた設計を確認してから初期値へ反映します。Chord / Melody等を自動生成しません。</p>
      <dl class="sheet-handoff-summary">
        <div><dt>仮タイトル</dt><dd>${escapeHtml(handoff.title || '—')}</dd></div>
        <div><dt>場面</dt><dd>${escapeHtml(sheet.scene || '—')}</dd></div>
        <div><dt>目的</dt><dd>${escapeHtml(sheet.purpose || '—')}</dd></div>
        <div><dt>参考曲</dt><dd>${escapeHtml(listText(references))}</dd></div>
        <div><dt>Genre / Mood</dt><dd>${escapeHtml(`${listText(sheet.genre)} / ${listText(sheet.mood)}`)}</dd></div>
        <div><dt>BPM / Key</dt><dd>${escapeHtml(`${sheet.bpm.selected ?? sheet.bpm.candidates[0] ?? '未決定'} / ${sheet.key.selected ?? sheet.key.candidates[0] ?? '未決定'} ${sheet.scale ?? ''}`)}</dd></div>
        <div><dt>制約</dt><dd>${escapeHtml(listText(sheet.constraints))}</dd></div>
        <div><dt>今回試すこと</dt><dd>${escapeHtml(listText(sheet.experiments))}</dd></div>
        ${vocal.isVocalSong !== null || vocal.lyricsTheme || vocal.direction ? `<div><dt>Vocal / Lyrics</dt><dd>${escapeHtml([vocal.lyricsTheme, vocal.lyricalImage, vocal.direction, vocal.range.low || vocal.range.high ? `${vocal.range.low || '?'}–${vocal.range.high || '?'}` : ''].filter(Boolean).join(' / ') || '歌もの')}</dd></div>` : ''}
      </dl>
      <div class="actions sheet-handoff-actions">
        <button type="button" class="primary-action" data-sheet-handoff-apply>Title / BPM / Key / Scaleを反映</button>
        <button type="button" data-sheet-handoff-clear>引き継ぎ情報を消す</button>
      </div>
      <p class="hint">Key変更は既存音符がある場合に移調を伴うことがあります。曲を作り始める前の適用を推奨します。</p>
    </section>`;
}

function dispatchField(id, value) {
  if (value === null || value === undefined || value === '') return false;
  const element = document.querySelector(id);
  if (!element) return false;
  if (element.tagName === 'SELECT' && ![...element.options].some((option) => option.value === String(value))) return false;
  element.value = String(value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

async function applyHandoff() {
  const handoff = loadCompositionSheetHandoff();
  if (!handoff) return;
  const values = sheetInitialValues(handoff);
  const changes = [
    ['#project-title', values.title],
    ['#project-bpm', values.bpm],
    ['#project-key', values.key],
    ['#project-scale', values.scale],
  ];
  for (const [selector, value] of changes) {
    dispatchField(selector, value);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const message = document.querySelector('#hub-message');
  if (message) message.textContent = '作曲シートのTitle / BPM / Key / Scale候補を初期値へ反映しました。設計メモは引き継ぎカードに残しています。';
}

function inject() {
  if (document.querySelector('[data-composition-sheet-handoff]')) return true;
  const handoff = loadCompositionSheetHandoff();
  if (!handoff) return false;
  const anchor = document.querySelector('.sheet-link');
  if (!anchor) return false;
  anchor.insertAdjacentHTML('afterend', summaryHtml(handoff));
  document.querySelector('[data-sheet-handoff-apply]')?.addEventListener('click', applyHandoff);
  document.querySelector('[data-sheet-handoff-clear]')?.addEventListener('click', () => {
    clearCompositionSheetHandoff();
    document.querySelector('[data-composition-sheet-handoff]')?.remove();
  });
  return true;
}

function init() {
  inject();
  const observer = new MutationObserver(() => inject());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
