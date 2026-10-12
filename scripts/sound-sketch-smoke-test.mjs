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
assert.ok(SOUND_PARTS.every((part) => part.presets.length >= 6), "each part should offer many presets");
assert.deepEqual(SOUND_PARTS[0].presets.slice(0, 3).map((p) => p.id), ["keys", "pad", "piano"], "既存のChord Presetは先頭のまま");
assert.deepEqual(SOUND_PARTS[1].presets.slice(0, 3).map((p) => p.id), ["lead", "keys", "pluck"], "既存のMelody Presetは先頭のまま");
assert.deepEqual(SOUND_PARTS[2].presets.slice(0, 3).map((p) => p.id), ["soft-bass", "synth-bass", "deep-bass"], "既存のBass Presetは先頭のまま");
SOUND_PARTS.forEach((part) => {
  assert.equal(new Set(part.presets.map((p) => p.id)).size, part.presets.length, `${part.id} preset ids are unique`);
  assert.ok(part.presets.some((p) => p.id === part.defaultPreset));
});
assert.ok(SOUND_TONES.length >= 6, "tone direction tags should be available");
assert.equal(DEFAULT_SOUND_SELECTIONS.length, 3);

const project = createDefaultProject();
assert.deepEqual(getSoundSelection(project.instruments, "chord"), {
  part: "chord",
  preset: "pad",
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
assert.equal(store.getHistoryState().canUndo, true, "sound change should be undoable");
store.undo();
assert.deepEqual(store.getSnapshot().instruments, [], "undo should restore previous sound selections");
store.redo();
assert.equal(getSoundSelection(store.getSnapshot().instruments, "melody").preset, "lead", "redo should restore sound selection");

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

// ---- ボカロ風などの声に近い音色
assert.equal(SOUND_PARTS[1].defaultPreset, "strings-lead", "Melodyの初期音色はStrings Lead");
assert.equal(SOUND_PARTS[0].defaultPreset, "pad", "Chordの初期音色はPad");
assert.equal(SOUND_PARTS[2].defaultPreset, "deep-bass", "Bassの初期音色はDeep Bass");
assert.equal(getSoundSelection([], "melody").preset, "strings-lead");
const vocal = resolveSoundProfile([{ part: "melody", preset: "vocal", tone: "natural" }], "melody");
assert.ok(vocal.layers.length >= 2 && vocal.vibrato.rate > 0 && vocal.formants.length >= 2, "声の重ね合わせ / ビブラート / 母音");
const plain = resolveSoundProfile([{ part: "melody", preset: "lead", tone: "natural" }], "melody");
assert.equal(plain.layers, null, "従来Presetは波形1つのまま");
assert.equal(plain.vibrato, null);
assert.equal(plain.formants, null);
for (const part of SOUND_PARTS) for (const preset of part.presets) {
  if (!preset.layers) continue;
  const sum = preset.layers.reduce((total, layer) => total + (layer.gain ?? 1 / preset.layers.length), 0);
  assert.ok(sum > 0.9 && sum < 1.1, `${part.id}/${preset.id}: layer gains sum to about 1`);
}
// 知らないPreset（将来のアプリで保存したもの）は、初期音色に戻るだけで壊れない
assert.equal(getSoundSelection([{ part: "melody", preset: "future-voice", tone: "natural" }], "melody").preset, "strings-lead");

console.log("Sound Sketch smoke test passed.");
