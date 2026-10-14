import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  PRIVATE_SHEET_URL,
  LATEST_SHEET_MANIFEST_URL,
  resolveLatestSheetUrl,
  loadLatestSheetManifest,
} from '../project-home/sheet-connection.js';
import { buildWorkflowState } from '../project-home/workflow.js';

const homeHtml = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const homeMenuEntry = await readFile(new URL('../project-home/song-data-menu-entry.js', import.meta.url), 'utf8');
const latestHtml = await readFile(new URL('../sheet-app/latest/composition_sheet_latest.html', import.meta.url), 'utf8');
const manifestText = await readFile(new URL('../sheet-app/latest/manifest.json', import.meta.url), 'utf8');
const sheetHtml = await readFile(new URL('../sheet-app/versions/v0.9/composition_sheet_v0.9.html', import.meta.url), 'utf8');
const sheetJsUrl = new URL('../sheet-app/versions/v0.9/composition_sheet_v0.9.js', import.meta.url);
const sheetJs = await readFile(sheetJsUrl, 'utf8');
const manifest = JSON.parse(manifestText);

assert.equal(PRIVATE_SHEET_URL, '../sheet-app/');
assert.equal(LATEST_SHEET_MANIFEST_URL, '../sheet-app/latest/manifest.json');
assert.equal(resolveLatestSheetUrl('https://example.com/project-home/'), 'https://example.com/sheet-app/');
assert.ok(!PRIVATE_SHEET_URL.includes('/versions/'), 'Home must not pin a sheet version');

assert.equal(manifest.kind, 'composition-sheet-latest');
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.version, 'v0.9-dev');
assert.equal(manifest.entry, '../versions/v0.9/composition_sheet_v0.9.html');
assert.equal(manifest.beginnerMode, true);
assert.match(latestHtml, /versions\/v0\.9\/composition_sheet_v0\.9\.html/);

const loaded = await loadLatestSheetManifest({
  baseHref: 'https://example.com/project-home/',
  fetcher: async (url) => {
    assert.equal(String(url), 'https://example.com/sheet-app/latest/manifest.json');
    return { ok: true, json: async () => manifest };
  },
});
assert.equal(loaded.version, 'v0.9-dev');

assert.match(homeHtml, /href="\.\.\/sheet-app\/"/);
assert.match(homeHtml, /id="latest-sheet-version"/);
assert.match(homeHtml, /id="latest-sheet-frame"/);
assert.match(homeHtml, /src="\.\.\/sheet-app\/"/);
assert.ok(!homeHtml.includes('songwriting-full-workbook-31.yoshitamura.chatgpt.site'));
assert.ok(!homeHtml.includes('composition_sheet_v0.5.html'));
assert.match(homeMenuEntry, /id: 'sheet'[\s\S]*href: '\.\.\/sheet-app\/'/);
assert.ok(!homeMenuEntry.includes('composition_sheet_v0.5.html'));
assert.ok(!homeMenuEntry.includes('/versions/'), 'Home song-data menu must not pin a sheet version');

const workflow = buildWorkflowState(null, { sheetLinked: false });
assert.equal(workflow.nextAction.id, 'sheet');
assert.equal(workflow.nextAction.href, '../sheet-app/');

assert.match(sheetHtml, /data-sheet-mode="beginner"/);
assert.match(sheetHtml, /id="beginner-card"/);
assert.match(sheetHtml, /data-sheet-mode-button="beginner"/);
assert.match(sheetHtml, /data-sheet-mode-button="detail"/);
assert.match(sheetHtml, /id="beginner-scene"/);
assert.match(sheetHtml, /id="beginner-reference"/);
assert.match(sheetHtml, /BPM \/ Keyは未定のままでOK/);
assert.match(sheetHtml, /31シート詳細/);
assert.match(sheetHtml, /id="sheet-panel" class="sheet-card detailed-only"/);

assert.match(sheetJs, /STORAGE='composition-sheet-full-library-v0\.4'/);
assert.match(sheetJs, /mergeSheetChangesIntoSongProject/);
assert.match(sheetJs, /composition_sheet_v0\.9\.json/);
assert.match(sheetJs, /schemaVersion:1/);
assert.match(sheetJs, /MODE_STORAGE='composition-sheet-ui-mode-v0\.9'/);

const syntax = spawnSync(process.execPath, ['--check', fileURLToPath(sheetJsUrl)], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'v0.9 sheet JavaScript syntax check failed');

console.log('Composition Sheet v0.9 beginner flow + Music Project Home canonical latest contract passed.');
