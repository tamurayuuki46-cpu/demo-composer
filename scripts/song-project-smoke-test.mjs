import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  demoProjectToSongProject,
  songProjectToDemoProject,
  mergeDemoChangesIntoSongProject,
  mergeSheetChangesIntoSongProject,
  normalizeSongProjectV1,
  projectValueToSongProject,
  parseProjectJsonToSongProject,
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

// 1. Empty project + lineage + canonical sections.
const empty = createEmptySongProject({ projectId: 'empty-1', title: 'Empty', now: NOW });
assert.equal(empty.schemaVersion, 1);
assert.equal(empty.lineage.rootProjectId, 'empty-1');
assert.equal(empty.lineage.parentProjectId, null);
assert.deepEqual(empty.intent.references, []);
assert.deepEqual(empty.assets.files, []);
assert.equal(validateSongProject(empty), true);

// Backward compatibility: old SongProject v1 without the newer optional sections still validates,
// then normalizes into the canonical shape on import/export.
const oldV1 = structuredClone(empty);
delete oldV1.lineage;
delete oldV1.intent;
delete oldV1.assets;
assert.equal(validateSongProject(oldV1), true);
const normalizedOld = normalizeSongProjectV1(oldV1, { now: NOW });
assert.equal(normalizedOld.lineage.rootProjectId, 'empty-1');
assert.deepEqual(normalizedOld.intent.references, []);
assert.deepEqual(normalizedOld.assets.files, []);

// 2. Demo -> SongProject
const song = demoProjectToSongProject(legacyDemo, { now: NOW });
assert.equal(song.title, 'Integration Song');
assert.equal(song.composition.melody[0].pitch, 64);
assert.equal(song.composition.counterMelody[0].pitch, 71);
assert.equal(song.lineage.rootProjectId, legacyDemo.id);
assert.equal(song.lineage.sourceApp, 'demo-composer');
assert.deepEqual(song.intent.genre, ['J-POP']);
assert.deepEqual(song.intent.mood, ['浮遊']);
assert.equal(song.intent.notes, 'keep me');

// 3. Legacy Composition Sheet JSON -> canonical SongProject v1.
const legacySheet = {
  format: 'demo-composer-project', schemaVersion: '1.0', projectId: 'sheet-1', title: 'Sheet Song',
  updatedAt: NOW,
  sheet: {
    scene: '夜の帰り道', referenceSongs: ['Artist / Song'], genre: 'J-POP', mood: ['切ない', '浮遊感'],
    bpm: 126, key: 'D minor', notes: 'sheet memo',
  },
  composer: { chords: [], melody: [], counterMelody: [], bass: [], drums: [], sections: [] },
  arrangement: { decisions: [{ sectionId: 'verse-1', reason: 'keep' }] },
  midiAnalysis: { keyCandidates: [{ key: 'D', confidence: 0.9 }] },
};
const migratedSheet = projectValueToSongProject(legacySheet, { now: NOW });
assert.equal(migratedSheet.kind, 'song-project');
assert.equal(migratedSheet.schemaVersion, 1);
assert.equal(migratedSheet.projectId, 'sheet-1');
assert.equal(migratedSheet.intent.scene, '夜の帰り道');
assert.equal(migratedSheet.intent.references[0].title, 'Artist / Song');
assert.deepEqual(migratedSheet.intent.genre, ['J-POP']);
assert.equal(migratedSheet.basic.bpm, 126);
assert.equal(migratedSheet.basic.key, 'D');
assert.equal(migratedSheet.basic.scale, 'minor');
assert.equal(migratedSheet.analysis.keyCandidates[0].key, 'D');
assert.equal(parseProjectJsonToSongProject(JSON.stringify(legacySheet), { now: NOW }).kind, 'song-project');

// 4/5. JSON export/import
const json = serializeSongProject(song);
const importedSong = parseSongProjectJson(json);
assert.deepEqual(importedSong.composition, song.composition);
assert.deepEqual(importedSong.lineage, song.lineage);
assert.deepEqual(importedSong.intent, song.intent);
assert.deepEqual(importedSong.assets, song.assets);

// 6. Arrangement Lab source restore
const arrangementInput = songProjectToArrangementSourceInput(importedSong);
const source = normalizeSourceProject(arrangementInput);
assert.equal(source.title, song.title);
assert.equal(source.basic.key, 'E');
assert.equal(source.tracks.find((track) => track.role === 'melody').notes.length, 1);

// 7. Arrangement update only owns arrangement.
const candidate = buildThreeCandidates(source, 'jpop-band')[1];
candidate.sections[0].density = 'full';
candidate.sections[0].enabled.counter = false;
candidate.sections[0].decisionNote = 'Aメロは薄く始める案と比較してこちらを採用';
const arrangerProject = createArrangerProject(source, candidate);
const compositionBefore = structuredClone(importedSong.composition);
const intentBefore = structuredClone(importedSong.intent);
const arrangedSong = mergeArrangementChangesIntoSongProject(importedSong, arrangerProject, { now: '2026-10-13T00:01:00.000Z' });
assert.deepEqual(arrangedSong.composition, compositionBefore, 'Arrangement must not overwrite composition');
assert.deepEqual(arrangedSong.intent, intentBefore, 'Arrangement must not overwrite intent');
assert.deepEqual(arrangedSong.lineage, importedSong.lineage, 'Arrangement must preserve lineage');
assert.equal(arrangedSong.arrangement.density[0].density, 'full');
assert.equal(arrangedSong.arrangement.instruments[0].enabled.counter, false);
assert.equal(arrangedSong.arrangement.decisions[0].sectionId, 'verse-1');

