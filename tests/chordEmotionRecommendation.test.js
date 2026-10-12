import assert from "node:assert/strict";
import { recommendProgressions } from "../src/chord/recommendProgressions.js";

const floatingNight = recommendProgressions({
  emotion: ["切ない"],
  texture: ["浮遊感"],
  scene: ["夜"]
}, { mode: "major", limit: 3 });

assert.equal(floatingNight.length, 3);
assert.ok(floatingNight.every((item) => item.rawScore === undefined));
assert.ok(floatingNight.some((item) => item.matchedTags.some(({ tag }) => tag === "浮遊感")));
assert.ok(floatingNight.some((item) => item.matchedTags.some(({ tag }) => tag === "夜")));

const darkTension = recommendProgressions(["不安", "緊張", "ダーク"], {
  mode: "minor",
  limit: 3
});

assert.ok(darkTension.length >= 1);
assert.ok(darkTension.every((item) => item.mode === "minor" || item.mode === "mixed"));
assert.ok(darkTension[0].matchedTags.length >= 2);

assert.deepEqual(recommendProgressions([], { mode: "major" }), []);

console.log("Chord emotion recommendation tests passed.");
