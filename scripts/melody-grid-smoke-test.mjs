import assert from "node:assert/strict";
import { toggleMonophonicStep, clearBar, copyMelodyBars, hasMelodyInBars, chordTonePitchClasses } from "../src/melody/melody-grid.js";

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

// Copy Bar: 次の小節へ複製（既存は上書き・idは新規）
const src = [
  { id: "s1", pitch: C4, startTick: 0, durationTick: 480, velocity: 96 },
  { id: "s2", pitch: E4, startTick: 1920 - 240, durationTick: 960, velocity: 90 },
  { id: "t1", pitch: G4, startTick: 1920 + 480, durationTick: 240, velocity: 96 }
];
const copied = copyMelodyBars(src, { sourceBarIndex: 0, targetBarIndex: 1, bars: 1, barTicks: 1920 });
const inBar2 = copied.filter((n) => n.startTick >= 1920 && n.startTick < 3840);
assert.deepEqual(inBar2.map((n) => [n.pitch, n.startTick]), [[C4, 1920], [E4, 3840 - 240]], "target is overwritten");
assert.ok(inBar2.every((n) => n.startTick + n.durationTick <= 3840), "durations clipped to target end");
assert.equal(new Set(copied.map((n) => n.id)).size, copied.length, "ids unique");
assert.equal(src.length, 3, "input not mutated");
assert.equal(hasMelodyInBars(src, { barIndex: 1, bars: 1, barTicks: 1920 }), true);
assert.equal(hasMelodyInBars(src, { barIndex: 3, bars: 1, barTicks: 1920 }), false);
const two = copyMelodyBars(src, { sourceBarIndex: 0, targetBarIndex: 2, bars: 2, barTicks: 1920 });
assert.ok(two.some((n) => n.startTick === 3840 && n.pitch === C4));
assert.ok(two.some((n) => n.startTick === 3840 + 1920 + 480 && n.pitch === G4));

// Chord Tone: C major = C,E,G / Am7 = A,C,E,G / コード無し = 空
assert.deepEqual([...chordTonePitchClasses({ root: 0, quality: "major" })].sort((a, b) => a - b), [0, 4, 7]);
assert.deepEqual([...chordTonePitchClasses({ root: 9, quality: "minor7" })].sort((a, b) => a - b), [0, 4, 7, 9]);
assert.equal(chordTonePitchClasses(undefined).size, 0);

console.log("Melody grid smoke test passed");
