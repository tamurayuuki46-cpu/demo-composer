import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSheetLink } from '../src/hub/sheet-link.js';

const html = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../project-home/app.js', import.meta.url), 'utf8');
const build = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');

assert.match(html, /<h1>Music Project Home<\/h1>/);
assert.match(html, /id="now-card"/);
assert.match(html, /今やること：作曲シート/);
assert.match(html, /href="#claude-link-card"[^>]*>作曲シートを開く \/ 登録する/);
assert.doesNotMatch(html, /href="\.\.\/sheet-app\//, '公開mainから未公開sheet-appを参照してはいけません');
assert.match(html, /id="quick-flow-card"/);
assert.match(html, /<strong>⓪ 方向を決める<\/strong><small>作曲シート<\/small>/);
assert.match(html, /<strong>① 必要なら解析<\/strong><small>MIDI Analyzer・任意<\/small>/);
assert.match(html, /<strong>② 作曲<\/strong><small>Demo Composer<\/small>/);
assert.match(html, /<strong>③ 編曲<\/strong><small>Arrangement Lab<\/small>/);
assert.match(html, /<strong>④ DAWへ<\/strong><small>Cubasis \/ Cubase<\/small>/);
assert.match(html, /1小節のフレーズだけでも③の編曲を試せます/);
assert.match(html, /id="claude-link-card"/);
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

console.log('Project Home 5-stage mobile-first flow + Claude sheet link smoke test passed.');
