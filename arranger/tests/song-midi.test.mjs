import assert from 'node:assert/strict';
import { buildSongMidi, SONG_MIDI_TRACKS } from '../src/song-midi.js';

const source = {
  basic: { bpm: 128, key: 'E', scale: 'major', timeSignature: '4/4', ppq: 480 },
  sections: [
    { id: 'verse', name: 'Aメロ', startTick: 0, endTick: 1920 },
    { id: 'chorus', name: 'サビ', startTick: 1920, endTick: 3840 },
  ],
  chords: [
    { root: 4, quality: 'major', startTick: 0, durationTick: 1920 },
    { root: 11, quality: 'major', startTick: 1920, durationTick: 1920 },
  ],
  tracks: [
    { role: 'melody', midiChannel: 2, notes: [{ pitch: 64, startTick: 0, durationTick: 480, velocity: 100 }] },
    { role: 'counter', midiChannel: 4, notes: [{ pitch: 71, startTick: 480, durationTick: 480, velocity: 88 }] },
    { role: 'bass', midiChannel: 3, notes: [{ pitch: 40, startTick: 0, durationTick: 960, velocity: 92 }] },
    { role: 'drums', midiChannel: 10, notes: [{ pitch: 36, startTick: 0, durationTick: 120, velocity: 110 }] },
  ],
};

const enabled = { harmony: true, melody: true, counter: true, bass: true, drums: true };
const candidate = {
  id: 'candidate-b',
  sections: [
    { sectionId: 'verse', density: 'standard', enabled, harmonyPattern: 'sustain' },
    { sectionId: 'chorus', density: 'full', enabled, harmonyPattern: 'sustain' },
  ],
};

function u32(bytes, offset) {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function readTrackBodies(bytes) {
  const bodies = [];
  let offset = 14;
  while (offset < bytes.length) {
    assert.equal(String.fromCharCode(...bytes.slice(offset, offset + 4)), 'MTrk', `invalid track chunk at byte ${offset}`);
    const length = u32(bytes, offset + 4);
    const start = offset + 8;
    const end = start + length;
    assert.ok(end <= bytes.length, 'MTrk chunk exceeds MIDI file length');
    bodies.push(bytes.slice(start, end));
    offset = end;
  }
  assert.equal(offset, bytes.length, 'MIDI file contains trailing bytes outside MTrk chunks');
  return bodies;
}

function readVlq(bytes, offset) {
  let value = 0;
  let cursor = offset;
  for (let count = 0; count < 4; count += 1) {
    const byte = bytes[cursor++];
    assert.notEqual(byte, undefined, 'unexpected end of track while reading VLQ');
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, next: cursor };
  }
  throw new Error('invalid VLQ longer than four bytes');
}

function parseTrackEvents(body) {
  const events = [];
  let offset = 0;
  let tick = 0;
  while (offset < body.length) {
    const delta = readVlq(body, offset);
    tick += delta.value;
    offset = delta.next;
    const status = body[offset++];
    if (status === 0xff) {
      const type = body[offset++];
      const length = readVlq(body, offset);
      offset = length.next;
      const data = body.slice(offset, offset + length.value);
      offset += length.value;
      events.push({ kind: 'meta', type, tick, data });
      if (type === 0x2f) break;
      continue;
    }
    const kind = status & 0xf0;
    if (kind === 0x80 || kind === 0x90) {
      const pitch = body[offset++];
      const velocity = body[offset++];
      events.push({ kind: kind === 0x90 && velocity > 0 ? 'note-on' : 'note-off', status, channel: status & 0x0f, tick, pitch, velocity });
      continue;
    }
    throw new Error(`unexpected MIDI status 0x${status.toString(16)} in generated Song.mid`);
  }
  return events;
}

function hasSequence(bytes, sequence) {
  return bytes.some((_, index) => sequence.every((value, i) => bytes[index + i] === value));
}

function countSequence(bytes, sequence) {
  let count = 0;
  for (let index = 0; index <= bytes.length - sequence.length; index += 1) {
    if (sequence.every((value, i) => bytes[index + i] === value)) count += 1;
  }
  return count;
}

