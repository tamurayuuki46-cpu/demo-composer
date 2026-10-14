import assert from 'node:assert/strict';
import { createEmptySongProject } from '../../src/shared/song-project.js';
import { songProjectToArrangementSourceInput } from '../src/song-project-sync.js';

const BAR = 1920;

const sketch = createEmptySongProject({
  projectId: 'quick-sketch',
  title: '1小節フレーズ',
  now: '2026-10-14T00:00:00.000Z',
});
sketch.composition.melody.push({
  id: 'm1',
  pitch: 64,
  startTick: 0,
  durationTick: 480,
  velocity: 96,
});

const oneBarInput = songProjectToArrangementSourceInput(sketch);
assert.equal(oneBarInput.structure.sections.length, 1);
assert.equal(oneBarInput.structure.sections[0].id, 'quick-sketch-1');
assert.equal(oneBarInput.structure.sections[0].name, '1小節スケッチ');
assert.equal(oneBarInput.structure.sections[0].bars, 1);
assert.equal(oneBarInput.tracks.find((track) => track.role === 'melody').notes.length, 1);

const twoBarSketch = structuredClone(sketch);
twoBarSketch.composition.melody.push({
  id: 'm2',
  pitch: 67,
  startTick: BAR,
  durationTick: 480,
  velocity: 96,
});
const twoBarInput = songProjectToArrangementSourceInput(twoBarSketch);
assert.equal(twoBarInput.structure.sections.length, 1);
assert.equal(twoBarInput.structure.sections[0].bars, 2);
assert.equal(twoBarInput.structure.sections[0].name, 'スケッチ');

const empty = createEmptySongProject({ projectId: 'empty', title: 'Empty' });
const emptyInput = songProjectToArrangementSourceInput(empty);
assert.deepEqual(emptyInput.structure.sections, []);

console.log('SongProject quick-sketch arrangement adapter: OK');
