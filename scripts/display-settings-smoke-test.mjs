import assert from "node:assert/strict";
import { TEXT_SIZES, applyTextSize, loadTextSize, normalizeTextSize, saveTextSize } from "../src/core/display-settings.js";

assert.deepEqual(TEXT_SIZES.map((s) => s.id), ["normal", "large", "xlarge"]);
assert.equal(normalizeTextSize("large"), "large");
assert.equal(normalizeTextSize("huge"), "normal");
assert.equal(normalizeTextSize(undefined), "normal");

const store = new Map();
const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
assert.equal(loadTextSize(storage), "normal", "default");
saveTextSize("xlarge", storage);
assert.equal(loadTextSize(storage), "xlarge");
store.set("demo-composer.textSize", "broken");
assert.equal(loadTextSize(storage), "normal", "invalid value falls back");

// localStorageが使えない環境でも落ちない
const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
assert.equal(loadTextSize(broken), "normal");
saveTextSize("large", broken);

const root = { dataset: {} };
applyTextSize("large", root);
assert.equal(root.dataset.textSize, "large");
applyTextSize("nope", root);
assert.equal(root.dataset.textSize, "normal");

console.log("display settings smoke test passed");
