import assert from "node:assert/strict";
import { duplicateProjectSnapshot } from "../src/core/project-copy.js";
import {
  PROJECT_OPEN_REQUEST_KEY,
  completePendingProjectOpen,
  queueProjectOpen
} from "../src/hub/project-list.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

const source = {
  schemaVersion: 2,
  appVersion: "v0.2-dev",
  id: "source-id",
  revision: 19,
  metadata: { title: "テスト曲", genre: "pop", mood: ["bright"], memo: "memo" },
  basic: { bpm: 128, key: "D", scale: "major", timeSignature: "4/4", ppq: 480 },
  structure: { sections: [] },
  chords: [{ root: 2, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }],
  tracks: [{ role: "melody", notes: [{ id: "n1", pitch: 74, startTick: 0, durationTick: 240, velocity: 80 }] }],
  instruments: [],
  progress: {},
  exportSettings: {}
};

const copy = duplicateProjectSnapshot(source, [source], { createId: () => "copy-id" });
assert.equal(copy.id, "copy-id");
assert.equal(copy.revision, 1);
assert.equal(copy.metadata.title, "テスト曲 のコピー");
assert.deepEqual(copy.chords, source.chords);
assert.deepEqual(copy.tracks, source.tracks);
assert.equal(source.id, "source-id");
assert.equal(source.revision, 19, "source must not be mutated");

const secondCopy = duplicateProjectSnapshot(source, [source, copy], { createId: () => "copy-id-2" });
assert.equal(secondCopy.metadata.title, "テスト曲 のコピー (2)");

const storage = memoryStorage();
queueProjectOpen("target-id", storage);
assert.equal(storage.getItem(PROJECT_OPEN_REQUEST_KEY), "target-id");

const activated = [];
const completed = await completePendingProjectOpen({
  storage,
  setActive: async (projectId) => activated.push(projectId),
  wait: async () => {}
});
assert.equal(completed, true);
assert.deepEqual(activated, ["target-id", "target-id"]);
assert.equal(storage.getItem(PROJECT_OPEN_REQUEST_KEY), null);

assert.throws(() => queueProjectOpen("", storage), /指定/);

console.log("project library smoke test passed.");
