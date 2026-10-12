import assert from "node:assert/strict";
import { chordMoodPanelHtml } from "../src/chord/chord-mood-ui.js";

const empty = chordMoodPanelHtml({ mode: "major", tags: [] });
assert.match(empty, /曲想から選ぶ/);
assert.match(empty, /感情/);
assert.match(empty, /質感/);
assert.match(empty, /場面/);
assert.match(empty, /1〜3個/);

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
