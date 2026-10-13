import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  demoProjectToSongProject,
  songProjectToDemoProject,
  mergeDemoChangesIntoSongProject,
  serializeSongProject,
  parseSongProjectJson,
  validateSongProject,
} from '../src/shared/song-project.js';
import {
  normalizeSourceProject,
  buildThreeCandidates,
  createArrangerProject,
} from '../arranger/src/core.js';
import {
  songProjectToArrangementSourceInput,
  mergeArrangementChangesIntoSongProject,
} from '../arranger/src/song-project-sync.js';

const NOW = '2026-10-13T00:00:00.000Z';
const note = (id, pitch, startTick, durationTick = 480, velocity = 96) => ({ id, pitch, startTick, durationTick, velocity });
const legacyDemo = {
  schemaVersion: 3,
  appVersion: 'v0.3-dev',
  id: 'legacy-demo-1',
  revision: 7,
  metadata: {
    title: 'Integration Song', genre: 'J-POP', mood: ['浮遊'], memo: 'keep me',
    composition: { decisions: [{ id: 'd1', text: 'A案を採用' }] },
  },
  basic: { bpm: 128, key: 'E', scale: 'major', timeSignature: '4/4', ppq: 480 },
  structure: {
    sections: [
      { id: 'verse-1', kind: 'verse', name: 'Aメロ', bars: 4, energy: 'low', transition: 'build', customSectionField: 'preserve' },
      { id: 'chorus-1', kind: 'chorus', name: 'サビ', bars: 4, energy: 'high', transition: 'fill' },
    ],
    customStructureField: 'preserve',
  },
  chords: [
    { root: 4, quality: 'major', degree: 'I', startTick: 0, durationTick: 1920, purposes: ['安定'] },
    { root: 11, quality: 'major', degree: 'V', startTick: 1920, durationTick: 1920 },
  ],
  tracks: [
    { role: 'melody', name: 'Lead', midiChannel: 2, mute: true, solo: false, volume: 0.8, pan: -0.2, customTrackField: 'keep', notes: [note('m1', 64, 0)] },
    { role: 'counter', name: 'Counter X', midiChannel: 4, mute: false, solo: true, volume: 0.7, pan: 0.2, notes: [note('c1', 71, 480)] },
    { role: 'bass', name: 'Bass X', midiChannel: 3, mute: false, solo: false, volume: 0.9, pan: 0, notes: [note('b1', 40, 0, 960)] },
    { role: 'drums', name: 'Kit', midiChannel: 10, drumMap: { kick: 36, snare: 38, closedHH: 42, custom: 46 }, mute: false, solo: false, volume: 1, pan: 0, notes: [note('d1', 36, 0, 120)] },
    { role: 'guide', name: 'Guide', midiChannel: 8, notes: [note('g1', 76, 0)] },
  ],
  instruments: [{ part: 'melody', preset: 'Piano', tone: 'soft' }],
  progress: { hub: true },
  exportSettings: { format: 'midi' },
  legacyUnknownTopLevel: { must: 'survive' },
};

// 1. Empty project
const empty = createEmptySongProject({ projectId: 'empty-1', title: 'Empty', now: NOW });
assert.equal(empty.schemaVersion, 1);
assert.equal(validateSongProject(empty), true);

// 2. Demo -> SongProject
const song = demoProjectToSongProject(legacyDemo, { now: NOW });
assert.equal(song.title, 'Integration Song');
assert.equal(song.composition.melody[0].pitch, 64);
assert.equal(song.composition.counterMelody[0].pitch, 71);

// 3/4. JSON export/import
const json = serializeSongProject(song);
const importedSong = parseSongProjectJson(json);
assert.deepEqual(importedSong.composition, song.composition);

// 5. Arrangement Lab source restore
const arrangementInput = songProjectToArrangementSourceInput(importedSong);
const source = normalizeSourceProject(arrangementInput);
assert.equal(source.title, song.title);
assert.equal(source.basic.key, 'E');
assert.equal(source.tracks.find((track) => track.role === 'melody').notes.length, 1);

// 6. Arrangement update
const candidate = buildThreeCandidates(source, 'jpop-band')[1];
candidate.sections[0].density = 'full';
candidate.sections[0].enabled.counter = false;
candidate.sections[0].decisionNote = 'Aメロは薄く始める案と比較してこちらを採用';
const arrangerProject = createArrangerProject(source, candidate);
const compositionBefore = structuredClone(importedSong.composition);
const arrangedSong = mergeArrangementChangesIntoSongProject(importedSong, arrangerProject, { now: '2026-10-13T00:01:00.000Z' });
assert.deepEqual(arrangedSong.composition, compositionBefore, 'Arrangement must not overwrite composition');
assert.equal(arrangedSong.arrangement.density[0].density, 'full');
assert.equal(arrangedSong.arrangement.instruments[0].enabled.counter, false);
assert.equal(arrangedSong.arrangement.decisions[0].sectionId, 'verse-1');

// 7. Re-export
const reexported = parseSongProjectJson(serializeSongProject(arrangedSong));
assert.equal(reexported.arrangement.selectedAlternatives.id, candidate.id);

// 8/9/10. Back to Demo: composition intact and Arrangement retained in SongProject.
const roundTripDemo = songProjectToDemoProject(reexported);
assert.deepEqual(roundTripDemo.chords, legacyDemo.chords);
assert.deepEqual(roundTripDemo.structure.sections, legacyDemo.structure.sections);
assert.deepEqual(roundTripDemo.tracks.find((track) => track.role === 'melody'), legacyDemo.tracks.find((track) => track.role === 'melody'));
assert.deepEqual(roundTripDemo.tracks.find((track) => track.role === 'guide'), legacyDemo.tracks.find((track) => track.role === 'guide'));
assert.deepEqual(roundTripDemo.legacyUnknownTopLevel, legacyDemo.legacyUnknownTopLevel);
assert.equal(reexported.arrangement.density[0].density, 'full');

// Demo owns composition, but Arrangement survives a later Demo merge.
const editedDemo = structuredClone(roundTripDemo);
editedDemo.basic.bpm = 132;
editedDemo.tracks.find((track) => track.role === 'melody').notes.push(note('m2', 66, 960));
const merged = mergeDemoChangesIntoSongProject(reexported, editedDemo, { now: '2026-10-13T00:02:00.000Z' });
assert.equal(merged.basic.bpm, 132);
assert.equal(merged.composition.melody.length, 2);
assert.deepEqual(merged.arrangement, reexported.arrangement, 'Demo merge must preserve Arrangement-owned data');

console.log('SongProject v1 smoke test passed: Demo ↔ Arrangement round trip preserves ownership and legacy data.');
