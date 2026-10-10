import assert from "node:assert/strict";
import {
  buildChordPreset,
  CHORD_PRESETS,
  CHORD_PRESET_CATEGORIES,
  chordPresetsByCategory,
  chordPresetPreview,
  getChordPreset
} from "../src/chord/chord-presets.js";

const barTicks = 1920;

assert.equal(CHORD_PRESETS.length, 100, "100 chord presets should be available");
assert.deepEqual(
  CHORD_PRESETS.slice(0, 6).map((preset) => preset.id),
  ["pop-1564", "jpop-4536", "pop-1645", "pop-6415", "cadence-2511", "canon"],
  "the original six presets keep their ids and order"
);
assert.equal(new Set(CHORD_PRESETS.map((preset) => preset.id)).size, 100, "preset ids must be unique");
assert.equal(
  new Set(CHORD_PRESETS.map((preset) => preset.degreeIndexes.join(""))).size,
  100,
  "every preset must have a different progression"
);
assert.ok(
  CHORD_PRESETS.every((preset) => [4, 8].includes(preset.degreeIndexes.length)),
  "presets are 4 or 8 bars"
);
assert.ok(
  CHORD_PRESETS.every((preset) => preset.degreeIndexes.every((degree) => Number.isInteger(degree) && degree >= 0 && degree <= 6)),
  "degree indexes stay within the 7 diatonic chords"
);
assert.ok(CHORD_PRESETS.every((preset) => preset.label && preset.description));
const grouped = chordPresetsByCategory();
assert.equal(grouped.length, CHORD_PRESET_CATEGORIES.length);
assert.equal(grouped.reduce((sum, category) => sum + category.presets.length, 0), 100, "every preset belongs to a category");
assert.ok(grouped.every((category) => category.presets.length > 0), "no empty category");
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

for (const [key, scale] of [["C", "major"], ["A", "minor"], ["F#", "major"]]) {
  for (const preset of CHORD_PRESETS) {
    const chords = buildChordPreset(preset.id, { key, scale, barTicks });
    assert.equal(chords.length, preset.degreeIndexes.length, `${preset.id} should create every configured bar`);
    assert.ok(chords.every((chord, index) => chord.startTick === index * barTicks));
    assert.ok(chords.every((chord) => chord.durationTick === barTicks));
    assert.equal(chordPresetPreview(preset.id, { key, scale }).length, chords.length);
  }
}

const minorKey = chordPresetPreview("minor-1765", { key: "A", scale: "minor" });
assert.deepEqual(minorKey, ["Am (i)", "G (VII)", "F (VI)", "Em (v)"], "minor-category presets read naturally in a minor key");
const royal = chordPresetPreview("bright-1451", { key: "G", scale: "major" });
assert.deepEqual(royal, ["G (I)", "C (IV)", "D (V)", "G (I)"]);

console.log("Chord preset smoke test passed.");
