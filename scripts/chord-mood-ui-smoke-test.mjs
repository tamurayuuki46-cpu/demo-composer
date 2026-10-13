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

// お気に入り（タグの組み合わせ）: 端末に保存。同じ組み合わせは1件にまとまる
{
  const { addMoodFavorite, removeMoodFavorite, loadMoodFavorites, isMoodFavorite, favoriteKey, MAX_FAVORITES } = await import("../src/chord/mood-favorites.js");
  const memory = new Map();
  const storage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  assert.deepEqual(loadMoodFavorites(storage), []);
  addMoodFavorite(["night", "sad"], storage);
  addMoodFavorite(["sad", "night"], storage); // 順番違いの同じ組み合わせ
  assert.equal(loadMoodFavorites(storage).length, 1, "同じ組み合わせは1件");
  assert.ok(isMoodFavorite(["sad", "night"], storage));
  addMoodFavorite(["bright"], storage);
  assert.deepEqual(loadMoodFavorites(storage)[0].tags, ["bright"], "新しく保存したものが先頭");
  assert.deepEqual(removeMoodFavorite(["night", "sad"], storage).map((f) => favoriteKey(f.tags)), ["bright"]);
  for (let i = 0; i < MAX_FAVORITES + 3; i += 1) addMoodFavorite([`t${i}`], storage);
  assert.equal(loadMoodFavorites(storage).length, MAX_FAVORITES, "上限を超えたら古いものから消える");
  assert.deepEqual(loadMoodFavorites({ getItem: () => "{broken" }), [], "壊れた保存データでも落ちない");
  assert.equal(loadMoodFavorites({ getItem: () => { throw new Error("blocked"); } }).length, 0, "localStorageが使えなくても落ちない");
  addMoodFavorite(["sad"], { getItem: () => null, setItem: () => { throw new Error("quota"); } });

  const withFav = moodPickerHtml({ tags: ["sad", "night"], group: null, favorites: [{ tags: ["night", "sad"] }, { tags: ["bright"] }] });
  assert.equal(count(withFav, /data-mood-fav-apply=/g), 2);
  assert.equal(count(withFav, /data-mood-fav-remove=/g), 2);
  assert.match(withFav, /★ 保存済み/, "いまの選択が保存済みなら★保存済み");
  const notSaved = moodPickerHtml({ tags: ["hope"], group: null, favorites: [{ tags: ["bright"] }] });
  assert.match(notSaved, /☆ お気に入りに保存/);
  assert.ok(!/data-mood-fav-save/.test(moodPickerHtml({ tags: [], group: null, favorites: [] })), "何も選んでいなければ保存ボタンは出ない");
}

console.log("Chord mood UI smoke test passed.");

// ▶ 聴く（試聴）: 一覧の各行に出る。試聴用の仮Projectは元を変えず、Bassを外して、そのPresetの長さで返す
{
  const { chordPresetAudition } = await import("../src/chord/chord-audition.js");
  const { createDefaultProject } = await import("../src/core/project-state.js");
  const html = moodPickerHtml({ tags: ["sad"], group: null, mode: "major", key: "C", favorites: [] });
  assert.equal(count(html, /data-chord-mood-audition=/g), count(html, /data-chord-mood-preset=/g), "各行に聴く");
  assert.ok(count(html, /data-chord-mood-audition=/g) >= 1);

  const project = createDefaultProject();
  project.chords = [{ root: 0, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }];
  const bass = project.tracks.find((t) => t.role === "bass");
  if (bass) bass.notes = [{ id: "b1", pitch: 36, startTick: 0, durationTick: 480, velocity: 96 }];
  const before = JSON.stringify(project);
  const result = chordPresetAudition(project, html.match(/data-chord-mood-audition="([^"]+)"/)[1]);
  assert.equal(JSON.stringify(project), before, "元のProjectは変えない");
  assert.ok(result.project.chords.length >= 2, "Presetのコードに置き換わる");
  assert.equal(result.lengthTick, result.project.chords.length * 1920);
  assert.equal(result.project.tracks.find((t) => t.role === "bass")?.notes.length ?? 0, 0, "Bassは外す");
}
