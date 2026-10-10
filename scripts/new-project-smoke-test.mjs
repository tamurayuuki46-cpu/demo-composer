import assert from "node:assert/strict";
import { beginNewProject } from "../src/hub/new-project.js";

const current = {
  metadata: { title: "Saved Song" }
};

const projectStore = {
  getSnapshot() {
    return structuredClone(current);
  }
};

let stopped = 0;
let flushed = 0;
let savedProject = null;
let reloaded = 0;

const result = await beginNewProject({
  projectStore,
  autosave: {
    async flush() {
      flushed += 1;
      return true;
    }
  },
  stopPlayback() {
    stopped += 1;
  },
  confirmFn(message) {
    assert.match(message, /Saved Song/);
    return true;
  },
  createProject() {
    return { id: "new-project", metadata: { title: "Untitled Project" } };
  },
  async save(project) {
    savedProject = structuredClone(project);
  },
  reload() {
    reloaded += 1;
  }
});

assert.equal(result.created, true);
assert.equal(result.project.id, "new-project");
assert.equal(flushed, 1, "current project is flushed before switching");
assert.equal(stopped, 1, "playback stops before switching");
assert.equal(savedProject.id, "new-project", "new project becomes the saved active project");
assert.equal(reloaded, 1, "app reloads into the new active project");

let cancelledSave = 0;
const cancelled = await beginNewProject({
  projectStore,
  autosave: { async flush() { throw new Error("should not flush"); } },
  confirmFn: () => false,
  save: async () => { cancelledSave += 1; },
  reload: () => { throw new Error("should not reload"); }
});
assert.deepEqual(cancelled, { created: false, reason: "cancelled" });
assert.equal(cancelledSave, 0);

await assert.rejects(
  () => beginNewProject({
    projectStore,
    autosave: { async flush() { return false; } },
    confirmFn: () => true,
    save: async () => { throw new Error("should not save new project"); },
    reload: () => { throw new Error("should not reload"); }
  }),
  /現在のProjectを保存できなかった/
);

console.log("New project smoke test passed");
