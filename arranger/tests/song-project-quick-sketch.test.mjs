import assert from 'node:assert/strict';
import { createEmptySongProject } from '../../src/shared/song-project.js';
import { buildReharmSuggestions, normalizeSourceProject } from '../src/core.js';
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
assert.equal(oneBarInput.structure.sections[0].name, '1小節スケッチ（仮コード付き）');
assert.equal(oneBarInput.structure.sections[0].bars, 1);
assert.equal(oneBarInput.tracks.find((track) => track.role === 'melody').notes.length, 1);
assert.equal(oneBarInput.chords.length, 2, '1小節メロディだけでも仮コードを2つ付ける');
assert.deepEqual(oneBarInput.chords.map((chord) => chord.startTick), [0, BAR / 2]);
assert.deepEqual(oneBarInput.chords.map((chord) => chord.durationTick), [BAR / 2, BAR / 2]);
assert.ok(oneBarInput.chords.every((chord) => String(chord.degree).startsWith('auto-')));
assert.equal(sketch.composition.chords.length, 0, '元のSongProject compositionは変更しない');

const normalized = normalizeSourceProject(oneBarInput);
const reharm = buildReharmSuggestions(normalized, 'quick-sketch-1');
assert.equal(reharm.length, 3, '自然 / 色付け / 大胆の3案を生成する');
assert.ok(reharm.every((item) => item.chords.length === 2));
assert.ok(new Set(reharm.map((item) => item.display)).size >= 2, '1小節でも比較できる異なる和声案を作る');

const withChord = structuredClone(sketch);
withChord.composition.chords.push({
  id: 'c1',
  root: 0,
  quality: 'major',
  startTick: 0,
  durationTick: BAR,
});
const withChordInput = songProjectToArrangementSourceInput(withChord);
assert.equal(withChordInput.chords.length, 1, '既存コードがある場合は仮コードで上書きしない');
assert.equal(withChordInput.chords[0].root, 0);

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
assert.equal(twoBarInput.chords.length, 0, '自動ハーモナイズは1小節スケッチだけに限定する');

const empty = createEmptySongProject({ projectId: 'empty', title: 'Empty' });
const emptyInput = songProjectToArrangementSourceInput(empty);
assert.deepEqual(emptyInput.structure.sections, []);
assert.deepEqual(emptyInput.chords, []);

console.log('SongProject quick-sketch one-bar reharm adapter: OK');
