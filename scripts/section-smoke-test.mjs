import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import {
  SECTION_TEMPLATES, buildTemplateSections, createSection, getSections, sectionLabel,
  sectionRanges, sliceProject, totalSectionBars, validateStructure, barsHaveContent,
  MAX_SECTION_BARS, MAX_TOTAL_BARS, sectionProgress,
  sectionEnergy, sectionTransition, withSectionEnergy, withSectionTransition, energyHints, energyFlowText, ENERGY_LEVELS, TRANSITIONS
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
// --- sectionProgress
const pp = {
  basic: { ppq: 480 },
  chords: [chord(0), chord(1), chord(2)],
  tracks: [
    { role: "melody", notes: [note("m", 60, 0), note("m2", 62, BAR * 2)] },
    { role: "bass", notes: [note("b", 36, BAR)] },
    { role: "drums", notes: [] }
  ]
};
const prog = sectionProgress(pp, 0, 4);
assert.deepEqual(prog.chord, { filled: 3, total: 4 });
assert.deepEqual(prog.melody, { filled: 2, total: 4 });
assert.deepEqual(prog.bass, { filled: 1, total: 4 });
assert.deepEqual(prog.drums, { filled: 0, total: 4 });
// --- Section Energy / Transition
{
  const tpl = buildTemplateSections("one-chorus");
  assert.deepEqual(tpl.map(sectionEnergy), ["low", "low", "mid", "high", "low"], "template defaults by kind");
  assert.equal(energyFlowText(tpl), "イントロ Low → Aメロ Low → Bメロ Mid → サビ High → アウトロ Low");
  assert.ok(tpl.every((s) => sectionTransition(s) === "keep"), "transition defaults to keep");
  // 古いProject（energyもtransitionも無い）でも種類ごとの初期値で扱える
  const legacy = [{ id: "a", kind: "chorus", name: "サビ", bars: 8 }];
  assert.equal(sectionEnergy(legacy[0]), "high");
  assert.doesNotThrow(() => validateStructure({ sections: legacy }));

  const changed = withSectionEnergy(tpl, 1, "high");
  assert.equal(changed[1].energy, "high");
  assert.equal(tpl[1].energy, "low", "input not mutated");
  assert.throws(() => withSectionEnergy(tpl, 1, "max"));
  assert.throws(() => withSectionEnergy(tpl, 99, "low"));
  const tr = withSectionTransition(tpl, 2, "build");
  assert.equal(sectionTransition(tr[2]), "build");
  assert.throws(() => withSectionTransition(tpl, 2, "nope"));

  // 検証: 不正な値は拒否、Section操作でも保持される
  assert.throws(() => validateStructure({ sections: [{ ...tpl[0], energy: "extreme" }] }));
  assert.throws(() => validateStructure({ sections: [{ ...tpl[0], transition: "jump" }] }));
  assert.doesNotThrow(() => validateStructure({ sections: tr }));

  // ヒント: サビが前より低い / Buildの次が低い / 全部同じ
  const lowChorus = withSectionEnergy(tpl, 3, "low");
  assert.ok(energyHints(lowChorus).some((h) => h.includes("サビ") && h.includes("低め")));
  const badBuild = withSectionTransition(withSectionEnergy(tpl, 3, "mid"), 2, "build");
  assert.ok(energyHints(badBuild).some((h) => h.includes("Build")));
  const flat = tpl.map((s) => ({ ...s, energy: "mid" }));
  assert.ok(energyHints(flat).some((h) => h.includes("同じ")));
  assert.deepEqual(energyHints(tpl), [], "no hints for a sensible design");

  // Storeに保存・Undo・Section小節数変更でも保持
  const s2 = createProjectStore(createDefaultProject());
  s2.applySectionTemplate("one-chorus");
  const sections0 = getSections(s2.getSnapshot());
  s2.setSections(withSectionEnergy(sections0, 1, "mid"));
  assert.equal(getSections(s2.getSnapshot())[1].energy, "mid");
  s2.resizeSection(1, 6);
  assert.equal(getSections(s2.getSnapshot())[1].energy, "mid", "energy survives resize");
  assert.equal(ENERGY_LEVELS.length, 3);
  assert.equal(TRANSITIONS.length, 5);
}
console.log("section smoke test passed");
