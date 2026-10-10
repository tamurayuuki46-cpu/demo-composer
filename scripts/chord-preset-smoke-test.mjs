import assert from "node:assert/strict";
import {
  buildChordPreset,
  CHORD_PRESETS,
  chordPresetPreview,
  getChordPreset
} from "../src/chord/chord-presets.js";

const barTicks = 1920;

assert.equal(CHORD_PRESETS.length, 6, "six beginner-friendly chord presets should be available");
assert.equal(getChordPreset("pop-1564").label, "Pop 1564");
assert.equal(getChordPreset("missing-id").id, CHORD_PRESETS[0].id, "unknown preset should fall back safely");

const pop = buildChordPreset("pop-1564", {
  key: "C",
  scale: "major",
  barTicks
});

assert.deepEqual(
  pop.map(({ root, quality, degree }) => ({ root, quality, degree })),
  [
    { root: 0, quality: "major", degree: "I" },
    { root: 7, quality: "major", degree: "V" },
    { root: 9, quality: "minor", degree: "vi" },
    { root: 5, quality: "major", degree: "IV" }
  ]
);
assert.deepEqual(pop.map((chord) => chord.startTick), [0, 1920, 3840, 5760]);
assert.ok(pop.every((chord) => chord.durationTick === barTicks));

const minorPop = chordPresetPreview("pop-1564", { key: "A", scale: "minor" });
assert.deepEqual(minorPop, ["Am (i)", "Em (v)", "F (VI)", "Dm (iv)"]);

const canon = buildChordPreset("canon", {
  key: "D",
  scale: "major",
  barTicks
});
assert.equal(canon.length, 8, "canon preset should create eight bars");
assert.equal(canon.at(-1).startTick, barTicks * 7);

for (const preset of CHORD_PRESETS) {
  const chords = buildChordPreset(preset.id, { key: "C", scale: "major", barTicks });
  assert.equal(chords.length, preset.degreeIndexes.length, `${preset.id} should create every configured bar`);
  assert.ok(chords.every((chord, index) => chord.startTick === index * barTicks));
  assert.ok(chords.every((chord) => chord.durationTick === barTicks));
}

console.log("Chord preset smoke test passed.");
