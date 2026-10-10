import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { buildConsultText, CONSULT_PLACEHOLDER } from "../src/hub/consult-text.js";

const BAR = 1920;
const chord = (i, root, quality, degree) => ({ startTick: i * BAR, durationTick: BAR, root, quality, degree });
const note = (id, pitch, startTick, durationTick) => ({ id, pitch, startTick, durationTick, velocity: 96 });

// 空のProjectでもエラーにならず、「まだありません」と相談欄の仮文言が入る
const empty = buildConsultText(createDefaultProject());
assert.match(empty, /Demo Composer 作曲相談/);
assert.match(empty, /構成はまだ決めていません/);
assert.match(empty, /コードはまだありません/);
assert.ok(empty.includes(CONSULT_PLACEHOLDER));
assert.match(empty, /候補を3つ/, "asks for 3 options, not full auto composition");

// 入力のあるProject
const store = createProjectStore(createDefaultProject());
store.updateHub({ metadata: { title: "テスト曲", genre: "J-POP" }, basic: { bpm: 150 } });
store.applySectionTemplate("loop-8");
store.updateChords([chord(0, 0, "major", "I"), chord(1, 7, "major", "V"), chord(2, 9, "minor", "vi"), chord(3, 5, "major", "IV")]);
store.updateMelodyNotes([
  note("m1", 64, 0, 480),                 // 1:E4/4分
  note("m2", 67, 480 + 240, 240),         // 2.5:G4/8分
  note("m3", 72, BAR * 2 + 960, 720)      // Bar3 3:C5/付点4分
]);
const kick = (bar, step) => note(`k${bar}-${step}`, 36, bar * BAR + step * 120, 120);
store.updateRhythmNotes({
  bassNotes: [note("b1", 36, 0, 960)],
  drumNotes: [0, 4, 8, 12].flatMap((s) => [kick(0, s), kick(1, s)])
});
const text = buildConsultText(store.getSnapshot(), "サビを盛り上げたい");
assert.match(text, /曲名: テスト曲/);
assert.match(text, /BPM: 150 \/ Key: C major/);
assert.match(text, /ジャンル: J-POP/);
assert.match(text, /Aメロ: Bar 1–8（8小節）/);
assert.match(text, /Aメロ Bar 1–4: C\(I\) \| G\(V\) \| Am\(vi\) \| F\(IV\)/);
assert.match(text, /Bar 1 \[C\(I\)\]: 1:E4\/4分 2\.5:G4\/8分/);
assert.match(text, /Bar 3 \[Am\(vi\)\]: 3:C5\/付点4分/);
assert.match(text, /音数 3 \/ 音域 E4〜C5/);
assert.match(text, /Bar 1 \[C\(I\)\]: 1:C2\/2分/);
assert.match(text, /Bar 1–2: K x\.\.\.x\.\.\.x\.\.\.x\.\.\./, "identical drum bars are merged");
assert.match(text, /■ 相談したいこと\nサビを盛り上げたい/);
assert.ok(!text.includes(CONSULT_PLACEHOLDER), "placeholder replaced by the question");

// 読むだけ: Projectを書き換えない
const before = JSON.stringify(store.getSnapshot());
buildConsultText(store.getSnapshot(), "x");
assert.equal(JSON.stringify(store.getSnapshot()), before);
console.log("consult text smoke test passed");
