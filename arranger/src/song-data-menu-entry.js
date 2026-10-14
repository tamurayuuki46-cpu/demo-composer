import { mountSongDataMenu } from '../../src/shared/song-data-menu.js';

const fileInput = document.querySelector('#project-file');
const exportButton = document.querySelector('#export-song-project-btn');
const sourceSummary = document.querySelector('#source-summary');
const dawSection = document.querySelector('#step-daw');

function currentLabel() {
  if (!exportButton || exportButton.disabled) return '未選択';
  const strong = sourceSummary?.querySelector('strong')?.textContent?.trim();
  const text = sourceSummary?.textContent?.trim().replace(/\s+/g, ' ');
  return strong || (text ? text.slice(0, 64) : '読み込み済みの曲');
}

let controller;
function syncMenu() {
  const ready = Boolean(exportButton && !exportButton.disabled);
  controller?.setCurrent(currentLabel());
  controller?.setSaveEnabled(ready);
}

controller = mountSongDataMenu({
  id: 'arrangement-lab-song-data-menu',
  currentLabel: currentLabel(),
  saveEnabled: Boolean(exportButton && !exportButton.disabled),
  nextLabel: 'DAW書き出しへ進む',
  nextNote: 'Cubasis / Cubase向けの書き出し場所へ移動します',
  onOpen() {
    fileInput?.click();
    return 'SongProject JSONを選んでください。';
  },
  onSave() {
    if (!exportButton || exportButton.disabled) throw new Error('先に曲データを読み込んでください。');
    exportButton.click();
    return 'Arrangementの変更を含む曲データを保存しました。';
  },
  onNext() {
    if (!dawSection) throw new Error('DAW書き出し欄を開けませんでした。');
    dawSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return 'DAW書き出し欄へ移動しました。';
  },
});

if (exportButton) new MutationObserver(syncMenu).observe(exportButton, { attributes: true, attributeFilter: ['disabled'] });
if (sourceSummary) new MutationObserver(syncMenu).observe(sourceSummary, { childList: true, subtree: true, characterData: true });
syncMenu();
