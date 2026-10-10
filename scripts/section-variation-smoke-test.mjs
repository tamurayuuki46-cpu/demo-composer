import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { SECTION_VARIATIONS, applySectionVariation } from "../src/core/section-variation.js";
import { applyDrumPresetToBars } from "../src/rhythm/drum-presets.js";

const BAR = 1920;
const STEP = BAR / 16;
const notesOf = (p, role) => p.tracks.find((t) => t.role === role)?.notes ?? [];
const inBar = (notes, bar) => notes.filter((n) => n.startTick >= bar * BAR && n.startTick < (bar + 1) * BAR);

// Aメロ8小節 + Aメロ2（8小節）。Aメロ2はAメロのコピー相当を直接作る
const store = createProjectStore(createDefaultProject());
store.applySectionTemplate("full-song");
const p0 = store.getSnapshot();
const chords = Array.from({ length: 16 }, (_, i) => ({ root: [0, 7, 9, 5][i % 4], quality: [ "major", "major", "minor", "major"][i % 4], degree: "I", startTick: i * BAR, durationTick: BAR }));
const bassNotes = [];
const melodyNotes = [];
for (let bar = 0; bar < 16; bar += 1) {
  bassNotes.push({ id: `b${bar}`, pitch: 36 + chords[bar].root, startTick: bar * BAR, durationTick: STEP * 4, velocity: 100 });
  melodyNotes.push({ id: `m${bar}a`, pitch: 72 + (bar % 3), startTick: bar * BAR, durationTick: STEP * 2, velocity: 96 });
  melodyNotes.push({ id: `m${bar}b`, pitch: 74, startTick: bar * BAR + STEP * 8, durationTick: STEP * 4, velocity: 96 });
}
const drumNotes = applyDrumPresetToBars([], { presetId: "basic-8", startBar: 0, endBar: 16, barTicks: BAR, stepTicks: STEP });
store.updateChords(chords);
store.updateMelodyNotes(melodyNotes);
store.updateRhythmNotes({ bassNotes, drumNotes });
const project = store.getSnapshot();
// full-song: イントロ4 / Aメロ8(index1, Bar 5–12) / Bメロ8 ...
const verse = { index: 1, start: 4, end: 12 };

assert.deepEqual(SECTION_VARIATIONS.map((v) => v.id), ["drums", "bass", "melody"]);

// --- ドラム: 偶数index(0,2,4,6)のHH追加、奇数index(1,3,5)のキック追加、最後の小節は触らない
{
  const { project: out, changed } = applySectionVariation(project, verse.index, "drums");
  assert.ok(changed > 0);
  const drums = notesOf(out, "drums");
  const lastBar = verse.end - 1;
  assert.deepEqual(inBar(drums, lastBar).map((n) => n.id), inBar(notesOf(project, "drums"), lastBar).map((n) => n.id), "last bar untouched");
  assert.ok(drums.some((n) => n.pitch === 36 && n.startTick === (verse.start + 1) * BAR + STEP * 10), "extra kick on 2nd bar");
  assert.ok(drums.some((n) => n.pitch === 42 && n.startTick === verse.start * BAR + STEP * 15), "extra hh on 1st bar");
  // Section外は変わらない
  assert.deepEqual(drums.filter((n) => n.startTick < verse.start * BAR).map((n) => n.id), notesOf(project, "drums").filter((n) => n.startTick < verse.start * BAR).map((n) => n.id));
  assert.deepEqual(drums.filter((n) => n.startTick >= verse.end * BAR).map((n) => n.id), notesOf(project, "drums").filter((n) => n.startTick >= verse.end * BAR).map((n) => n.id));
  assert.equal(new Set(drums.map((n) => n.id)).size, drums.length);
  // もう一度当てても重複しない（同じ位置・同じ音は足さない）
  const again = applySectionVariation(out, verse.index, "drums");
  assert.equal(again.changed, 0);
  assert.equal(again.project, out, "no change returns same project");
}

// --- ベース: 奇数indexに5度、最後の小節にオクターブ上。重ならない
{
  const { project: out, changed } = applySectionVariation(project, verse.index, "bass");
  assert.ok(changed > 0);
  const bass = notesOf(out, "bass");
  for (let i = 1; i < bass.length; i += 1) assert.ok(bass[i - 1].startTick + bass[i - 1].durationTick <= bass[i].startTick, "no overlap");
  const second = inBar(bass, verse.start + 1);
  assert.equal(second.length, 2);
  assert.equal(second[1].pitch, 36 + chords[verse.start + 1].root + 7, "fifth");
  const last = inBar(bass, verse.end - 1);
  assert.ok(last.some((n) => n.pitch === 36 + chords[verse.end - 1].root + 12 && n.startTick === (verse.end - 1) * BAR + STEP * 12), "octave on last bar");
  assert.equal(inBar(bass, verse.end).length, 1, "next section untouched");
}

// --- メロディ: 区切り（4小節ごと / 最後の小節）の最後の音だけがコードの音に変わる
{
  const { project: out, changed } = applySectionVariation(project, verse.index, "melody");
  assert.equal(changed, 2, "bars 4 and 8 of the section");
  const before = notesOf(project, "melody");
  const after = notesOf(out, "melody");
  assert.equal(after.length, before.length);
  const diff = after.filter((n, i) => n.pitch !== before[i].pitch);
  assert.equal(diff.length, 2);
  diff.forEach((n) => {
    const bar = Math.floor(n.startTick / BAR);
    const chord = chords[bar];
    const tones = chord.quality === "minor" ? [0, 3, 7] : [0, 4, 7];
    assert.ok(tones.includes(((n.pitch - chord.root) % 12 + 12) % 12), "chord tone");
    assert.ok([verse.start + 3, verse.end - 1].includes(bar));
    assert.ok(n.startTick % BAR === STEP * 8, "last note of the bar");
  });
}

// --- 空のSectionや入力が無いパートでは changed=0
{
  const empty = createProjectStore(createDefaultProject());
  empty.applySectionTemplate("one-chorus");
  const e = empty.getSnapshot();
  ["drums", "bass", "melody"].forEach((id) => assert.equal(applySectionVariation(e, 1, id).changed, 0, id));
}
assert.throws(() => applySectionVariation(project, 99, "drums"), /Section/);
assert.throws(() => applySectionVariation(project, 1, "nope"), /バリエーション/);
assert.equal(notesOf(project, "bass").length, 16, "input not mutated");

// --- Store経由: Undoで1回で戻る・無変更は履歴を増やさない・検証を通る
{
  const s = createProjectStore(project);
  const revision = s.getSnapshot().revision;
  const result = s.applySectionVariation(verse.index, "bass");
  assert.ok(result.changed > 0);
  assert.equal(s.getSnapshot().revision, revision + 1);
  s.undo();
  assert.equal(notesOf(s.getSnapshot(), "bass").length, 16);
  const none = createProjectStore(createDefaultProject());
  none.applySectionTemplate("one-chorus");
  const before = none.getSnapshot().revision;
  assert.deepEqual(none.applySectionVariation(1, "drums"), { changed: 0 });
  assert.equal(none.getSnapshot().revision, before, "no history for no-op");
}

console.log("section variation smoke test passed");
