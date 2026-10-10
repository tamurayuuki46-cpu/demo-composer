export const BACKING_PART_ID = "chord-backing";
export const DEFAULT_BACKING_PATTERN = "block";

export const BACKING_PATTERNS = Object.freeze([
  Object.freeze({
    id: "block",
    label: "Block",
    description: "1小節を伸ばして鳴らします。Padやバラードの確認向け。",
    mode: "chord",
    hits: Object.freeze([
      Object.freeze({ offset: 0, duration: 1, accent: 1 })
    ])
  }),
  Object.freeze({
    id: "eighth",
    label: "8分刻み",
    description: "コードを8分音符で刻みます。Pop / Rockのノリを確認しやすい形です。",
    mode: "chord",
    hits: Object.freeze(
      Array.from({ length: 8 }, (_, index) => Object.freeze({
        offset: index / 8,
        duration: 0.105,
        accent: index % 2 === 0 ? 1 : 0.84
      }))
    )
  }),
  Object.freeze({
    id: "arpeggio",
    label: "Arpeggio",
    description: "コード構成音を8分音符で順番に鳴らします。流れのある伴奏確認向け。",
    mode: "arpeggio",
    hits: Object.freeze(
      Array.from({ length: 8 }, (_, index) => Object.freeze({
        offset: index / 8,
        duration: 0.11,
        accent: index % 4 === 0 ? 1 : 0.9,
        noteIndex: index
      }))
    )
  }),
  Object.freeze({
    id: "syncopation",
    label: "Syncopation",
    description: "1拍目と裏拍を中心に鳴らします。J-POPの軽い食い込み感を確認できます。",
    mode: "chord",
    hits: Object.freeze([
      Object.freeze({ offset: 0, duration: 0.11, accent: 1 }),
      Object.freeze({ offset: 6 / 16, duration: 0.11, accent: 0.9 }),
      Object.freeze({ offset: 10 / 16, duration: 0.11, accent: 0.94 }),
      Object.freeze({ offset: 14 / 16, duration: 0.11, accent: 0.88 })
    ])
  })
]);

export function getBackingPattern(patternId) {
  return BACKING_PATTERNS.find((pattern) => pattern.id === patternId)
    ?? BACKING_PATTERNS.find((pattern) => pattern.id === DEFAULT_BACKING_PATTERN);
}

export function getBackingPatternSelection(instruments) {
  const entry = Array.isArray(instruments)
    ? instruments.find((instrument) => instrument?.part === BACKING_PART_ID)
    : null;
  const pattern = getBackingPattern(entry?.preset);
  return pattern.id;
}

export function upsertBackingPattern(instruments, patternId) {
  const pattern = getBackingPattern(patternId);
  if (!BACKING_PATTERNS.some((candidate) => candidate.id === patternId)) {
    throw new Error(`Unsupported backing pattern: ${patternId}`);
  }

  const current = Array.isArray(instruments) ? instruments : [];
  return [
    ...current.filter((instrument) => instrument?.part !== BACKING_PART_ID),
    {
      part: BACKING_PART_ID,
      preset: pattern.id,
      tone: "natural"
    }
  ];
}

export function buildBackingEvents(patternId, intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) return [];

  const pattern = getBackingPattern(patternId);
  return pattern.hits.map((hit) => ({
    offset: hit.offset,
    duration: hit.duration,
    accent: hit.accent,
    intervals: pattern.mode === "arpeggio"
      ? [intervals[(hit.noteIndex ?? 0) % intervals.length]]
      : [...intervals]
  }));
}
