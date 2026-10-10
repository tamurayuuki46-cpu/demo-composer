import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import { melodyCandidatesForBar, applyMelodyCandidate } from "../src/melody/melody-candidates.js";

const project = createDefaultProject();
project.basic.key = "C";
project.basic.scale = "major";
project.chords = [{ root: 0, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }];

const candidates = melodyCandidatesForBar(project, 0, { octave: 4 });
assert.equal(candidates.length, 3);
assert.deepEqual(candidates.map((item) => item.id), ["stable", "catchy", "floating"]);

const stablePitchClasses = new Set(candidates[0].steps.map((item) => item.pitch % 12));
for (const pc of stablePitchClasses) assert.ok([0, 4, 7].includes(pc));

for (const candidate of candidates) {
  assert.ok(candidate.steps.length > 0);
  for (const item of candidate.steps) {
    assert.ok(item.step >= 0 && item.step < 8);
    assert.ok(item.pitch >= 0 && item.pitch <= 127);
    assert.ok(item.length >= 1 && item.step + item.length <= 8);
  }
}

const existing = [
  { id: "before", pitch: 60, startTick: 0, durationTick: 240, velocity: 100 },
  { id: "after", pitch: 62, startTick: 1920, durationTick: 240, velocity: 100 }
];
let id = 0;
const applied = applyMelodyCandidate(existing, 0, candidates[1], {
  barTicks: 1920,
  createId: () => `generated-${++id}`
});
assert.equal(applied.some((note) => note.id === "before"), false);
assert.equal(applied.some((note) => note.id === "after"), true);
assert.equal(applied.filter((note) => note.startTick < 1920).length, candidates[1].steps.length);
assert.ok(applied.every((note) => note.durationTick > 0));

const noChordProject = createDefaultProject();
noChordProject.basic.key = "A";
noChordProject.basic.scale = "minor";
const noChord = melodyCandidatesForBar(noChordProject, 0, { octave: 4 });
assert.equal(noChord.length, 3);
assert.ok(noChord.every((candidate) => candidate.steps.every((item) => item.pitch >= 0 && item.pitch <= 127)));

console.log("Melody candidates smoke test passed.");
