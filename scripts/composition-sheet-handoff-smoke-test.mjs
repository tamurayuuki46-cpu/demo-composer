import assert from 'node:assert/strict';
import {
  normalizeCompositionSheetHandoff,
  parseCompositionSheetHandoffJson,
  sheetInitialValues,
} from '../src/hub/composition-sheet-handoff.js';

const full = normalizeCompositionSheetHandoff({
  kind: 'composition-sheet-handoff',
  schemaVersion: 1,
  source: 'claude-artifact',
  createdAt: '2026-10-13T00:00:00.000Z',
  title: 'Test Song',
  sheet: {
    scene: '夜の帰り道',
    purpose: '少し前向きになる曲',
    references: [{ title: 'Ref', artist: 'Artist', note: 'サビの開放感' }],
    genre: ['J-POP'],
    mood: ['浮遊感'],
    bpm: { selected: 128, candidates: [120, 128] },
    key: { selected: 'E', candidates: ['E', 'A'] },
    scale: 'major',
    constraints: ['サビまで短く'],
    experiments: ['裏メロを会話させる'],
    vocal: {
      isVocalSong: true,
      lyricsTheme: '帰り道',
      lyricalImage: '街灯',
      direction: '静か→開放',
      range: { low: 'B3', high: 'E5', note: 'サビで上へ' },
    },
    notes: 'memo',
  },
});

assert.equal(full.title, 'Test Song');
assert.equal(full.sheet.vocal.lyricsTheme, '帰り道');
assert.deepEqual(sheetInitialValues(full), { title: 'Test Song', bpm: 128, key: 'E', scale: 'major' });

// Earlier Schema v1 output without vocal remains valid.
const legacyV1 = parseCompositionSheetHandoffJson(JSON.stringify({
  kind: 'composition-sheet-handoff',
  schemaVersion: 1,
  title: 'Legacy Sheet',
  sheet: {
    scene: 'study',
    references: [],
    genre: [],
    mood: [],
    bpm: { selected: null, candidates: [100] },
    key: { selected: null, candidates: ['C'] },
    constraints: [],
    experiments: [],
  },
}));
assert.equal(legacyV1.sheet.vocal.isVocalSong, null);
assert.deepEqual(sheetInitialValues(legacyV1), { title: 'Legacy Sheet', bpm: 100, key: 'C', scale: null });

assert.throws(
  () => normalizeCompositionSheetHandoff({ kind: 'song-project', schemaVersion: 1 }),
  /composition-sheet-handoff/,
);
assert.throws(
  () => normalizeCompositionSheetHandoff({ kind: 'composition-sheet-handoff', schemaVersion: 2 }),
  /未対応/,
);

console.log('Composition sheet handoff smoke test passed.');
