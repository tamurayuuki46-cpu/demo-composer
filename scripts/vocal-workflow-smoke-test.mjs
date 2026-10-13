import assert from 'node:assert/strict';
import { createDefaultProject, createProjectStore, validateProject } from '../src/core/project-state.js';
import { defaultDesign, designOf, validateDesign } from '../src/core/decision-design.js';
import { normalizeCompositionSheetHandoff, sheetDesignValues } from '../src/hub/composition-sheet-handoff.js';

const fresh = createDefaultProject();
const design = defaultDesign();
assert.equal(design.lyricsTheme, '');
assert.equal(design.vocalRange, '');
assert.equal(design.lyricPhrases, '');
assert.equal(design.axes.vocal, '');
assert.equal(validateDesign(design), true);
assert.equal(validateProject(fresh), true);

// v0.8以前のSchema 3 Projectに新しいVocal fieldが無くても、そのまま読める。
const legacy = structuredClone(fresh);
delete legacy.metadata.composition.lyricsTheme;
delete legacy.metadata.composition.vocalRange;
delete legacy.metadata.composition.lyricPhrases;
delete legacy.metadata.composition.axes.vocal;
assert.equal(validateProject(legacy), true);
const normalizedLegacy = designOf(legacy);
assert.equal(normalizedLegacy.lyricsTheme, '');
assert.equal(normalizedLegacy.vocalRange, '');
assert.equal(normalizedLegacy.lyricPhrases, '');
assert.equal(normalizedLegacy.axes.vocal, '');

// Claude Artifactはテーマ・音域・方向だけを作曲設計へ渡し、完成歌詞を捏造しない。
const handoff = normalizeCompositionSheetHandoff({
  kind: 'composition-sheet-handoff',
  schemaVersion: 1,
  title: 'Vocal Test',
  sheet: {
    references: [{ title: 'Ref Song', artist: 'Ref Artist', note: 'サビの開放感' }],
    genre: ['J-POP'],
    mood: ['浮遊感'],
    bpm: { selected: 128, candidates: [] },
    key: { selected: 'E', candidates: [] },
    constraints: [],
    experiments: [],
    vocal: {
      isVocalSong: true,
      lyricsTheme: '夜の帰り道',
      lyricalImage: '街灯と雨上がり',
      direction: 'Aメロは静か、サビで開く',
      range: { low: 'B3', high: 'E5', note: 'サビ最高音は一度だけ' },
    },
  },
});
const mapped = sheetDesignValues(handoff);
assert.equal(mapped.fields.lyricsTheme, '夜の帰り道');
assert.equal(mapped.fields.vocalRange, 'B3–E5 / サビ最高音は一度だけ');
assert.equal(mapped.fields.lyricPhrases, '');
assert.match(mapped.axes.vocal, /街灯と雨上がり/);
assert.match(mapped.axes.vocal, /サビで開く/);
assert.match(mapped.fields.reference, /Ref Song/);

// Demo Composer側でPhrase歌詞 / 音節メモを追記し、Project保存とUndoの対象にできる。
const store = createProjectStore(legacy);
const nextDesign = structuredClone(designOf(store.getSnapshot()));
nextDesign.lyricsTheme = mapped.fields.lyricsTheme;
nextDesign.vocalRange = mapped.fields.vocalRange;
nextDesign.axes.vocal = mapped.axes.vocal;
nextDesign.lyricPhrases = 'Aメロ1｜雨上がりの道｜8音節\nサビ1｜まだ歩いていける｜9音節';
store.updateDesign(nextDesign);
assert.equal(designOf(store.getSnapshot()).lyricsTheme, '夜の帰り道');
assert.match(designOf(store.getSnapshot()).lyricPhrases, /8音節/);
assert.equal(store.getHistoryState().undoCount, 1);
store.undo();
assert.equal(designOf(store.getSnapshot()).lyricsTheme, '');

console.log('Vocal/Lyrics workflow smoke test passed: legacy compatibility, Claude mapping, save and Undo OK');
