import assert from "node:assert/strict";
import { analyzeMelody, describeMelody, pitchLabel } from "../src/core/melody-analysis.js";

const BAR = 1920;
const n = (pitch, startTick, durationTick = 240) => ({ id: `${pitch}-${startTick}`, pitch, startTick, durationTick, velocity: 96 });
const project = (notes, chords = []) => ({ basic: { ppq: 480 }, chords, tracks: [{ role: "melody", notes }] });
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
// コードトーン: C(CEG) と F(FAC) に対して全て構成音
assert.equal(a.chordTone.rate, 1);
// コード外の音を混ぜると率が下がる（D=62 は C の構成音ではない）
const b = analyzeMelody(project([n(60, 0), n(62, 480), n(64, 960), n(62, 1440)], [C]));
assert.equal(b.chordTone.rate, 0.5);
// コードが無ければ null
assert.equal(analyzeMelody(project(motif)).chordTone.rate, null);
// 音が1つだけでも落ちない
const one = analyzeMelody(project([n(60, 0)]));
assert.equal(one.leaps.motions, 0);
assert.equal(describeMelody(one).find((r) => r.id === "leap").value, "音が1つだけ");

// 説明: 6項目、すべて文字がある
const rows = describeMelody(a);
assert.deepEqual(rows.map((r) => r.id), ["range", "leap", "tone", "density", "same", "motif"]);
assert.ok(rows.every((r) => r.label && r.value));
assert.equal(rows[0].value, "C4〜C5（1オクターブ）");
assert.match(rows.find((r) => r.id === "same").comment, /同じ音が続く/);

console.log("melody analysis smoke test passed");
