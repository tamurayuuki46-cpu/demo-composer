import assert from 'node:assert/strict';
import {createDefaultProject,createProjectStore,validateProject} from '../src/core/project-state.js';
import {migrateProject} from '../src/core/project-migration.js';
import {APP_VERSION} from '../src/core/project-schema.js';
import {defaultDesign,designOf,undecidedItems} from '../src/core/decision-design.js';
import {decisionCandidates,withDecisionCandidate} from '../src/core/decision-candidates.js';
import {createDecisionComparison,decisionPreview} from '../src/core/decision-comparison.js';
import {decisionAnalysis} from '../src/core/decision-analysis.js';
import {buildMidiExports} from '../src/midi/midi-export.js';
import {parseMidi} from '../src/midi/midi-reader.js';
import {parseProjectJson} from '../src/storage/project-import.js';
import {duplicateProjectRecord} from '../src/storage/project-records.js';
import {buildConsultText} from '../src/hub/consult-text.js';
const clone=x=>structuredClone(x),BAR=1920;
const note=(id,pitch,tick,duration=120)=>({id,pitch,startTick:tick,durationTick:duration,velocity:87});
const base=createDefaultProject();
base.metadata.memo='元の自由メモ';
base.chords=Array.from({length:4},(_,i)=>({root:i===3?7:0,quality:'major',degree:i===3?'V':'I',startTick:i*BAR,durationTick:BAR}));
base.tracks=[{role:'melody',name:'Melody',midiChannel:2,notes:[note('m0',60,0),note('m1',62,240),note('m2',64,480),note('m3',65,720),note('other',67,BAR)]}, {role:'counter',name:'Counter',midiChannel:4,notes:[note('c0',67,0)]},{role:'drums',name:'Drums',midiChannel:10,notes:[note('d0',36,0)]}];
base.structure.sections=[{id:'verse',kind:'verse',name:'Aメロ',bars:2},{id:'chorus',kind:'chorus',name:'サビ',bars:2}];
// v1/v2 migration is explicit, non-mutating, and preserves all musical fields.
for(const schemaVersion of [1,2]){
 const old=clone(base);old.schemaVersion=schemaVersion;old.appVersion='v0.2-dev';delete old.metadata.composition;
 const untouched=clone(old),migrated=migrateProject(old);
 assert.deepEqual(old,untouched);assert.equal(migrated.schemaVersion,3);assert.equal(migrated.appVersion,APP_VERSION);
 for(const key of ['basic','chords','tracks','structure','instruments','id','revision'])assert.deepEqual(migrated[key],old[key]);
 assert.equal(migrated.metadata.memo,old.metadata.memo);assert.deepEqual(migrated.metadata.composition,defaultDesign());validateProject(migrated);
}
// Every offered variation only changes its stated part. Preview never notifies saves.
for(const mode of ['last-two','rhythm','pitch','counter','chord','voicing','sound']){
 const source=clone(base),store=createProjectStore(source);let updates=0;store.subscribe(()=>updates++);
 const candidates=decisionCandidates(source,{mode,startBar:0,bars:1});assert.ok(candidates.length>=2);
 for(const c of candidates){
  const session=createDecisionComparison(source,c);const changed=withDecisionCandidate(source,c);validateProject(changed);
  for(const choice of ['A','B']){const preview=decisionPreview(session,store.getSnapshot(),choice);assert.equal(preview.lengthTick,BAR);preview.project.metadata.memo='仮のコピー';}
  assert.deepEqual(store.getSnapshot(),source);assert.equal(updates,0);
  if(c.kind==='melody'||c.kind==='counter'){
    assert.deepEqual(changed.chords,source.chords);assert.deepEqual(changed.instruments,source.instruments);
    assert.deepEqual(changed.tracks.filter(t=>t.role!==c.kind),source.tracks.filter(t=>t.role!==c.kind));
    const outside=p=>(p.tracks.find(t=>t.role===c.kind)?.notes??[]).filter(n=>n.startTick>=BAR);
    assert.deepEqual(outside(changed),outside(source));
  }else if(c.kind==='chord'){
    assert.deepEqual(changed.chords.slice(1),source.chords.slice(1));assert.deepEqual(changed.tracks,source.tracks);assert.deepEqual(changed.instruments,source.instruments);
  }else{assert.deepEqual(changed.chords,source.chords);assert.deepEqual(changed.tracks,source.tracks);}
 }
 assert.deepEqual(base,source);
}
const last=decisionCandidates(base,{mode:'last-two'})[0];
const changed=withDecisionCandidate(base,last).tracks[0].notes;
assert.deepEqual(changed.slice(0,2),base.tracks[0].notes.slice(0,2));
for(let i=0;i<4;i++){assert.equal(changed[i].startTick,base.tracks[0].notes[i].startTick);assert.equal(changed[i].durationTick,base.tracks[0].notes[i].durationTick);assert.equal(changed[i].velocity,base.tracks[0].notes[i].velocity);}
const rhythm=decisionCandidates(base,{mode:'rhythm'})[0];
for(let i=0;i<4;i++){assert.equal(rhythm.data[i].pitch,base.tracks[0].notes[i].pitch);assert.equal(rhythm.data[i].durationTick,base.tracks[0].notes[i].durationTick);}
// B and its reason are one atomic operation; Undo/Redo restores both.
const store=createProjectStore(base),session=createDecisionComparison(base,last);
store.adoptDecision(session,'歌いやすい終わりにしたかった');
assert.equal(store.getHistoryState().undoCount,1);assert.equal(designOf(store.getSnapshot()).decisions[0].reason,'歌いやすい終わりにしたかった');
const adopted=store.getSnapshot();store.undo();assert.deepEqual(store.getSnapshot().tracks,base.tracks);assert.deepEqual(designOf(store.getSnapshot()).decisions,[]);
assert.throws(()=>store.adoptDecision(session,'古い候補'));store.redo();assert.deepEqual(store.getSnapshot().tracks,adopted.tracks);assert.deepEqual(designOf(store.getSnapshot()).decisions,designOf(adopted).decisions);
const keepStore=createProjectStore(base);keepStore.keepDecision(session,'');assert.equal(keepStore.getSnapshot().revision,base.revision);
keepStore.keepDecision(session,'現在案の方がいい');assert.deepEqual(keepStore.getSnapshot().tracks,base.tracks);assert.equal(designOf(keepStore.getSnapshot()).decisions.length,1);
// Bass protection applies to one-chord and whole-progression candidates.
const bass=clone(base);bass.tracks.push({role:'bass',notes:[note('bass',36,0)]});
const chordStore=createProjectStore(bass);const chordCandidate=decisionCandidates(bass,{mode:'chord'})[0];
const blocked=createDecisionComparison(bass,chordCandidate);const before=chordStore.getSnapshot();
assert.throws(()=>chordStore.adoptDecision(blocked,'変更'),/Bass/);assert.deepEqual(chordStore.getSnapshot(),before);assert.equal(chordStore.getHistoryState().undoCount,0);
for(const choice of ['A','B'])assert.equal(decisionPreview(blocked,bass,choice).project.tracks.find(t=>t.role==='bass').notes.length,0);
const progression={kind:'chord',replaceAll:true,startBar:0,endBar:4,label:'進行B',data:base.chords.map(c=>({...c,root:5}))};
const progressionSession=createDecisionComparison(base,progression);const ps=createProjectStore(base);ps.adoptDecision(progressionSession,'サビに向かう');assert.deepEqual(ps.getSnapshot().tracks,base.tracks);assert.equal(ps.getSnapshot().chords[3].root,5);ps.undo();assert.deepEqual(ps.getSnapshot().chords,base.chords);
// Design and annotations survive export/import/copy; empty audio is not automatically undecided or decided.
const d=clone(defaultDesign());d.hook='繰り返すリズム';d.reference='反復と変化の考え方';d.axes.melody='会話的';d.axes.counter='応答';d.axes.sound='柔らかい';d.tags.counter=['コール＆レスポンス'];d.checks.counter='unnecessary';
const ds=createProjectStore(base);ds.updateDesign(d);ds.updateDecisionAnnotations({sections:[{id:'verse',purpose:'抑える'},{id:'chorus',purpose:'解放'}],chords:[{index:0,purposes:['緊張','浮遊']}]});
const designed=ds.getSnapshot();assert.equal(designed.chords[0].root,base.chords[0].root);assert.deepEqual(designed.tracks,base.tracks);assert.ok(!undecidedItems(designed).some(i=>i.id==='counter'));assert.ok(undecidedItems(designed).some(i=>i.id==='sound'));
assert.deepEqual(parseProjectJson(JSON.stringify(designed)),designed);assert.deepEqual(duplicateProjectRecord(designed).metadata.composition,designed.metadata.composition);
ds.resizeSection(1,3);assert.equal(ds.getSnapshot().structure.sections[1].purpose,'解放');ds.undo();assert.equal(ds.getSnapshot().structure.sections[0].purpose,'抑える');
assert.match(buildConsultText(designed),/繰り返すリズム/);assert.match(buildConsultText(designed),/コール＆レスポンス/);
const malformed=clone(designed);malformed.metadata.composition.tags.melody=['自動で100点'];assert.throws(()=>parseProjectJson(JSON.stringify(malformed)));
const invalidPurpose=clone(designed);invalidPurpose.structure.sections[0].purpose=3;assert.throws(()=>validateProject(invalidPurpose));
// Analysis works on counter notes and never mutates the Project.
const original=clone(designed);assert.equal(decisionAnalysis(designed,'counter').notes,1);assert.equal(decisionAnalysis(designed,'melody').steps,4);assert.deepEqual(designed,original);
// Voicing is the only addition that changes rendered chord MIDI pitches; tempo/PPQ stay fixed.
const upper=decisionCandidates(base,{mode:'voicing'}).find(c=>c.data.preset==='upper');
const voiced=withDecisionCandidate(base,upper);const a=parseMidi(buildMidiExports(base)['Chord.mid']),b=parseMidi(buildMidiExports(voiced)['Chord.mid']);
assert.equal(a.division,480);assert.equal(b.division,480);
const pitches=m=>m.tracks.flatMap(t=>t.notes).map(n=>n.pitch);
assert.deepEqual(pitches(b),pitches(a).map(p=>p+12));assert.deepEqual(voiced.chords,base.chords);
const sound=withDecisionCandidate(base,decisionCandidates(base,{mode:'sound'})[0]);assert.deepEqual(buildMidiExports(sound)['Draft.mid'],buildMidiExports(base)['Draft.mid']);
console.log('Decision support: migration, scope preservation, stale rejection, atomic reasons, Bass protection, annotations, analysis and MIDI passed');
