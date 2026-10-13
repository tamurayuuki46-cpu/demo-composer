import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSheetLink } from '../src/hub/sheet-link.js';

const html = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../project-home/app.js', import.meta.url), 'utf8');
const build = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');

assert.match(html, /id="composition-sheet-card"/);
assert.match(html, /href="\.\.\/sheet-app\/"[^>]*>作曲シート v0\.1 を開く/);
assert.match(html, /<h1>Music Project Home<\/h1>/);
assert.match(html, /id="quick-flow-card"/);
assert.match(html, /id="quick-flow"/);
assert.match(html, /<strong>1 決める<\/strong><small>作曲シート<\/small>/);
assert.match(html, /<strong>2 作る<\/strong><small>Demo Composer<\/small>/);
assert.match(html, /<strong>3 育てる<\/strong><small>Arrangement Lab<\/small>/);
assert.match(html, /<strong>4 仕上げる<\/strong><small>Cubasis \/ Cubase<\/small>/);
assert.match(html, /MIDI Analyzerで分析/);
assert.match(html, /PC DAWは最終制作の必須工程/);
assert.ok(html.indexOf('id="composition-sheet-card"') < html.indexOf('id="quick-flow-card"'), '作曲シート入口が一番上にありません');
assert.match(html, /id="claude-link-input"/);
assert.match(html, /id="claude-link-open"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.match(html, /Song Project JSON・MIDI・公開コードには入れません/);
assert.match(app, /loadSheetLink, saveSheetLink/);
assert.match(app, /\.\.\/src\/hub\/sheet-link\.js/);
assert.match(app, /claude-link-save/);
assert.match(build, /stampModules\(`\$\{outputDir\}\/project-home`\)/);

assert.equal(
  normalizeSheetLink('https://claude.ai/artifact/A7Fmc5gD8HwgyrqWt4RzfG#c753d41d-9227'),
  'https://claude.ai/artifact/A7Fmc5gD8HwgyrqWt4RzfG#c753d41d-9227',
);
assert.equal(normalizeSheetLink('https://example.com/not-claude'), null);

console.log('Project Home quick flow + Composition Sheet top link + Claude link smoke test passed.');
