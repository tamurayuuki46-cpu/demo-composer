import assert from "node:assert/strict";
import { compareSections, contrastHints } from "../src/core/section-compare.js";

const BAR = 1920;
const n = (pitch, bar, beat) => ({ id: `${pitch}-${bar}-${beat}`, pitch, startTick: bar * BAR + beat * 480, durationTick: 240, velocity: 96 });
const section = (kind, name, bars) => ({ id: `${kind}-${name}`, kind, name, bars });
const project = (sections, notes) => ({
  basic: { ppq: 480 },
  structure: { sections },
  chords: [],
  tracks: [{ role: "melody", notes }]
});

assert.deepEqual(compareSections({ basic: { ppq: 480 }, tracks: [] }), []);

// A(2小節): 60-64、4音ずつ / サビ(2小節): 69-76、8音ずつ
const aNotes = [60, 62, 64, 62, 60, 62, 64, 62].map((p, i) => n(p, Math.floor(i / 4), i % 4));
const cNotes = [69, 72, 74, 76, 74, 72, 69, 72, 76, 74, 72, 69, 72, 76, 74, 72].map((p, i) => n(p, 2 + Math.floor(i / 8), (i % 8) / 2));
const p = project([section("verse", "Aメロ", 2), section("chorus", "サビ", 2), section("outro", "アウトロ", 2)], [...aNotes, ...cNotes]);
const rows = compareSections(p);
assert.equal(rows.length, 3);
assert.equal(rows[0].noteCount, 8);
assert.deepEqual(rows[0].range, { low: 60, high: 64, span: 4 });
assert.equal(rows[0].density, 4);
assert.equal(rows[1].noteCount, 16);
assert.equal(rows[1].density, 8);
assert.equal(rows[2].noteCount, 0);
assert.equal(rows[2].range, null);

const hints = contrastHints(rows);
assert.equal(hints.ref, "Aメロ");
assert.equal(hints.lacking, false);
assert.ok(hints.lines[0].includes("+12半音"));

// 差が小さい（サビも同じような音）→ 「差が足りない」
const same = project([section("verse", "Aメロ", 2), section("chorus", "サビ", 2)], [...aNotes, ...aNotes.map((x) => ({ ...x, id: `${x.id}b`, startTick: x.startTick + BAR * 2 }))]);
const sameHints = contrastHints(compareSections(same));
assert.equal(sameHints.lacking, true);
assert.ok(sameHints.advice.includes("差が小さめ"));

// サビが無い / 比べる相手が無い → null
assert.equal(contrastHints(compareSections(project([section("verse", "Aメロ", 2)], aNotes))), null);
assert.equal(contrastHints(compareSections(project([section("chorus", "サビ", 2)], aNotes))), null);

console.log("section-compare smoke test passed");
