import assert from "node:assert/strict";
import { analyzeMelody, describeMelody, pitchLabel } from "../src/core/melody-analysis.js";

const BAR = 1920;
const n = (pitch, startTick, durationTick = 240) => ({ id: `${pitch}-${startTick}`, pitch, startTick, durationTick, velocity: 96 });
const project = (notes, chords = [], basic = {}) => ({
  basic: { ppq: 480, key: "C", scale: "major", ...basic },
  chords,
  tracks: [{ role: "melody", notes }]
});
const C = { root: 0, quality: "major" };
const F = { root: 5, quality: "major" };

assert.equal(analyzeMelody(project([])), null);
assert.deepEqual(describeMelody(null), []);
assert.equal(pitchLabel(60), "C4");

// C E G E / C E G E（1小節目と2小節目が同じ）+ 3小節目に高い音
const motif = [n(60, 0), n(64, 480), n(67, 960), n(64, 1440)];
const notes = [
  ...motif,
  ...motif.map((x) => n(x.pitch, x.startTick + BAR)),
  n(72, BAR * 2), n(72, BAR * 2 + 480), n(72, BAR * 2 + 960), n(72, BAR * 2 + 1440)
];
const a = analyzeMelody(project(notes, [C, C, F]));
assert.equal(a.noteCount, 12);
assert.equal(a.barsWithNotes, 3);
assert.deepEqual(a.range, { low: 60, high: 72, span: 12 });
// 動き: 跳躍(5半音以上)は 64→72 の1回だけ。最大8半音
assert.equal(a.leaps.motions, 11);
assert.equal(a.leaps.count, 1);
assert.equal(a.leaps.max, 8);
// 同音連打: 72が4つ続く（3回、最長4音）
assert.equal(a.repeats.sameCount, 3);
assert.equal(a.repeats.maxRun, 4);
// モチーフ反復: 2小節目は1小節目と同じ
assert.equal(a.motif.repeatedBars, 1);
assert.equal(a.motif.barsWithNotes, 3);
// リズム密度: 12音 / 3小節
assert.equal(a.density.perBar, 4);
// Key Cからの度数: C=1が6音、E=3が4音、G=5が2音
assert.equal(a.keyDegree.total, 12);
assert.equal(a.keyDegree.counts[0], 6);
assert.equal(a.keyDegree.counts[4], 4);
assert.equal(a.keyDegree.counts[7], 2);
// Chordからの度数: C chord 2小節 + F chord上のC4音 → R=2, 3=4, 5=6
assert.equal(a.chordDegree.counted, 12);
assert.equal(a.chordDegree.counts[0], 2);
assert.equal(a.chordDegree.counts[4], 4);
assert.equal(a.chordDegree.counts[7], 6);
// すべてC Major scale内
assert.equal(a.scaleFit.rate, 1);
assert.equal(a.scaleFit.hits, 12);
// コードトーン: C(CEG) と F(FAC) に対して全て構成音
assert.equal(a.chordTone.rate, 1);
// コード外の音を混ぜると率が下がる（D=62 は C の構成音ではない）
const b = analyzeMelody(project([n(60, 0), n(62, 480), n(64, 960), n(62, 1440)], [C]));
assert.equal(b.chordTone.rate, 0.5);
assert.equal(b.scaleFit.rate, 1);
// Scale外のF#を混ぜるとScale内率が下がる
const c = analyzeMelody(project([n(60, 0), n(66, 480)], [C]));
assert.equal(c.scaleFit.rate, 0.5);
assert.equal(c.scaleFit.hits, 1);
// MinorでもScale判定する（A natural minor: A B C D E F G）
const minor = analyzeMelody(project([n(69, 0), n(72, 480), n(76, 960), n(77, 1440)], [], { key: "A", scale: "minor" }));
assert.equal(minor.scaleFit.rate, 1);
assert.equal(minor.keyDegree.counts[0], 1); // A = 1
assert.equal(minor.keyDegree.counts[3], 1); // C = ♭3
// コードが無ければ Chord度数 / コードトーン率は未集計
const noChord = analyzeMelody(project(motif));
assert.equal(noChord.chordDegree.counted, 0);
assert.equal(noChord.chordTone.rate, null);
// 音が1つだけでも落ちない
const one = analyzeMelody(project([n(60, 0)]));
assert.equal(one.leaps.motions, 0);
assert.equal(describeMelody(one).find((r) => r.id === "leap").value, "音が1つだけ");

// 説明: 既存6項目 + Key度数 / Chord度数 / Scale内率の3項目
const rows = describeMelody(a);
assert.deepEqual(rows.map((r) => r.id), [
  "range",
  "key-degree",
  "chord-degree",
  "scale-fit",
  "leap",
  "tone",
  "density",
  "same",
  "motif"
]);
assert.ok(rows.every((r) => r.label && r.value));
assert.equal(rows[0].value, "C4〜C5（1オクターブ）");
assert.equal(rows.find((r) => r.id === "key-degree").value, "1 50%・3 33%・5 17%");
assert.equal(rows.find((r) => r.id === "chord-degree").value, "5 50%・3 33%・R 17%");
assert.equal(rows.find((r) => r.id === "scale-fit").value, "100%");
assert.match(rows.find((r) => r.id === "same").comment, /同じ音が続く/);

console.log("melody analysis smoke test passed");
