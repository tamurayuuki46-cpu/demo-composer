import { sheetSummary } from './composition-sheet-summary.js';

const STYLE_ID = 'song-data-menu-style';
const DEFAULT_APPS = Object.freeze([
  { id: 'home', label: 'Music Project Home', note: '曲づくり全体の入口', href: 'https://tamurayuuki46-cpu.github.io/demo-composer/project-home/' },
  { id: 'sheet', label: '作曲シート', note: '方向・参考曲・構成を整理', href: 'https://songwriting-full-workbook-31.yoshitamura.chatgpt.site/sheet-app/' },
  { id: 'analyzer', label: 'MIDI Analyzer', note: '参考MIDIを分析', href: 'https://tamurayuuki46-cpu.github.io/midi-analyzer/' },
  { id: 'composer', label: 'Demo Composer', note: 'コード・メロ・リズムを作る', href: 'https://tamurayuuki46-cpu.github.io/demo-composer/' },
  { id: 'arranger', label: 'Arrangement Lab', note: '編曲案を比較して仕上げる', href: 'https://tamurayuuki46-cpu.github.io/demo-composer/arranger/' },
]);

function ensureStyles() {
  if (document.querySelector(`#${STYLE_ID}`)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .song-data-dock{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:10px;z-index:5000;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .song-data-trigger{width:auto!important;min-width:0!important;min-height:42px!important;margin:0!important;padding:9px 12px!important;border:1px solid rgba(15,23,42,.25)!important;border-radius:999px!important;background:#111827!important;color:#fff!important;box-shadow:0 7px 22px rgba(15,23,42,.18)!important;font:inherit!important;font-weight:800!important;line-height:1!important;cursor:pointer!important;white-space:nowrap}
    .song-data-trigger[aria-expanded="true"]{background:#312e81!important}
    .song-data-panel{position:absolute;top:50px;right:0;width:min(390px,calc(100vw - 20px));box-sizing:border-box;padding:14px;border:1px solid #d1d5db;border-radius:18px;background:#fff;color:#111827;box-shadow:0 18px 48px rgba(15,23,42,.24)}
    .song-data-panel[hidden]{display:none!important}
    .song-data-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
    .song-data-head strong{display:block;font-size:1rem}.song-data-head small{display:block;margin-top:3px;color:#6b7280;font-size:.76rem}
    .song-data-close{width:34px!important;min-width:34px!important;min-height:34px!important;padding:0!important;border:1px solid #d1d5db!important;border-radius:999px!important;background:#fff!important;color:#111827!important;font:inherit!important;font-size:1.2rem!important;line-height:1!important}
    .song-data-current{margin:0 0 12px;padding:9px 10px;border-radius:10px;background:#f3f4f6;font-size:.82rem;line-height:1.45;word-break:break-word}
    .song-data-primary-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .song-data-primary-action{width:100%!important;min-height:92px!important;margin:0!important;padding:12px!important;border:1px solid #cbd5e1!important;border-radius:14px!important;background:#fff!important;color:#111827!important;font:inherit!important;font-weight:850!important;text-align:left!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(15,23,42,.05)!important}
    .song-data-primary-action span{display:block;font-size:1rem;line-height:1.25}.song-data-primary-action small{display:block;margin-top:7px;color:#6b7280;font-size:.73rem;font-weight:500;line-height:1.35}
    .song-data-primary-action.featured{background:#111827!important;color:#fff!important;border-color:#111827!important}.song-data-primary-action.featured small{color:#d1d5db}
    .song-data-primary-action:disabled{opacity:.42!important;cursor:not-allowed!important}
    .song-data-secondary-actions{display:flex;gap:8px;margin-top:10px}
    .song-data-secondary-action{flex:1;width:auto!important;min-height:42px!important;margin:0!important;padding:8px 10px!important;border:1px solid #d1d5db!important;border-radius:10px!important;background:#f9fafb!important;color:#374151!important;font:inherit!important;font-size:.78rem!important;font-weight:750!important;cursor:pointer!important}
    .song-data-secondary-action:disabled{opacity:.42!important;cursor:not-allowed!important}
    .song-data-status{min-height:1.25em;margin:10px 0 0;color:#4b5563;font-size:.78rem;line-height:1.45}.song-data-status[data-tone="error"]{color:#b91c1c}.song-data-status[data-tone="success"]{color:#166534}
    .song-data-dialog{box-sizing:border-box;width:min(620px,calc(100vw - 24px));max-height:88dvh;overflow:auto;border:1px solid #cbd5e1;border-radius:18px;padding:18px;background:#fff;color:#111827;font:16px system-ui;box-shadow:0 24px 70px rgba(15,23,42,.3)}
    .song-data-dialog::backdrop{background:rgba(15,23,42,.55)}
    .song-data-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.song-data-dialog-head h2{margin:0;font-size:1.25rem}.song-data-dialog-close{min-height:42px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#111827;font:inherit;font-weight:800}
    .song-data-app-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.song-data-app-link{box-sizing:border-box;display:block;min-height:82px;padding:13px;border:1px solid #cbd5e1;border-radius:14px;background:#f8fafc;color:#111827;text-decoration:none}.song-data-app-link strong{display:block}.song-data-app-link small{display:block;margin-top:6px;color:#64748b;line-height:1.35}
    .song-data-summary-row{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
    @media(max-width:520px){.song-data-dock{top:calc(env(safe-area-inset-top,0px) + 8px);right:8px}.song-data-trigger{min-height:40px!important;padding:8px 10px!important;font-size:.88rem!important}.song-data-panel{top:47px;width:min(390px,calc(100vw - 16px));padding:12px}.song-data-primary-action{min-height:86px!important;padding:11px!important}.song-data-app-grid{grid-template-columns:1fr}.song-data-dialog{width:calc(100vw - 16px);padding:14px}}
  `;
  document.head.append(style);
}

function normalizeLabel(value, fallback = '未選択') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function ensureDialog(id, label) {
  let dialog = document.querySelector(`#${id}`);
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = id;
    dialog.className = 'song-data-dialog';
    dialog.setAttribute('aria-label', label);
    document.body.append(dialog);
  }
  return dialog;
}

function showDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
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
        <div><strong>曲データ</strong><small>4つの入口 / SongProject v1</small></div>
        <button type="button" class="song-data-close" aria-label="曲データメニューを閉じる">×</button>
      </div>
      <p class="song-data-current"><strong>現在：</strong><span data-song-data-current>${normalizeLabel(options.currentLabel)}</span></p>
      <div class="song-data-primary-actions">
        <button type="button" class="song-data-primary-action featured" data-song-data-action="apps"><span>🧭 全アプリ遷移</span><small>Home / 作曲シート / MIDI解析 / 作曲 / 編曲へ</small></button>
        <button type="button" class="song-data-primary-action" data-song-data-action="midi"><span>🎹 MIDI保存</span><small>現在の曲をMIDIとして端末へ保存</small></button>
        <button type="button" class="song-data-primary-action" data-song-data-action="save"><span>💾 JSON保存</span><small>SongProject v1をバックアップ</small></button>
        <button type="button" class="song-data-primary-action" data-song-data-action="sheet"><span>📝 作曲シート成果物</span><small>書き出し済みの記入内容を確認</small></button>
      </div>
      <div class="song-data-secondary-actions">
        <button type="button" class="song-data-secondary-action" data-song-data-action="open">保存JSONを開く</button>
        <button type="button" class="song-data-secondary-action" data-song-data-action="next" hidden><span data-song-data-next-label>${normalizeLabel(options.nextLabel, '次の工程へ')}</span></button>
      </div>
      <p class="song-data-status" data-song-data-status aria-live="polite">4つの大きなボタンから、移動・MIDI・JSON・作曲シートを操作できます。</p>
    </section>`;
  document.body.append(root);

  const trigger = root.querySelector('.song-data-trigger');
  const panel = root.querySelector('.song-data-panel');
  const closeButton = root.querySelector('.song-data-close');
  const current = root.querySelector('[data-song-data-current]');
  const status = root.querySelector('[data-song-data-status]');
  const appsButton = root.querySelector('[data-song-data-action="apps"]');
  const midiButton = root.querySelector('[data-song-data-action="midi"]');
  const sheetButton = root.querySelector('[data-song-data-action="sheet"]');
  const openButton = root.querySelector('[data-song-data-action="open"]');
  const saveButton = root.querySelector('[data-song-data-action="save"]');
  const nextButton = root.querySelector('[data-song-data-action="next"]');
  const nextLabel = root.querySelector('[data-song-data-next-label]');

  let busy = false;
  const openPanel = () => { panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
  const closePanel = () => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
  const setStatus = (message, tone = 'neutral') => {
    status.textContent = String(message || '');
    status.dataset.tone = tone;
  };
  const setBusy = (value) => {
    busy = Boolean(value);
    [appsButton, midiButton, sheetButton, openButton, saveButton, nextButton].forEach((button) => {
      if (button) button.dataset.songDataBusy = busy ? 'true' : 'false';
    });
  };

  async function run(callback) {
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

  appsButton.addEventListener('click', () => {
    const dialog = ensureDialog(`${id}-apps-dialog`, '全アプリ遷移');
    dialog.replaceChildren();
    const head = document.createElement('div');
    head.className = 'song-data-dialog-head';
    const heading = document.createElement('h2');
    heading.textContent = '🧭 全アプリ遷移';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'song-data-dialog-close';
    close.textContent = '閉じる';
    close.addEventListener('click', () => closeDialog(dialog));
    head.append(heading, close);
    const note = document.createElement('p');
    note.textContent = '移動前に必要ならJSON保存してください。別サイトへの曲データ共有はJSONで行います。';
    const grid = document.createElement('div');
    grid.className = 'song-data-app-grid';
    const apps = Array.isArray(options.apps) && options.apps.length ? options.apps : DEFAULT_APPS;
    for (const app of apps) {
      const link = document.createElement('a');
      link.className = 'song-data-app-link';
      link.href = app.href;
      link.dataset.appId = app.id || '';
      const strong = document.createElement('strong');
      strong.textContent = app.label;
      const small = document.createElement('small');
      small.textContent = app.note || '';
      link.append(strong, small);
      grid.append(link);
    }
    dialog.append(head, note, grid);
    closePanel();
    showDialog(dialog);
    close.focus();
  });

  sheetButton.addEventListener('click', async () => {
    try {
      const data = sheetSummary(await options.getSheetProject?.());
      const dialog = ensureDialog('composition-sheet-summary-dialog', '作曲シート成果物');
      dialog.replaceChildren();
      const head = document.createElement('div');
      head.className = 'song-data-dialog-head';
      const heading = document.createElement('h2');
      heading.textContent = '📝 作曲シート成果物';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'song-data-dialog-close';
      close.textContent = '閉じる';
      close.addEventListener('click', () => closeDialog(dialog));
      head.append(heading, close);
      const title = document.createElement('p');
      title.textContent = data.title;
      dialog.append(head, title);
      if (!data.rows.length) {
        const empty = document.createElement('p');
        empty.textContent = 'この曲の作曲シート成果物はまだありません。作曲シートで記入し、SongProject JSONを保存してください。';
        dialog.append(empty);
      }
      let group = '';
      for (const row of data.rows) {
        if (row.group !== group) {
          const h = document.createElement('h3');
          h.textContent = row.group;
          dialog.append(h);
          group = row.group;
        }
        const p = document.createElement('p');
        p.className = 'song-data-summary-row';
        const label = document.createElement('strong');
        const value = document.createElement('span');
        label.textContent = `${row.label}：`;
        value.textContent = row.value;
        p.append(label, value);
        dialog.append(p);
      }
      const link = document.createElement('a');
      link.href = 'https://songwriting-full-workbook-31.yoshitamura.chatgpt.site/sheet-app/';
      link.textContent = '作曲シート本体を開く ↗';
      link.style.display = 'inline-block';
      link.style.marginTop = '12px';
      dialog.append(link);
      closePanel();
      showDialog(dialog);
      close.focus();
    } catch (error) {
      setStatus(error?.message || '作曲シート成果物を表示できませんでした。', 'error');
    }
  });

  trigger.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener('click', closePanel);
  midiButton.addEventListener('click', () => run(options.onMidi));
  openButton.addEventListener('click', () => run(options.onOpen));
  saveButton.addEventListener('click', () => run(options.onSave));
  nextButton.addEventListener('click', () => run(options.onNext));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) closePanel(); });
  document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !root.contains(event.target)) closePanel(); });

  const controller = Object.freeze({
    open: openPanel,
    close: closePanel,
    setCurrent(label) { current.textContent = normalizeLabel(label); },
    setStatus,
    setOpenEnabled(enabled) { openButton.disabled = !enabled; },
    setMidiEnabled(enabled) { midiButton.disabled = !enabled; },
    setSaveEnabled(enabled) { saveButton.disabled = !enabled; },
    setNextEnabled(enabled) {
      nextButton.disabled = !enabled;
      nextButton.hidden = typeof options.onNext !== 'function';
    },
    setNextLabel(label) { if (label) nextLabel.textContent = label; },
  });
  root.songDataController = controller;

  controller.setOpenEnabled(options.openEnabled !== false && typeof options.onOpen === 'function');
  controller.setMidiEnabled(options.midiEnabled !== false && typeof options.onMidi === 'function');
  controller.setSaveEnabled(options.saveEnabled !== false && typeof options.onSave === 'function');
  controller.setNextEnabled(options.nextEnabled !== false);
  return controller;
}
