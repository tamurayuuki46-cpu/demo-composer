import assert from "node:assert/strict";
import { duplicateProjectRecord, sortProjectRecords } from "../src/storage/project-records.js";
import {
  PROJECT_SWITCH_REQUEST_KEY,
  completePendingProjectSwitch,
  queueProjectSwitch
} from "../src/hub/project-list.js";

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const source = {
  schemaVersion: 2,
  appVersion: "v0.2-dev",
  id: "project-a",
  revision: 14,
  metadata: { title: "曲A", genre: "", mood: [], memo: "" },
  basic: { bpm: 120, key: "C", scale: "major", timeSignature: "4/4", ppq: 480 },
  structure: { sections: [] },
  chords: [{ root: 0, quality: "major", degree: "I", startTick: 0, durationTick: 1920 }],
  tracks: [],
  instruments: [],
  progress: {},
  exportSettings: {}
};

const duplicated = duplicateProjectRecord(source, { createId: () => "project-copy" });
assert.equal(duplicated.id, "project-copy");
assert.equal(duplicated.revision, 1);
assert.equal(duplicated.metadata.title, "曲A コピー");
assert.deepEqual(duplicated.chords, source.chords);
assert.equal(source.id, "project-a");
assert.equal(source.metadata.title, "曲A");

const sorted = sortProjectRecords([
  { id: "b", metadata: { title: "B" } },
  { id: "a", metadata: { title: "A" } },
  { id: "current", metadata: { title: "Z" } }
], "current");
assert.deepEqual(sorted.map((project) => project.id), ["current", "a", "b"]);

const storage = fakeStorage();
queueProjectSwitch("project-b", storage);
assert.equal(storage.getItem(PROJECT_SWITCH_REQUEST_KEY), "project-b");

const activated = [];
const waits = [];
const switched = await completePendingProjectSwitch({
  storage,
  activate: async (projectId) => { activated.push(projectId); },
  wait: async (ms) => { waits.push(ms); }
});
assert.equal(switched, "project-b");
assert.deepEqual(activated, ["project-b", "project-b"]);
assert.deepEqual(waits, [180, 80]);
assert.equal(storage.getItem(PROJECT_SWITCH_REQUEST_KEY), null);

console.log("project list smoke test passed.");
