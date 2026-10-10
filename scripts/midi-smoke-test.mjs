import assert from "node:assert/strict";
import { buildMidiExports } from "../src/midi/midi-export.js";

const project = {
  basic: {
    bpm: 120,
    key: "C",
    scale: "major",
    timeSignature: "4/4",
    ppq: 480
  },
  chords: [
    { startTick: 0, durationTick: 1920, root: 0, quality: "major", degree: "I" }
  ],
  tracks: [
    {
      role: "melody",
      name: "Melody",
      midiChannel: 2,
      notes: [
        { id: "m1", pitch: 60, startTick: 0, durationTick: 240, velocity: 96 }
      ]
    },
    {
      role: "bass",
      name: "Bass",
      midiChannel: 3,
      notes: [
        { id: "b1", pitch: 36, startTick: 0, durationTick: 120, velocity: 96 }
      ]
    },
    {
      role: "drums",
      name: "Drums",
      midiChannel: 10,
      notes: [
        { id: "d1", pitch: 36, startTick: 0, durationTick: 120, velocity: 100 }
      ]
    }
  ]
};

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function uint16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

const files = buildMidiExports(project);
const expected = ["Song.mid", "Chord.mid", "Melody.mid", "Bass.mid", "Drums.mid"];

assert.deepEqual(Object.keys(files), expected);

for (const filename of expected) {
  const bytes = files[filename];
  assert.ok(bytes instanceof Uint8Array, `${filename} should be Uint8Array`);
  assert.equal(ascii(bytes, 0, 4), "MThd", `${filename} header`);
  assert.equal(uint16(bytes, 8), 1, `${filename} should be SMF Type 1`);
  assert.equal(uint16(bytes, 12), 480, `${filename} PPQ`);
  assert.ok(bytes.length > 30, `${filename} should contain track data`);
}

assert.equal(uint16(files["Song.mid"], 10), 5, "Song.mid should have 5 tracks");
assert.equal(uint16(files["Chord.mid"], 10), 2, "Chord.mid should have conductor + part");
assert.equal(uint16(files["Melody.mid"], 10), 2, "Melody.mid should have conductor + part");
assert.equal(uint16(files["Bass.mid"], 10), 2, "Bass.mid should have conductor + part");
assert.equal(uint16(files["Drums.mid"], 10), 2, "Drums.mid should have conductor + part");

console.log("MIDI smoke test passed.");
