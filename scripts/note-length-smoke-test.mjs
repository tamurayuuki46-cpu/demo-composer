import assert from "node:assert/strict";
import { LENGTH_STEPS, noteValueLabel, placeMonophonicNote } from "../src/core/note-placement.js";
import { toggleMonophonicStep } from "../src/melody/melody-grid.js";
import { copyRhythmBar, copyRhythmBeat, toggleBassStep } from "../src/rhythm/rhythm-grid.js";

const BAR = 1920, EIGHTH = 240, SIXTEENTH = 120, QUARTER = 480;
const C4 = 60, E4 = 64, G4 = 67;
const shape = (notes) => notes.map((n) => [n.pitch, n.startTick, n.durationTick]);

// ラベル
assert.deepEqual(LENGTH_STEPS, [1, 2, 3, 4, 6, 8]);
assert.equal(noteValueLabel(120), "16分");
assert.equal(noteValueLabel(360), "付点8分");
assert.equal(noteValueLabel(480), "4分");
assert.equal(noteValueLabel(720), "付点4分");
assert.equal(noteValueLabel(960), "2分");
assert.equal(noteValueLabel(1920), "全音符");

// 長い音を置ける
let notes = toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: QUARTER, limitTick: BAR, resize: true });
assert.deepEqual(shape(notes), [[C4, 0, 480]]);

// 小節の終わりを超えない
notes = toggleMonophonicStep([], { pitch: C4, startTick: BAR - EIGHTH, durationTick: QUARTER * 2, limitTick: BAR, resize: true });
assert.deepEqual(shape(notes), [[C4, BAR - EIGHTH, EIGHTH]], "clipped at bar end");

// 次の音を消さず、手前までに収める
notes = toggleMonophonicStep([], { pitch: E4, startTick: QUARTER, durationTick: EIGHTH, limitTick: BAR, resize: true });
notes = toggleMonophonicStep(notes, { pitch: C4, startTick: 0, durationTick: QUARTER * 2, limitTick: BAR, resize: true });
assert.deepEqual(shape(notes), [[C4, 0, 480], [E4, 480, 240]], "stops before the next note");

// 長い音の途中に別の音を置くと、前の音が短くなる
notes = toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: QUARTER * 2, limitTick: BAR, resize: true });
notes = toggleMonophonicStep(notes, { pitch: G4, startTick: QUARTER, durationTick: EIGHTH, limitTick: BAR, resize: true });
assert.deepEqual(shape(notes), [[C4, 0, 480], [G4, 480, 240]], "previous long note is trimmed");

// resize=true: 長さ違いの同じ音は長さ変更、同じ長さは削除
let long = toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: QUARTER, limitTick: BAR, resize: true });
const id = long[0].id;
long = toggleMonophonicStep(long, { pitch: C4, startTick: 0, durationTick: EIGHTH, limitTick: BAR, resize: true });
assert.deepEqual(shape(long), [[C4, 0, 240]], "length changed, not deleted");
assert.equal(long[0].id, id, "note identity kept on resize");
long = toggleMonophonicStep(long, { pitch: C4, startTick: 0, durationTick: EIGHTH, limitTick: BAR, resize: true });
assert.equal(long.length, 0, "same length deletes");

// resize=false(1マス): 従来どおり、同じ音をタップすると長さにかかわらず削除
let single = toggleMonophonicStep([], { pitch: C4, startTick: 0, durationTick: QUARTER, limitTick: BAR, resize: true });
single = toggleMonophonicStep(single, { pitch: C4, startTick: 0, durationTick: SIXTEENTH, limitTick: BAR, resize: false });
assert.equal(single.length, 0, "1-step tap still deletes");

// 次の音に収めた長さと同じ長さを選んで再タップしても削除できる
let clipped = toggleMonophonicStep([{ id: "n", pitch: E4, startTick: QUARTER, durationTick: EIGHTH, velocity: 96 }],
  { pitch: C4, startTick: 0, durationTick: QUARTER * 2, limitTick: BAR, resize: true });
clipped = toggleMonophonicStep(clipped, { pitch: C4, startTick: 0, durationTick: QUARTER * 2, limitTick: BAR, resize: true });
assert.deepEqual(shape(clipped), [[E4, 480, 240]], "tapping again with the same selected length removes the clipped note");

// Bassも同じ規則
let bass = toggleBassStep([], { pitch: 36, startTick: 0, durationTick: SIXTEENTH * 8, limitTick: BAR, resize: true });
bass = toggleBassStep(bass, { pitch: 43, startTick: SIXTEENTH * 4, durationTick: SIXTEENTH, limitTick: BAR, resize: true });
assert.deepEqual(shape(bass), [[36, 0, 480], [43, 480, 120]], "bass overlap trims previous note");

// Copy: 長いBassは、コピー先の範囲の外へはみ出さない / コピー先に食い込む前の音は短くなる
const longBass = [
  { id: "x", pitch: 36, startTick: BAR - QUARTER, durationTick: QUARTER, velocity: 96 },   // 小節末の4分
  { id: "y", pitch: 36, startTick: 0, durationTick: BAR - QUARTER * 2, velocity: 96 }
];
const copiedBeat = copyRhythmBeat(longBass, { sourceBeatStartTick: BAR - QUARTER, targetBeatStartTick: BAR, beatDurationTick: QUARTER });
assert.ok(copiedBeat.filter((n) => n.startTick >= BAR).every((n) => n.startTick + n.durationTick <= BAR + QUARTER), "copied note stays in target beat");

const wide = [{ id: "w", pitch: 36, startTick: 0, durationTick: QUARTER * 3, velocity: 96 }];
const copiedWide = copyRhythmBeat(wide, { sourceBeatStartTick: 0, targetBeatStartTick: QUARTER, beatDurationTick: QUARTER });
const trimmedSource = copiedWide.find((n) => n.startTick === 0);
assert.equal(trimmedSource.durationTick, QUARTER, "source note trimmed to the target start");
assert.equal(copiedWide.find((n) => n.startTick === QUARTER).durationTick, QUARTER, "copy clipped to the beat");

const barCopy = copyRhythmBar([{ id: "b", pitch: 36, startTick: 0, durationTick: BAR, velocity: 96 }],
  { sourceBarStartTick: 0, targetBarStartTick: BAR, barDurationTick: BAR });
assert.deepEqual(shape(barCopy), [[36, 0, BAR], [36, BAR, BAR]], "whole-bar note copies intact");
console.log("note length smoke test passed");
