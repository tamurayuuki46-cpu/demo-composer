import assert from "node:assert/strict";
import { CHORD_QUALITY_ORDER, chordIntervals } from "../src/core/chord-qualities.js";
import { migrateProject } from "../src/core/project-migration.js";
import { APP_VERSION } from "../src/core/project-schema.js";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { chordSymbol, getChordVariants, rootDegreeName } from "../src/chord/chord-theory.js";
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
assert.equal(migrated.schemaVersion, 3);
assert.equal(migrated.appVersion, APP_VERSION);
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

assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((root) => rootDegreeName(root, "C", "major")), ["I", "♭II", "II", "♭III", "III", "IV", "♯IV", "V", "♭VI", "VI", "♭VII", "VII"]);
assert.equal(rootDegreeName(7, "G", "major"), "I");
assert.equal(rootDegreeName(0, "G", "major"), "IV", "C is IV in G major");
assert.deepEqual([9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((root) => rootDegreeName(root, "A", "minor")), ["I", "♯I", "II", "III", "♯III", "IV", "♯IV", "V", "VI", "♯VI", "VII", "♯VII"].map((name, index) => (index === 1 ? "♭II" : name)));
assert.equal(rootDegreeName(0, "A", "minor"), "III", "C is III in A minor (natural minor)");
assert.equal(rootDegreeName(4, "A", "minor"), "V");
assert.equal(rootDegreeName(7, "A", "minor"), "VII");

console.log("Chord types smoke test passed.");
