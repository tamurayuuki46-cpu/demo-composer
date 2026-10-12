import assert from 'node:assert/strict';
import {
  ARRANGER_VERSION,
  ARRANGER_SCHEMA_VERSION,
  normalizeSourceProject,
  buildThreeCandidates,
  updateCandidateSection,
  mixCandidates,
  candidateCurve,
  detectMelodyCounterCollisions,
  buildReharmSuggestions,
  createArrangerProject,
  createPartMidi,
} from '../src/core.js';

const BAR = 1920;
const sourceJson = {
  schemaVersion: 3,
  appVersion: 'v0.3-dev',
  id: 'demo-1',
  revision: 4,
  metadata: { title: 'Test Song', genre: 'J-POP', mood: ['切ない'] },
  basic: { bpm: 128, key: 'D', scale: 'major', timeSignature: '4/4', ppq: 480 },
  structure: { sections: [
    { id: 's1', kind: 'intro', name: 'イントロ', bars: 1, energy: 'low', transition: 'build' },
    { id: 's2', kind: 'verse', name: 'Aメロ', bars: 1 },
    { id: 's3', kind: 'chorus', name: 'サビ', bars: 1, energy: 'high', transition: 'fill' },
  ]},
  chords: [
    { root: 2, quality: 'major', degree: 'I', startTick: 0, durationTick: BAR },
    { root: 11, quality: 'minor', degree: 'vi', startTick: BAR, durationTick: BAR },
    { root: 7, quality: 'dominant7', degree: 'V', startTick: BAR * 2, durationTick: BAR },
  ],
  tracks: [
    { role: 'melody', name: 'Melody', midiChannel: 2, notes: [
      { id: 'm1', pitch: 62, startTick: BAR, durationTick: 480, velocity: 100 },
      { id: 'm2', pitch: 66, startTick: BAR * 2, durationTick: 480, velocity: 100 },
    ]},
    { role: 'counter', name: 'Counter', midiChannel: 4, notes: [
      { id: 'c1', pitch: 63, startTick: BAR, durationTick: 480, velocity: 90 },
    ]},
    { role: 'bass', name: 'Bass', midiChannel: 3, notes: [
      { id: 'b1', pitch: 38, startTick: 0, durationTick: 480, velocity: 90 },
    ]},
  ],
  instruments: [], progress: {}, exportSettings: {},
};

assert.equal(ARRANGER_VERSION, 'v0.4-dev');
assert.equal(ARRANGER_SCHEMA_VERSION, 4);

const source = normalizeSourceProject(sourceJson);
assert.equal(source.title, 'Test Song');
assert.equal(source.sections.length, 3);
assert.equal(source.sections[1].energy, 'low');
assert.equal(source.sections[1].startTick, BAR);
assert.equal(source.chords.length, 3);
assert.equal(source.tracks.length, 3);

const candidates = buildThreeCandidates(source, 'jpop-band');
assert.equal(candidates.length, 3);
assert.equal(candidates[0].sections.length, 3);
assert.equal(candidates[2].sections[2].density, 'full');
assert.notEqual(candidates[0].id, candidates[1].id);

const edited = updateCandidateSection(candidates[1], 's2', { density: 'full', enabled: { counter: false } });
assert.equal(edited.sections[1].density, 'full');
assert.equal(edited.sections[1].enabled.counter, false);
assert.equal(candidates[1].sections[1].density, 'thin');

const mixed = mixCandidates(candidates[0], candidates[2]);
assert.match(mixed.label, /Mix/);
assert.equal(mixed.sections[2].density, candidates[2].sections[2].density);

const curve = candidateCurve(mixed);
assert.equal(curve.length, 3);
assert.ok(curve[2].instruments >= 1);

const collisions = detectMelodyCounterCollisions(source);
assert.equal(collisions[1].count, 1);
assert.equal(collisions[0].count, 0);

const reharm = buildReharmSuggestions(source, 's2');
assert.equal(reharm.length, 3);
assert.equal(reharm[0].label, '自然');
assert.match(reharm[0].display, /Bm7/);

const withReharm = updateCandidateSection(candidates[1], 's2', { reharmonization: reharm[1] });
assert.equal(withReharm.sections[1].reharmonization.id, 'color');

const plan = createArrangerProject(source, withReharm);
assert.equal(plan.arrangerSchemaVersion, 4);
assert.equal(plan.source.projectId, 'demo-1');
assert.equal(plan.arrangement.sections[1].reharmonization.id, 'color');

const melodyMidi = createPartMidi(source, candidates[1], 'melody');
assert.ok(melodyMidi instanceof Uint8Array);
assert.equal(String.fromCharCode(...melodyMidi.slice(0, 4)), 'MThd');

const harmonyMidi = createPartMidi(source, withReharm, 'harmony');
assert.ok(harmonyMidi instanceof Uint8Array);
assert.equal(String.fromCharCode(...harmonyMidi.slice(0, 4)), 'MThd');

assert.equal(createPartMidi(source, candidates[1], 'drums'), null);
assert.throws(() => normalizeSourceProject({}), /basic/);
assert.throws(() => normalizeSourceProject({ basic: {}, structure: { sections: [] } }), /Section/);

console.log('arranger v0.2 core tests: OK');
