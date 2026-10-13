import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import {
  MELODY_CANDIDATE_VARIATION_COUNT,
  melodyCandidatesForBar,
  applyMelodyCandidate
} from "../src/melody/melody-candidates.js";

const project = createDefaultProject();
project.basic.key = "C";
project.basic.scale = "major";
project.chords = [{ root: 0, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }];

const candidates = melodyCandidatesForBar(project, 0, { octave: 4 });
assert.equal(candidates.length, 3);
assert.deepEqual(candidates.map((item) => item.id), ["stable", "catchy", "floating"]);

const stablePitchClasses = new Set(candidates[0].steps.map((item) => item.pitch % 12));
for (const pc of stablePitchClasses) assert.ok([0, 4, 7].includes(pc));

const signatures = [];
for (let variation = 0; variation < MELODY_CANDIDATE_VARIATION_COUNT; variation += 1) {
  const set = melodyCandidatesForBar(project, 0, { octave: 4, variation });
  signatures.push(JSON.stringify(set.map((candidate) => candidate.steps)));

  const stable = new Set(set[0].steps.map((item) => item.pitch % 12));
  for (const pc of stable) assert.ok([0, 4, 7].includes(pc));

  for (const candidate of set) {
    assert.ok(candidate.steps.length > 0);
    for (const item of candidate.steps) {
      assert.ok(item.step >= 0 && item.step < 8);
      assert.ok(item.pitch >= 0 && item.pitch <= 127);
      assert.ok(item.length >= 1 && item.step + item.length <= 8);
    }
  }
}
assert.equal(new Set(signatures).size, MELODY_CANDIDATE_VARIATION_COUNT);

const wrapped = melodyCandidatesForBar(project, 0, {
  octave: 4,
  variation: MELODY_CANDIDATE_VARIATION_COUNT
});
assert.deepEqual(wrapped, candidates);

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
for (let variation = 0; variation < MELODY_CANDIDATE_VARIATION_COUNT; variation += 1) {
  const noChord = melodyCandidatesForBar(noChordProject, 0, { octave: 4, variation });
  assert.equal(noChord.length, 3);
  assert.ok(noChord.every((candidate) => candidate.steps.every((item) => item.pitch >= 0 && item.pitch <= 127)));
}

console.log("Melody candidates smoke test passed.");

// 浮遊感: 余白（休み・長い音）を作らず、全別案で小節の終わりまで切れ目なくつながる。同じ音の連打もしない
{
  const { MELODY_CANDIDATE_VARIATION_COUNT } = await import("../src/melody/melody-candidates.js");
  for (let variation = 0; variation < MELODY_CANDIDATE_VARIATION_COUNT; variation += 1) {
    const floating = melodyCandidatesForBar(project, 0, { variation }).find((item) => item.id === "floating");
    let cursor = 0;
    floating.steps.forEach((item, index) => {
      assert.equal(item.step, cursor, `variation ${variation}: 休みなくつながる`);
      assert.ok(item.length <= 2, `variation ${variation}: 長い音にしない`);
      if (index > 0) assert.notEqual(item.pitch, floating.steps[index - 1].pitch, `variation ${variation}: 同音連打なし`);
      cursor += item.length;
    });
    assert.equal(cursor, 8, `variation ${variation}: 小節の終わりまで`);
  }
}

// Keyの主音が一番下の段になる（Piano Rollの12段 = 主音〜主音+11）。候補もその範囲に収まる
{
  const { getOctavePitches } = await import("../src/melody/melody-grid.js");
  assert.equal(getOctavePitches(4)[11], 60, "既定はC4が一番下");
  assert.equal(getOctavePitches(4)[0], 71);
  const a = getOctavePitches(4, 9);
  assert.equal(a[11], 69, "Aなら A4 が一番下");
  assert.equal(a[0], 80);
  for (const [key, tonic] of [["A", 9], ["F#", 6], ["B", 11], ["C", 0]]) {
    const p = createDefaultProject();
    p.basic.key = key;
    p.basic.scale = "major";
    p.chords = [{ root: tonic, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }];
    const grid = getOctavePitches(4, tonic);
    const low = grid[11];
    const high = grid[0];
    for (let variation = 0; variation < MELODY_CANDIDATE_VARIATION_COUNT; variation += 1) {
      for (const candidate of melodyCandidatesForBar(p, 0, { octave: 4, variation })) {
        assert.ok(candidate.steps.every((s) => s.pitch >= low && s.pitch <= high), `${key}: ${candidate.id} が鍵盤の範囲内`);
      }
    }
  }
}
