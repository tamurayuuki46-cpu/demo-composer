import assert from 'node:assert/strict';
import { normalizeSourceProject, buildThreeCandidates, createArrangerProject } from '../src/core.js';

const sourceJson = {
  schemaVersion: 3,
  appVersion: 'v0.3-dev',
  id: 'demo-1',
  revision: 4,
  metadata: { title: 'Test Song', genre: 'J-POP', mood: ['切ない'] },
  basic: { bpm: 128, key: 'D', scale: 'major', timeSignature: '4/4', ppq: 480 },
  structure: { sections: [
    { id: 's1', kind: 'intro', name: 'イントロ', bars: 4, energy: 'low', transition: 'build' },
    { id: 's2', kind: 'verse', name: 'Aメロ', bars: 8 },
    { id: 's3', kind: 'chorus', name: 'サビ', bars: 8, energy: 'high', transition: 'fill' },
  ]},
  chords: [], tracks: [], instruments: [], progress: {}, exportSettings: {},
};

const source = normalizeSourceProject(sourceJson);
assert.equal(source.title, 'Test Song');
assert.equal(source.sections.length, 3);
assert.equal(source.sections[1].energy, 'low');

const candidates = buildThreeCandidates(source, 'jpop-band');
assert.equal(candidates.length, 3);
assert.equal(candidates[0].sections.length, 3);
assert.equal(candidates[2].sections[2].density, 'full');
assert.notEqual(candidates[0].id, candidates[1].id);

const plan = createArrangerProject(source, candidates[1]);
assert.equal(plan.arrangerSchemaVersion, 1);
assert.equal(plan.source.projectId, 'demo-1');
assert.equal(plan.arrangement.sections[2].sectionName, 'サビ');

assert.throws(() => normalizeSourceProject({}), /basic/);
assert.throws(() => normalizeSourceProject({ basic: {}, structure: { sections: [] } }), /Section/);

console.log('arranger core tests: OK');
