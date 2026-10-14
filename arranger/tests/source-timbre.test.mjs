import assert from 'node:assert/strict';
import { demoProjectToSongProject } from '../../src/shared/song-project.js';
import { resolveSoundProfile } from '../../src/core/sound-presets.js';
import { normalizeSourceProject } from '../src/core.js';
import { songProjectToArrangementSourceInput } from '../src/song-project-sync.js';
import { resolvePreviewSoundProfile } from '../src/preview.js';

const demoProject = {
  schemaVersion: 3,
  appVersion: 'v0.12-dev',
  id: 'source-timbre-test',
  revision: 7,
  metadata: { title: '音色保持テスト', genre: 'J-POP', mood: [] },
  basic: { bpm: 120, timeSignature: '4/4', key: 'C', scale: 'major', ppq: 480 },
  structure: { sections: [{ id: 'verse-1', kind: 'verse', name: 'Verse', bars: 1, energy: 'mid', transition: 'keep' }] },
  chords: [{ root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: 1920 }],
  tracks: [
    { role: 'melody', name: 'Melody', midiChannel: 2, notes: [{ pitch: 64, startTick: 0, durationTick: 480, velocity: 100 }] },
    { role: 'counter', name: 'Counter', midiChannel: 4, notes: [{ pitch: 67, startTick: 480, durationTick: 480, velocity: 90 }] },
    { role: 'bass', name: 'Bass', midiChannel: 3, notes: [{ pitch: 36, startTick: 0, durationTick: 960, velocity: 96 }] },
    { role: 'drums', name: 'Drums', midiChannel: 10, notes: [{ pitch: 36, startTick: 0, durationTick: 120, velocity: 100 }] },
  ],
  instruments: [
    { part: 'chord', preset: 'choir', tone: 'warm' },
    { part: 'melody', preset: 'vocal-bright', tone: 'dark' },
    { part: 'bass', preset: 'growl-bass', tone: 'soft' },
  ],
};

const songProject = demoProjectToSongProject(demoProject, { now: '2026-10-14T00:00:00.000Z' });
const arrangementInput = songProjectToArrangementSourceInput(songProject);
const source = normalizeSourceProject(arrangementInput);

assert.deepEqual(source.sourceSnapshot.instruments, demoProject.instruments, 'Demo Composer instruments survive SongProject handoff');
assert.deepEqual(resolvePreviewSoundProfile(source, 'harmony'), resolveSoundProfile(demoProject.instruments, 'chord'), 'Harmony keeps Chord preset/tone');
assert.deepEqual(resolvePreviewSoundProfile(source, 'melody'), resolveSoundProfile(demoProject.instruments, 'melody'), 'Melody keeps Melody preset/tone');
assert.deepEqual(resolvePreviewSoundProfile(source, 'counter'), resolveSoundProfile(demoProject.instruments, 'melody'), 'Counter follows Melody preset/tone');
assert.deepEqual(resolvePreviewSoundProfile(source, 'bass'), resolveSoundProfile(demoProject.instruments, 'bass'), 'Bass keeps Bass preset/tone');
assert.equal(resolvePreviewSoundProfile(source, 'drums'), null, 'Drums continue to use the shared percussion engine');

console.log('Arrangement Lab preserves Demo Composer Sound Sketch presets/tones through SongProject v1');
