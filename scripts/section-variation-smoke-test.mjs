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

assert.deepEqual(SECTION_VARIATIONS.map((v) => v.id), ["drums", "bass", "melody", "melody-pitch", "melody-rhythm"]);

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

// --- メロディの音程だけ: リズム不変・1つ目の音は残る・偶数小節は上 / 奇数小節は下へ音階で1つ・Section外は不変
{
  const { project: out, changed } = applySectionVariation(project, verse.index, "melody-pitch");
  assert.equal(changed, 8, "1 note per bar (2nd note) in 8 bars");
  const before = notesOf(project, "melody");
  const after = notesOf(out, "melody");
  assert.equal(after.length, before.length);
  assert.deepEqual(after.map((n) => [n.startTick, n.durationTick]), before.map((n) => [n.startTick, n.durationTick]), "rhythm unchanged");
  const byId = new Map(before.map((n) => [n.id, n]));
  // 小節の1つ目（m{bar}a）は変わらない
  for (let bar = verse.start; bar < verse.end; bar += 1) assert.equal(after.find((n) => n.id === `m${bar}a`).pitch, byId.get(`m${bar}a`).pitch);
  assert.equal(after.find((n) => n.id === `m${verse.start}b`).pitch, 76, "even bar: D -> E (scale step up)");
  assert.equal(after.find((n) => n.id === `m${verse.start + 1}b`).pitch, 72, "odd bar: D -> C (scale step down)");
  // 動かした音（2つ目）は Cメジャーの音階の中
  const scale = new Set([0, 2, 4, 5, 7, 9, 11]);
  assert.ok(after.filter((n) => n.id.endsWith("b") && n.startTick >= verse.start * BAR && n.startTick < verse.end * BAR).every((n) => scale.has(n.pitch % 12)));
  // Section外は変わらない
  assert.deepEqual(after.filter((n) => n.startTick < verse.start * BAR || n.startTick >= verse.end * BAR), before.filter((n) => n.startTick < verse.start * BAR || n.startTick >= verse.end * BAR));
  // 音階外の音（C#）は触らない
  const chromatic = JSON.parse(JSON.stringify(project));
  chromatic.tracks.find((t) => t.role === "melody").notes.find((n) => n.id === `m${verse.start}b`).pitch = 73;
  const c = applySectionVariation(chromatic, verse.index, "melody-pitch");
  assert.equal(c.project.tracks.find((t) => t.role === "melody").notes.find((n) => n.id === `m${verse.start}b`).pitch, 73);
  assert.equal(c.changed, 7);
}

// --- メロディのリズムだけ: 音程と順番は不変・2つ目の拍頭の音が8分後ろへ・重ならない・2回目は動かない
{
  const { project: out, changed } = applySectionVariation(project, verse.index, "melody-rhythm");
  assert.equal(changed, 8);
  const before = notesOf(project, "melody");
  const after = notesOf(out, "melody");
  assert.deepEqual(after.map((n) => n.id).sort(), before.map((n) => n.id).sort());
  const pitchOf = (list) => Object.fromEntries(list.map((n) => [n.id, n.pitch]));
  assert.deepEqual(pitchOf(after), pitchOf(before), "pitches unchanged");
  const moved = after.find((n) => n.id === `m${verse.start}b`);
  assert.equal(moved.startTick, verse.start * BAR + STEP * 10);
  assert.ok(moved.durationTick <= STEP * 4);
  assert.equal(after.find((n) => n.id === `m${verse.start}a`).startTick, verse.start * BAR, "first note stays");
  const sorted = [...after].sort((a, b) => a.startTick - b.startTick);
  for (let i = 1; i < sorted.length; i += 1) assert.ok(sorted[i - 1].startTick + sorted[i - 1].durationTick <= sorted[i].startTick, "no overlap");
  const again = applySectionVariation(out, verse.index, "melody-rhythm");
  assert.equal(again.changed, 0);
  // 次の音に近すぎる（後ろに1stepも残らない）ときは動かさない
  const tight = JSON.parse(JSON.stringify(project));
  const tm = tight.tracks.find((t) => t.role === "melody").notes;
  tm.push({ id: "tight", pitch: 70, startTick: verse.start * BAR + STEP * 9, durationTick: STEP, velocity: 90 });
  const t2 = applySectionVariation(tight, verse.index, "melody-rhythm");
  assert.equal(t2.project.tracks.find((t) => t.role === "melody").notes.find((n) => n.id === `m${verse.start}b`).startTick, verse.start * BAR + STEP * 8);
}

// --- 空のSectionや入力が無いパートでは changed=0
{
  const empty = createProjectStore(createDefaultProject());
  empty.applySectionTemplate("one-chorus");
  const e = empty.getSnapshot();
  ["drums", "bass", "melody", "melody-pitch", "melody-rhythm"].forEach((id) => assert.equal(applySectionVariation(e, 1, id).changed, 0, id));
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
