import assert from "node:assert/strict";
import { chordMoodPanelHtml, intentMoodTagIds } from "../src/chord/chord-mood-ui.js";

assert.deepEqual(
  intentMoodTagIds(["切ない", "夜", "浮遊感", "やさしい"]),
  ["sad", "night", "floating"],
  "Hub / 作曲シートの日本語曲想を既存Chordタグへ変換し、初期選択は3個までにする"
);
assert.deepEqual(intentMoodTagIds(["bright", "優しい"]), ["bright", "gentle"]);

const empty = chordMoodPanelHtml({ mode: "major", tags: [], intentValues: [] });
assert.match(empty, /曲想から選ぶ/);
assert.match(empty, /感情/);
assert.match(empty, /質感/);
assert.match(empty, /場面/);
assert.match(empty, /1〜3個/);

const inherited = chordMoodPanelHtml({
  mode: "major",
  tags: ["sad", "night", "floating"],
  intentValues: ["切ない", "夜", "浮遊感"]
});
assert.match(inherited, /Hubの曲想から自動選択/);
assert.match(inherited, /切ない・夜・浮遊感/);
assert.equal((inherited.match(/data-chord-mood-preset=/g) ?? []).length, 3);

const adjusted = chordMoodPanelHtml({
  mode: "major",
  tags: ["sad", "night"],
  intentValues: ["切ない", "夜", "浮遊感"],
  adjusted: true
});
assert.match(adjusted, /Chordで調整中/);

const major = chordMoodPanelHtml({ mode: "major", tags: ["bright", "hope", "youth"] });
assert.equal((major.match(/data-chord-mood-preset=/g) ?? []).length, 3, "Majorで3候補を表示する");
assert.match(major, /明るい/);
assert.match(major, /希望/);
assert.match(major, /青春/);
assert.match(major, /この進行を使う/);

const minor = chordMoodPanelHtml({ mode: "minor", tags: ["dark", "tension", "night"] });
assert.equal((minor.match(/data-chord-mood-preset=/g) ?? []).length, 3, "Minorで3候補を表示する");
assert.match(minor, /ダーク/);
assert.match(minor, /緊張/);
assert.match(minor, /夜/);

console.log("Chord mood UI smoke test passed.");
