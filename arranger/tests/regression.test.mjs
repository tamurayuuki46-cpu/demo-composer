import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeSourceProject, buildThreeCandidates, buildReharmSuggestions, updateCandidateSection, arrangedNotes, createPartMidi, createArrangerProject, restoreArrangerProject, detectMelodyCounterCollisions, chordName } from '../src/core.js';
import { parseMidi } from '../../src/midi/midi-reader.js';

assert.equal(readFileSync('arranger/src/chord-qualities.js', 'utf8'), readFileSync('src/core/chord-qualities.js', 'utf8'), 'standalone definitions must match Demo Composer');
const json = {
 id: 'regression', revision: 1, basic: { bpm: 120, ppq: 960, timeSignature: '4/4' }, metadata: { title: 'Regression' },
 structure: { sections: [{ id: 'a', bars: 1, kind: 'verse' }, { id: 'b', bars: 1, kind: 'chorus' }] },
 chords: [ { root: 7, quality: 'dominant7', startTick: 0, durationTick: 960 }, { root: 0, quality: 'major', startTick: 960, durationTick: 960 }, { root: 9, quality: 'minor', startTick: 1920, durationTick: 1920 }, { root: 5, quality: 'major7sharp11', startTick: 3840, durationTick: 3840 } ],
 tracks: ['melody','bass','drums','counter'].map((role, i) => ({ role, midiChannel: i+1, notes: [
  { pitch: role === 'drums' ? 36 : 60+i, startTick: 3600, durationTick: 480, velocity: 90 },
  { pitch: role === 'drums' ? 38 : 64+i, startTick: 5000, durationTick: 240, velocity: 100 }
 ] }))
};
const original = JSON.stringify(json), source = normalizeSourceProject(json);
let candidate = buildThreeCandidates(source)[1];
for (const part of ['melody','bass','drums','counter','harmony']) {
 const midi = createPartMidi(source, candidate, part), parsed = parseMidi(midi);
 assert.equal(parsed.format, 0); assert.equal(parsed.division, 960);
 assert.equal(parsed.tempos[0].bpm, 120); assert.equal(parsed.timeSignatures[0].numerator, 4);
 const actual = parsed.tracks.flatMap(t => t.notes).map(n => [n.pitch,n.startTick,n.durationTick,n.velocity]).sort();
 const expected = arrangedNotes(source,candidate,part).map(n => [n.pitch,n.startTick,n.durationTick,n.velocity]).sort();
 assert.deepEqual(actual,expected, part+' round trip delta/on/off');
 if (part === 'drums') assert.deepEqual(parsed.tracks[0].channels,[9]);
 const muted = updateCandidateSection(candidate,'b',{enabled:{[part]:false}});
 assert.ok(arrangedNotes(source,muted,part).every(n=>n.startTick+n.durationTick<=3840));
}
const suggestions = buildReharmSuggestions(source,'a');
assert.equal(suggestions[1].chords[0].root,7,'V of next C');
assert.equal(suggestions[2].chords[0].root,1,'G7 tritone Db7 resolving C');
assert.equal(suggestions[2].chords[1].root,8,'G#dim leads to A');
for (const suggestion of suggestions) {
 assert.deepEqual(suggestion.chords.map(c=>[c.startTick,c.durationTick]),source.chords.slice(0,3).map(c=>[c.startTick,c.durationTick]));
 assert.ok(suggestion.chords.every(c=>Number.isInteger(c.root)&&c.root>=0&&c.root<12));
 assert.ok(!suggestion.display.includes('undefined'));
}
candidate = updateCandidateSection(candidate,'a',{density:'standard',reharmonization:suggestions[0]});
assert.ok(arrangedNotes(source,candidate,'harmony').some(n=>n.startTick===960&&n.pitch===59),'maj7 audible even standard');
const off = updateCandidateSection(candidate,'a',{reharmonization:null});
assert.notDeepEqual(createPartMidi(source,candidate,'harmony'),createPartMidi(source,off,'harmony'));
const plan = createArrangerProject(source,candidate);
const restored = restoreArrangerProject(JSON.parse(JSON.stringify(plan)));
assert.deepEqual(restored.candidate,candidate);
assert.deepEqual(createPartMidi(restored.source,restored.candidate,'harmony'),createPartMidi(source,candidate,'harmony'));
const legacy = structuredClone(plan); delete legacy.sourceSnapshot; legacy.arrangerSchemaVersion = 1;
for (const section of legacy.arrangement.sections) delete section.enabled;
assert.equal(restoreArrangerProject(legacy).source,null);
assert.ok(restoreArrangerProject(legacy,source).candidate.sections[0].enabled.harmony);
assert.throws(()=>restoreArrangerProject(legacy,{...source,sourceRevision:2}),/revision/);
assert.equal(JSON.stringify(json),original,'source must never mutate');
assert.equal(chordName({root:-1,quality:'minor'}),'Bm');
const unison = normalizeSourceProject({...json,tracks:[{role:'melody',notes:[{pitch:60,startTick:0,durationTick:100}]},{role:'counter',notes:[{pitch:60,startTick:0,durationTick:100}]}]});
assert.equal(detectMelodyCounterCollisions(unison)[0].count,0,'unison is not a semitone collision');
console.log('Arrangement MIDI, reharm, restoration, source isolation regression: PASS');
