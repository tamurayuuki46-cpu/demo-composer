import assert from "node:assert/strict";
import { buildLabel, isNewerBuild } from "../src/core/update-notice.js";
assert.equal(isNewerBuild("dev", "abc"), false, "開発版は通知しない");
assert.equal(isNewerBuild("abc1234", "abc1234"), false);
assert.equal(isNewerBuild("abc1234", "def5678"), true);
assert.equal(isNewerBuild("abc1234", ""), false);
assert.equal(buildLabel("dev", ""), "開発版");
assert.match(buildLabel("abc1234", "2026-10-12T10:50:00.000Z"), /^abc1234・\d+\/\d+ \d\d:\d\d$/);
console.log("Update notice smoke test passed.");
