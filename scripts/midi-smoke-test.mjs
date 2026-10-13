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
  structure: {
    sections: [
      { id: "s1", kind: "verse", name: "Verse", bars: 1 }
    ]
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
        { id: "m1", pitch: 60, startTick: 0, durationTick: 120, velocity: 96 },
        { id: "m2", pitch: 64, startTick: 120, durationTick: 120, velocity: 96 },
        { id: "m3", pitch: 67, startTick: 240, durationTick: 240, velocity: 96 }
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

function containsSequence(bytes, sequence) {
  for (let index = 0; index <= bytes.length - sequence.length; index += 1) {
    let matched = true;
    for (let offset = 0; offset < sequence.length; offset += 1) {
      if (bytes[index + offset] !== sequence[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

function countSequence(bytes, sequence) {
  let count = 0;
  for (let index = 0; index <= bytes.length - sequence.length; index += 1) {
    let matched = true;
    for (let offset = 0; offset < sequence.length; offset += 1) {
      if (bytes[index + offset] !== sequence[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) count += 1;
  }
  return count;
}

function utf8(text) {
  return [...new TextEncoder().encode(text)];
}

function textMeta(type, text) {
  const data = utf8(text);
  assert.ok(data.length < 128, "test helper only supports short text meta events");
  return [0xff, type, data.length, ...data];
}

const files = buildMidiExports(project);
const expected = ["Draft.mid", "Chord.mid", "Melody.mid", "Bass.mid", "Drums.mid"];

assert.deepEqual(Object.keys(files), expected);

for (const filename of expected) {
  const bytes = files[filename];
  assert.ok(bytes instanceof Uint8Array, `${filename} should be Uint8Array`);
  assert.equal(ascii(bytes, 0, 4), "MThd", `${filename} header`);
  assert.equal(uint16(bytes, 8), 1, `${filename} should be SMF Type 1`);
  assert.equal(uint16(bytes, 12), 480, `${filename} PPQ`);
  assert.ok(bytes.length > 30, `${filename} should contain track data`);
}

assert.equal(uint16(files["Draft.mid"], 10), 5, "Draft.mid should have 5 tracks");
assert.equal(uint16(files["Chord.mid"], 10), 2, "Chord.mid should have conductor + part");
assert.equal(uint16(files["Melody.mid"], 10), 2, "Melody.mid should have conductor + part");
assert.equal(uint16(files["Bass.mid"], 10), 2, "Bass.mid should have conductor + part");
assert.equal(uint16(files["Drums.mid"], 10), 2, "Drums.mid should have conductor + part");

const draft = files["Draft.mid"];

assert.ok(
  containsSequence(draft, [0xff, 0x51, 0x03, 0x07, 0xa1, 0x20]),
  "Draft.mid should contain 120 BPM tempo meta event"
);
assert.ok(
  containsSequence(draft, [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]),
  "Draft.mid should contain 4/4 time signature meta event"
);
assert.ok(
  containsSequence(draft, [0xff, 0x59, 0x02, 0x00, 0x00]),
  "Draft.mid should contain C major key signature meta event"
);
assert.ok(containsSequence(draft, textMeta(0x03, "Conductor")), "Draft.mid conductor track name");
assert.ok(containsSequence(draft, textMeta(0x03, "Chord")), "Draft.mid chord track name");
assert.ok(containsSequence(draft, textMeta(0x03, "Melody")), "Draft.mid melody track name");
assert.ok(containsSequence(draft, textMeta(0x03, "Bass")), "Draft.mid bass track name");
assert.ok(containsSequence(draft, textMeta(0x03, "Drums")), "Draft.mid drums track name");
assert.ok(containsSequence(draft, textMeta(0x06, "Verse")), "Draft.mid should contain section marker");

assert.ok(containsSequence(draft, [0x91, 60, 96]), "Melody should use MIDI channel 2");
assert.ok(containsSequence(draft, [0x92, 36, 96]), "Bass should use MIDI channel 3");
assert.ok(containsSequence(draft, [0x99, 36, 100]), "Drums should use MIDI channel 10");
assert.ok(containsSequence(draft, [0x81, 60, 0]), "Melody note-off should use MIDI channel 2");
assert.ok(containsSequence(draft, [0x82, 36, 0]), "Bass note-off should use MIDI channel 3");
assert.ok(containsSequence(draft, [0x89, 36, 0]), "Drums note-off should use MIDI channel 10");
assert.equal(countSequence(draft, [0xff, 0x2f, 0x00]), 5, "Draft.mid should end all 5 tracks");

const projectWithCounter = structuredClone(project);
projectWithCounter.tracks.push({
  role: "counter",
  name: "Counter Melody",
  midiChannel: 4,
  notes: [
    { id: "c1", pitch: 72, startTick: 480, durationTick: 240, velocity: 88 }
  ]
});

const counterFiles = buildMidiExports(projectWithCounter);
assert.ok(counterFiles["CounterMelody.mid"] instanceof Uint8Array, "CounterMelody.mid should be exported");
assert.equal(uint16(counterFiles["Draft.mid"], 10), 6, "Draft.mid should add counter melody as track 6");
assert.ok(
  containsSequence(counterFiles["Draft.mid"], textMeta(0x03, "Counter Melody")),
  "Draft.mid counter melody track name"
);
assert.ok(
  containsSequence(counterFiles["Draft.mid"], [0x93, 72, 88]),
  "Counter melody should use MIDI channel 4"
);
assert.equal(
  countSequence(counterFiles["Draft.mid"], [0xff, 0x2f, 0x00]),
  6,
  "Draft.mid should end all 6 tracks when counter melody exists"
);

console.log("MIDI smoke test passed with Draft.mid DAW interoperability metadata checks.");
