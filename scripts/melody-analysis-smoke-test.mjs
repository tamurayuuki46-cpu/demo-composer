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
// Guide ToneはC MajorのE（3rd）4音。F chord上のCは5thなのでGuideではない
assert.equal(a.melodicFunctions.harmony.chordTones, 12);
assert.equal(a.melodicFunctions.harmony.guideTones, 4);
assert.equal(a.melodicFunctions.harmony.tensions, 0);
assert.equal(a.melodicFunctions.harmony.otherNonChord, 0);

// コード外の音を混ぜると率が下がる（D=62 は C の構成音ではない）
const b = analyzeMelody(project([n(60, 0), n(62, 480), n(64, 960), n(62, 1440)], [C]));
assert.equal(b.chordTone.rate, 0.5);
assert.equal(b.scaleFit.rate, 1);
assert.equal(b.melodicFunctions.harmony.guideTones, 1); // E = 3rd
assert.equal(b.melodicFunctions.harmony.tensions, 2); // D = 9th相当
assert.equal(b.melodicFunctions.functions.passing, 1); // C-D-E

// 刺繍音: C-D-C
const neighbor = analyzeMelody(project([n(60, 0), n(62, 480), n(60, 960)], [C]));
assert.equal(neighbor.melodicFunctions.functions.neighbor, 1);

// 倚音: C-F-E（跳躍でFへ入り、Eへ順次解決）
const appoggiatura = analyzeMelody(project([n(60, 0), n(65, 480), n(64, 960)], [C]));
assert.equal(appoggiatura.melodicFunctions.functions.appoggiatura, 1);

// 逸音: E-F-C（順次でFへ外れ、反対方向へ跳躍）
const escape = analyzeMelody(project([n(64, 0), n(65, 480), n(60, 960)], [C]));
assert.equal(escape.melodicFunctions.functions.escape, 1);

// アプローチ: F#-F-E。Fは次のEへ半音接近するが、前音F#はコードトーンではない
const approach = analyzeMelody(project([n(66, 0), n(65, 480), n(64, 960)], [C]));
assert.equal(approach.melodicFunctions.functions.approach, 1);

// 先取音: C chord最後の拍のAはC chord外だが、次のF chordでは3rd
const anticipation = analyzeMelody(project([n(69, 1440), n(69, BAR)], [C, F]));
assert.equal(anticipation.melodicFunctions.functions.anticipation, 1);

// 係留音候補: C chordのGを次のF chordまで保持。Cでは5th、Fではコード外
const suspension = analyzeMelody(project([n(67, 1680, 480)], [C, F]));
assert.equal(suspension.melodicFunctions.functions.suspension, 1);

// Scale外のF#を混ぜるとScale内率が下がる
const c = analyzeMelody(project([n(60, 0), n(66, 480)], [C]));
assert.equal(c.scaleFit.rate, 0.5);
assert.equal(c.scaleFit.hits, 1);
// MinorでもScale判定する（A natural minor: A B C D E F G）
const minor = analyzeMelody(project([n(69, 0), n(72, 480), n(76, 960), n(77, 1440)], [], { key: "A", scale: "minor" }));
assert.equal(minor.scaleFit.rate, 1);
assert.equal(minor.keyDegree.counts[0], 1); // A = 1
assert.equal(minor.keyDegree.counts[3], 1); // C = ♭3
// コードが無ければ Chord度数 / コードトーン率 / 和声役割は未集計
const noChord = analyzeMelody(project(motif));
assert.equal(noChord.chordDegree.counted, 0);
assert.equal(noChord.chordTone.rate, null);
assert.equal(noChord.melodicFunctions.harmony.counted, 0);
// 音が1つだけでも落ちない
const one = analyzeMelody(project([n(60, 0)]));
assert.equal(one.leaps.motions, 0);
assert.equal(describeMelody(one).find((r) => r.id === "leap").value, "音が1つだけ");

// 説明: 既存分析 + メロディの働き + 旋律の3つの見方
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
  "motif",
  "melodic-role-heading",
  "harmony-role",
  "non-chord-function",
  "phrase-vocabulary",
  "perspective-note",
  "perspective-kusano",
  "perspective-yonezu",
  "perspective-ayase"
]);
assert.ok(rows.every((r) => r.label && r.value));
assert.equal(rows[0].value, "C4〜C5（1オクターブ）");
assert.equal(rows.find((r) => r.id === "key-degree").value, "1 50%・3 33%・5 17%");
assert.equal(rows.find((r) => r.id === "chord-degree").value, "5 50%・3 33%・R 17%");
assert.equal(rows.find((r) => r.id === "scale-fit").value, "100%");
assert.match(rows.find((r) => r.id === "same").comment, /同じ音が続く/);
assert.equal(rows.find((r) => r.id === "harmony-role").value, "Guide 4・Chord 12・Tension 0・Other 0");
assert.match(rows.find((r) => r.id === "phrase-vocabulary").comment, /リック/);
assert.equal(rows.find((r) => r.id === "perspective-kusano").value, "跳躍 9%・2(9th)/6th 0%");
assert.equal(rows.find((r) => r.id === "perspective-yonezu").value, "最大跳躍 8半音・Scale外 0音");
assert.equal(rows.find((r) => r.id === "perspective-ayase").value, "4.0音/小節・同型反復 1/3小節");

// Chordが無い場合は草野参考の2(9th)/6thと和声役割を未集計として表示する
const noChordRows = describeMelody(noChord);
assert.match(noChordRows.find((r) => r.id === "perspective-kusano").value, /2\(9th\)\/6th —/);
assert.equal(noChordRows.find((r) => r.id === "harmony-role").value, "—");

console.log("melody analysis smoke test passed");
