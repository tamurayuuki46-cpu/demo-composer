import assert from "node:assert/strict";
import { toggleMonophonicStep, clearBar } from "../src/melody/melody-grid.js";

const EIGHTH = 240;
const SIXTEENTH = 120;
const C4 = 60;
const E4 = 64;
const G4 = 67;

// 8分だけの従来動作は変わらない
let notes = toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: EIGHTH });
notes = toggleMonophonicStep(notes, { pitch: E4, startTick: EIGHTH, durationTick: EIGHTH });
assert.deepEqual(notes.map((n) => [n.pitch, n.startTick, n.durationTick]), [[C4, 0, 240], [E4, 240, 240]]);

// 同じマスを同じ音で再Tapすると削除
const removed = toggleMonophonicStep(notes, { pitch: C4, startTick: 0, durationTick: EIGHTH });
assert.deepEqual(removed.map((n) => n.startTick), [240]);

// 同じマスの別の音は置換
const replaced = toggleMonophonicStep(notes, { pitch: G4, startTick: 0, durationTick: EIGHTH });
assert.equal(replaced.length, 2);
assert.equal(replaced[0].pitch, G4);

// 8分Noteの後半に16分を置くと、前のNoteが短くなる
const split = toggleMonophonicStep(
  toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: EIGHTH }),
  { pitch: E4, startTick: SIXTEENTH, durationTick: SIXTEENTH }
);
assert.deepEqual(split.map((n) => [n.pitch, n.startTick, n.durationTick]), [[C4, 0, 120], [E4, 120, 120]]);

// 次のNoteが近い位置にあれば、新しい8分Noteは短くなる（重ならない）
const near = toggleMonophonicStep(
  toggleMonophonicStep([], { pitch: E4, startTick: SIXTEENTH, durationTick: SIXTEENTH }),
  { pitch: C4, startTick: 0, durationTick: EIGHTH }
);
assert.deepEqual(near.map((n) => [n.pitch, n.startTick, n.durationTick]), [[C4, 0, 120], [E4, 120, 120]]);

// どの組み合わせでも重ならない
for (let i = 1; i < split.length; i += 1) {
  assert.ok(split[i - 1].startTick + split[i - 1].durationTick <= split[i].startTick, "notes must not overlap");
}

// 元の配列は変更しない
const original = [{ id: "a", pitch: C4, startTick: 0, durationTick: EIGHTH, velocity: 96 }];
toggleMonophonicStep(original, { pitch: E4, startTick: SIXTEENTH, durationTick: SIXTEENTH });
assert.equal(original[0].durationTick, EIGHTH, "input must not be mutated");

// Clear Barは16分位置のNoteも消す
const cleared = clearBar(split, { barStartTick: 0, barDurationTick: 1920 });
assert.equal(cleared.length, 0);

console.log("Melody grid smoke test passed");
