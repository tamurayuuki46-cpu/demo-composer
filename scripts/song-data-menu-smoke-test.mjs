import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const shared = await fs.readFile('src/shared/song-data-menu.js', 'utf8');
const demoEntry = await fs.readFile('src/hub/song-data-menu-entry.js', 'utf8');
const appEntry = await fs.readFile('src/hub/app-entry.js', 'utf8');
const homeEntry = await fs.readFile('project-home/song-data-menu-entry.js', 'utf8');
const homeApp = await fs.readFile('project-home/app.js', 'utf8');
const homeWorkflow = await fs.readFile('project-home/workflow.js', 'utf8');
const arrangerEntry = await fs.readFile('arranger/src/song-data-menu-entry.js', 'utf8');
const arrangerBoundary = await fs.readFile('arranger/src/workflow-boundary-ui.js', 'utf8');
const sheetLatest = await fs.readFile('sheet-app/latest/composition_sheet_latest.html', 'utf8');
const sheetHtml = await fs.readFile('sheet-app/versions/v0.3/composition_sheet_v0.3.html', 'utf8');
const sheetJs = await fs.readFile('sheet-app/versions/v0.3/composition_sheet_v0.3.js', 'utf8');

assert.match(shared, /position:fixed/);
assert.match(shared, /right:10px/);
assert.match(shared, /📦 曲データ/);
assert.match(shared, /保存した曲を開く/);
assert.match(shared, /今の曲を保存/);
assert.match(shared, /SongProject v1 \/ JSON/);

assert.match(appEntry, /song-data-menu-entry\.js/);
assert.match(demoEntry, /Arrangement Labへ進む/);
assert.match(demoEntry, /music-project-songproject-handoff-v1/);
assert.match(homeApp, /song-data-menu-entry\.js/);
assert.doesNotMatch(homeWorkflow, /song-data-menu-entry\.js/, 'workflow.js must stay DOM-free for Node tests');
assert.match(homeEntry, /次の工程へ進む/);
assert.match(arrangerBoundary, /song-data-menu-entry\.js/);
assert.match(arrangerEntry, /DAW書き出しへ進む/);
assert.match(sheetLatest, /versions\/v0\.3\/composition_sheet_v0\.3\.html/);
assert.match(sheetHtml, /v0\.3-dev/);
assert.match(sheetJs, /mountSongDataMenu/);
assert.match(sheetJs, /Demo Composerへ進む/);
assert.match(sheetJs, /music-project-songproject-handoff-v1/);

console.log('Shared top-right song data menu wiring passed across Sheet / Home / Demo / Arrangement');
