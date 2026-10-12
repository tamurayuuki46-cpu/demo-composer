import assert from 'node:assert/strict';
import { normalizeSourceProject,buildThreeCandidates,arrangedNotes,createPartMidi,createArrangerProject,restoreArrangerProject,updateCandidateSection } from '../src/core.js';
import { buildTheorySuggestions,analyzeReharm,theoryAudition } from '../src/reharm-theory.js';
import { adoptSectionFrom,buildChorusCandidates,buildSubtractionCandidates,buildCounterScaleCandidates,leadHandoffCandidate } from '../src/arrangement-tools.js';
import { parseMidi } from '../../src/midi/midi-reader.js';
const BAR=1920;
const json={id:'features',revision:2,basic:{key:'C',scale:'major',ppq:480,bpm:120},metadata:{title:'7 features'},structure:{sections:[{id:'verse',kind:'verse',name:'Aメロ',bars:1},{id:'chorus',kind:'chorus',name:'サビ',bars:4}]},
 chords:[{root:0,quality:'major',startTick:0,durationTick:BAR},...[{root:5,quality:'major7'},{root:7,quality:'dominant7'},{root:0,quality:'major'},{root:9,quality:'minor'}].map((c,i)=>({...c,startTick:BAR*(i+1),durationTick:BAR}))],
 tracks:[{role:'melody',notes:[{pitch:69,startTick:BAR,durationTick:480},{pitch:71,startTick:BAR*2,durationTick:480},{pitch:72,startTick:BAR*3,durationTick:480}]},
 {role:'counter',notes:[{pitch:66,startTick:0,durationTick:240},{pitch:66,startTick:BAR,durationTick:960},{pitch:70,startTick:BAR*2,durationTick:960},{pitch:74,startTick:BAR*3,durationTick:480}]},
 {role:'bass',notes:[{pitch:41,startTick:BAR,durationTick:BAR}]}]};
const source=normalizeSourceProject(json),before=JSON.stringify(source),a=buildThreeCandidates(source)[1],b=buildThreeCandidates(source)[2];
const theory=buildTheorySuggestions(source,'chorus');assert.equal(theory.length,6);assert.ok(theory.every(t=>t.available));
assert.equal(theory.find(t=>t.method==='borrowed').chords[0].quality,'minor');
assert.equal(theory.find(t=>t.method==='tritone').chords[1].root,1);
assert.equal(theory.find(t=>t.method==='diminished').chords[2].root,8);
for(const t of theory){assert.deepEqual(t.chords.map(c=>[c.startTick,c.durationTick]),source.chords.slice(1).map(c=>[c.startTick,c.durationTick]));assert.ok(t.chords.every(c=>c.root>=0&&c.root<12));}
const analysis=analyzeReharm(source,'chorus',theory.find(t=>t.method==='borrowed'));assert.ok(analysis.rows[0].melody[0].attention,'held A over F minor needs listening');assert.equal(analysis.rows[0].melody[0].after.startsWith('非構成音'),true);assert.ok(analysis.rows[0].common.includes('F'));
const noMelody=normalizeSourceProject({...json,tracks:[]});assert.equal(analyzeReharm(noMelody,'chorus',theory[0]).coverage,null);
for(const mode of ['candidate','original','guide','bass']){const sketch=theoryAudition(source,a,'chorus',theory[0],mode);assert.equal(sketch.startTick,BAR);assert.equal(sketch.endTick,BAR*5);assert.notEqual(sketch.candidate,a);if(mode==='guide')assert.ok(sketch.source.tracks[0].notes.length);}
const picked=adoptSectionFrom(a,b,'chorus');assert.deepEqual(picked.sections[0],a.sections[0]);assert.equal(picked.sections[1].adoptedFrom,b.label);
const chorus=buildChorusCandidates(source,a,'chorus');assert.equal(chorus.length,5);assert.equal(buildChorusCandidates(source,a,'verse').length,0);
for(const c of chorus)assert.deepEqual(c.sections[0],a.sections[0]);
const patterns=chorus.map(c=>JSON.stringify(arrangedNotes(source,c,'harmony')));assert.equal(new Set(patterns).size,5,'five audibly different harmony arrangements');
const subtraction=buildSubtractionCandidates(source,a,'chorus');assert.equal(subtraction.length,3);assert.ok(subtraction[1].candidate.sections[1].enabled.bass===false);
const scales=buildCounterScaleCandidates(source,a,'chorus');assert.equal(scales.length,5);
for(const c of scales) {assert.deepEqual(c.candidate.sections[0],a.sections[0]);assert.deepEqual(c.notes.map(n=>[n.startTick,n.durationTick]),source.tracks[1].notes.slice(1).map(n=>[n.startTick,n.durationTick]));}
assert.ok(scales.find(c=>c.id==='pentatonic').notes.every(n=>[0,2,4,7,9].includes(n.pitch%12)));
const response=scales.find(c=>c.id==='response').candidate;
for(const n of arrangedNotes(source,response,'counter').filter(n=>n.startTick>=BAR))for(const m of source.tracks[0].notes)assert.ok(n.startTick+n.durationTick<=m.startTick||m.startTick+m.durationTick<=n.startTick,'response never overlaps melody');
for(const mode of ['melody','counter','harmony']){const c=leadHandoffCandidate(response,'chorus',mode);assert.deepEqual(arrangedNotes(source,c,'melody'),arrangedNotes(source,a,'melody'));assert.deepEqual(c.sections[0],a.sections[0]);}
const empty=normalizeSourceProject({...json,tracks:json.tracks.filter(t=>t.role!=='counter')});assert.ok(buildCounterScaleCandidates(empty,a,'chorus').every(c=>c.notes.length>0));
const adopted=updateCandidateSection(response,'chorus',{reharmonization:theory[3],harmonyPattern:'arpeggio',decisionNote:'歌の隙間だけ'});
const saved=createArrangerProject(source,adopted);assert.equal(saved.arrangerSchemaVersion,3);const restored=restoreArrangerProject(JSON.parse(JSON.stringify(saved)));
for(const part of ['counter','harmony','melody','bass']){assert.deepEqual(createPartMidi(source,adopted,part),createPartMidi(restored.source,restored.candidate,part));const midi=createPartMidi(source,adopted,part);if(midi)assert.ok(parseMidi(midi).tracks[0].notes.length);}
assert.equal(JSON.stringify(source),before,'no source mutation');
assert.deepEqual(a,buildThreeCandidates(source)[1],'no preview/generator mutation');
console.log('PASS seven features: theory, melody fit, scales, section adoption, chorus, subtraction, handoff, JSON/MIDI');
