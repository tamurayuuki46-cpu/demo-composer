import assert from "node:assert/strict";
import { createProjectStore } from "../src/core/project-state.js";
import { counterNotes } from "../src/core/counter-melody.js";
import { toggleMonophonicStep } from "../src/melody/melody-grid.js";

const store = createProjectStore();
const snap = () => store.getSnapshot();
const bar = 1920;
const write = (notes) => store.applyCounterMelody({ startBar: 0, endBar: 129, notes });

// 空から1音入れる → counter Trackができる
write(toggleMonophonicStep(counterNotes(snap()), { pitch: 72, startTick: 0, durationTick: 240, limitTick: bar, resize: false }));
assert.equal(counterNotes(snap()).length, 1);
// 別小節に追加しても、既存の音は残る
write(toggleMonophonicStep(counterNotes(snap()), { pitch: 74, startTick: bar, durationTick: 480, limitTick: bar * 2, resize: false }));
assert.equal(counterNotes(snap()).length, 2);
// 同じマスをもう一度タップすると削除
write(toggleMonophonicStep(counterNotes(snap()), { pitch: 72, startTick: 0, durationTick: 240, limitTick: bar, resize: false }));
assert.deepEqual(counterNotes(snap()).map((n) => n.pitch), [74]);
// メインのメロディTrackは変わらない
assert.equal((snap().tracks.find((t) => t.role === "melody")?.notes ?? []).length, 0);
// Undoは1手ずつ戻る
store.undo();
assert.equal(counterNotes(snap()).length, 2);
// 全部消すと音が空になる
write([]);
assert.equal(counterNotes(snap()).length, 0);
console.log("counter edit smoke test ok");
