import assert from 'node:assert/strict';
import {
  normalizeCompositionSheetHandoff,
  parseCompositionSheetHandoffJson,
  sheetInitialValues,
} from '../src/hub/composition-sheet-handoff.js';
import {
  normalizeVocalDesign,
  vocalDesignFromSheetHandoff,
} from '../src/hub/vocal-design.js';
import {
  applyPendingVocalDesign,
  peekPendingVocalDesign,
  queuePendingVocalDesign,
} from '../src/hub/vocal-design-store.js';

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
assert.deepEqual(vocalDesignFromSheetHandoff(full), normalizeVocalDesign({
  isVocalSong: true,
  lyricsTheme: '帰り道',
  lyricalImage: '街灯',
  direction: '静か→開放',
  range: { low: 'B3', high: 'E5', note: 'サビで上へ' },
}));

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

// Vocal design is stored as Project metadata through a one-reload bridge.
const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
const queued = queuePendingVocalDesign({
  projectId: 'p1',
  vocal: {
    isVocalSong: true,
    lyricsTheme: '未来',
    range: { low: 'A3', high: 'D5', note: 'サビだけ高め' },
    lyricsDraft: '仮歌詞',
    phraseNotes: 'Bar1-2: 8音節',
    syllableNotes: '7-8-7',
    synthVNotes: '語尾を弱く',
  },
}, storage);
assert.equal(queued.projectId, 'p1');
assert.equal(peekPendingVocalDesign(storage).vocal.lyricsTheme, '未来');

let saved = null;
const active = { id: 'p1', revision: 4, metadata: { title: 'Song' } };
const applied = await applyPendingVocalDesign({
  storage,
  load: async () => active,
  save: async (project) => { saved = project; },
});
assert.equal(applied, true);
assert.equal(saved.metadata.vocal.lyricsDraft, '仮歌詞');
assert.equal(saved.metadata.vocal.range.high, 'D5');
assert.equal(saved.revision, 5);
assert.equal(peekPendingVocalDesign(storage), null);

// A queued edit for another project must never be applied to the active project.
queuePendingVocalDesign({ projectId: 'other', vocal: { lyricsTheme: 'wrong project' } }, storage);
const mismatch = await applyPendingVocalDesign({
  storage,
  load: async () => active,
  save: async () => { throw new Error('must not save'); },
});
assert.equal(mismatch, false);
assert.equal(peekPendingVocalDesign(storage).projectId, 'other');

console.log('Composition sheet handoff + vocal design smoke test passed.');
