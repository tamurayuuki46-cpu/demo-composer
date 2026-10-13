import fs from 'node:fs';
import assert from 'node:assert/strict';

const demo = fs.readFileSync(new URL('../src/hub/song-project-ui.js', import.meta.url), 'utf8');
const arranger = fs.readFileSync(new URL('../arranger/src/song-project-ui.js', import.meta.url), 'utf8');

for (const text of [demo, arranger]) {
  assert.match(text, /music-project-songproject-handoff-v1/);
  assert.match(text, /SongProject/);
}

assert.match(demo, /mergeDemoChangesIntoSongProject/);
assert.match(demo, /前のアプリから受け取る/);
assert.match(demo, /Arrangement Labへ渡す/);
assert.match(demo, /song_project_v1\.json/);
assert.match(demo, /writeHandoff\(songProject,\s*'arrangement-lab'\)/);
assert.match(demo, /get\('handoff'\)\s*===\s*'midi-analyzer'/);

assert.match(arranger, /Demo Composerから続ける/);
assert.match(arranger, /受け取った曲を反映/);
assert.match(arranger, /targetApp !== 'arrangement-lab'/);
assert.match(arranger, /次は②A\/B\/Cを聴いてください/);

console.log('JSON handoff guide smoke test passed');
