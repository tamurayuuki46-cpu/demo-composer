import { sheetSummary } from './composition-sheet-summary.js';
const STYLE_ID = 'song-data-menu-style';

function ensureStyles() {
  if (document.querySelector(`#${STYLE_ID}`)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .song-data-dock{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:10px;z-index:5000;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .song-data-trigger{width:auto!important;min-width:0!important;min-height:42px!important;margin:0!important;padding:9px 12px!important;border:1px solid rgba(15,23,42,.25)!important;border-radius:999px!important;background:#111827!important;color:#fff!important;box-shadow:0 7px 22px rgba(15,23,42,.18)!important;font:inherit!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;white-space:nowrap}
    .song-data-trigger[aria-expanded="true"]{background:#312e81!important}
    .song-data-panel{position:absolute;top:50px;right:0;width:min(330px,calc(100vw - 20px));box-sizing:border-box;padding:14px;border:1px solid #d1d5db;border-radius:16px;background:#fff;color:#111827;box-shadow:0 18px 48px rgba(15,23,42,.24)}
    .song-data-panel[hidden]{display:none!important}
    .song-data-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
    .song-data-head strong{display:block;font-size:1rem}.song-data-head small{display:block;margin-top:3px;color:#6b7280;font-size:.76rem}
    .song-data-close{width:34px!important;min-width:34px!important;min-height:34px!important;padding:0!important;border:1px solid #d1d5db!important;border-radius:999px!important;background:#fff!important;color:#111827!important;font:inherit!important;font-size:1.2rem!important;line-height:1!important}
    .song-data-current{margin:0 0 10px;padding:9px 10px;border-radius:10px;background:#f3f4f6;font-size:.82rem;line-height:1.45;word-break:break-word}
    .song-data-actions{display:grid;gap:8px}
    .song-data-action{width:100%!important;min-height:46px!important;margin:0!important;padding:10px 12px!important;border:1px solid #cbd5e1!important;border-radius:11px!important;background:#fff!important;color:#111827!important;font:inherit!important;font-weight:800!important;text-align:left!important;cursor:pointer!important}
    .song-data-action small{display:block;margin-top:3px;color:#6b7280;font-size:.74rem;font-weight:500}
    .song-data-action.primary{background:#111827!important;color:#fff!important;border-color:#111827!important}.song-data-action.primary small{color:#d1d5db}
    .song-data-action:disabled{opacity:.45!important;cursor:not-allowed!important}
    .song-data-status{min-height:1.25em;margin:10px 0 0;color:#4b5563;font-size:.78rem;line-height:1.45}.song-data-status[data-tone="error"]{color:#b91c1c}.song-data-status[data-tone="success"]{color:#166534}
    @media(max-width:520px){.song-data-dock{top:calc(env(safe-area-inset-top,0px) + 8px);right:8px}.song-data-trigger{min-height:40px!important;padding:8px 10px!important;font-size:.88rem!important}.song-data-panel{top:47px;width:min(330px,calc(100vw - 16px));padding:12px}}
  `;
  document.head.append(style);
}

function normalizeLabel(value, fallback = '未選択') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function mountSongDataMenu(options = {}) {
  const id = options.id || 'song-data-menu';
  const existing = document.querySelector(`#${id}`);
  if (existing?.songDataController) return existing.songDataController;

  ensureStyles();
  const root = document.createElement('div');
  root.id = id;
  root.className = 'song-data-dock';
  root.innerHTML = `
    <button type="button" class="song-data-trigger" aria-expanded="false" aria-controls="${id}-panel">📦 曲データ</button>
    <section id="${id}-panel" class="song-data-panel" aria-label="曲データメニュー" hidden>
      <div class="song-data-head">
        <div><strong>曲データ</strong><small>SongProject v1 / JSON</small></div>
        <button type="button" class="song-data-close" aria-label="曲データメニューを閉じる">×</button>
      </div>
      <p class="song-data-current"><strong>現在：</strong><span data-song-data-current>${normalizeLabel(options.currentLabel)}</span></p>
      <div class="song-data-actions"><button type="button" class="song-data-action" data-song-data-action="sheet"><span>📝 記入シートの簡易版</span><small>テーマ・場面・山谷・パート別のメモを見る</small></button>
        <button type="button" class="song-data-action" data-song-data-action="open"><span>保存した曲を開く</span><small>SongProject JSONを読み込みます</small></button>
        <button type="button" class="song-data-action" data-song-data-action="save"><span>今の曲を保存</span><small>SongProject v1を端末へ保存します</small></button>
        <button type="button" class="song-data-action primary" data-song-data-action="next"><span data-song-data-next-label>${normalizeLabel(options.nextLabel, '次のアプリへ進む')}</span><small data-song-data-next-note>${normalizeLabel(options.nextNote, '保存して次の工程へ進みます')}</small></button>
      </div>
      <p class="song-data-status" data-song-data-status aria-live="polite">困ったらここから曲データを開く / 保存できます。</p>
    </section>`;
  document.body.append(root);

  const sheetButton=root.querySelector('[data-song-data-action="sheet"]');
  sheetButton.addEventListener('click',async()=>{
    try{
      const data=sheetSummary(await options.getSheetProject?.());
      let dialog=document.querySelector('#composition-sheet-summary-dialog');
      if(!dialog){dialog=document.createElement('dialog');dialog.id='composition-sheet-summary-dialog';dialog.setAttribute('aria-label','記入シートの簡易版');document.body.append(dialog);}
      dialog.style.cssText='box-sizing:border-box;width:min(580px,calc(100vw - 24px));max-height:85dvh;overflow:auto;border:1px solid #cbd5e1;border-radius:16px;padding:20px;background:#fff;color:#111827;font:16px system-ui;';
      dialog.replaceChildren();
      const close=document.createElement('button');close.type='button';close.textContent='閉じる';close.style.cssText='float:right;min-height:44px';close.onclick=()=>dialog.close();
      const heading=document.createElement('h2');heading.textContent='📝 記入シートの簡易版';
      const title=document.createElement('p');title.textContent=data.title;
      dialog.append(close,heading,title);
      if(!data.rows.length){const empty=document.createElement('p');empty.textContent='この曲の記入内容はまだありません。作曲シートで記入し、保存したSongProject JSONをこのアプリで読み込んでください。';dialog.append(empty);}
      let group='';
      for(const row of data.rows){if(row.group!==group){const h=document.createElement('h3');h.textContent=row.group;dialog.append(h);group=row.group;}const p=document.createElement('p'),label=document.createElement('strong'),value=document.createElement('span');label.textContent=row.label+'：';value.textContent=row.value;p.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6';p.append(label,value);dialog.append(p);}
      const link=document.createElement('a');link.href='https://songwriting-full-workbook-31.yoshitamura.chatgpt.site/sheet-app/';link.target='_blank';link.rel='noopener';link.textContent='作曲シートを開く ↗';dialog.append(link);
      closePanel();dialog.showModal();close.focus();
    }catch(error){setStatus(error?.message||'記入シートを表示できませんでした。','error');}
  });
  const trigger = root.querySelector('.song-data-trigger');
  const panel = root.querySelector('.song-data-panel');
  const closeButton = root.querySelector('.song-data-close');
  const current = root.querySelector('[data-song-data-current]');
  const status = root.querySelector('[data-song-data-status]');
  const openButton = root.querySelector('[data-song-data-action="open"]');
  const saveButton = root.querySelector('[data-song-data-action="save"]');
  const nextButton = root.querySelector('[data-song-data-action="next"]');
  const nextLabel = root.querySelector('[data-song-data-next-label]');
  const nextNote = root.querySelector('[data-song-data-next-note]');

  let busy = false;
  const openPanel = () => { panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
  const closePanel = () => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
  const setStatus = (message, tone = 'neutral') => {
    status.textContent = String(message || '');
    status.dataset.tone = tone;
  };
  const setBusy = (value) => {
    busy = Boolean(value);
    [openButton, saveButton, nextButton].forEach((button) => { button.dataset.songDataBusy = busy ? 'true' : 'false'; });
  };

  async function run(action, callback) {
    if (busy || typeof callback !== 'function') return;
    setBusy(true);
    try {
      const result = await callback();
      if (typeof result === 'string' && result) setStatus(result, 'success');
    } catch (error) {
      setStatus(error?.message || '操作できませんでした。', 'error');
    } finally {
      setBusy(false);
    }
  }

  trigger.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener('click', closePanel);
  openButton.addEventListener('click', () => run('open', options.onOpen));
  saveButton.addEventListener('click', () => run('save', options.onSave));
  nextButton.addEventListener('click', () => run('next', options.onNext));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) closePanel(); });
  document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !root.contains(event.target)) closePanel(); });

  const controller = Object.freeze({
    open: openPanel,
    close: closePanel,
    setCurrent(label) { current.textContent = normalizeLabel(label); },
    setStatus,
    setOpenEnabled(enabled) { openButton.disabled = !enabled; },
    setSaveEnabled(enabled) { saveButton.disabled = !enabled; },
    setNextEnabled(enabled) { nextButton.disabled = !enabled; },
    setNextLabel(label, note) {
      if (label) nextLabel.textContent = label;
      if (note) nextNote.textContent = note;
    },
  });
  root.songDataController = controller;

  controller.setOpenEnabled(options.openEnabled !== false);
  controller.setSaveEnabled(options.saveEnabled !== false);
  controller.setNextEnabled(options.nextEnabled !== false);
  return controller;
}
