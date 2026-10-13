import assert from "node:assert/strict";
import {
  NEW_PROJECT_REQUEST_KEY,
  clearNewProjectRequest,
  completePendingNewProject,
  queueNewProject
} from "../src/hub/new-project.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const storage = memoryStorage();
const queued = queueNewProject({
  storage,
  createProject: () => ({ id: "new-project", revision: 1, metadata: { title: "Untitled Project" } })
});
assert.equal(queued.id, "new-project");
assert.ok(storage.getItem(NEW_PROJECT_REQUEST_KEY), "request is stored for the reload boundary");

const saves = [];
const waits = [];
const completed = await completePendingNewProject({
  storage,
  save: async (project) => saves.push(structuredClone(project)),
  wait: async (ms) => waits.push(ms)
});
assert.equal(completed, true);
assert.equal(saves.length, 2, "new project is saved twice to win any old-page visibility autosave race");
assert.equal(saves[0].id, "new-project");
assert.deepEqual(waits, [180, 80]);
assert.equal(storage.getItem(NEW_PROJECT_REQUEST_KEY), null, "request is cleared after successful switch");

assert.equal(await completePendingNewProject({ storage, save: async () => {} }), false, "no request is a no-op");

storage.setItem(NEW_PROJECT_REQUEST_KEY, "not-json");
await assert.rejects(
  () => completePendingNewProject({ storage, save: async () => {}, wait: async () => {} }),
  /準備データが壊れていた/
);
assert.equal(storage.getItem(NEW_PROJECT_REQUEST_KEY), null, "broken request is cleared");

storage.setItem(NEW_PROJECT_REQUEST_KEY, JSON.stringify({ id: "pending" }));
clearNewProjectRequest(storage);
assert.equal(storage.getItem(NEW_PROJECT_REQUEST_KEY), null);

console.log("New project smoke test passed");
