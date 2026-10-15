import assert from 'node:assert/strict';
import { branchDivergence, createDivergenceSession } from '../src/core/divergence.js';
import { normalizeSourceProject } from '../arranger/src/core.js';
import { arrangementDivergenceTransform, createArrangementDivergenceSeed } from '../arranger/src/divergence.js';

const ppq = 480;
const bar = ppq * 4;
const source = normalizeSourceProject({
  schemaVersion: 3,
  appVersion: 'v0.17-dev',
  id: 'source-1',
  revision: 2,
  metadata: { title: 'Divergence Test', genre: 'J-POP', mood: ['bright'] },
  basic: { bpm: 128, key: 'C', scale: 'major', timeSignature: '4/4', ppq },
  structure: { sections: [
    { id: 'verse', name: 'Verse', kind: 'verse', bars: 4, energy: 'low', transition: 'build' },
    { id: 'chorus', name: 'Chorus', kind: 'chorus', bars: 4, energy: 'high', transition: 'fill' },
  ] },
  chords: Array.from({ length: 8 }, (_, index) => ({
    root: [0, 7, 9, 5][index % 4], quality: index % 4 === 2 ? 'minor' : 'major',
    startTick: index * bar, durationTick: bar,
  })),
  tracks: [
    { role: 'melody', name: 'Melody', midiChannel: 2, notes: [
      { id: 'm1', pitch: 64, startTick: 0, durationTick: ppq, velocity: 96 },
      { id: 'm2', pitch: 67, startTick: bar * 4, durationTick: ppq, velocity: 96 },
    ] },
    { role: 'counter', name: 'Counter', midiChannel: 4, notes: [
      { id: 'c1', pitch: 55, startTick: ppq, durationTick: ppq, velocity: 72 },
    ] },
    { role: 'drums', name: 'Drums', midiChannel: 10, notes: [
      { id: 'd1', pitch: 36, startTick: 0, durationTick: 120, velocity: 100 },
    ] },
  ],
  instruments: [], progress: {}, exportSettings: {},
});

const seedCandidate = createArrangementDivergenceSeed(source, { styleId: 'jpop-band' });
const original = structuredClone(seedCandidate);
const session = createDivergenceSession(seedCandidate, {
  seedValue: 'arranger-test',
  locks: { melody: true, harmony: false, counterMelody: false, rhythm: false, sound: false },
  distance: 4,
  mode: 'arranger',
});

const generated = branchDivergence(session, {
  count: 5,
  transform(candidate, context) {
    return arrangementDivergenceTransform(candidate, context, { source });
  },
});
assert.equal(generated.branches.length, 5);
assert.deepEqual(session.nodes.root.payload, original, 'Seed candidate must remain untouched');
assert.ok(generated.branches.every((node) => !node.changedAxes.includes('melody')), 'Arrangement Lab must not mutate main melody');
assert.ok(generated.branches.every((node) => Array.isArray(node.payload.sections) && node.payload.sections.length === 2));

const harmonyLocked = createDivergenceSession(seedCandidate, {
  seedValue: 'locked-test',
  locks: { melody: true, harmony: true, counterMelody: false, rhythm: false, sound: false },
  distance: 5,
  mode: 'arranger',
});
const lockedBranches = branchDivergence(harmonyLocked, {
  count: 3,
  transform(candidate, context) {
    return arrangementDivergenceTransform(candidate, context, { source });
  },
});
assert.ok(lockedBranches.branches.every((node) => !node.changedAxes.includes('harmony')), 'Harmony lock must be respected');

const firstRun = generated.branches.map((node) => JSON.stringify(node.payload));
const repeated = branchDivergence(session, {
  count: 5,
  transform(candidate, context) {
    return arrangementDivergenceTransform(candidate, context, { source });
  },
});
assert.deepEqual(firstRun, repeated.branches.map((node) => JSON.stringify(node.payload)), 'Same seed must reproduce arrangement branches');

console.log('arranger-divergence-smoke-test: ok');
