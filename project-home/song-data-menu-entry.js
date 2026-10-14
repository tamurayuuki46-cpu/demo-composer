import { getSheetSongProject } from './app.js';
import { songProjectToDemoProject } from '../src/shared/song-project.js';
import { downloadMidiBundle } from '../src/midi/midi-export.js';
import { mountSongDataMenu } from '../src/shared/song-data-menu.js';

const fileInput = document.querySelector('#project-file');
const backupButton = document.querySelector('#backup');
const summary = document.querySelector('#summary');
const title = document.querySelector('#title');
const nextAction = document.querySelector('#next-action');

const HOME_APPS = Object.freeze([
  { id: 'home', label: 'Music Project Home', note: '曲づくり全体の入口', href: './' },
  { id: 'sheet', label: '作曲シート', note: '初心者モードから方向を決める・常に最新版', href: '../sheet-app/' },
  { id: 'analyzer', label: 'MIDI Analyzer', note: '必要な時だけ参考MIDIを分析', href: 'https://tamurayuuki46-cpu.github.io/midi-analyzer/' },
  { id: 'composer', label: 'Demo Composer', note: 'コード・メロ・リズムを作る', href: '../' },
  { id: 'arranger', label: 'Arrangement Lab', note: '編曲案を比較して仕上げる', href: '../arranger/' },
]);

function hasCurrentSong() {
  return Boolean(summary && !summary.hidden && title?.textContent?.trim());
}

let controller;
function syncMenu() {
  const ready = hasCurrentSong();
  controller?.setCurrent(ready ? title.textContent : '未選択');
  controller?.setMidiEnabled(ready);
  controller?.setSaveEnabled(ready);
  const href = nextAction?.getAttribute('href');
  controller?.setNextEnabled(Boolean(href));
  controller?.setNextLabel('次の工程へ進む', nextAction?.textContent?.trim() || 'Projectの状態から次の工程を案内します');
}

controller = mountSongDataMenu({
  id: 'project-home-song-data-menu',
  apps: HOME_APPS,
  getSheetProject: getSheetSongProject,
  currentLabel: '未選択',
  midiEnabled: false,
  saveEnabled: false,
  nextLabel: '次の工程へ進む',
  nextNote: 'Projectの状態から次の工程を案内します',
  onOpen() {
    fileInput?.click();
    return 'SongProject JSONを選んでください。';
  },
  onMidi() {
    const songProject = getSheetSongProject();
    if (!songProject) throw new Error('先に保存した曲を開いてください。');
    downloadMidiBundle(songProjectToDemoProject(songProject));
    return '現在の曲のMIDIを保存しました。';
  },
  onSave() {
    if (!hasCurrentSong() || !backupButton) throw new Error('先に保存した曲を開いてください。');
    backupButton.click();
    return `「${title.textContent || 'Untitled Project'}」のJSONを保存しました。`;
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
