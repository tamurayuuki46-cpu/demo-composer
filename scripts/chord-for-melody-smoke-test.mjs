import assert from "node:assert/strict";
import {
  chordsWithBarChord,
  draftChordsFromMelody,
  melodyBarCount,
  suggestChordsForBar
} from "../src/chord/chord-for-melody.js";

const BAR = 1920;
const n = (pitch, bar, beat, beats = 1) => ({
  id: `${pitch}-${bar}-${beat}`, pitch, startTick: bar * BAR + beat * 480, durationTick: beats * 480, velocity: 96
});
const project = (notes, chords = []) => ({
  basic: { ppq: 480, key: "C", scale: "major" },
  chords,
  tracks: [{ role: "melody", notes }]
});

// メロなし
assert.equal(melodyBarCount(project([])), 0);
assert.deepEqual(suggestChordsForBar(project([]), 0), { notes: 0, candidates: [] });

// 1小節目: C E G E → C(I) が1位で、すべて構成音
const bar1 = [n(60, 0, 0), n(64, 0, 1), n(67, 0, 2), n(64, 0, 3)];
// 2小節目: F A C A → F(IV)
const bar2 = [n(65, 1, 0), n(69, 1, 1), n(72, 1, 2), n(69, 1, 3)];
// 3小節目: G B D B → G(V)
const bar3 = [n(67, 2, 0), n(71, 2, 1), n(74, 2, 2), n(71, 2, 3)];
const p = project([...bar1, ...bar2, ...bar3]);
assert.equal(melodyBarCount(p), 3);

const s1 = suggestChordsForBar(p, 0, []);
assert.equal(s1.notes, 4);
assert.equal(s1.candidates.length, 3);
assert.equal(s1.candidates[0].symbol, "C");
assert.equal(s1.candidates[0].reason.startsWith("メロの音がすべて構成音"), true);
assert.ok(s1.candidates[0].fit >= s1.candidates[1].fit);
assert.equal(new Set(s1.candidates.map((c) => c.symbol)).size, 3);

assert.equal(suggestChordsForBar(p, 1, [])?.candidates[0].symbol, "F");
assert.equal(suggestChordsForBar(p, 2, [])?.candidates[0].symbol, "G");

// 叩き台: C → F → G
const draft = draftChordsFromMelody(p);
assert.equal(draft.filled, 3);
assert.deepEqual(draft.chords.map((c) => c.degree), ["I", "IV", "V"]);
assert.equal(draft.chords[2].startTick, BAR * 2);

// 差し替え・追加
const withChords = project([...bar1, ...bar2], draft.chords);
const replaced = chordsWithBarChord(withChords, 1, { root: 9, quality: "minor", degree: "vi" });
assert.equal(replaced.length, 3);
assert.equal(replaced[1].degree, "vi");
assert.equal(replaced[1].startTick, BAR);
assert.equal(withChords.chords[1].degree, "IV"); // 元は変えない
assert.equal(chordsWithBarChord(project(bar1), 0, { root: 0, quality: "major", degree: "I" }).length, 1);
assert.throws(() => chordsWithBarChord(project(bar1), 2, { root: 0, quality: "major", degree: "I" }));

// 途切れたメロ（2小節目が空）では叩き台がそこで止まる
const gap = project([...bar1, ...bar3]);
assert.equal(draftChordsFromMelody(gap).filled, 1);

// Minor: A C E → Am(i)
const minor = { basic: { ppq: 480, key: "A", scale: "minor" }, chords: [], tracks: [{ role: "melody", notes: [n(69, 0, 0, 2), n(72, 0, 2), n(76, 0, 3)] }] };
assert.equal(suggestChordsForBar(minor, 0, []).candidates[0].symbol, "Am");

console.log("chord-for-melody smoke test passed");
