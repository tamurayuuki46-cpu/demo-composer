import assert from "node:assert/strict";
import { copyRhythmBar, copyRhythmBeat } from "../src/rhythm/rhythm-grid.js";

const BAR_TICKS = 1920;
const BEAT_TICKS = 480;
const STEP_TICKS = 120;

const bass = [
  { id: "source-bass", pitch: 36, startTick: 0, durationTick: STEP_TICKS, velocity: 96 },
  { id: "old-target-bass", pitch: 40, startTick: BAR_TICKS, durationTick: STEP_TICKS, velocity: 96 },
  { id: "later-bass", pitch: 43, startTick: BAR_TICKS * 2, durationTick: STEP_TICKS, velocity: 96 }
];

const copiedBass = copyRhythmBar(bass, {
  sourceBarStartTick: 0,
  targetBarStartTick: BAR_TICKS,
  barDurationTick: BAR_TICKS,
  pitch: 41
});

assert.equal(copiedBass.find((note) => note.startTick === 0)?.pitch, 36, "source bar must remain unchanged");
const targetBass = copiedBass.filter((note) => note.startTick >= BAR_TICKS && note.startTick < BAR_TICKS * 2);
assert.equal(targetBass.length, 1, "target bass bar must be replaced by the copied pattern");
assert.equal(targetBass[0].pitch, 41, "copied bass must use the target bar root pitch");
assert.notEqual(targetBass[0].id, "source-bass", "copied note must get a new id");
assert.equal(copiedBass.find((note) => note.id === "later-bass")?.startTick, BAR_TICKS * 2, "later bars must remain unchanged");

const drums = [
  { id: "kick", pitch: 36, startTick: 0, durationTick: STEP_TICKS, velocity: 100 },
  { id: "hh", pitch: 42, startTick: STEP_TICKS, durationTick: STEP_TICKS, velocity: 100 },
  { id: "old-target-snare", pitch: 38, startTick: BAR_TICKS, durationTick: STEP_TICKS, velocity: 100 }
];

const copiedDrums = copyRhythmBar(drums, {
  sourceBarStartTick: 0,
  targetBarStartTick: BAR_TICKS,
  barDurationTick: BAR_TICKS
});

const targetDrums = copiedDrums.filter((note) => note.startTick >= BAR_TICKS && note.startTick < BAR_TICKS * 2);
assert.deepEqual(
  targetDrums.map((note) => [note.pitch, note.startTick]),
  [[36, BAR_TICKS], [42, BAR_TICKS + STEP_TICKS]],
  "drum pitches and relative step positions must be copied"
);
assert.equal(copiedDrums.some((note) => note.id === "old-target-snare"), false, "existing target bar notes must be replaced");

const beatDrums = [
  { id: "beat-kick", pitch: 36, startTick: 0, durationTick: STEP_TICKS, velocity: 100 },
  { id: "beat-hh", pitch: 42, startTick: STEP_TICKS, durationTick: STEP_TICKS, velocity: 100 },
  { id: "old-beat-target", pitch: 38, startTick: BEAT_TICKS, durationTick: STEP_TICKS, velocity: 100 },
  { id: "later-beat", pitch: 38, startTick: BEAT_TICKS * 2, durationTick: STEP_TICKS, velocity: 100 }
];

const copiedBeatDrums = copyRhythmBeat(beatDrums, {
  sourceBeatStartTick: 0,
  targetBeatStartTick: BEAT_TICKS,
  beatDurationTick: BEAT_TICKS
});
const targetBeatDrums = copiedBeatDrums.filter(
  (note) => note.startTick >= BEAT_TICKS && note.startTick < BEAT_TICKS * 2
);
assert.deepEqual(
  targetBeatDrums.map((note) => [note.pitch, note.startTick]),
  [[36, BEAT_TICKS], [42, BEAT_TICKS + STEP_TICKS]],
  "current beat must copy to the next beat with relative 16th-step positions preserved"
);
assert.equal(copiedBeatDrums.some((note) => note.id === "old-beat-target"), false, "existing target beat notes must be replaced");
assert.equal(copiedBeatDrums.some((note) => note.id === "later-beat"), true, "later beats must remain unchanged");

const beatFourBass = [
  { id: "beat-four-bass", pitch: 36, startTick: BEAT_TICKS * 3, durationTick: STEP_TICKS, velocity: 96 }
];
const copiedAcrossBarBass = copyRhythmBeat(beatFourBass, {
  sourceBeatStartTick: BEAT_TICKS * 3,
  targetBeatStartTick: BAR_TICKS,
  beatDurationTick: BEAT_TICKS,
  pitch: 43
});
const nextBarBass = copiedAcrossBarBass.find((note) => note.startTick === BAR_TICKS);
assert.equal(nextBarBass?.pitch, 43, "Beat 4 copy to next bar Beat 1 must follow the target bar root pitch");

console.log("Rhythm bar/beat copy smoke test passed.");
