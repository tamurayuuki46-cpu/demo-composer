import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import {
  applyStartingPointConfirmText,
  buildStartingPointPatch,
  GENRES,
  previewProject,
  progressionNames,
  MOODS,
  STARTING_POINTS,
  suggestStartingPoints
} from "../src/hub/starting-point.js";

// 全ジャンル・全Moodに、2つ以上の出発点がある
for (const g of GENRES) assert.ok(STARTING_POINTS.filter((p) => p.genre === g.id).length >= 2, g.id);
for (const m of MOODS) assert.ok(STARTING_POINTS.filter((p) => p.moods.includes(m.id)).length >= 2, m.id);
assert.equal(new Set(STARTING_POINTS.map((p) => p.id)).size, STARTING_POINTS.length);

// 候補は常に3つ・重複なし。ジャンル×Moodが合うものが先頭
for (const g of ["", ...GENRES.map((x) => x.id)]) {
  for (const m of ["", ...MOODS.map((x) => x.id)]) {
    const list = suggestStartingPoints({ genre: g, mood: m });
    assert.equal(list.length, 3, `${g}/${m}`);
    assert.equal(new Set(list.map((p) => p.id)).size, 3);
  }
}
const ballad = suggestStartingPoints({ genre: "ballad", mood: "sad" });
assert.equal(ballad[0].id, "ballad-sad");
assert.equal(ballad[0].matched, "genre+mood");
assert.ok(suggestStartingPoints({ genre: "rock" }).slice(0, 2).every((p) => p.genre === "rock"));

// 適用: 全レシピがProjectとして成立する
for (const point of STARTING_POINTS) {
  const store = createProjectStore(createDefaultProject());
  const next = store.applyStartingPoint(buildStartingPointPatch(store.getSnapshot(), point));
  assert.equal(next.basic.key, point.key);
  assert.equal(next.basic.scale, point.scale);
  assert.equal(next.basic.bpm, point.bpm);
  assert.equal(next.chords.length, point.degrees.length, point.id);
  assert.ok(next.tracks.find((t) => t.role === "drums").notes.length > 0);
  assert.equal(next.instruments.some((i) => i.part === "chord-backing" && i.preset === point.backing), true);
  assert.ok(next.instruments.some((i) => i.part === "melody"));
}

// 1回の適用 = Undo 1回
const store = createProjectStore(createDefaultProject());
const point = STARTING_POINTS.find((p) => p.id === "ballad-sad");
store.applyStartingPoint(buildStartingPointPatch(store.getSnapshot(), point, { mood: "sad" }));
const after = store.getSnapshot();
assert.equal(after.metadata.genre, "バラード");
assert.deepEqual(after.metadata.mood, ["切ない"]);
assert.equal(after.chords[0].degree, "i");
store.undo();
const undone = store.getSnapshot();
assert.equal(undone.chords.length, 0);
assert.equal(undone.basic.bpm, 120);

// 確認文: 空なら null、コードやドラムがあれば出る。メロは残す旨
assert.equal(applyStartingPointConfirmText(createDefaultProject(), point), null);
assert.ok(applyStartingPointConfirmText(after, point).includes("コード進行"));

// 既存ドラムのうち、出発点の小節数より後ろは残る
const long = createProjectStore(createDefaultProject());
long.applyStartingPoint(buildStartingPointPatch(long.getSnapshot(), STARTING_POINTS.find((p) => p.id === "pop-bright")));
const drums1 = long.getSnapshot().tracks.find((t) => t.role === "drums").notes;
const extra = [...drums1, { id: "x", pitch: 36, startTick: 1920 * 6, durationTick: 120, velocity: 100 }];
const patched = buildStartingPointPatch({ ...long.getSnapshot(), tracks: [{ ...long.getSnapshot().tracks.find((t) => t.role === "drums"), notes: extra }] }, point);
assert.ok(patched.drumNotes.some((n) => n.id === "x"));

// Bassがあると適用できない
const withBass = createProjectStore(createDefaultProject());
withBass.updateChords([{ startTick: 0, durationTick: 1920, root: 0, quality: "major", degree: "I" }]);
withBass.updateRhythmNotes({ bassNotes: [{ id: "b", pitch: 36, startTick: 0, durationTick: 480, velocity: 90 }], drumNotes: [] });
assert.throws(() => withBass.applyStartingPoint(buildStartingPointPatch(withBass.getSnapshot(), point)), /Bass/);

// 試聴用の仮Project: 元は変わらず、コードとドラムが入り、Bassは外れる
const base = createDefaultProject();
const pv = previewProject(base, point);
assert.equal(base.chords.length, 0);
assert.equal(pv.chords.length, 4);
assert.equal(pv.basic.bpm, 68);
assert.ok(pv.tracks.find((t) => t.role === "drums").notes.length > 0);
assert.equal(progressionNames(point), "Dm → A# → F → C");

console.log("starting-point smoke test passed");
