import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const legacyAppPath = 'sheet-app/versions/v0.2/composition_sheet_v0.2.html';
const previousAppPath = 'sheet-app/versions/v0.7/composition_sheet_v0.7.html';
const priorAppPath = 'sheet-app/versions/v0.8/composition_sheet_v0.8.html';
const appPath = 'sheet-app/versions/v0.9/composition_sheet_v0.9.html';
const scriptPath = 'sheet-app/versions/v0.9/composition_sheet_v0.9.js';
const stylePath = 'sheet-app/versions/v0.9/composition_sheet_v0.9.css';
const sourcePath = 'sheet-app/versions/v0.4/sheet_content_v0.4.js';
const modelPath = 'sheet-app/versions/v0.4/sheet_model_v0.4.js';
const baseStylePath = 'sheet-app/versions/v0.6/composition_sheet_v0.6.css';
const manualIdeasPath = 'sheet-app/versions/v0.8/manual_ideas_v0.8.js';
const latestPath = 'sheet-app/latest/composition_sheet_latest.html';
const manifestPath = 'sheet-app/latest/manifest.json';
const entryPath = 'sheet-app/index.html';

const [legacyApp, previousApp, priorApp, app, script, style, source, model, baseStyle, manualIdeas, latest, manifestText, entry] = await Promise.all([
  readFile(legacyAppPath, 'utf8'),
  readFile(previousAppPath, 'utf8'),
  readFile(priorAppPath, 'utf8'),
  readFile(appPath, 'utf8'),
  readFile(scriptPath, 'utf8'),
  readFile(stylePath, 'utf8'),
  readFile(sourcePath, 'utf8'),
  readFile(modelPath, 'utf8'),
  readFile(baseStylePath, 'utf8'),
  readFile(manualIdeasPath, 'utf8'),
  readFile(latestPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
  readFile(entryPath, 'utf8'),
]);
const manifest = JSON.parse(manifestText);

// Historical public recovery points remain available.
assert.match(legacyApp, /まずは、2項目だけ。/, 'v0.2 historical page is missing');
assert.match(previousApp, /作曲シート全集 · v0\.7/, 'v0.7 public recovery point is missing');
assert.match(priorApp, /31シートの引き出し/, 'v0.8 public recovery point is missing');

// v0.9 beginner-first public workbook.
assert.match(app, /data-sheet-mode="beginner"/, 'v0.9 must open in beginner mode');
assert.match(app, /id="beginner-card"/, 'beginner card is missing');
assert.match(app, /id="beginner-scene"/, 'beginner scene input is missing');
assert.match(app, /id="beginner-reference"/, 'beginner reference input is missing');
assert.match(app, /BPM \/ Keyは未定のままでOK/, 'optional BPM/Key guidance is missing');
assert.match(app, /31シート詳細/, 'detail-mode switch is missing');
assert.match(app, /id="sheet-panel" class="sheet-card detailed-only"/, '31-sheet detail panel is missing');
assert.match(app, /id="manual-idea-form"/, 'manual idea form is missing');
assert.match(app, /viewport-fit=cover/, 'mobile viewport setting is missing');
assert.match(style, /beginner-card/, 'v0.9 beginner styles are missing');
assert.match(baseStyle, /@media\(max-width:820px\)/, 'mobile base layout is missing');

// Runtime dependencies and SongProject compatibility remain on the public main lineage.
assert.match(script, /\.\.\/v0\.4\/sheet_content_v0\.4\.js/, 'v0.9 sheet data reference is missing');
assert.match(script, /\.\.\/v0\.4\/sheet_model_v0\.4\.js/, 'v0.9 sheet model reference is missing');
assert.match(script, /\.\.\/v0\.8\/manual_ideas_v0\.8\.js/, 'v0.9 manual idea model reference is missing');
assert.match(script, /createEmptySongProject/, 'SongProject creation is missing');
assert.match(script, /mergeSheetChangesIntoSongProject/, 'SongProject sheet merge is missing');
assert.match(script, /parseProjectJsonToSongProject/, 'SongProject import is missing');
assert.match(script, /serializeSongProject/, 'SongProject export is missing');
assert.match(script, /STORAGE='composition-sheet-full-library-v0\.4'/, 'existing localStorage contract changed');
assert.match(script, /MODE_STORAGE='composition-sheet-ui-mode-v0\.9'/, 'v0.9 mode storage is missing');
assert.match(source, /04_アイデア帳\/03_ベース/, '31-sheet source data is missing');
assert.match(model, /renderMarkdown/, 'sheet renderer is missing');
assert.match(manualIdeas, /createManualIdea/, 'manual idea creation is missing');

assert.equal(manifest.kind, 'composition-sheet-latest', 'latest manifest kind is invalid');
assert.equal(manifest.schemaVersion, 1, 'latest manifest schema is invalid');
assert.equal(manifest.version, 'v0.9-dev', 'latest manifest is not v0.9-dev');
assert.equal(manifest.entry, '../versions/v0.9/composition_sheet_v0.9.html', 'latest manifest entry is invalid');
assert.match(latest, /versions\/v0\.9\/composition_sheet_v0\.9\.html/, 'latest redirect is not v0.9');
assert.match(entry, /latest\/composition_sheet_latest\.html/, 'sheet-app entry does not point to latest');

console.log('Composition Sheet public legacy preservation + canonical latest v0.9 smoke test: OK');
