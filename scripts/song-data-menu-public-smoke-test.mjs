import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const files = [
  'src/shared/song-data-menu.js',
  'src/hub/song-data-menu-entry.js',
  'project-home/song-data-menu-entry.js',
  'arranger/src/song-data-menu-entry.js',
];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });

const [shared, demoEntry, appEntry, homeApp, homeEntry, arrangerHtml, arrangerEntry, index] = await Promise.all([
  readFile('src/shared/song-data-menu.js', 'utf8'),
  readFile('src/hub/song-data-menu-entry.js', 'utf8'),
  readFile('src/hub/app-entry.js', 'utf8'),
  readFile('project-home/app.js', 'utf8'),
  readFile('project-home/song-data-menu-entry.js', 'utf8'),
  readFile('arranger/index.html', 'utf8'),
  readFile('arranger/src/song-data-menu-entry.js', 'utf8'),
  readFile('index.html', 'utf8'),
]);

assert.match(shared, /📦 曲データ/);
for (const label of ['全アプリ遷移', 'MIDI保存', 'JSON保存', '作曲シート成果物']) assert.match(shared, new RegExp(label));
assert.match(shared, /保存JSONを開く/);
assert.match(shared, /song-data-primary-action/);
assert.match(shared, /Music Project Home/);
assert.match(shared, /MIDI Analyzer/);
assert.match(shared, /Demo Composer/);
assert.match(shared, /Arrangement Lab/);
assert.match(shared, /setMidiEnabled/);
assert.match(appEntry, /song-data-menu-entry\.js/);
assert.match(demoEntry, /downloadMidiBundle/);
assert.match(demoEntry, /onMidi/);
assert.match(demoEntry, /music-project-songproject-handoff-v1/);
assert.match(homeApp, /song-data-menu-entry\.js/);
assert.match(homeEntry, /songProjectToDemoProject/);
assert.match(homeEntry, /onMidi/);
assert.match(arrangerHtml, /song-data-menu-entry\.js/);
assert.match(arrangerEntry, /export-song-midi-btn/);
assert.match(arrangerEntry, /onMidi/);
assert.match(index, /v0\.9-dev/);

console.log('Public four-action song data menu wiring passed.');
