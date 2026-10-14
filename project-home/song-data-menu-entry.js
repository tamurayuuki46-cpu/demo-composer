import { getSheetSongProject } from './app.js';
import { songProjectToDemoProject } from '../src/shared/song-project.js';
import { downloadMidiBundle } from '../src/midi/midi-export.js';
import { mountSongDataMenu } from '../src/shared/song-data-menu.js';

const fileInput = document.querySelector('#project-file');
const backupButton = document.querySelector('#backup');
const summary = document.querySelector('#summary');
const title = document.querySelector('#title');

function hasCurrentSong() {
  return Boolean(summary && !summary.hidden && title?.textContent?.trim());
}

let controller;
function syncMenu() {
  const ready = hasCurrentSong();
  controller?.setCurrent(ready ? title.textContent : '未選択');
  controller?.setMidiEnabled(ready);
  controller?.setSaveEnabled(ready);
}

controller = mountSongDataMenu({
  id: 'project-home-song-data-menu',
  getSheetProject: getSheetSongProject,
  currentLabel: '未選択',
  midiEnabled: false,
  saveEnabled: false,
  nextLabel: 'Demo Composerへ進む',
  nextNote: '曲づくり画面を開きます',
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
    window.location.href = new URL('../', window.location.href).href;
  },
});

if (summary) new MutationObserver(syncMenu).observe(summary, { attributes: true, attributeFilter: ['hidden'] });
if (title) new MutationObserver(syncMenu).observe(title, { childList: true, characterData: true, subtree: true });
syncMenu();
