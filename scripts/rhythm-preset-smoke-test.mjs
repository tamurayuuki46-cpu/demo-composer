import assert from "node:assert/strict";
import {
  applyDrumPreset,
  DRUM_PRESETS,
  getDrumPreset,
  hasEditableDrumsInBar,
  applyDrumPresetToBars,
  hasEditableDrumsInBars
} from "../src/rhythm/drum-presets.js";
import { DRUM_FILLS, applyDrumFill, applyDrumFillToSectionEnds } from "../src/rhythm/drum-fills.js";
import { DRUM_PITCH } from "../src/rhythm/rhythm-grid.js";

const stepTicks = 120;
const barTicks = 1920;

assert.equal(DRUM_PRESETS.length, 6, "six beginner-friendly drum presets should be available");
assert.equal(getDrumPreset("basic-8").label, "8ビート 基本");

const existing = [
  { id: "old-kick", pitch: DRUM_PITCH.kick, startTick: 240, durationTick: 120, velocity: 100 },
  { id: "future-open-hh", pitch: 46, startTick: 360, durationTick: 120, velocity: 90 },
  { id: "next-bar-kick", pitch: DRUM_PITCH.kick, startTick: 1920, durationTick: 120, velocity: 100 }
];

assert.equal(
  hasEditableDrumsInBar(existing, { barStartTick: 0, barDurationTick: barTicks }),
  true,
  "existing kick in current bar should trigger overwrite confirmation"
);

const basic = applyDrumPreset(existing, {
  presetId: "basic-8",
  barStartTick: 0,
  stepTicks
});

assert.ok(!basic.some((note) => note.id === "old-kick"), "editable drum notes in current bar should be replaced");
assert.ok(basic.some((note) => note.id === "future-open-hh"), "other drum pitches should be preserved");
assert.ok(basic.some((note) => note.id === "next-bar-kick"), "notes in another bar should be preserved");

const basicKickSteps = basic
  .filter((note) => note.pitch === DRUM_PITCH.kick && note.startTick < barTicks)
  .map((note) => note.startTick / stepTicks);
const basicSnareSteps = basic
  .filter((note) => note.pitch === DRUM_PITCH.snare && note.startTick < barTicks)
  .map((note) => note.startTick / stepTicks);
const basicHhSteps = basic
  .filter((note) => note.pitch === DRUM_PITCH.hh && note.startTick < barTicks)
  .map((note) => note.startTick / stepTicks);

assert.deepEqual(basicKickSteps, [0, 8]);
assert.deepEqual(basicSnareSteps, [4, 12]);
assert.deepEqual(basicHhSteps, [0, 2, 4, 6, 8, 10, 12, 14]);

for (const preset of DRUM_PRESETS) {
  const notes = applyDrumPreset([], {
    presetId: preset.id,
    barStartTick: barTicks,
    stepTicks
  });

  assert.ok(notes.length > 0, `${preset.id} should generate notes`);
  assert.ok(
    notes.every((note) => note.startTick >= barTicks && note.startTick < barTicks * 2),
    `${preset.id} notes should stay inside the target bar`
  );
  assert.ok(notes.every((note) => note.durationTick === stepTicks));
}

// Section全体への一括適用
const first = DRUM_PRESETS[0];
const multi = applyDrumPresetToBars([], { presetId: first.id, startBar: 1, endBar: 4, barTicks, stepTicks });
const perBar = applyDrumPreset([], { presetId: first.id, barStartTick: 0, stepTicks }).length;
assert.equal(multi.length, perBar * 3, "3 bars filled");
assert.ok(multi.every((n) => n.startTick >= barTicks && n.startTick < barTicks * 4));
assert.equal(hasEditableDrumsInBars(multi, { startBar: 1, endBar: 4, barTicks }), true);
assert.equal(hasEditableDrumsInBars(multi, { startBar: 0, endBar: 1, barTicks }), false);

// --- ドラムフィル
const base = applyDrumPreset([], { presetId: "basic-8", barStartTick: 0, stepTicks });
const firstHalf = (list) => list.filter((n) => n.startTick < stepTicks * 8).map((n) => [n.pitch, n.startTick]);
for (const fill of DRUM_FILLS) {
  const out = applyDrumFill(base, { fillId: fill.id, barStartTick: 0, stepTicks });
  assert.deepEqual(firstHalf(out), firstHalf(base), `${fill.id}: first half untouched`);
  const second = out.filter((n) => n.startTick >= stepTicks * 8);
  assert.ok(second.length > 0 && second.every((n) => n.startTick < barTicks), `${fill.id}: second half only inside the bar`);
  assert.ok(!second.some((n) => n.pitch === DRUM_PITCH.hh), `${fill.id}: no hi-hat in the fill`);
  assert.equal(new Set(out.map((n) => n.id)).size, out.length, "ids unique");
}
assert.equal(base.length, 12, "input not mutated");
// 他の小節は変えない
const twoBars = applyDrumPresetToBars([], { presetId: "basic-8", startBar: 0, endBar: 2, barTicks, stepTicks });
const filledBar2 = applyDrumFill(twoBars, { fillId: "break", barStartTick: barTicks, stepTicks });
assert.deepEqual(filledBar2.filter((n) => n.startTick < barTicks).map((n) => n.id), twoBars.filter((n) => n.startTick < barTicks).map((n) => n.id), "bar 1 identical");
// 空の小節には前半（Kick / Snare / HH）も足す
const onEmpty = applyDrumFill([], { fillId: "snare-8th", barStartTick: 0, stepTicks });
assert.ok(onEmpty.some((n) => n.pitch === DRUM_PITCH.kick && n.startTick === 0));
assert.ok(onEmpty.some((n) => n.pitch === DRUM_PITCH.snare && n.startTick === stepTicks * 4));
// 各Sectionの最後（最後のSectionを除く）
const ranges = [{ startBar: 0, endBar: 2 }, { startBar: 2, endBar: 4 }, { startBar: 4, endBar: 6 }];
const ends = applyDrumFillToSectionEnds([], { fillId: "snare-8th", ranges, barTicks, stepTicks });
const barsWithFill = [...new Set(ends.map((n) => Math.floor(n.startTick / barTicks)))];
assert.deepEqual(barsWithFill, [1, 3], "bars 2 and 4 only; last section left alone");

console.log("Rhythm preset smoke test passed.");
