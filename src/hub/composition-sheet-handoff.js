export const COMPOSITION_SHEET_HANDOFF_KIND = 'composition-sheet-handoff';
export const COMPOSITION_SHEET_HANDOFF_VERSION = 1;
export const COMPOSITION_SHEET_STORAGE_KEY = 'demo-composer-composition-sheet-handoff-v1';

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function stringList(value, maxItems = 20, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function numberCandidate(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function normalizeReferences(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).map((item) => ({
    title: text(item?.title, 120),
    artist: text(item?.artist, 120),
    note: text(item?.note, 400),
  })).filter((item) => item.title || item.artist || item.note);
}

export function normalizeCompositionSheetHandoff(value) {
  if (!value || typeof value !== 'object') throw new Error('作曲シートJSONが不正です。');
  if (value.kind !== COMPOSITION_SHEET_HANDOFF_KIND) throw new Error('composition-sheet-handoff JSONではありません。');
  if (value.schemaVersion !== COMPOSITION_SHEET_HANDOFF_VERSION) throw new Error(`未対応の作曲シートSchemaです: ${value.schemaVersion ?? 'unknown'}`);

  const sheet = value.sheet && typeof value.sheet === 'object' ? value.sheet : {};
  const selectedBpm = numberCandidate(sheet.bpm?.selected, 40, 240);
  const bpmCandidates = Array.isArray(sheet.bpm?.candidates)
    ? sheet.bpm.candidates.map((item) => numberCandidate(item, 40, 240)).filter((item) => item !== null).slice(0, 10)
    : [];
  const selectedKey = text(sheet.key?.selected, 20) || null;
  const keyCandidates = Array.isArray(sheet.key?.candidates)
    ? sheet.key.candidates.map((item) => text(item, 20)).filter(Boolean).slice(0, 10)
    : [];
  const vocal = sheet.vocal && typeof sheet.vocal === 'object' ? sheet.vocal : {};

  return Object.freeze({
    kind: COMPOSITION_SHEET_HANDOFF_KIND,
    schemaVersion: COMPOSITION_SHEET_HANDOFF_VERSION,
    source: text(value.source, 80) || 'claude-artifact',
    createdAt: text(value.createdAt, 80),
    title: text(value.title, 100),
    sheet: Object.freeze({
      scene: text(sheet.scene, 500),
      purpose: text(sheet.purpose, 500),
      references: Object.freeze(normalizeReferences(sheet.references)),
      genre: Object.freeze(stringList(sheet.genre, 10, 60)),
      mood: Object.freeze(stringList(sheet.mood, 10, 60)),
      bpm: Object.freeze({ selected: selectedBpm, candidates: Object.freeze(bpmCandidates) }),
      key: Object.freeze({ selected: selectedKey, candidates: Object.freeze(keyCandidates) }),
      scale: text(sheet.scale, 30) || null,
      constraints: Object.freeze(stringList(sheet.constraints, 30, 200)),
      experiments: Object.freeze(stringList(sheet.experiments, 30, 200)),
      vocal: Object.freeze({
        isVocalSong: typeof vocal.isVocalSong === 'boolean' ? vocal.isVocalSong : null,
        lyricsTheme: text(vocal.lyricsTheme, 500),
        lyricalImage: text(vocal.lyricalImage, 500),
        direction: text(vocal.direction, 500),
        range: Object.freeze({
          low: text(vocal.range?.low, 20) || null,
          high: text(vocal.range?.high, 20) || null,
          note: text(vocal.range?.note, 300),
        }),
      }),
      notes: text(sheet.notes, 2000),
    }),
  });
}

export function parseCompositionSheetHandoffJson(raw) {
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('JSONとして読めませんでした。'); }
  return normalizeCompositionSheetHandoff(value);
}

export function saveCompositionSheetHandoff(value) {
  const normalized = normalizeCompositionSheetHandoff(value);
  if (typeof localStorage !== 'undefined') localStorage.setItem(COMPOSITION_SHEET_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadCompositionSheetHandoff() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(COMPOSITION_SHEET_STORAGE_KEY);
  if (!raw) return null;
  try { return parseCompositionSheetHandoffJson(raw); } catch { return null; }
}

export function clearCompositionSheetHandoff() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(COMPOSITION_SHEET_STORAGE_KEY);
}

export function sheetInitialValues(handoff) {
  const normalized = normalizeCompositionSheetHandoff(handoff);
  return Object.freeze({
    title: normalized.title || null,
    bpm: normalized.sheet.bpm.selected ?? normalized.sheet.bpm.candidates[0] ?? null,
    key: normalized.sheet.key.selected ?? normalized.sheet.key.candidates[0] ?? null,
    scale: normalized.sheet.scale,
  });
}

// Claude側はテーマと方向だけを渡す。完成歌詞やVocal Noteは自動生成しない。
// Demo Composerの「作曲の判断」へ入れるための安全な初期値だけを返す。
export function sheetDesignValues(handoff) {
  const normalized = normalizeCompositionSheetHandoff(handoff);
  const { vocal, references } = normalized.sheet;
  const rangeText = [vocal.range.low, vocal.range.high].filter(Boolean).join('–');
  const range = [rangeText, vocal.range.note].filter(Boolean).join(' / ');
  const vocalDirection = [vocal.lyricalImage, vocal.direction].filter(Boolean).join(' / ');
  const reference = references
    .map((item) => [item.title, item.artist, item.note].filter(Boolean).join(' / '))
    .join('\n')
    .slice(0, 400);

  return Object.freeze({
    fields: Object.freeze({
      reference,
      lyricsTheme: vocal.lyricsTheme,
      vocalRange: range,
      lyricPhrases: '',
    }),
    axes: Object.freeze({
      vocal: vocalDirection,
    }),
  });
}
