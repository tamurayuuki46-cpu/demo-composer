import assert from 'node:assert/strict';
import { ARRANGER_VERSION } from '../src/core.js';
import { resolvePreviewSoundProfile } from '../src/preview.js';

assert.equal(ARRANGER_VERSION, 'v0.13-dev');

const source = {
  sourceSnapshot: {
    instruments: [
      { part: 'chord', preset: 'pad', tone: 'dark' },
      { part: 'melody', preset: 'pluck', tone: 'bright' },
      { part: 'bass', preset: 'synth-bass', tone: 'warm' },
    ],
  },
};

const chord = resolvePreviewSoundProfile(source, 'harmony');
const melody = resolvePreviewSoundProfile(source, 'melody');
const counter = resolvePreviewSoundProfile(source, 'counter');
const bass = resolvePreviewSoundProfile(source, 'bass');

assert.equal(chord.waveform, 'sine');
assert.ok(Math.abs(chord.filter - 912) < 1e-9);
assert.equal(melody.waveform, 'square');
assert.ok(Math.abs(melody.filter - 3720) < 1e-9);
assert.deepEqual(counter, melody);
assert.equal(bass.waveform, 'sawtooth');
assert.ok(Math.abs(bass.filter - 639.6) < 1e-9);

assert.equal(resolvePreviewSoundProfile({ sourceSnapshot: { instruments: [] } }, 'melody'), null);
assert.equal(resolvePreviewSoundProfile({}, 'harmony'), null);
assert.equal(resolvePreviewSoundProfile(source, 'drums'), null);

console.log('Arrangement Lab preserves Demo Composer sound profiles and falls back safely.');
