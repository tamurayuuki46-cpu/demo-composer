import assert from 'node:assert/strict';
import { normalizeSourceProject, buildThreeCandidates, updateCandidateSection, createArrangerProject } from '../src/core.js';
import { fixture } from './music-lab-fixture.mjs';
import { createBaselineCandidate, changedPartsForRange, findPrechorusToChorusRange, ensureDecisionJournal, recordDecision, restoreDecisionSnapshot, createStoreZip, createDawHandoffBundle } from '../src/v05-workflow.js';
import { createSongMidi } from '../src/v05-tools.js';

const source = normalizeSourceProject(fixture());
const candidates = buildThreeCandidates(source, 'jpop-band');
let candidate = updateCandidateSection(candidates[1], 's1', { density: 'full', enabled: { counter: false } });

const baseline = createBaselineCandidate(source, candidate);
assert.equal(baseline.sections.length, source.sections.length);
assert.ok(createSongMidi(source, baseline)?.length > 20);

const changed = changedPartsForRange(source, candidate, source.sections[1].startTick, source.sections[1].endTick);
assert.ok(changed.includes('counter'));
assert.ok(changed.includes('harmony'));

const range = findPrechorusToChorusRange(source);
assert.ok(range);
assert.equal(range.chorusSectionId, 's2');
assert.equal(range.startSectionId, 's1');

let plan = createArrangerProject(source, candidate);
let journal = ensureDecisionJournal(plan, candidate);
assert.equal(journal.entries.length, 0);
assert.equal(journal.originals.s1.density, 'full');
plan.decisionJournal = journal;
plan = recordDecision(plan, candidate, { sectionId: 's1', status: 'hold', reason: 'サビ前の密度を確認', now: '2026-10-13T01:00:00.000Z' });
assert.equal(plan.decisionJournal.entries.at(-1).statusLabel, '保留');
assert.equal(plan.decisionJournal.entries.at(-1).snapshot.sectionId, 's1');
const entryId = plan.decisionJournal.entries.at(-1).id;

plan.arrangement.sections.find((section) => section.sectionId === 's1').density = 'thin';
plan = restoreDecisionSnapshot(plan, { sectionId: 's1', entryId, now: '2026-10-13T01:01:00.000Z' });
assert.equal(plan.arrangement.sections.find((section) => section.sectionId === 's1').density, 'full');
assert.equal(plan.decisionJournal.entries.at(-1).status, 'restored');

plan.arrangement.sections.find((section) => section.sectionId === 's1').density = 'thin';
plan = restoreDecisionSnapshot(plan, { sectionId: 's1', original: true, now: '2026-10-13T01:02:00.000Z' });
assert.equal(plan.arrangement.sections.find((section) => section.sectionId === 's1').density, 'full');

const zip = createStoreZip({ 'hello.txt': 'hello', 'folder/test.json': '{"ok":true}' });
assert.equal(Buffer.from(zip.subarray(0, 4)).toString('hex'), '504b0304');
const zipText = Buffer.from(zip).toString('latin1');
assert.ok(zipText.includes('hello.txt'));
assert.ok(zipText.includes('folder/test.json'));

const bundle = createDawHandoffBundle(source, candidate, plan);
assert.equal(Buffer.from(bundle.subarray(0, 4)).toString('hex'), '504b0304');
const bundleText = Buffer.from(bundle).toString('latin1');
for (const name of ['Before_Source_Song.mid', 'After_Arrangement_Song.mid', 'Arrangement_Plan.json', 'TRACK_INSTRUCTIONS.md', 'SECTION_INSTRUCTIONS.md', 'DAW_CHECKLIST.md', 'DECISIONS.json', 'COMPARE_MANIFEST.json']) assert.ok(bundleText.includes(name), name);

// Regression: a 1-chorus song produces plan JSON larger than ~120KB. Spreading that into
// Array.push() threw "Maximum call stack size exceeded" and the DAW ZIP could not be exported.
const largeText = 'x'.repeat(512 * 1024);
const largeZip = createStoreZip({ '02_plan/Arrangement_Plan.json': largeText, '01_compare/After_Arrangement_Song.mid': new Uint8Array([77, 84, 104, 100]) });
const largeView = new DataView(largeZip.buffer, largeZip.byteOffset, largeZip.byteLength);
assert.equal(largeView.getUint32(0, true), 0x04034b50, 'local header signature');
assert.equal(largeView.getUint32(18, true), largeText.length, 'compressed size of the large entry');
const eocd = largeZip.byteLength - 22;
assert.equal(largeView.getUint32(eocd, true), 0x06054b50, 'end of central directory');
assert.equal(largeView.getUint16(eocd + 10, true), 2, 'both entries listed');
const firstName = '02_plan/Arrangement_Plan.json';
assert.equal(Buffer.from(largeZip.subarray(30 + firstName.length, 30 + firstName.length + 8)).toString('latin1'), 'xxxxxxxx', 'large entry payload kept intact');

console.log('PASS v0.5 workflow: comparison ranges/changed parts, decision history/restore, DAW ZIP bundle');
