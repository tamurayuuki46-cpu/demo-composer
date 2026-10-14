import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const shared = await fs.readFile('src/shared/song-data-menu.js', 'utf8');
const demoEntry = await fs.readFile('src/hub/song-data-menu-entry.js', 'utf8');
const appEntry = await fs.readFile('src/hub/app-entry.js', 'utf8');
const homeEntry = await fs.readFile('project-home/song-data-menu-entry.js', 'utf8');
const homeWorkflow = await fs.readFile('project-home/workflow.js', 'utf8');
const arrangerEntry = await fs.readFile('arranger/src/song-data-menu-entry.js', 'utf8');
const arrangerBoundary = await fs.readFile('arranger/src/workflow-boundary-ui.js', 'utf8');

assert.match(shared, /position:fixed/);
assert.match(shared, /right:10px/);
assert.match(shared, /📦 曲データ/);
assert.match(shared, /保存した曲を開く/);
assert.match(shared, /今の曲を保存/);
assert.match(shared, /SongProject v1 \/ JSON/);

assert.match(appEntry, /song-data-menu-entry\.js/);
assert.match(demoEntry, /Arrangement Labへ進む/);
assert.match(demoEntry, /music-project-songproject-handoff-v1/);
assert.match(homeWorkflow, /song-data-menu-entry\.js/);
assert.match(homeEntry, /次の工程へ進む/);
assert.match(arrangerBoundary, /song-data-menu-entry\.js/);
assert.match(arrangerEntry, /DAW書き出しへ進む/);

console.log('Shared top-right song data menu wiring passed');
