import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import {
  bassChoicesForBar, bassPitchForBar, bassShortLabel, copyRhythmBar, copyRhythmBeat, toggleBassStep
} from "../src/rhythm/rhythm-grid.js";

const BAR = 1920, STEP = 120;
const project = createDefaultProject();
project.chords = [
  { startTick: 0, durationTick: BAR, root: 0, quality: "major", degree: "I" },
  { startTick: BAR, durationTick: BAR, root: 9, quality: "minor7", degree: "vi" },
  { startTick: BAR * 2, durationTick: BAR, root: 7, quality: "sus4", degree: "V" }
];

// 選べる音程はコードの構成音に従う
const semis = (bar) => bassChoicesForBar(project, bar).map((c) => c.semitones);
assert.deepEqual(semis(0), [0, 4, 7, 12, -12], "major: root, 3rd, 5th, oct up, root down");
assert.deepEqual(semis(1), [0, 3, 7, 10, 12, -12], "m7 has minor 3rd and 7th");
assert.deepEqual(bassChoicesForBar(project, 2).map((c) => c.label).slice(0, 3), ["ルート", "4度", "5度"], "sus4 names");
assert.equal(bassChoicesForBar(project, 9).length, 5, "bars without chords fall back to a major shape");

// 同じステップは別の音程へ置き換わり、同じ音程をもう一度タップすると消える
const root = bassPitchForBar(project, 0);
let notes = toggleBassStep([], { pitch: root, startTick: 0, durationTick: STEP });
notes = toggleBassStep(notes, { pitch: root + 7, startTick: 0, durationTick: STEP });
assert.deepEqual(notes.map((n) => n.pitch), [root + 7]);
notes = toggleBassStep(notes, { pitch: root + 7, startTick: 0, durationTick: STEP });
assert.equal(notes.length, 0);

// 短い表示
assert.equal(bassShortLabel(project, 0, root), "R");
assert.equal(bassShortLabel(project, 0, root + 7), "5");
assert.equal(bassShortLabel(project, 0, root + 12), "8");
assert.equal(bassShortLabel(project, 0, root + 1), "•");

// Copy: 音程関係(ルート/5度)を保ったまま、コピー先のルートへ追従
const pattern = [
  { id: "a", pitch: root, startTick: 0, durationTick: STEP, velocity: 96 },
  { id: "b", pitch: root + 7, startTick: STEP * 4, durationTick: STEP, velocity: 96 },
  { id: "c", pitch: root + 12, startTick: STEP * 8, durationTick: STEP, velocity: 96 }
];
const shift = bassPitchForBar(project, 1) - bassPitchForBar(project, 0);
const copied = copyRhythmBar(pattern, { sourceBarStartTick: 0, targetBarStartTick: BAR, barDurationTick: BAR, pitchShift: shift });
const target = copied.filter((n) => n.startTick >= BAR);
const targetRoot = bassPitchForBar(project, 1);
assert.deepEqual(target.map((n) => n.pitch - targetRoot), [0, 7, 12], "intervals survive bar copy");
const beat = copyRhythmBeat(pattern, { sourceBeatStartTick: 0, targetBeatStartTick: 480, beatDurationTick: 480, pitchShift: 0 });
assert.equal(beat.find((n) => n.startTick === 480)?.pitch, root, "beat copy keeps pitch without shift");

// 後方互換: pitch指定は従来どおり全ノートをその音程にそろえる
const forced = copyRhythmBar(pattern, { sourceBarStartTick: 0, targetBarStartTick: BAR, barDurationTick: BAR, pitch: 41 });
assert.ok(forced.filter((n) => n.startTick >= BAR).every((n) => n.pitch === 41));
console.log("bass pitch smoke test passed");
