import assert from "node:assert/strict";
import { CHORD_PRESETS } from "../src/chord/chord-presets.js";
import {
  CHORD_MOOD_PROFILES,
  CHORD_MOOD_TAGS,
  chordMoodProfile,
  recommendChordPresetsByMood
} from "../src/chord/chord-mood-tags.js";

assert.equal(CHORD_MOOD_PROFILES.length, CHORD_PRESETS.length, "全Chord PresetにMood Profileが必要");
assert.ok(CHORD_MOOD_TAGS.some((tag) => tag.id === "sad" && tag.label === "切ない"));
assert.ok(CHORD_MOOD_TAGS.some((tag) => tag.id === "night" && tag.label === "夜"));

const jpop = chordMoodProfile("jpop-4536");
assert.ok(jpop, "既存J-POP 4536のProfileが必要");
assert.ok(jpop.tags.some((tag) => tag.id === "sad"), "J-POP 4536は切ないタグに紐付く");

const bright = recommendChordPresetsByMood(["bright", "hope", "youth"], {
  mode: "major",
  limit: 3
});
assert.equal(bright.length, 3, "Majorの曲想候補は3案返す");
assert.ok(bright.every((item) => item.mode === "major"));
assert.ok(bright.some((item) => item.matchedTags.some((tag) => tag.id === "bright")));

const dark = recommendChordPresetsByMood(["dark", "tension", "night"], {
  mode: "minor",
  limit: 3
});
assert.equal(dark.length, 3, "Minorの曲想候補は3案返す");
assert.ok(dark.every((item) => item.mode === "minor"));
assert.ok(dark[0].matchedTags.length >= 2);

assert.deepEqual(recommendChordPresetsByMood([], { mode: "major" }), []);
assert.deepEqual(recommendChordPresetsByMood(["unknown-tag"], { mode: "major" }), []);

console.log(`Chord mood tags OK: ${CHORD_MOOD_PROFILES.length} presets linked.`);

// 曲想を1つ選んで一覧
{
  const { chordPresetsForEmotion } = await import("../src/chord/chord-mood-tags.js");
  const sad = chordPresetsForEmotion("sad", { mode: "major" });
  assert.ok(sad.length >= 5);
  assert.ok(sad.every((row) => row.mode === "major" && row.weight >= 3));
  assert.ok(sad.every((row, index) => index === 0 || sad[index - 1].weight >= row.weight));
  assert.deepEqual(chordPresetsForEmotion("floating"), []); // 質感・場面のタグは曲想の一覧には使わない
  assert.deepEqual(chordPresetsForEmotion("nope"), []);
  const minorSad = chordPresetsForEmotion("sad", { mode: "minor" });
  assert.ok(minorSad.every((row) => row.mode === "minor"));
  const all = chordPresetsForEmotion("bright", { mode: "any", minWeight: 0 });
  assert.equal(all.length, 100);

  // 質感・場面もタブごとに1つ選んで一覧にできる
  const { chordPresetsForTag, CHORD_MOOD_TAG_GROUPS: groups } = await import("../src/chord/chord-mood-tags.js");
  for (const group of ["texture", "scene"]) {
    const withRows = groups[group].filter((tag) => chordPresetsForTag(tag.id, { mode: "major" }).length > 0);
    assert.ok(withRows.length >= 3, `${group}: 一覧が出るタグが複数ある`);
  }
  assert.ok(chordPresetsForTag("floating", { mode: "major" }).length > 0);
  assert.deepEqual(chordPresetsForTag("nope"), []);
}
