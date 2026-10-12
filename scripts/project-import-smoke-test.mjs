import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { parseProjectJson } from "../src/storage/project-import.js";

const BAR = 1920;
const source = createProjectStore(createDefaultProject());
source.updateHub({ metadata: { title: "Backup曲" }, basic: { bpm: 140 } });
source.updateChords([{ startTick: 0, durationTick: BAR, root: 0, quality: "major", degree: "I" }]);
source.applySectionTemplate("loop-8");
const json = JSON.stringify(source.getSnapshot(), null, 2);

// 正常: 書き出したJSONを読み込める
const parsed = parseProjectJson(json);
assert.equal(parsed.metadata.title, "Backup曲");

// schemaVersion 1も現行へ移行して読める
const v1 = JSON.parse(json); v1.schemaVersion = 1;
assert.equal(parseProjectJson(JSON.stringify(v1)).schemaVersion, 3);

// 不正データは日本語のErrorで拒否
assert.throws(() => parseProjectJson("not json"), /project\.json/);
assert.throws(() => parseProjectJson("[]"), /Demo Composer/);
assert.throws(() => parseProjectJson('{"hello":1}'), /Demo Composer/);
assert.throws(() => parseProjectJson(JSON.stringify({ ...JSON.parse(json), schemaVersion: 99 })), /読み込めません/);
assert.throws(() => parseProjectJson(JSON.stringify({ ...JSON.parse(json), chords: "x" })), /読み込めません/);

// Storeへの置換: idは維持、revisionは増加、Undoで戻せる
const target = createProjectStore(createDefaultProject());
target.updateHub({ metadata: { title: "いまの曲" } });
const before = target.getSnapshot();
target.replaceProject(parsed);
const after = target.getSnapshot();
assert.equal(after.id, before.id, "id is kept");
assert.ok(after.revision > before.revision);
assert.equal(after.metadata.title, "Backup曲");
assert.equal(after.chords.length, 1);
assert.equal(after.structure.sections.length, 1);
target.undo();
assert.equal(target.getSnapshot().metadata.title, "いまの曲", "undo restores previous project");

// 不正なProjectでは状態が変わらない
const broken = { ...parsed, chords: "x" };
assert.throws(() => target.replaceProject(broken));
assert.equal(target.getSnapshot().metadata.title, "いまの曲");
console.log("project import smoke test passed");
