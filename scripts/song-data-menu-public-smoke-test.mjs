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

const [shared, demoEntry, appEntry, homeApp, homeEntry, arrangerHtml, arrangerEntry, index, arrangerCore] = await Promise.all([
  readFile('src/shared/song-data-menu.js', 'utf8'),
  readFile('src/hub/song-data-menu-entry.js', 'utf8'),
  readFile('src/hub/app-entry.js', 'utf8'),
  readFile('project-home/app.js', 'utf8'),
  readFile('project-home/song-data-menu-entry.js', 'utf8'),
  readFile('arranger/index.html', 'utf8'),
  readFile('arranger/src/song-data-menu-entry.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('arranger/src/core.js', 'utf8'),
]);

assert.match(shared, /position:fixed/);
assert.match(shared, /right:10px/);
assert.match(shared, /📦 曲データ/);
assert.match(shared, /保存した曲を開く/);
assert.match(shared, /今の曲を保存/);
assert.match(appEntry, /song-data-menu-entry\.js/);
assert.match(demoEntry, /Arrangement Labへ進む/);
assert.match(demoEntry, /music-project-songproject-handoff-v1/);
assert.match(homeApp, /song-data-menu-entry\.js/);
assert.match(homeEntry, /Demo Composerへ進む/);
assert.match(arrangerHtml, /song-data-menu-entry\.js/);
assert.match(arrangerEntry, /DAW書き出しへ進む/);
assert.match(index, /v0\.8-dev/);
assert.match(arrangerCore, /ARRANGER_VERSION = 'v0\.7-dev'/);

console.log('Public top-right song data menu wiring passed.');
