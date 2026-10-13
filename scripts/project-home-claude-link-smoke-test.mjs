import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSheetLink } from '../src/hub/sheet-link.js';

const html = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../project-home/app.js', import.meta.url), 'utf8');
const build = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');

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

console.log('Project Home Claude link smoke test passed.');
