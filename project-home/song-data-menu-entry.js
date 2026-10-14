import { mountSongDataMenu } from '../src/shared/song-data-menu.js';

const fileInput = document.querySelector('#project-file');
const backupButton = document.querySelector('#backup');
const summary = document.querySelector('#summary');
const title = document.querySelector('#title');
const nextAction = document.querySelector('#next-action');

function hasCurrentSong() {
  return Boolean(summary && !summary.hidden && title?.textContent?.trim());
}

let controller;
function syncMenu() {
  const ready = hasCurrentSong();
  controller?.setCurrent(ready ? title.textContent : '未選択');
  controller?.setSaveEnabled(ready);
  const href = nextAction?.getAttribute('href');
  controller?.setNextEnabled(Boolean(href));
  controller?.setNextLabel('次の工程へ進む', nextAction?.textContent?.trim() || 'Projectの状態から次の工程を案内します');
}

controller = mountSongDataMenu({
  id: 'project-home-song-data-menu',
  currentLabel: '未選択',
  saveEnabled: false,
  nextLabel: '次の工程へ進む',
  nextNote: 'Projectの状態から次の工程を案内します',
  onOpen() {
    fileInput?.click();
    return 'SongProject JSONを選んでください。';
  },
  onSave() {
    if (!hasCurrentSong() || !backupButton) throw new Error('先に保存した曲を開いてください。');
    backupButton.click();
    return `「${title.textContent || 'Untitled Project'}」を保存しました。`;
  },
  onNext() {
    const href = nextAction?.getAttribute('href');
    if (!href) throw new Error('次の工程をまだ決められません。曲データを開くか、作曲シートから始めてください。');
    window.location.href = href;
  },
});

if (summary) new MutationObserver(syncMenu).observe(summary, { attributes: true, attributeFilter: ['hidden'] });
if (title) new MutationObserver(syncMenu).observe(title, { childList: true, characterData: true, subtree: true });
if (nextAction) new MutationObserver(syncMenu).observe(nextAction, { attributes: true, childList: true, characterData: true, subtree: true });
syncMenu();
