import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Published recovery artifacts are immutable; additions are allowed.
const manifest = JSON.parse(await readFile('docs/reconciliation-preserved-assets.json', 'utf8'));
for (const { path, blob } of manifest.files) {
  const data = await readFile(path);
  // Git checkouts may use CRLF. Compare canonical repository bytes.
  const gitBlob = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const raw = gitBlob(data);
  const actual = raw === blob ? raw : gitBlob(Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n')));
  assert.equal(actual, blob, `Published recovery artifact changed: ${path}`);
}

const index = await readFile('index.html', 'utf8');
const entry = await readFile('src/hub/app-entry.js', 'utf8');
assert.match(entry, /ai-monitoring-entry\.js/);
assert.doesNotMatch(index, /src=["'][^"']*\/ai-monitoring\.js/,
  'AI monitoring must initialize once through the published entry wrapper');
assert.doesNotMatch(index, /href=["'][^"']*\/ai-monitoring\.css/,
  'AI monitoring wrapper owns its build-stamped stylesheet');
console.log(`Reconciliation preservation passed (${manifest.files.length} published artifacts; single AI entry).`);
