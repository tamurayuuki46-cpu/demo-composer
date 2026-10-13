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

const midi = buildSongMidi(source, candidate);
const bytes = [...midi];
const binaryText = Buffer.from(midi).toString('utf8');

assert.equal(binaryText.slice(0, 4), 'MThd');
assert.deepEqual(bytes.slice(4, 8), [0, 0, 0, 6]);
assert.deepEqual(bytes.slice(8, 10), [0, 1], 'Song.mid must be Standard MIDI File format 1');
assert.equal((bytes[10] << 8) | bytes[11], 5, 'Song.mid must contain exactly five musical tracks');
assert.equal((bytes[12] << 8) | bytes[13], 480);
assert.equal(SONG_MIDI_TRACKS.length, 5);

for (const name of ['Chords', 'Melody', 'Counter Melody', 'Bass', 'Drums']) {
  assert.ok(binaryText.includes(name), `missing track name: ${name}`);
}

assert.ok(bytes.some((value, index) => value === 0xff && bytes[index + 1] === 0x51), 'tempo meta event missing');
assert.ok(bytes.some((value, index) => value === 0xff && bytes[index + 1] === 0x58), 'time-signature meta event missing');
assert.ok(bytes.some((value, index) => value === 0xff && bytes[index + 1] === 0x06), 'section marker meta event missing');
assert.ok(midi.length > 100, 'Song.mid unexpectedly small');

console.log('Arrangement Lab Song.mid test passed: Format 1, five tracks, tempo, meter, markers.');
