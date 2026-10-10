import assert from "node:assert/strict";
import { CHORD_QUALITY_ORDER, chordIntervals } from "../src/core/chord-qualities.js";
import { migrateProject } from "../src/core/project-migration.js";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { chordSymbol, getChordVariants } from "../src/chord/chord-theory.js";
import { buildMidiExports } from "../src/midi/midi-export.js";

const expectedSymbols = [
  "C",
  "Cm",
  "C7",
  "Cmaj7",
  "Cm7",
  "Csus2",
  "Csus4",
  "Cdim",
  "Caug"
];

const expectedIntervals = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8]
};

assert.equal(CHORD_QUALITY_ORDER.length, 9);
assert.deepEqual(
  CHORD_QUALITY_ORDER.map((quality) => chordSymbol(0, quality)),
  expectedSymbols
);

for (const quality of CHORD_QUALITY_ORDER) {
  assert.deepEqual(chordIntervals(quality), expectedIntervals[quality], `${quality} intervals`);
}

const variants = getChordVariants(0, "C");
assert.equal(variants.length, 9);
assert.equal(variants.find((item) => item.quality === "dominant7")?.degree, "I7");
assert.equal(variants.find((item) => item.quality === "major7")?.degree, "Imaj7");
assert.equal(variants.find((item) => item.quality === "minor7")?.degree, "i7");

const legacyProject = {
  ...createDefaultProject(),
  schemaVersion: 1,
  appVersion: "v0.1-dev",
  chords: [
    { startTick: 0, durationTick: 1920, root: 0, quality: "major", degree: "I" }
  ]
};

const migrated = migrateProject(legacyProject);
assert.equal(migrated.schemaVersion, 2);
assert.equal(migrated.appVersion, "v0.2-dev");
assert.deepEqual(migrated.chords, legacyProject.chords);
assert.equal(legacyProject.schemaVersion, 1, "migration must not mutate source data");

const project = createDefaultProject();
const barTicks = project.basic.ppq * 4;
const chords = variants.map((variant, index) => ({
  startTick: index * barTicks,
  durationTick: barTicks,
  root: variant.root,
  quality: variant.quality,
  degree: variant.degree
}));

const store = createProjectStore(project);
store.updateChords(chords);
assert.equal(store.getSnapshot().chords.length, 9);

const midi = buildMidiExports(store.getSnapshot());
assert.ok(midi["Chord.mid"] instanceof Uint8Array);
assert.ok(midi["Chord.mid"].length > 100, "expanded chord MIDI should contain note data");

console.log("Chord types smoke test passed.");
