import assert from "node:assert/strict";
import {
  applyDrumPreset,
  DRUM_PRESETS,
  getDrumPreset,
  hasEditableDrumsInBar
} from "../src/rhythm/drum-presets.js";
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

console.log("Rhythm preset smoke test passed.");
