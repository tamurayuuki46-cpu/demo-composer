const STYLE_ID = 'song-memo-pad-style';
const STORAGE_PREFIX = 'music-project-song-memo-v1:';

function clean(value) { return String(value ?? '').trim(); }

export function songMemoIdentity(project = {}) {
  return clean(project.projectId || project.id || project.title) || 'unselected';
}

export function songMemoStorageKey(project = {}) {
  return `${STORAGE_PREFIX}${songMemoIdentity(project)}`;
}

export function buildSongMemoText(project = {}, memo = '') {
  const title = clean(project.title || project.metadata?.title) || '名前のない曲';
  return `# ${title} - 作曲メモ\n\n${String(memo ?? '').trim() || '（メモなし）'}\n`;
}

export function buildChatGptMemoText(project = {}, memo = '') {
  const title = clean(project.title || project.metadata?.title) || '名前のない曲';
  return `作曲中の「${title}」について、以下のメモを整理して、次にやることを初心者向けに3つ以内で提案してください。\n\n${String(memo ?? '').trim() || '（メモなし）'}`;
}

function safeFileName(value) {
  return (clean(value) || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
}

function ensureStyles() {
  if (document.querySelector(`#${STYLE_ID}`)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .song-memo-dialog{box-sizing:border-box;width:min(620px,calc(100vw - 20px));max-height:88dvh;overflow:auto;border:1px solid #cbd5e1;border-radius:18px;padding:18px;background:#fff;color:#111827;font:16px system-ui;box-shadow:0 24px 70px rgba(15,23,42,.3)}
    .song-memo-dialog::backdrop{background:rgba(15,23,42,.55)}
    .song-memo-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.song-memo-head h2{margin:0;font-size:1.25rem}.song-memo-close{min-height:42px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#111827;font:inherit;font-weight:800}
    .song-memo-current{margin:10px 0;padding:9px 10px;border-radius:10px;background:#f3f4f6;font-size:.84rem;overflow-wrap:anywhere}
    .song-memo-textarea{box-sizing:border-box;width:100%;min-height:230px;padding:12px;border:1px solid #94a3b8;border-radius:12px;background:#fff;color:#111827;font:16px/1.55 system-ui;resize:vertical}
    .song-memo-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.song-memo-action{min-height:46px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;color:#111827;font:inherit;font-weight:800;text-align:left}.song-memo-action.primary{background:#111827;color:#fff;border-color:#111827}.song-memo-action small{display:block;margin-top:3px;font-size:.72rem;font-weight:500;opacity:.72}
    .song-memo-status{min-height:1.3em;margin:10px 0 0;color:#475569;font-size:.8rem;line-height:1.45}.song-memo-status[data-tone="error"]{color:#b91c1c}.song-memo-status[data-tone="success"]{color:#166534}
    @media(max-width:520px){.song-memo-dialog{width:calc(100vw - 16px);padding:14px}.song-memo-actions{grid-template-columns:1fr}.song-memo-textarea{min-height:210px}}
  `;
  document.head.append(style);
}

function readMemo(project) {
  try {
    const parsed = JSON.parse(localStorage.getItem(songMemoStorageKey(project)) || 'null');
    return typeof parsed?.text === 'string' ? parsed.text : '';
  } catch { return ''; }
}

function writeMemo(project, text) {
  localStorage.setItem(songMemoStorageKey(project), JSON.stringify({
    schemaVersion: 1,
    projectId: songMemoIdentity(project),
    title: clean(project?.title || project?.metadata?.title) || '名前のない曲',
    text: String(text ?? ''),
    updatedAt: new Date().toISOString(),
  }));
}

function downloadText(project, text) {
  const title = clean(project?.title || project?.metadata?.title) || '名前のない曲';
  const blob = new Blob([buildSongMemoText(project, text)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFileName(title)}_memo.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

async function shareMemo(project, text, mode) {
  const title = clean(project?.title || project?.metadata?.title) || '名前のない曲';
  const plainText = mode === 'chatgpt' ? buildChatGptMemoText(project, text) : buildSongMemoText(project, text);
  const file = typeof File === 'function'
    ? new File([buildSongMemoText(project, text)], `${safeFileName(title)}_memo.txt`, { type: 'text/plain' })
    : null;

  if (typeof navigator.share === 'function') {
    const payload = { title: `${title} - 作曲メモ`, text: plainText };
    if (mode !== 'chatgpt' && file && (!navigator.canShare || navigator.canShare({ files: [file] }))) payload.files = [file];
    await navigator.share(payload);
    return mode === 'chatgpt'
      ? '共有が完了しました。ChatGPTを選んだ場合はメモが転送されています。'
      : '共有が完了しました。Google Drive / Notionを選んだ場合は保存されています。';
  }

  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(plainText);
  if (mode === 'chatgpt') {
    window.open('https://chatgpt.com/', '_blank', 'noopener');
    return 'メモをコピーしてChatGPTを開きました。貼り付けて送信してください。';
  }
  downloadText(project, text);
  return '共有機能が使えないためTXTを保存しました。Drive / Notionへアップロードしてください。';
}

export function openSongMemoPad(project, options = {}) {
  if (!project) throw new Error('現在の曲を取得できませんでした。先に曲を開くか作成してください。');
  ensureStyles();
  let dialog = document.querySelector('#song-memo-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'song-memo-dialog';
    dialog.className = 'song-memo-dialog';
    document.body.append(dialog);
  }
  dialog.replaceChildren();

  const head = document.createElement('div');
  head.className = 'song-memo-head';
  const heading = document.createElement('h2');
  heading.textContent = '📓 曲メモ帳';
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'song-memo-close'; close.textContent = '閉じる';
  close.addEventListener('click', () => typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open'));
  head.append(heading, close);

  const current = document.createElement('p');
  current.className = 'song-memo-current';
  current.textContent = `現在：${clean(project.title || project.metadata?.title) || '名前のない曲'}`;
  const textarea = document.createElement('textarea');
  textarea.className = 'song-memo-textarea';
  textarea.placeholder = '気づいたこと、次に試すこと、参考曲から借りたい点などを自由にメモ';
  textarea.value = readMemo(project);

  const status = document.createElement('p');
  status.className = 'song-memo-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = '入力内容は曲ごとに端末へ自動保存されます。';
  const setStatus = (message, tone = 'neutral') => { status.textContent = message; status.dataset.tone = tone; };
  const persist = (silent = false) => {
    try { writeMemo(project, textarea.value); if (!silent) setStatus('この曲のメモを端末に保存しました。', 'success'); }
    catch { setStatus('端末に保存できませんでした。TXT保存または共有を使ってください。', 'error'); }
  };
  let saveTimer = 0;
  textarea.addEventListener('input', () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => persist(true), 250);
  });

  const actions = document.createElement('div');
  actions.className = 'song-memo-actions';
  const make = (label, note, primary = false) => {
    const node = document.createElement('button');
    node.type = 'button'; node.className = `song-memo-action${primary ? ' primary' : ''}`;
    node.innerHTML = `<span>${label}</span><small>${note}</small>`;
    return node;
  };
  const save = make('💾 端末に保存', 'この曲専用メモとして自動保存', true);
  const external = make('☁️ Drive / Notion', 'Android共有画面から保存先を選ぶ');
  const chatgpt = make('🤖 ChatGPTへ共有', '共有先でChatGPTを選ぶ / 非対応時はコピー');
  const txt = make('📄 TXT保存', '普通のテキストファイルとしてバックアップ');
  save.addEventListener('click', () => persist(false));
  external.addEventListener('click', async () => {
    persist(true);
    try { setStatus(await shareMemo(project, textarea.value, 'external'), 'success'); }
    catch (error) { setStatus(error?.name === 'AbortError' ? '共有をキャンセルしました。端末のメモは残っています。' : (error?.message || '共有できませんでした。'), error?.name === 'AbortError' ? 'neutral' : 'error'); }
  });
  chatgpt.addEventListener('click', async () => {
    persist(true);
    try { setStatus(await shareMemo(project, textarea.value, 'chatgpt'), 'success'); }
    catch (error) { setStatus(error?.name === 'AbortError' ? '共有をキャンセルしました。端末のメモは残っています。' : (error?.message || 'ChatGPTへ共有できませんでした。'), error?.name === 'AbortError' ? 'neutral' : 'error'); }
  });
  txt.addEventListener('click', () => { persist(true); downloadText(project, textarea.value); setStatus('TXTを端末に保存しました。', 'success'); });
  actions.append(save, external, chatgpt, txt);
  dialog.append(head, current, textarea, actions, status);

  options.onOpen?.(project);
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  textarea.focus();
  return dialog;
}
