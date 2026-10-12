import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import {
  canShareFiles,
  midiShareFiles,
  midiShareFilesAsText,
  projectJsonShareFile,
  shareFiles
} from "../src/hub/drive-export.js";

class FakeFile {
  constructor(parts, name, options = {}) {
    this.parts = parts;
    this.name = name;
    this.type = options.type ?? "";
  }
}

const project = createDefaultProject();
project.metadata.title = "Drive Test";

const jsonFile = projectJsonShareFile(project, FakeFile);
assert.equal(jsonFile.name, "project.json.txt");
assert.equal(jsonFile.type, "text/plain");

assert.match(String(jsonFile.parts[0]), /Drive Test/);

const midiFiles = midiShareFiles(project, FakeFile);
assert.ok(midiFiles.length >= 5);
assert.ok(midiFiles.some((file) => file.name === "Song.mid"));
assert.ok(midiFiles.every((file) => file.type === "audio/midi"));

let sharedPayload = null;
const fakeNavigator = {
  canShare({ files }) {
    return Array.isArray(files) && files.length > 0;
  },
  share(payload) {
    sharedPayload = payload;
    return Promise.resolve();
  }
};

assert.equal(canShareFiles([jsonFile], fakeNavigator), true);
const shared = await shareFiles([jsonFile], {
  navigatorObject: fakeNavigator,
  title: "Drive Test"
});
assert.equal(shared.status, "shared");
assert.equal(sharedPayload.files[0].name, "project.json.txt");

const cancelled = await shareFiles([jsonFile], {
  navigatorObject: {
    canShare: () => true,
    share: () => Promise.reject(Object.assign(new Error("cancel"), { name: "AbortError" }))
  }
});
assert.equal(cancelled.status, "cancelled");

const unsupported = await shareFiles([jsonFile], { navigatorObject: {} });
assert.equal(unsupported.status, "unsupported");

console.log("Drive export smoke test passed.");

{
  const txt = midiShareFilesAsText(project, FakeFile);
  assert.ok(txt.some((file) => file.name === "Song.mid.txt"));
  assert.ok(txt.every((file) => file.type === "text/plain"));
}
