import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { loopGuide, suggestedCopyKind } from "../src/core/loop-guide.js";

const BAR = 1920;
const chord = (bar) => ({ startTick: bar * BAR, durationTick: BAR, root: 0, quality: "major", degree: "I" });
const store = createProjectStore(createDefaultProject());
const phase = () => loopGuide(store.getSnapshot()).phase;

// 1. 構成なし
assert.equal(phase(), "start");
assert.deepEqual(loopGuide(store.getSnapshot()).steps.map((s) => s.status), ["now", "todo", "todo"]);

// 2. 8小節ループを作っただけ（中身なし）
store.applySectionTemplate("loop-8");
assert.equal(phase(), "build");

// コードだけ全小節 → まだメロ/ベース/ドラムが無いので build
store.updateChords(Array.from({ length: 8 }, (_, i) => chord(i)));
assert.equal(phase(), "build");

// メロディを入れる → grow
store.updateMelodyNotes([{ id: "m1", pitch: 60, startTick: 0, durationTick: 480, velocity: 90 }]);
assert.equal(phase(), "grow");
assert.deepEqual(loopGuide(store.getSnapshot()).steps.map((s) => s.status), ["done", "now", "todo"]);

// 3. 複製して追加（1回の編集でUndo1回）
const before = store.getHistoryState?.();
store.appendSectionCopy(0, "chorus");
const copied = store.getSnapshot();
assert.equal(copied.structure.sections.length, 2);
assert.equal(copied.structure.sections[1].kind, "chorus");
assert.equal(copied.structure.sections[1].bars, 8);
assert.equal(copied.chords.length, 16);
assert.equal(copied.tracks.find((t) => t.role === "melody").notes.length, 2);
assert.equal(phase(), "vary");
assert.deepEqual(loopGuide(copied).identical, [1]);

// 4. 違いが出れば done
store.updateMelodyNotes([
  ...copied.tracks.find((t) => t.role === "melody").notes,
  { id: "m3", pitch: 72, startTick: BAR * 9, durationTick: 240, velocity: 90 }
]);
assert.equal(phase(), "done");

// Undoで1回ずつ戻る（メロ追加 → 複製）
store.undo();
assert.equal(phase(), "vary");
store.undo();
assert.equal(store.getSnapshot().structure.sections.length, 1);
assert.equal(store.getSnapshot().chords.length, 8);

// コードに空きがあると複製できない（既存のcopySectionのルール）
const gap = createProjectStore(createDefaultProject());
gap.applySectionTemplate("loop-8");
gap.updateChords([chord(0)]);
gap.updateMelodyNotes([{ id: "m", pitch: 60, startTick: 0, durationTick: 480, velocity: 90 }]);
assert.equal(loopGuide(gap.getSnapshot()).phase, "build");

assert.equal(suggestedCopyKind(1), "chorus");
assert.equal(suggestedCopyKind(2), "prechorus");
assert.equal(suggestedCopyKind(3), "verse");

console.log("loop-guide smoke test passed");
