import assert from 'node:assert/strict';
import { normalizeSourceProject,buildThreeCandidates,arrangedNotes,createPartMidi,createArrangerProject,restoreArrangerProject,updateCandidateSection } from '../src/core.js';
import { MUSIC_LAB_CATALOG } from '../src/music-lab-catalog.js';
import { generateMusicLabCandidates,adoptMusicLabCandidate,validateMusicLabCandidate } from '../src/music-lab.js';
import { parseMidi } from '../../src/midi/midi-reader.js';
import { CHORD_QUALITY_DEFINITIONS as Q } from '../src/chord-qualities.js';
import { fixture } from './music-lab-fixture.mjs';
const source=normalizeSourceProject(fixture()),original=JSON.stringify(source),current=buildThreeCandidates(source)[2];for(const s of current.sections){s.enabled={drums:true,bass:true,harmony:true,counter:true,color:true};s.density='full';}
assert.equal(MUSIC_LAB_CATALOG.length,50);assert.equal(new Set(MUSIC_LAB_CATALOG.map(m=>m.id)).size,50);
const counts={};let available=0;
for(const method of MUSIC_LAB_CATALOG){
 counts[method.category]=(counts[method.category]||0)+1;
 const choices=generateMusicLabCandidates(source,current,'s1',method.id);
 assert.equal(choices.length,method.variants.length);
 assert.ok(choices.some(c=>c.available),`${method.id}: no musical change: ${choices.map(c=>c.unavailableReason).join(' | ')}`);
 for(const choice of choices){
  if(!choice.available){assert.ok(choice.unavailableReason);continue;}
  available++;assert.ok(choice.affectedSectionIds.length);validateMusicLabCandidate(source,choice.candidate);
  const adopted=adoptMusicLabCandidate(current,choice);
  for(const s of current.sections)if(!choice.affectedSectionIds.includes(s.sectionId))assert.deepEqual(adopted.sections.find(t=>t.sectionId===s.sectionId),s,method.id+' unrelated section');
  for(const s of adopted.sections)for(const c of s.reharmonization?.chords||[])assert.ok(Object.hasOwn(Q,c.quality));
  for(const part of ['melody','counter','harmony','bass','drums','counter-a','counter-b']){
   const midi=createPartMidi(source,adopted,part);if(!midi)continue;const parsed=parseMidi(midi);
   assert.equal(parsed.division,480);if(part==='drums')assert.deepEqual(parsed.tracks[0].channels,[9]);
   assert.ok(parsed.tracks.flatMap(t=>t.notes).every(n=>n.durationTick>0&&n.pitch>=0&&n.pitch<=127),method.id+' MIDI');
   const expected=arrangedNotes(source,adopted,part).map(n=>[n.pitch,n.startTick,n.durationTick,n.velocity]).sort();
   const actual=parsed.tracks.flatMap(t=>t.notes).map(n=>[n.pitch,n.startTick,n.durationTick,n.velocity]).sort();assert.deepEqual(actual,expected,method.id+' '+part+' MIDI note roundtrip');
  }
  const restored=restoreArrangerProject(JSON.parse(JSON.stringify(createArrangerProject(source,adopted))));
  assert.deepEqual(arrangedNotes(restored.source,restored.candidate,'harmony'),arrangedNotes(source,adopted,'harmony'));
  assert.deepEqual(arrangedNotes(restored.source,restored.candidate,'counter'),arrangedNotes(source,adopted,'counter'));
 }
 console.log('PASS',method.id);
}
assert.deepEqual(counts,{harmony:14,counter:16,development:15,linked:5});assert.equal(JSON.stringify(source),original);
// Reharm anchors, timing preservation and masks are semantic checks, not just valid output.
const by=(id,v=0)=>generateMusicLabCandidates(source,current,'s1',id)[v].candidate;
for(const id of ['h-melody-fit','h-meaning','h-bass-fixed','h-bridge','h-modulate'])assert.deepEqual(arrangedNotes(source,by(id),'melody'),arrangedNotes(source,current,'melody'));
assert.deepEqual(arrangedNotes(source,by('h-bass-fixed'),'bass'),arrangedNotes(source,current,'bass'));
for(const id of ['c-contour','c-rhythm','c-register']) {
 const before=arrangedNotes(source,current,'counter').filter(n=>n.startTick>=7680&&n.startTick<15360);
 const after=arrangedNotes(source,by(id),'counter').filter(n=>n.startTick>=7680&&n.startTick<15360);
 assert.deepEqual(after.map(n=>[n.startTick,n.durationTick]),before.map(n=>[n.startTick,n.durationTick]));
}
const voices=by('c-voices');const a=arrangedNotes(source,voices,'counter-a'),b=arrangedNotes(source,voices,'counter-b');assert.ok(a.length&&b.length);for(const x of a)for(const y of b)assert.ok(x.startTick+x.durationTick<=y.startTick||y.startTick+y.durationTick<=x.startTick);
const lateEdit=structuredClone(current);lateEdit.sections[0].decisionNote='keep latest';assert.equal(adoptMusicLabCandidate(lateEdit,generateMusicLabCandidates(source,current,'s1','h-bridge')[0]).sections[0].decisionNote,'keep latest');
const empty=normalizeSourceProject({id:'empty',revision:1,basic:{ppq:96},structure:{sections:[{id:'empty',kind:'verse',bars:1}]},chords:[],tracks:[]});
for(const method of MUSIC_LAB_CATALOG)for(const c of generateMusicLabCandidates(empty,buildThreeCandidates(empty)[1],'empty',method.id)){if(c.available)validateMusicLabCandidate(empty,c.candidate);else assert.ok(c.unavailableReason);}
for(const ppq of [96,960]){const s=normalizeSourceProject(fixture(ppq)),c=buildThreeCandidates(s)[2];for(const id of ['h-bridge','c-answer','d-transition','d-once'])for(const choice of generateMusicLabCandidates(s,c,'s1',id)){if(choice.available){validateMusicLabCandidate(s,choice.candidate);const midi=createPartMidi(s,choice.candidate,'harmony');if(midi)assert.equal(parseMidi(midi).division,ppq);}}}
console.log(`PASS all 50 methods, ${available} applicable variants, old-source isolation, Plan/MIDI, empty material and PPQ`);

// Legacy Schema 3 and the old seven tools remain usable after advanced overrides.
const advanced=by('h-inner');const plan=createArrangerProject(source,advanced);plan.arrangerSchemaVersion=3;
assert.ok(restoreArrangerProject(plan).candidate);
const counterOverride=by('c-rhythm');const legacyCounter=updateCandidateSection(counterOverride,'s1',{counterArrangement:{notes:[{id:'legacy',pitch:80,startTick:7680,durationTick:480,velocity:80}]}});
assert.equal(arrangedNotes(source,legacyCounter,'counter').filter(n=>n.startTick>=7680&&n.startTick<15360).length,1);
const pulse=by('d-density',0);const cleared=updateCandidateSection(pulse,'s1',{reharmonization:{chords:[{root:0,quality:'minor7',startTick:7680,durationTick:7680}]}});
assert.equal(cleared.sections[1].partOverrides?.harmony,undefined);
