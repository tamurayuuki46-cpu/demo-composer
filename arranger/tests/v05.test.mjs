import assert from 'node:assert/strict';
import { normalizeSourceProject, buildThreeCandidates, createArrangerProject } from '../src/core.js';
import {
  ARRANGER_V05_VERSION,
  createSongMidi,
  createDemoComposerProject,
  buildDrumFillCandidates,
  buildBassApproachCandidates,
  applyPerformanceOverride,
  clearPerformanceOverride,
} from '../src/v05-tools.js';

const project = {
  schemaVersion: 3,
  appVersion: 'v0.3-dev',
  id: 'v05-source',
  revision: 7,
  metadata: { title: 'V05 Test', lineage: { rootProjectId: 'song-root', parentProjectId: null, sourceApp: 'demo-composer', createdFrom: 'new', forkReason: null, revision: 1 } },
  basic: { bpm: 120, key: 'C', scale: 'major', timeSignature: '4/4', ppq: 480 },
  structure: { sections: [
    { id: 's1', kind: 'verse', name: 'Aメロ', bars: 1, energy: 'low' },
    { id: 's2', kind: 'chorus', name: 'サビ', bars: 1, energy: 'high' },
  ] },
  chords: [
    { root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: 960 },
    { root: 5, quality: 'major', degree: 'IV', startTick: 960, durationTick: 960 },
    { root: 7, quality: 'dominant7', degree: 'V7', startTick: 1920, durationTick: 960 },
    { root: 0, quality: 'major', degree: 'I', startTick: 2880, durationTick: 960 },
  ],
  tracks: [
    { role: 'melody', name: 'Melody', midiChannel: 2, mute: false, solo: false, volume: 1, pan: 0, notes: [
      { id: 'm1', pitch: 64, startTick: 0, durationTick: 480, velocity: 96 },
      { id: 'm2', pitch: 67, startTick: 1920, durationTick: 480, velocity: 100 },
    ] },
    { role: 'bass', name: 'Bass', midiChannel: 3, mute: false, solo: false, volume: 1, pan: 0, notes: [
      { id: 'b1', pitch: 36, startTick: 0, durationTick: 720, velocity: 88 },
      { id: 'b2', pitch: 41, startTick: 960, durationTick: 720, velocity: 88 },
      { id: 'b3', pitch: 43, startTick: 1920, durationTick: 720, velocity: 90 },
      { id: 'b4', pitch: 36, startTick: 2880, durationTick: 720, velocity: 90 },
    ] },
    { role: 'drums', name: 'Drums', midiChannel: 10, mute: false, solo: false, volume: 1, pan: 0, drumMap: { kick: 36, snare: 38, closedHH: 42 }, notes: [
      { id: 'd1', pitch: 36, startTick: 0, durationTick: 60, velocity: 100 },
      { id: 'd2', pitch: 38, startTick: 960, durationTick: 60, velocity: 100 },
      { id: 'd3', pitch: 36, startTick: 1920, durationTick: 60, velocity: 100 },
    ] },
    { role: 'counter', name: 'Counter Melody', midiChannel: 4, mute: false, solo: false, volume: 1, pan: 0, notes: [
      { id: 'c1', voice: 'A', pitch: 72, startTick: 480, durationTick: 240, velocity: 82 },
      { id: 'c2', voice: 'B', pitch: 76, startTick: 2400, durationTick: 240, velocity: 82 },
    ] },
  ],
  instruments: [], progress: {}, exportSettings: {},
};

const source = normalizeSourceProject(project);
const candidate = buildThreeCandidates(source, 'jpop-band')[1];

const song = createSongMidi(source, candidate);
assert.ok(song instanceof Uint8Array);
assert.equal(Buffer.from(song.subarray(0, 4)).toString(), 'MThd');
assert.deepEqual([...song.subarray(8, 10)], [0, 1], 'Song.mid must be SMF Type 1');
const trackCount = (song[10] << 8) | song[11];
assert.ok(trackCount >= 5, `expected conductor + musical tracks, got ${trackCount}`);
assert.equal((song[12] << 8) | song[13], 480);
assert.ok([...song].includes(0x99), 'drums must use MIDI channel 10');
assert.ok(Buffer.from(song).includes(Buffer.from([0xff, 0x06])), 'section marker meta event expected');

const fills = buildDrumFillCandidates(source, candidate, 's1');
assert.equal(fills.length, 3);
for (const fill of fills) {
  assert.equal(fill.part, 'drums');
  assert.ok(fill.notes.some((note) => note.startTick >= 1440 && note.startTick < 1920));
  assert.ok(fill.notes.every((note) => note.startTick >= 0 && note.startTick + note.durationTick <= 1920));
}

const approaches = buildBassApproachCandidates(source, candidate, 's1');
assert.equal(approaches.length, 3);
for (const approach of approaches) {
  assert.equal(approach.part, 'bass');
  assert.ok(approach.notes.some((note) => note.startTick === 720), `${approach.id} should approach the chord at tick 960`);
}

let plan = createArrangerProject(source, candidate);
plan = applyPerformanceOverride(plan, 's1', fills[0]);
assert.equal(plan.arrangerVersion, ARRANGER_V05_VERSION);
assert.equal(plan.arrangement.sections[0].performanceGenerator.drums.id, 'snare-build');
assert.ok(plan.arrangement.sections[0].partOverrides.drums.length);
const generatedNotes = plan.arrangement.sections[0].partOverrides.drums;
plan = clearPerformanceOverride(plan, 's1', 'drums');
assert.equal(plan.arrangement.sections[0].performanceGenerator, undefined);
assert.equal(plan.arrangement.sections[0].partOverrides, undefined);
assert.ok(generatedNotes.length > 0);

const metadataBefore = structuredClone(project.metadata);
const demoProject = createDemoComposerProject(source, candidate);
assert.notEqual(demoProject.id, project.id, 'fork project must be a non-destructive duplicate');
assert.equal(demoProject.revision, 1);
assert.match(demoProject.metadata.title, /Arrangement$/);
assert.equal(demoProject.schemaVersion, 3);
assert.equal(demoProject.chords.length, project.chords.length);
assert.equal(demoProject.tracks.find((track) => track.role === 'drums').midiChannel, 10);
assert.ok(demoProject.tracks.find((track) => track.role === 'melody').notes.length);
assert.equal(demoProject.metadata.lineage.rootProjectId, 'song-root');
assert.equal(demoProject.metadata.lineage.parentProjectId, project.id);
assert.equal(demoProject.metadata.lineage.sourceApp, 'arrangement-lab');
assert.equal(demoProject.metadata.lineage.createdFrom, 'fork');
assert.equal(demoProject.metadata.lineage.revision, 1);
assert.match(demoProject.metadata.lineage.forkReason, /編曲/);
assert.deepEqual(project.metadata, metadataBefore, 'source snapshot must not be mutated');

// Legacy Demo Project without lineage starts a new lineage rooted at the parent project id.
const legacyProject = structuredClone(project);
delete legacyProject.metadata.lineage;
const legacySource = normalizeSourceProject(legacyProject);
const legacyCandidate = buildThreeCandidates(legacySource, 'jpop-band')[1];
const legacyFork = createDemoComposerProject(legacySource, legacyCandidate);
assert.equal(legacyFork.metadata.lineage.rootProjectId, legacyProject.id);
assert.equal(legacyFork.metadata.lineage.parentProjectId, legacyProject.id);

console.log('arranger v0.5 tests: Song MIDI, performance candidates, and lineage-aware Fork OK');