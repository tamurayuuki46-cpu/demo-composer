import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";

function note(id, pitch, startTick = 0, durationTick = 240, velocity = 100) {
  return { id, pitch, startTick, durationTick, velocity };
}

const project = createDefaultProject();
const barTicks = project.basic.ppq * 4;
const store = createProjectStore(project);

store.updateChords([
  { startTick: 0, durationTick: barTicks, root: 0, quality: "major", degree: "I" },
  { startTick: barTicks, durationTick: barTicks, root: 9, quality: "minor", degree: "vi" }
]);
store.updateMelodyNotes([note("melody-1", 60)]);
store.updateRhythmNotes({
  bassNotes: [note("bass-1", 48, 0, 120, 96)],
  drumNotes: [note("drum-1", 36, 0, 120, 108)]
});

store.updateHub({ basic: { key: "D" } });
const transposed = store.getSnapshot();

assert.equal(transposed.basic.key, "D");
assert.equal(transposed.basic.scale, "major");
assert.deepEqual(transposed.chords.map((chord) => chord.root), [2, 11]);
assert.deepEqual(transposed.chords.map((chord) => chord.degree), ["I", "vi"]);
assert.equal(transposed.tracks.find((track) => track.role === "melody")?.notes[0].pitch, 62);
assert.equal(transposed.tracks.find((track) => track.role === "bass")?.notes[0].pitch, 50);
assert.equal(transposed.tracks.find((track) => track.role === "drums")?.notes[0].pitch, 36);

assert.throws(
  () => store.updateHub({ basic: { scale: "minor" } }),
  /Scaleを変更できません/
);

const shortestStore = createProjectStore(createDefaultProject());
shortestStore.updateMelodyNotes([note("melody-shortest", 60)]);
shortestStore.updateHub({ basic: { key: "B" } });
assert.equal(shortestStore.getSnapshot().tracks.find((track) => track.role === "melody")?.notes[0].pitch, 59);

const rangeStore = createProjectStore(createDefaultProject());
rangeStore.updateMelodyNotes([note("melody-low", 0)]);
assert.throws(
  () => rangeStore.updateHub({ basic: { key: "B" } }),
  /MIDI範囲外/
);
assert.equal(rangeStore.getSnapshot().basic.key, "C", "failed transposition must keep the original key");
assert.equal(rangeStore.getSnapshot().tracks.find((track) => track.role === "melody")?.notes[0].pitch, 0);

console.log("Key change smoke test passed.");