function assertNoteSpan(events, { pitch, channel, startTick, endTick, label }) {
  assert.ok(events.some((event) => event.kind === 'note-on' && event.channel === channel && event.pitch === pitch && event.tick === startTick), `${label} Note On moved from tick ${startTick}`);
  assert.ok(events.some((event) => event.kind === 'note-off' && event.channel === channel && event.pitch === pitch && event.tick === endTick), `${label} Note Off moved from tick ${endTick}`);
}

const midi = buildSongMidi(source, candidate);
const bytes = [...midi];
const binaryText = Buffer.from(midi).toString('utf8');
const tracks = readTrackBodies(bytes);
const trackEvents = tracks.map(parseTrackEvents);

assert.equal(binaryText.slice(0, 4), 'MThd');
assert.deepEqual(bytes.slice(4, 8), [0, 0, 0, 6]);
assert.deepEqual(bytes.slice(8, 10), [0, 1], 'Song.mid must be Standard MIDI File format 1');
assert.equal((bytes[10] << 8) | bytes[11], 5, 'Song.mid must contain exactly five musical tracks');
assert.equal((bytes[12] << 8) | bytes[13], 480, 'Song.mid PPQ must remain 480');
assert.equal(tracks.length, 5, 'MThd track count and actual MTrk chunks must agree');

assert.deepEqual(
  SONG_MIDI_TRACKS.map(({ role, name, channel }) => ({ role, name, channel })),
  [
    { role: 'harmony', name: 'Chords', channel: 0 },
    { role: 'melody', name: 'Melody', channel: 1 },
    { role: 'counter', name: 'Counter Melody', channel: 3 },
    { role: 'bass', name: 'Bass', channel: 2 },
    { role: 'drums', name: 'Drums', channel: 9 },
  ],
  'DAW handoff channel map changed unexpectedly',
);

for (const name of ['Chords', 'Melody', 'Counter Melody', 'Bass', 'Drums']) {
  assert.ok(binaryText.includes(name), `missing track name: ${name}`);
}

// 128 BPM = 468750 microseconds per quarter note = 0x07 0x27 0x0E.
assert.ok(hasSequence(tracks[0], [0xff, 0x51, 0x03, 0x07, 0x27, 0x0e]), '128 BPM tempo meta event is missing or incorrect');
assert.ok(hasSequence(tracks[0], [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]), '4/4 time-signature meta event is missing or incorrect');
assert.equal(countSequence(tracks[0], [0xff, 0x06]), 2, 'expected one section marker for each source section');

// MIDI status nibbles prove each musical part is written to its agreed DAW channel.
// Channels in MIDI bytes are zero-based: 0/1/3/2/9 => DAW channels 1/2/4/3/10.
for (const [index, channel] of [0, 1, 3, 2, 9].entries()) {
  assert.ok(tracks[index].includes(0x90 | channel), `track ${index + 1} is missing Note On for MIDI channel ${channel + 1}`);
  assert.ok(tracks[index].includes(0x80 | channel), `track ${index + 1} is missing Note Off for MIDI channel ${channel + 1}`);
}

// Preserve concrete note timing through MIDI serialization. These are the values a DAW must recover.
assertNoteSpan(trackEvents[1], { label: 'Melody C4', pitch: 64, channel: 1, startTick: 0, endTick: 480 });
assertNoteSpan(trackEvents[2], { label: 'Counter B4', pitch: 71, channel: 3, startTick: 480, endTick: 960 });
assertNoteSpan(trackEvents[3], { label: 'Bass E2', pitch: 40, channel: 2, startTick: 0, endTick: 960 });
assertNoteSpan(trackEvents[4], { label: 'Kick', pitch: 36, channel: 9, startTick: 0, endTick: 120 });

assert.ok(midi.length > 100, 'Song.mid unexpectedly small');

console.log('Arrangement Lab Song.mid DAW handoff test passed: SMF1, 5 tracks, PPQ480, BPM128, 4/4, markers, channels, and note timing.');
