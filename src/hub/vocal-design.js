export const DEFAULT_VOCAL_DESIGN = Object.freeze({
  isVocalSong: null,
  lyricsTheme: '',
  lyricalImage: '',
  direction: '',
  range: Object.freeze({ low: '', high: '', note: '' }),
  lyricsDraft: '',
  phraseNotes: '',
  syllableNotes: '',
  synthVNotes: '',
});

function text(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

export function normalizeVocalDesign(value) {
  const source = value && typeof value === 'object' ? value : {};
  const range = source.range && typeof source.range === 'object' ? source.range : {};
  return Object.freeze({
    isVocalSong: typeof source.isVocalSong === 'boolean' ? source.isVocalSong : null,
    lyricsTheme: text(source.lyricsTheme, 500),
    lyricalImage: text(source.lyricalImage, 500),
    direction: text(source.direction, 500),
    range: Object.freeze({
      low: text(range.low, 20),
      high: text(range.high, 20),
      note: text(range.note, 300),
    }),
    lyricsDraft: text(source.lyricsDraft, 6000),
    phraseNotes: text(source.phraseNotes, 4000),
    syllableNotes: text(source.syllableNotes, 2000),
    synthVNotes: text(source.synthVNotes, 2000),
  });
}

export function vocalDesignFromProject(project) {
  return normalizeVocalDesign(project?.metadata?.vocal);
}

export function vocalDesignFromSheetHandoff(handoff) {
  const vocal = handoff?.sheet?.vocal ?? {};
  return normalizeVocalDesign({
    isVocalSong: vocal.isVocalSong,
    lyricsTheme: vocal.lyricsTheme,
    lyricalImage: vocal.lyricalImage,
    direction: vocal.direction,
    range: vocal.range,
  });
}
