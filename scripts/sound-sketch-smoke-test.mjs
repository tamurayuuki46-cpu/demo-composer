import assert from "node:assert/strict";
import {
  DEFAULT_SOUND_SELECTIONS,
  getSoundSelection,
  resolveSoundProfile,
  SOUND_PARTS,
  SOUND_TONES,
  upsertSoundSelection
} from "../src/core/sound-presets.js";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";

assert.equal(SOUND_PARTS.length, 3, "Sound Sketch Lite should expose three parts");
assert.deepEqual(SOUND_PARTS.map((part) => part.id), ["chord", "melody", "bass"]);
assert.ok(SOUND_PARTS.every((part) => part.presets.length === 3), "each part should offer three presets");
assert.ok(SOUND_TONES.length >= 6, "tone direction tags should be available");
assert.equal(DEFAULT_SOUND_SELECTIONS.length, 3);

const project = createDefaultProject();
assert.deepEqual(getSoundSelection(project.instruments, "chord"), {
  part: "chord",
  preset: "keys",
  tone: "natural"
});

const store = createProjectStore(project);
const next = upsertSoundSelection(store.getSnapshot().instruments, {
  part: "melody",
  preset: "lead",
  tone: "bright"
});
store.updateInstruments(next);
const saved = store.getSnapshot();
assert.deepEqual(getSoundSelection(saved.instruments, "melody"), {
  part: "melody",
  preset: "lead",
  tone: "bright"
});
assert.equal(saved.revision, 2, "sound change should increment revision");

for (const part of SOUND_PARTS) {
  for (const preset of part.presets) {
    for (const tone of SOUND_TONES) {
      const instruments = [{ part: part.id, preset: preset.id, tone: tone.id }];
      const profile = resolveSoundProfile(instruments, part.id);
      assert.ok(["sine", "triangle", "square", "sawtooth"].includes(profile.waveform));
      assert.ok(profile.filter >= 180 && profile.filter <= 12000);
      assert.ok(profile.attack > 0);
      assert.ok(profile.release > 0);
      assert.ok(profile.gain > 0 && profile.gain <= 0.35);
    }
  }
}

console.log("Sound Sketch smoke test passed.");
