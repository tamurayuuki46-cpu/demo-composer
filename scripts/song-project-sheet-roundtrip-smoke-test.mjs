import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  mergeSheetChangesIntoSongProject,
  songProjectToDemoProject,
  projectValueToSongProject,
} from '../src/shared/song-project.js';
import { validateProject } from '../src/core/project-state.js';

const sheetProject = mergeSheetChangesIntoSongProject(
  createEmptySongProject({ projectId: 'sheet-roundtrip-1', title: '作曲シートから開始', now: '2026-10-13T00:00:00.000Z', sourceApp: 'composition-sheet' }),
  {
    scene: '夜の帰り道',
    references: ['Artist / Reference Song'],
    genre: ['J-POP'],
    mood: ['浮遊感'],
    bpm: 128,
    key: 'E♭ major',
    notes: '仮決め',
  },
  { now: '2026-10-13T00:01:00.000Z' },
);

assert.equal(sheetProject.basic.key, 'D#', 'flat spelling should normalize to a Demo-compatible key');
assert.equal(sheetProject.basic.scale, 'major');
assert.equal(sheetProject.intent.scene, '夜の帰り道');

const demoProject = songProjectToDemoProject(sheetProject);
assert.equal(validateProject(demoProject), true, 'A fresh Composition Sheet SongProject must open as a valid Demo Composer project');
assert.equal(demoProject.metadata.title, '作曲シートから開始');
assert.equal(demoProject.metadata.genre, 'J-POP');
assert.deepEqual(demoProject.metadata.mood, ['浮遊感']);
assert.equal(demoProject.basic.bpm, 128);
assert.equal(demoProject.basic.key, 'D#');
assert.ok(demoProject.metadata.composition, 'Demo decision design must be initialized');

const legacy = {
  format: 'demo-composer-project',
  schemaVersion: '1.0',
  projectId: 'legacy-sheet-1',
  title: '旧作曲シート',
  updatedAt: '2026-10-13T00:00:00.000Z',
  sheet: { scene: '朝', referenceSongs: ['Ref'], bpm: 300, key: 'C Dorian' },
  composer: { chords: [], melody: [], counterMelody: [], bass: [], drums: [] },
  arrangement: {},
  midiAnalysis: {},
};
const migrated = projectValueToSongProject(legacy);
assert.equal(migrated.basic.bpm, 120, 'legacy out-of-range BPM must not create an invalid Demo project');
assert.equal(migrated.basic.key, 'C');
assert.equal(migrated.basic.scale, 'major', 'unsupported scale must fall back to the canonical major/minor contract');
assert.equal(validateProject(songProjectToDemoProject(migrated)), true);

console.log('Composition Sheet -> SongProject v1 -> Demo Composer roundtrip: OK');
