import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  songProjectToDemoProject,
  mergeDemoChangesIntoSongProject,
  mergeSheetChangesIntoSongProject,
} from '../src/shared/song-project.js';

const base = createEmptySongProject({
  projectId: 'contract-song-1',
  title: 'Ownership Contract',
  now: '2026-10-15T00:00:00.000Z',
});

base.intent = {
  ...base.intent,
  scene: 'night drive',
  purpose: 'keep intent outside composition owner',
  notes: 'sheet-owned note',
};
base.analysis = {
  ...base.analysis,
  keyCandidates: [{ key: 'C', confidence: 0.9 }],
  melodyAnalysis: { contour: 'arch' },
};
base.composition = {
  ...base.composition,
  chords: [{ root: 0, quality: 'major', startTick: 0, durationTick: 1920 }],
  melody: [{ id: 'm1', pitch: 64, startTick: 0, durationTick: 480, velocity: 96 }],
  sections: [{ id: 'verse-1', kind: 'verse', name: 'Aメロ', bars: 4 }],
};
base.arrangement = {
  ...base.arrangement,
  density: [{ sectionId: 'verse-1', density: 'light' }],
  decisions: [{ sectionId: 'verse-1', reason: 'keep arrangement decision' }],
};
base.history = { version: 1, changes: [{ type: 'seed', at: '2026-10-15T00:00:00.000Z' }] };
base.reference = { items: [{ id: 'ref-1', type: 'midi', name: 'reference.mid' }] };
base.assets = { files: [{ id: 'asset-1', type: 'midi', name: 'reference.mid', external: true }] };
base.export = { lastDraftMidiAt: '2026-10-14T10:00:00.000Z', lastSongMidiAt: null, lastDawHandoffAt: null };

const demo = songProjectToDemoProject(base);
demo.basic.bpm = 132;
demo.tracks.find((track) => track.role === 'melody').notes.push({
  id: 'm2', pitch: 67, startTick: 480, durationTick: 480, velocity: 100,
});

const protectedFromDemo = {
  lineage: structuredClone(base.lineage),
  intent: structuredClone(base.intent),
  analysis: structuredClone(base.analysis),
  arrangement: structuredClone(base.arrangement),
  history: structuredClone(base.history),
  reference: structuredClone(base.reference),
  assets: structuredClone(base.assets),
  export: structuredClone(base.export),
};

const demoMerged = mergeDemoChangesIntoSongProject(base, demo, {
  now: '2026-10-15T00:01:00.000Z',
});

assert.equal(demoMerged.basic.bpm, 132, 'Demo Composer must be able to update common musical basic data');
assert.equal(demoMerged.composition.melody.length, 2, 'Demo Composer must own composition data');
for (const [key, expected] of Object.entries(protectedFromDemo)) {
  assert.deepEqual(demoMerged[key], expected, `Demo Composer must preserve non-owned ${key}`);
}

const protectedFromSheet = {
  analysis: structuredClone(demoMerged.analysis),
  composition: structuredClone(demoMerged.composition),
  arrangement: structuredClone(demoMerged.arrangement),
  history: structuredClone(demoMerged.history),
  reference: structuredClone(demoMerged.reference),
  assets: structuredClone(demoMerged.assets),
  export: structuredClone(demoMerged.export),
  lineage: structuredClone(demoMerged.lineage),
};

const sheetMerged = mergeSheetChangesIntoSongProject(demoMerged, {
  title: 'Ownership Contract - Sheet Edit',
  scene: 'sunrise',
  notes: 'intent edited by sheet',
  bpm: 134,
  key: 'D minor',
}, { now: '2026-10-15T00:02:00.000Z' });

assert.equal(sheetMerged.intent.scene, 'sunrise', 'Composition Sheet must own intent');
assert.equal(sheetMerged.basic.bpm, 134, 'Composition Sheet may explicitly update common basic data');
assert.equal(sheetMerged.basic.key, 'D');
assert.equal(sheetMerged.basic.scale, 'minor');
for (const [key, expected] of Object.entries(protectedFromSheet)) {
  assert.deepEqual(sheetMerged[key], expected, `Composition Sheet must preserve ${key}`);
}

console.log('SongProject v1 ownership/data-retention contract passed for Demo Composer and Composition Sheet; Arrangement ownership remains covered by song-project-smoke-test.mjs.');
