import assert from "node:assert/strict";
import { clearMusicPart, musicPartHasData } from "../src/core/music-clear.js";
import { createProjectStore } from "../src/core/project-state.js";

const note = (pitch, startTick) => ({
  id: `n${pitch}-${startTick}`,
  pitch,
  startTick,
  durationTick: 240,
  velocity: 80
});

function seededStore() {
  const store = createProjectStore();
  store.updateChords([{
    root: 0,
    quality: "major",
    degree: "I",
    startTick: 0,
    durationTick: 1920
  }]);
  store.updateMelodyNotes([note(72, 0), note(74, 480)]);
  store.updateRhythmNotes({
    bassNotes: [note(36, 0)],
    drumNotes: [note(36, 0), note(38, 480)]
  });
  store.applyCounterMelody({ startBar: 0, endBar: 2, notes: [note(64, 0)] });
  return store;
}

function trackNotes(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

for (const part of ["chord", "melody", "bass", "drums"]) {
  const store = seededStore();
  const before = store.getSnapshot();
  assert.equal(musicPartHasData(before, part), true);

  const cleared = clearMusicPart(before, part);
  assert.notEqual(cleared, before);
  assert.equal(musicPartHasData(cleared, part), false);

  if (part !== "chord") assert.equal(cleared.chords.length, before.chords.length);
  if (part !== "melody") assert.deepEqual(trackNotes(cleared, "melody"), trackNotes(before, "melody"));
  if (part !== "bass") assert.deepEqual(trackNotes(cleared, "bass"), trackNotes(before, "bass"));
  if (part !== "drums") assert.deepEqual(trackNotes(cleared, "drums"), trackNotes(before, "drums"));
  assert.deepEqual(trackNotes(cleared, "counter"), trackNotes(before, "counter"));
  assert.equal(before.chords.length, 1, "pure helper must not mutate the original project");

  store.replaceProject(cleared);
  assert.equal(musicPartHasData(store.getSnapshot(), part), false);
  store.undo();
  assert.equal(musicPartHasData(store.getSnapshot(), part), true, `${part} clear should be undoable in one step`);
}

assert.throws(
  () => clearMusicPart(seededStore().getSnapshot(), "counter"),
  /消去できないパート/
);

const store = seededStore();
const before = store.getSnapshot();
store.clearAllMusic();
const after = store.getSnapshot();
assert.equal(after.chords.length, 0);
assert.ok(after.tracks.every((track) => track.notes.length === 0));
assert.equal(after.basic.bpm, before.basic.bpm);
assert.equal(after.basic.key, before.basic.key);
assert.deepEqual(after.structure, before.structure);
assert.deepEqual(after.instruments, before.instruments);
store.undo();
assert.equal(trackNotes(store.getSnapshot(), "melody").length, 2);

console.log("clear all / per-part clear smoke test passed.");
