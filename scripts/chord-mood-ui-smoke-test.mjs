import assert from "node:assert/strict";
import { chordMoodPanelHtml, intentMoodTagIds, moodPickerHtml } from "../src/chord/chord-mood-ui.js";
import { chordPresetsForTags, CHORD_MOOD_TAG_GROUPS } from "../src/chord/chord-mood-tags.js";

const count = (html, pattern) => (html.match(pattern) ?? []).length;

assert.deepEqual(
  intentMoodTagIds(["切ない", "夜", "浮遊感", "やさしい"]),
  ["sad", "night", "floating"],
  "Hub / 作曲シートの日本語曲想を既存Chordタグへ変換し、初期選択は3個までにする"
);
assert.deepEqual(intentMoodTagIds(["bright", "優しい"]), ["bright", "gentle"]);

// 何も選んでいない: 3タブ + 説明。一覧は出ない
const empty = chordMoodPanelHtml({ mode: "major", tags: [], intentValues: [], group: null });
assert.match(empty, /曲想から選ぶ/);
assert.equal(count(empty, /data-chord-tab=/g), 3);
assert.match(empty, /感情/);
assert.match(empty, /質感/);
assert.match(empty, /場面/);
assert.match(empty, /複数OK/);
assert.equal(count(empty, /data-chord-mood-preset=/g), 0);
assert.equal(count(empty, /data-chord-mood-tag=/g), 0, "タブを開くまでタグは出さない");

// Hubから引き継いだ3タグ: 選択中にタブをまたいで3つ全部見える（どのタブを開いていても）
const inherited = chordMoodPanelHtml({
  mode: "major",
  tags: ["sad", "night", "floating"],
  intentValues: ["切ない", "夜", "浮遊感"],
  group: "emotion"
});
assert.match(inherited, /Hubの曲想から自動選択/);
assert.match(inherited, /切ない・夜・浮遊感/);
assert.match(inherited, /選択中 3\//);
assert.equal(count(inherited, /class="mood-pill /g), 3, "選択中のタグが3つ常に見える");
for (const group of ["emotion", "texture", "scene", null]) {
  const html = moodPickerHtml({ tags: ["sad", "night", "floating"], group, mode: "major", key: "C" });
  assert.equal(count(html, /class="mood-pill /g), 3, `${group}タブでも選択中の3つが見える`);
}

const adjusted = chordMoodPanelHtml({ mode: "major", tags: ["sad", "night"], intentValues: ["切ない", "夜", "浮遊感"], adjusted: true });
assert.match(adjusted, /Chordで調整中/);

// 開いているタブのタグだけが並ぶ。選んだタグは on
const scene = moodPickerHtml({ tags: ["night"], group: "scene", mode: "major", key: "C" });
assert.equal(count(scene, /class="mood-chip[" ]/g), CHORD_MOOD_TAG_GROUPS.scene.length);
assert.equal(count(scene, /mood-chip on/g), 1);

// 複数選択の一覧: 全部のタグに合う進行だけ（無ければ最も多く合う進行）
const major = chordMoodPanelHtml({ mode: "major", tags: ["bright", "hope", "youth"], group: null });
assert.ok(count(major, /data-chord-mood-preset=/g) >= 1 && count(major, /data-chord-mood-preset=/g) <= 10);
assert.match(major, /使う/);
const minor = chordMoodPanelHtml({ mode: "minor", tags: ["dark", "tension", "night"], group: null });
assert.ok(count(minor, /data-chord-mood-preset=/g) >= 1);

const one = chordPresetsForTags(["sad"], { mode: "major" });
const two = chordPresetsForTags(["sad", "night"], { mode: "major" });
assert.ok(one.rows.length >= two.rows.length, "タグを足すと絞り込まれる（増えない）");
if (two.matchedAll) assert.ok(two.rows.every((row) => row.matchedCount === 2));
const none = chordPresetsForTags(["sad", "bright", "tension", "night", "rain"], { mode: "major" });
assert.ok(none.rows.length > 0, "全部に合う進行が無くても、近い進行を返す");
assert.equal(chordPresetsForTags([], { mode: "major" }).rows.length, 0);

// 「すべて外す」は選択中があるときだけ出る
assert.match(moodPickerHtml({ tags: ["sad"], group: null }), /data-chord-mood-clear/);
assert.ok(!/data-chord-mood-clear/.test(moodPickerHtml({ tags: [], group: null })));

console.log("Chord mood UI smoke test passed.");
