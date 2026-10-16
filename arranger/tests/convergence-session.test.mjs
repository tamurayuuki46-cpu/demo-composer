import assert from 'node:assert/strict';
import { ConvergenceSession } from '../src/convergence-session.js';
import { initializeConvergence, ARRANGER_PLAN_STORAGE_KEY, ARRANGER_JOURNAL_STORAGE_KEY } from '../src/convergence-integration.js';
import { normalizeSourceProject, buildThreeCandidates, updateCandidateSection, createArrangerProject } from '../src/core.js';
import { createSongMidi } from '../src/v05-tools.js';
import { createDawHandoffBundle } from '../src/v05-workflow.js';
import * as cv from '../convergence/index.js';
class MemoryStorage {
  map = new Map(); failKey = null; writes = [];
  get length() { return this.map.size; } key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.get(k) ?? null; }
  setItem(k,v) { this.writes.push(k); if (this.failKey === '*' || this.failKey === k) throw Error('quota'); this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
const raw = (revision = 1, id = 'session-song') => ({ schemaVersion: 3, id, revision, metadata: { title: 'Session test' }, basic: { bpm: 120, ppq: 480, key: 'C', scale: 'major', timeSignature: '4/4' }, structure: { sections: [{ id: 's1', kind: 'verse', name: 'A', bars: 1 }, { id: 's2', kind: 'chorus', name: 'サビ', bars: 1 }] }, chords: [{ root: 0, quality: 'major', startTick: 0, durationTick: 3840 }], tracks: ['melody', 'drums', 'counter'].map((role, i) => ({ role, midiChannel: role === 'drums' ? 10 : i + 2, notes: [0, 1920].map(startTick => ({ pitch: role === 'drums' ? 36 : 64 + i, startTick, durationTick: 480, velocity: 100 })) })) });
function open(storage = new MemoryStorage(), input = raw()) {
  const source = normalizeSourceProject(input), model = { source, candidates: buildThreeCandidates(source), selectedIndex: 1, arrangerProject: null };
  const session = new ConvergenceSession(model, storage); session.initialize(); return session;
}
const session = open(), model = session.model, storage = session.storage;
assert.equal(session.validationReady, true);
session.validationReady = false; assert.equal(session.save().ok, false); assert.equal(storage.writes.length, 0); session.validationReady = true;
session.decide('global','adopted');
const originalPlan = session.makePlan();
const before = session.selected, after = updateCandidateSection(before,'s2',{ enabled: { drums: false } });
session.applyCandidateEdit(before,after); assert.ok(cv.dirtyKeys(session.tracker).includes('global:s2'));
const pendingTracker = session.tracker, priorState = session.state;
storage.failKey = ARRANGER_JOURNAL_STORAGE_KEY;
assert.equal(session.save().ok,false); assert.equal(session.tracker,pendingTracker); assert.equal(session.state,priorState);
storage.failKey = null;
// current() is the implicit save used by comparison/Export; it must apply dirty.
const current = session.current(); assert.equal(cv.dirtyKeys(session.tracker).length,0); assert.equal(cv.listRecoveries(session.state,Date.now()).length,0);
assert.deepEqual(createSongMidi(current.source,current.candidate), createSongMidi(current.source,current.plan.arrangement));
assert.equal(current.plan.selectedCandidateId,current.candidate.id); assert.equal(current.unresolved.length,0);
// Non-sounding note edit and unadopted candidate edits stay clean.
session.applyCandidateEdit(session.selected, updateCandidateSection(session.selected,'s1',{decisionNote:'memo'})); assert.equal(cv.dirtyKeys(session.tracker).length,0);
const unadopted = model.candidates[0]; session.applyCandidateEdit(unadopted,updateCandidateSection(unadopted,'s1',{enabled:{drums:false}})); assert.equal(cv.dirtyKeys(session.tracker).length,0);
assert.throws(()=>session.applyCandidateEdit(session.selected,{...session.selected,id:'new'}));
// Direct changes are external, not normal Lab edits.
model.candidates[model.selectedIndex]=updateCandidateSection(session.selected,'s1',{ enabled: { counter:false } });
session.current(); assert.ok(cv.listRecoveries(session.state,Date.now()).some(r=>r.key==='global:s1'));
session.recover('global:s1'); assert.equal(cv.listRecoveries(session.state,Date.now()).length,0);
const adoptedId = cv.getAdopted(session.state,'global').candidateId, planId=model.arrangerProject.id;
// revision-only rebase preserves all decisions and the plan id, including dirty edits.
session.applyCandidateEdit(session.selected,updateCandidateSection(session.selected,'s1',{enabled:{drums:false}}));
session.rebase(normalizeSourceProject(raw(2)));
assert.equal(model.arrangerProject.id,planId); assert.equal(cv.getAdopted(session.state,'global').candidateId,adoptedId); assert.equal(session.current().unresolved.length,0);
assert.equal(model.arrangerProject.source.revision,2); assert.equal(model.arrangerProject.sourceSnapshot.revision,2);
session.applySnapshot(originalPlan); assert.equal(model.source.sourceRevision,2); assert.equal(model.arrangerProject.sourceSnapshot.revision,2); assert.equal(model.arrangerProject.id,planId);
// Pool/edited adopted candidates and journal survive reload, without crossing projects.
const saved=JSON.parse(storage.getItem(ARRANGER_PLAN_STORAGE_KEY)), poolSource=normalizeSourceProject(saved.sourceSnapshot);
const restoredModel={ source:poolSource,candidates:[saved.arrangement],selectedIndex:0,arrangerProject:saved };
const reload=new ConvergenceSession(restoredModel,storage); reload.initialize({restorePool:true});
assert.equal(reload.model.candidates.length,3); assert.equal(cv.getAdopted(reload.state,'global').candidateId,adoptedId); assert.equal(reload.current().unresolved.length,0);
const other=open(storage,raw(1,'other-song')); assert.equal(cv.getAdopted(other.state,'global'),null); assert.equal(other.model.arrangerProject.decisionJournal.entries.length,0);
// Loss or corruption of auxiliary data warns after convergence journal is imported.
storage.removeItem(cv.stateKey(reload.state)); reload.initialize(); assert.equal(reload.warning,'収束判断が見つかりません');
storage.setItem(cv.stateKey(reload.state),'broken'); reload.initialize(); assert.equal(reload.warning,'収束判断が見つかりません');
// Valid storage envelope but invalid slot triggers verify exception; gate still opens.
const malformed=cv.createEmptyState({projectId:model.source.sourceProjectId,planId,planFingerprint:cv.planStructureFingerprint(model.source)}); malformed.slots.global=null;
cv.saveState(storage,malformed); const boot=initializeConvergence({storage,source:model.source,candidates:model.candidates,plan:model.arrangerProject});
assert.equal(boot.validationReady,true); assert.equal(boot.diagnosis,'validation-error'); assert.ok(boot.warning);
// Export works even with every storage write blocked.
const failing=open(); failing.decide('global','adopted'); failing.storage.failKey='*'; assert.ok(createSongMidi(failing.current().source,failing.current().candidate));
// Carry-over reaches actual ZIP bytes, while Plan remains schema 4.
const carry=open(); carry.carry('section:s1'); carry.carry('section:s2');
const handoff=carry.current(); assert.equal(handoff.unresolved.length,0); assert.equal(handoff.plan.arrangerSchemaVersion,4);
const zip=createDawHandoffBundle(handoff.source,handoff.candidate,handoff.plan,{carryOver:handoff.carryOver});
const decoded=new TextDecoder().decode(zip); assert.ok(decoded.includes('## DAWで決める\n- A / section\n- サビ / section'));
// Structure changes are backed up per contract; returning structure offers recovery.
const structural=open(); structural.decide('global','adopted'); const expanded=raw(2); expanded.structure.sections.push({id:'s3',kind:'outro',name:'Outro',bars:1});
structural.rebase(normalizeSourceProject(expanded)); assert.match(structural.warning,/追加 1 \/ 削除 0/); assert.equal(cv.getAdopted(structural.state,'global'),null);
structural.rebase(normalizeSourceProject(raw(3))); assert.ok(structural.structureOffer); structural.recover('structure'); assert.equal(structural.current().unresolved.length,0);
console.log('PASS convergence session: edit/implicit save/rollback/rebase/snapshot/reload/project isolation/warnings/verify gate/Export/ZIP/structure recovery');
