import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  demoProjectToSongProject,
  songProjectToDemoProject,
  mergeDemoChangesIntoSongProject,
  forkSongProject,
  serializeSongProject,
  parseSongProjectJson,
  validateSongProject,
} from '../src/shared/song-project.js';
import {
  normalizeSourceProject,
  buildThreeCandidates,
  createArrangerProject,
} from '../arranger/src/core.js';
import { createDemoComposerProject } from '../arranger/src/v05-tools.js';
import {
  createArrangementForkSongProject,
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

// 1. Empty project + lineage
const empty = createEmptySongProject({ projectId: 'empty-1', title: 'Empty', now: NOW });
assert.equal(empty.schemaVersion, 1);
assert.equal(empty.lineage.rootProjectId, 'empty-1');
assert.equal(empty.lineage.parentProjectId, null);
assert.equal(validateSongProject(empty), true);

// Backward compatibility: old SongProject v1 without lineage still validates.
const oldV1 = structuredClone(empty);
delete oldV1.lineage;
assert.equal(validateSongProject(oldV1), true);

// 2. Demo -> SongProject
const song = demoProjectToSongProject(legacyDemo, { now: NOW });
assert.equal(song.title, 'Integration Song');
assert.equal(song.composition.melody[0].pitch, 64);
assert.equal(song.composition.counterMelody[0].pitch, 71);
assert.equal(song.lineage.rootProjectId, legacyDemo.id);
assert.equal(song.lineage.sourceApp, 'demo-composer');

// 3/4. JSON export/import
const json = serializeSongProject(song);
const importedSong = parseSongProjectJson(json);
assert.deepEqual(importedSong.composition, song.composition);
assert.deepEqual(importedSong.lineage, song.lineage);

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
assert.deepEqual(arrangedSong.lineage, importedSong.lineage, 'Arrangement must preserve lineage');
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
assert.equal(roundTripDemo.metadata.lineage.rootProjectId, legacyDemo.id);
assert.equal(reexported.arrangement.density[0].density, 'full');

// Demo owns composition, but Arrangement and lineage survive a later Demo merge.
const editedDemo = structuredClone(roundTripDemo);
editedDemo.basic.bpm = 132;
editedDemo.tracks.find((track) => track.role === 'melody').notes.push(note('m2', 66, 960));
const merged = mergeDemoChangesIntoSongProject(reexported, editedDemo, { now: '2026-10-13T00:02:00.000Z' });
assert.equal(merged.basic.bpm, 132);
assert.equal(merged.composition.melody.length, 2);
assert.deepEqual(merged.arrangement, reexported.arrangement, 'Demo merge must preserve Arrangement-owned data');
assert.deepEqual(merged.lineage, reexported.lineage, 'Demo merge must preserve project lineage');

// Explicit generic fork creates a new project without overwriting its parent.
const forked = forkSongProject(merged, {
  projectId: 'fork-1',
  title: 'Integration Song - Arrangement Fork',
  sourceApp: 'arrangement-lab',
  forkReason: '採用した編曲を新しい作曲案として続ける',
  now: '2026-10-13T00:03:00.000Z',
});
assert.equal(forked.projectId, 'fork-1');
assert.equal(forked.lineage.rootProjectId, legacyDemo.id);
assert.equal(forked.lineage.parentProjectId, merged.projectId);
assert.equal(forked.lineage.sourceApp, 'arrangement-lab');
assert.equal(forked.lineage.forkReason, '採用した編曲を新しい作曲案として続ける');
assert.equal(merged.projectId, legacyDemo.id, 'parent project must remain unchanged');
assert.equal(forked.history.changes.at(-1).type, 'fork');

// Arrangement-specific fork adopts arranged Composition while preserving SongProject lineage/ownership.
const arrangedDemoProject = createDemoComposerProject(source, candidate);
const arrangementFork = createArrangementForkSongProject(arrangedSong, arrangedDemoProject, {
  projectId: 'arrangement-fork-1',
  title: 'Integration Song Arrangement Fork',
  forkReason: '編曲採用版を作曲ProjectへFork',
  now: '2026-10-13T00:04:00.000Z',
});
assert.equal(arrangementFork.projectId, 'arrangement-fork-1');
assert.equal(arrangementFork.lineage.rootProjectId, legacyDemo.id);
assert.equal(arrangementFork.lineage.parentProjectId, arrangedSong.projectId);
assert.equal(arrangementFork.lineage.sourceApp, 'arrangement-lab');
assert.equal(arrangementFork.lineage.createdFrom, 'arrangement-fork');
assert.equal(arrangementFork.lineage.revision, 1);
assert.equal(arrangementFork.basic.bpm, arrangedDemoProject.basic.bpm);
assert.deepEqual(arrangementFork.composition.chords, arrangedDemoProject.chords);
assert.deepEqual(
  arrangementFork.composition.melody,
  arrangedDemoProject.tracks.find((track) => track.role === 'melody')?.notes || [],
);
assert.deepEqual(arrangementFork.arrangement, arrangedSong.arrangement, 'Arrangement-owned evidence remains attached to the fork');
assert.equal(arrangedSong.projectId, legacyDemo.id, 'Arrangement fork must not mutate its parent');

console.log('SongProject v1 smoke test passed: ownership, lineage, arrangement fork, and legacy compatibility are preserved.');
