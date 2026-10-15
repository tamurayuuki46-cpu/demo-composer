import assert from 'node:assert/strict';
import {
  createEmptySongProject,
  normalizeSongProjectV1,
  songProjectToDemoProject,
  mergeDemoChangesIntoSongProject,
  mergeSheetChangesIntoSongProject,
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

const NOW = '2026-10-15T00:00:00.000Z';
const note = (id, pitch, startTick, durationTick = 480, velocity = 96) => ({ id, pitch, startTick, durationTick, velocity });

const analyzerProject = createEmptySongProject({
  projectId: 'analyzer-contract-1',
  title: 'Analyzer Contract Song',
  now: NOW,
  sourceApp: 'midi-analyzer',
  createdFrom: 'analysis-import',
});

analyzerProject.basic = { bpm: 126, timeSignature: '4/4', key: 'E', scale: 'major', ppq: 480 };
analyzerProject.analysis = {
  keyCandidates: [{ value: 'E major', confidence: 0.91 }],
  chordCandidates: [
    { startTick: 0, endTick: 1920, candidates: [{ root: 4, quality: 'major' }] },
    { startTick: 1920, endTick: 3840, candidates: [{ root: 11, quality: 'major' }] },
  ],
  degreeAnalysis: { progression: ['I', 'V'], text: 'I - V' },
  melodyAnalysis: { range: { min: 64, max: 67 } },
  bassAnalysis: { range: { min: 40, max: 40 } },
  rhythmAnalysis: { noteDensity: 1.25 },
  analyzerSpecific: {
    generatedBy: 'midi-analyzer',
    higherLevelMetrics: { repetitionAndVariation: 0.72 },
  },
};
analyzerProject.reference = {
  items: [
    {
      id: 'reference-midi',
      type: 'midi',
      name: 'reference.mid',
      sourceApp: 'midi-analyzer',
      provenance: { origin: 'reference-song' },
    },
    {
      id: 'stem-bass-1',
      type: 'stem',
      stemType: 'bass',
      name: 'Bass Stem',
      storage: { kind: 'indexeddb', database: 'midi-analyzer-stems', recordId: 'stem-bass-1' },
    },
  ],
};
analyzerProject.assets.files.push({
  id: 'reference-midi-file',
  type: 'midi',
  role: 'reference',
  name: 'reference.mid',
  path: 'assets/reference.mid',
  mimeType: 'audio/midi',
  external: true,
});
analyzerProject.composition = {
  chords: [
    { root: 4, quality: 'major', degree: 'I', startTick: 0, durationTick: 1920 },
    { root: 11, quality: 'major', degree: 'V', startTick: 1920, durationTick: 1920 },
  ],
  melody: [note('m1', 64, 0), note('m2', 66, 480)],
  counterMelody: [],
  bass: [note('b1', 40, 0, 960)],
  drums: [note('d1', 36, 0, 120)],
  sections: [
    { id: 'verse-1', kind: 'verse', name: 'Aメロ', bars: 4 },
    { id: 'chorus-1', kind: 'chorus', name: 'サビ', bars: 4 },
  ],
};
analyzerProject.compatibility.midiAnalyzer = {
  appVersion: 'v0.18-dev',
  sourceFileName: 'reference.mid',
};

// 1. Analyzer-shaped SongProject v1 must normalize and serialize without losing Analyzer-owned fields.
const normalized = normalizeSongProjectV1(analyzerProject, { now: NOW });
assert.equal(validateSongProject(normalized), true);
assert.deepEqual(normalized.analysis, analyzerProject.analysis);
assert.deepEqual(normalized.reference, analyzerProject.reference);
assert.deepEqual(normalized.assets, analyzerProject.assets);
assert.equal(normalized.lineage.sourceApp, 'midi-analyzer');

const parsed = parseSongProjectJson(serializeSongProject(normalized));
assert.deepEqual(parsed.analysis, normalized.analysis);
assert.deepEqual(parsed.reference, normalized.reference);
assert.deepEqual(parsed.assets, normalized.assets);
assert.deepEqual(parsed.compatibility.midiAnalyzer, normalized.compatibility.midiAnalyzer);

// 2. Demo Composer owns composition/basic only; Analyzer analysis/reference/assets must survive Demo edits.
const demo = songProjectToDemoProject(parsed);
demo.basic.bpm = 132;
demo.tracks.find((track) => track.role === 'melody').notes.push(note('m3', 68, 960));
const afterDemo = mergeDemoChangesIntoSongProject(parsed, demo, { now: '2026-10-15T00:01:00.000Z' });
assert.equal(afterDemo.basic.bpm, 132);
assert.equal(afterDemo.composition.melody.length, 3);
assert.deepEqual(afterDemo.analysis, parsed.analysis, 'Demo Composer must preserve MIDI Analyzer analysis');
assert.deepEqual(afterDemo.reference, parsed.reference, 'Demo Composer must preserve MIDI Analyzer reference metadata');
assert.deepEqual(afterDemo.assets, parsed.assets, 'Demo Composer must preserve external asset references');
assert.deepEqual(afterDemo.compatibility.midiAnalyzer, parsed.compatibility.midiAnalyzer);

// 3. Arrangement Lab owns arrangement only; Analyzer and Demo-owned fields must survive arrangement edits.
const arrangementInput = songProjectToArrangementSourceInput(afterDemo);
const source = normalizeSourceProject(arrangementInput);
const candidate = buildThreeCandidates(source, 'jpop-band')[1];
candidate.sections[0].density = 'full';
candidate.sections[0].decisionNote = '境界テスト用の編曲判断';
const arrangerProject = createArrangerProject(source, candidate);
const afterArrangement = mergeArrangementChangesIntoSongProject(afterDemo, arrangerProject, { now: '2026-10-15T00:02:00.000Z' });
assert.deepEqual(afterArrangement.analysis, afterDemo.analysis, 'Arrangement Lab must preserve MIDI Analyzer analysis');
assert.deepEqual(afterArrangement.reference, afterDemo.reference, 'Arrangement Lab must preserve reference metadata');
assert.deepEqual(afterArrangement.assets, afterDemo.assets, 'Arrangement Lab must preserve assets');
assert.deepEqual(afterArrangement.composition, afterDemo.composition, 'Arrangement Lab must preserve Demo Composer composition');
assert.equal(afterArrangement.arrangement.density[0].density, 'full');

// 4. Composition Sheet owns intent and optional basic fields; all other app-owned regions must survive.
const beforeSheet = {
  analysis: structuredClone(afterArrangement.analysis),
  reference: structuredClone(afterArrangement.reference),
  assets: structuredClone(afterArrangement.assets),
  composition: structuredClone(afterArrangement.composition),
  arrangement: structuredClone(afterArrangement.arrangement),
};
const afterSheet = mergeSheetChangesIntoSongProject(afterArrangement, {
  title: 'Analyzer Contract Song - Sheet Edit',
  scene: '夜明け前',
  references: ['Reference Song A'],
  mood: ['浮遊感'],
  bpm: 134,
  key: 'F# minor',
  notes: '作曲シート側の更新',
}, { now: '2026-10-15T00:03:00.000Z' });
assert.equal(afterSheet.basic.bpm, 134);
assert.equal(afterSheet.basic.key, 'F#');
assert.equal(afterSheet.basic.scale, 'minor');
assert.deepEqual(afterSheet.analysis, beforeSheet.analysis, 'Composition Sheet must preserve MIDI Analyzer analysis');
assert.deepEqual(afterSheet.reference, beforeSheet.reference, 'Composition Sheet must preserve Analyzer reference metadata');
assert.deepEqual(afterSheet.assets, beforeSheet.assets, 'Composition Sheet must preserve assets');
assert.deepEqual(afterSheet.composition, beforeSheet.composition, 'Composition Sheet must preserve composition');
assert.deepEqual(afterSheet.arrangement, beforeSheet.arrangement, 'Composition Sheet must preserve arrangement');

// 5. Final JSON round-trip must preserve every app boundary after all three app edits.
const finalProject = parseSongProjectJson(serializeSongProject(afterSheet));
assert.equal(validateSongProject(finalProject), true);
assert.deepEqual(finalProject.analysis, beforeSheet.analysis);
assert.deepEqual(finalProject.reference, beforeSheet.reference);
assert.deepEqual(finalProject.assets, beforeSheet.assets);
assert.deepEqual(finalProject.composition, beforeSheet.composition);
assert.deepEqual(finalProject.arrangement, beforeSheet.arrangement);
assert.equal(finalProject.lineage.rootProjectId, 'analyzer-contract-1');
assert.equal(finalProject.lineage.sourceApp, 'midi-analyzer');
