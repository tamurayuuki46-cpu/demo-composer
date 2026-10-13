import assert from "node:assert/strict";
import {
  getCompositionIntent,
  setCompositionIntent,
  subscribeCompositionIntent,
  syncCompositionIntentFromProject
} from "../src/core/composition-intent.js";

const seen = [];
const unsubscribe = subscribeCompositionIntent((intent) => seen.push(intent));

assert.deepEqual(getCompositionIntent().moodValues, []);

syncCompositionIntentFromProject({
  metadata: { mood: ["切ない", "夜", "浮遊感"] }
});
assert.deepEqual(getCompositionIntent().moodValues, ["切ない", "夜", "浮遊感"]);
const afterFirstSync = seen.length;

// 同じProject意図をHubが再描画しても通知を増やさない。
syncCompositionIntentFromProject({
  metadata: { mood: ["切ない", "夜", "浮遊感"] }
});
assert.equal(seen.length, afterFirstSync);

// Project側の曲想が変わったときだけ通知する。
syncCompositionIntentFromProject({ metadata: { mood: ["明るい"] } });
assert.deepEqual(getCompositionIntent().moodValues, ["明るい"]);
assert.equal(seen.length, afterFirstSync + 1);

// 作曲シート等の将来入力も同じ共有層へ渡せる。
setCompositionIntent({ moodValues: ["希望", "希望", " 青春 "], source: "composition-sheet" });
assert.deepEqual(getCompositionIntent(), {
  moodValues: ["希望", "青春"],
  source: "composition-sheet"
});

unsubscribe();
console.log("Composition intent smoke test passed.");
