import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, '../');
assert.equal(manifest.scope, '../');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest must define an app icon');
assert.ok(manifest.icons.some((icon) => icon.type === 'image/svg+xml' && icon.purpose.includes('maskable')));

const index = await readFile('index.html', 'utf8');
assert.match(index, /src\/core\/pwa-service-worker\.js/);
assert.match(index, /public\/manifest\.webmanifest/);
assert.match(index, /v0\.7-dev/);

const build = JSON.parse(await readFile('dist/build.json', 'utf8'));
const worker = await readFile('dist/service-worker.js', 'utf8');
assert.ok(worker.includes(`const CACHE_VERSION = ${JSON.stringify(build.id)};`));
assert.ok(!worker.includes('const CACHE_VERSION = "dev";'));

const match = worker.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/);
assert.ok(match, 'generated service worker must include a precache list');
const urls = JSON.parse(match[1]);
assert.ok(urls.includes('./index.html'));
assert.ok(urls.includes('./public/manifest.webmanifest'));
assert.ok(urls.includes('./public/icon.svg'));
assert.ok(urls.some((url) => url.startsWith('./src/core/pwa-service-worker.js?build=')));
assert.ok(urls.some((url) => url.startsWith('./project-home/app.js?build=')));
assert.ok(!urls.some((url) => url.includes('build.json')), 'build.json must stay network-fresh');
assert.ok(!urls.some((url) => url.startsWith('./arranger/')), 'Arrangement Lab owns its nested PWA cache');

console.log(`PWA smoke test passed: ${urls.length} precache entries for build ${build.id}`);