// 8. Re-export
const reexported = parseSongProjectJson(serializeSongProject(arrangedSong));
assert.equal(reexported.arrangement.selectedAlternatives.id, candidate.id);

// 9/10/11. Back to Demo: composition intact and Arrangement retained in SongProject.
const roundTripDemo = songProjectToDemoProject(reexported);
assert.deepEqual(roundTripDemo.chords, legacyDemo.chords);
assert.deepEqual(roundTripDemo.structure.sections, legacyDemo.structure.sections);
assert.deepEqual(roundTripDemo.tracks.find((track) => track.role === 'melody'), legacyDemo.tracks.find((track) => track.role === 'melody'));
assert.deepEqual(roundTripDemo.tracks.find((track) => track.role === 'guide'), legacyDemo.tracks.find((track) => track.role === 'guide'));
assert.deepEqual(roundTripDemo.legacyUnknownTopLevel, legacyDemo.legacyUnknownTopLevel);
assert.equal(roundTripDemo.metadata.lineage.rootProjectId, legacyDemo.id);
assert.equal(reexported.arrangement.density[0].density, 'full');

// Demo owns composition/basic, but Arrangement / intent / assets survive a later Demo merge.
const editedDemo = structuredClone(roundTripDemo);
editedDemo.basic.bpm = 132;
editedDemo.tracks.find((track) => track.role === 'melody').notes.push(note('m2', 66, 960));
const merged = mergeDemoChangesIntoSongProject(reexported, editedDemo, { now: '2026-10-13T00:02:00.000Z' });
assert.equal(merged.basic.bpm, 132);
assert.equal(merged.composition.melody.length, 2);
assert.deepEqual(merged.arrangement, reexported.arrangement, 'Demo merge must preserve Arrangement-owned data');
assert.deepEqual(merged.intent, reexported.intent, 'Demo merge must preserve Composition Sheet-owned intent');
assert.deepEqual(merged.lineage, reexported.lineage, 'Demo merge must preserve project lineage');

// 12. Composition Sheet owns intent, while composition / arrangement / analysis / assets survive.
const withAsset = structuredClone(merged);
withAsset.assets.files.push({ id: 'ref-midi', type: 'midi', role: 'reference', name: 'reference.mid', path: 'assets/reference.mid', external: true });
withAsset.analysis.keyCandidates = [{ key: 'E', confidence: 0.8 }];
const beforeSheet = {
  composition: structuredClone(withAsset.composition),
  arrangement: structuredClone(withAsset.arrangement),
  analysis: structuredClone(withAsset.analysis),
  assets: structuredClone(withAsset.assets),
};
const sheetUpdated = mergeSheetChangesIntoSongProject(withAsset, {
  title: 'Integration Song Sheet Edit',
  scene: '夜明け前',
  references: ['Ref A', 'Ref B'],
  genre: ['J-POP'],
  mood: ['浮遊感'],
  bpm: 134,
  key: 'F# minor',
  notes: '仮決めでOK',
}, { now: '2026-10-13T00:02:30.000Z' });
assert.equal(sheetUpdated.intent.scene, '夜明け前');
assert.equal(sheetUpdated.intent.references.length, 2);
assert.equal(sheetUpdated.basic.bpm, 134);
assert.equal(sheetUpdated.basic.key, 'F#');
assert.equal(sheetUpdated.basic.scale, 'minor');
assert.deepEqual(sheetUpdated.composition, beforeSheet.composition, 'Sheet merge must preserve composition');
assert.deepEqual(sheetUpdated.arrangement, beforeSheet.arrangement, 'Sheet merge must preserve arrangement');
assert.deepEqual(sheetUpdated.analysis, beforeSheet.analysis, 'Sheet merge must preserve analysis');
assert.deepEqual(sheetUpdated.assets, beforeSheet.assets, 'Sheet merge must preserve external asset references');

// 13. Explicit fork creates a new project without overwriting its parent.
const forked = forkSongProject(sheetUpdated, {
  projectId: 'fork-1',
  title: 'Integration Song - Arrangement Fork',
  sourceApp: 'arrangement-lab',
  forkReason: '採用した編曲を新しい作曲案として続ける',
  now: '2026-10-13T00:03:00.000Z',
});
assert.equal(forked.projectId, 'fork-1');
assert.equal(forked.lineage.rootProjectId, legacyDemo.id);
assert.equal(forked.lineage.parentProjectId, sheetUpdated.projectId);
assert.equal(forked.lineage.sourceApp, 'arrangement-lab');
assert.equal(forked.lineage.forkReason, '採用した編曲を新しい作曲案として続ける');
assert.equal(sheetUpdated.projectId, legacyDemo.id, 'parent project must remain unchanged');
assert.equal(forked.history.changes.at(-1).type, 'fork');

console.log('SongProject v1 canonical contract smoke test passed: sheet/composition/arrangement/analysis ownership, assets, legacy migration, lineage and fork are preserved.');
