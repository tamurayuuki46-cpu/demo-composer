import assert from "node:assert/strict";
import {
  buildLabel,
  clearDemoComposerShellCaches,
  isNewerBuild,
} from "../src/core/update-notice.js";

assert.equal(isNewerBuild("dev", "abc"), false, "開発版は通知しない");
assert.equal(isNewerBuild("abc1234", "abc1234"), false);
assert.equal(isNewerBuild("abc1234", "def5678"), true);
assert.equal(isNewerBuild("abc1234", ""), false);
assert.equal(buildLabel("dev", ""), "開発版");
assert.match(buildLabel("abc1234", "2026-10-12T10:50:00.000Z"), /^abc1234・\d+\/\d+ \d\d:\d\d$/);

const deleted = [];
globalThis.caches = {
  async keys() {
    return [
      "demo-composer-shell-old1234",
      "demo-composer-shell-new5678",
      "arranger-v0.5-shell",
      "unrelated-cache",
    ];
  },
  async delete(key) {
    deleted.push(key);
    return true;
  },
};

await clearDemoComposerShellCaches();
assert.deepEqual(deleted.sort(), [
  "demo-composer-shell-new5678",
  "demo-composer-shell-old1234",
]);
delete globalThis.caches;

console.log("Update notice smoke test passed.");
