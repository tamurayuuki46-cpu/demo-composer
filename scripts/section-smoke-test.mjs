import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import {
  SECTION_TEMPLATES, buildTemplateSections, createSection, getSections, sectionLabel,
  sectionRanges, sliceProject, totalSectionBars, validateStructure, barsHaveContent,
  MAX_SECTION_BARS, MAX_TOTAL_BARS
} from "../src/core/section-ops.js";

const BAR = 1920;
const chord = (i, root = 0) => ({ startTick: i * BAR, durationTick: BAR, root, quality: "major", degree: "I" });
const note = (id, pitch, startTick, durationTick = 240) => ({ id, pitch, startTick, durationTick, velocity: 96 });
const notesOf = (p, role) => p.tracks.find((t) => t.role === role)?.notes ?? [];

// --- validate
assert.ok(validateStructure(undefined));
assert.ok(validateStructure({ sections: [] }));
assert.throws(() => validateStructure({ sections: "x" }));
assert.throws(() => validateStructure({ sections: [{ id: "a", kind: "nope", name: "x", bars: 4 }] }));
assert.throws(() => validateStructure({ sections: [{ id: "a", kind: "verse", name: "", bars: 4 }] }));
assert.throws(() => validateStructure({ sections: [{ id: "a", kind: "verse", name: "A", bars: 0 }] }));
assert.throws(() => validateStructure({ sections: [{ id: "a", kind: "verse", name: "A", bars: MAX_SECTION_BARS + 1 }] }));
assert.throws(() => validateStructure({ sections: [
  { id: "a", kind: "verse", name: "A", bars: 4 }, { id: "a", kind: "verse", name: "B", bars: 4 }] }), "duplicate id");
assert.throws(() => validateStructure({ sections: Array.from({ length: 5 }, (_, i) => (
  { id: `s${i}`, kind: "verse", name: `A${i}`, bars: MAX_SECTION_BARS }
)) }), "total bars");
assert.ok(MAX_TOTAL_BARS >= 128);

// --- templates
for (const template of SECTION_TEMPLATES) {
  const sections = buildTemplateSections(template.id);
  assert.ok(sections.length > 0);
  assert.ok(validateStructure({ sections }));
  assert.equal(new Set(sections.map((s) => s.id)).size, sections.length);
}
const oneChorus = buildTemplateSections("one-chorus");
assert.equal(totalSectionBars(oneChorus), 32);
assert.throws(() => buildTemplateSections("missing"));
const two = buildTemplateSections("full-song").filter((s) => s.kind === "chorus");
assert.deepEqual(two.map((s) => s.name), ["サビ", "サビ2"], "duplicate names get a number");

// --- store integration
const store = createProjectStore(createDefaultProject());
store.applySectionTemplate("one-chorus");
let p = store.getSnapshot();
assert.equal(getSections(p).length, 5);
validateProject(p);
store.undo();
assert.equal(getSections(store.getSnapshot()).length, 0, "template undoable");
store.redo();

// content: 32 bars of chords (0..31), melody at bar 3, bass at bar 20
store.updateChords(Array.from({ length: 32 }, (_, i) => chord(i)));
store.updateMelodyNotes([note("m1", 60, 3 * BAR), note("m2", 64, 20 * BAR)]);
p = store.getSnapshot();
assert.equal(sectionLabel(p, 0), "イントロ 1/4小節");
assert.equal(sectionLabel(p, 4), "Aメロ 1/8小節");
assert.equal(sectionLabel(p, 99), "");
assert.ok(barsHaveContent(p, 0, 4));
assert.ok(!barsHaveContent(createDefaultProject(), 0, 4));

// grow rejected while chords exist after the section end
assert.throws(() => store.resizeSection(0, 6), /コード/);
assert.equal(getSections(store.getSnapshot())[0].bars, 4, "failed op leaves state");

// shrink intro 4 -> 2: removes bars 2-3, shifts everything up by 2 bars
store.resizeSection(0, 2);
p = store.getSnapshot();
assert.equal(getSections(p)[0].bars, 2);
assert.equal(p.chords.length, 30);
p.chords.forEach((c, i) => assert.equal(c.startTick, i * BAR, "chords stay contiguous"));
assert.deepEqual(notesOf(p, "melody").map((n) => n.startTick), [18 * BAR], "melody in removed bars dropped / shifted");

// grow works at the tail (no chords after the section)
store.removeSection(4); // outro (last)
p = store.getSnapshot();
assert.equal(getSections(p).length, 4);
store.undo();
assert.equal(getSections(store.getSnapshot()).length, 5, "remove undoable");

// copy: verse(1) -> prechorus(2) (both 8 bars)
const before = store.getSnapshot();
store.copySection(1, 2);
p = store.getSnapshot();
assert.equal(p.chords.length, before.chords.length);
const verseRange = sectionRanges(getSections(p))[1];
const preRange = sectionRanges(getSections(p))[2];
const offset = (preRange.startBar - verseRange.startBar) * BAR;
const srcMel = notesOf(p, "melody").filter((n) => n.startTick >= verseRange.startBar * BAR && n.startTick < verseRange.endBar * BAR);
const dstMel = notesOf(p, "melody").filter((n) => n.startTick >= preRange.startBar * BAR && n.startTick < preRange.endBar * BAR);
assert.equal(dstMel.length, srcMel.length, "melody copied");
assert.deepEqual(dstMel.map((n) => n.startTick), srcMel.map((n) => n.startTick + offset));
assert.equal(new Set(notesOf(p, "melody").map((n) => n.id)).size, notesOf(p, "melody").length, "unique note ids");
assert.throws(() => store.copySection(1, 1));
assert.throws(() => store.copySection(1, 9));

// copy into a gap is rejected
const gap = createProjectStore(createDefaultProject());
gap.applySectionTemplate("one-chorus");
gap.updateChords([chord(0)]);
assert.throws(() => gap.copySection(0, 3), /空き/);

// --- sliceProject
p = store.getSnapshot();
const range = sectionRanges(getSections(p))[1];
const slice = sliceProject(p, range.startBar * BAR, range.endBar * BAR);
assert.equal(slice.chords.length, 8);
assert.equal(slice.chords[0].startTick, 0);
assert.ok(notesOf(slice, "melody").every((n) => n.startTick >= 0 && n.startTick + n.durationTick <= 8 * BAR));
assert.equal(store.getSnapshot().chords.length, p.chords.length, "slice does not mutate");

// --- createSection / history coexist
assert.equal(createSection("verse", undefined, []).bars, 8);
assert.throws(() => store.setSections([{ id: "x", kind: "bad", name: "x", bars: 1 }]));
console.log("section smoke test passed");
