function ext(label, suffix, intervals, degree) {
  return Object.freeze({ label, suffix, intervals: Object.freeze(intervals), degree: Object.freeze({ minor: false, ...degree }) });
}

export const CHORD_QUALITY_DEFINITIONS = Object.freeze({
  major: Object.freeze({ label: "Major", suffix: "", intervals: Object.freeze([0, 4, 7]) }),
  minor: Object.freeze({ label: "Minor", suffix: "m", intervals: Object.freeze([0, 3, 7]) }),
  dominant7: Object.freeze({ label: "7", suffix: "7", intervals: Object.freeze([0, 4, 7, 10]) }),
  major7: Object.freeze({ label: "Maj7", suffix: "maj7", intervals: Object.freeze([0, 4, 7, 11]) }),
  minor7: Object.freeze({ label: "m7", suffix: "m7", intervals: Object.freeze([0, 3, 7, 10]) }),
  sus2: Object.freeze({ label: "sus2", suffix: "sus2", intervals: Object.freeze([0, 2, 7]) }),
  sus4: Object.freeze({ label: "sus4", suffix: "sus4", intervals: Object.freeze([0, 5, 7]) }),
  diminished: Object.freeze({ label: "dim", suffix: "dim", intervals: Object.freeze([0, 3, 6]) }),
  augmented: Object.freeze({ label: "aug", suffix: "aug", intervals: Object.freeze([0, 4, 8]) }),

  // ---- 拡張（v0.2-dev。許可値の追記のみ。schemaVersionは2のまま）----
  // intervals は、ルートからの半音数。9th / 11th / 13th は1オクターブ上の位置（14 / 17 / 21）で持つ（構成音の判定は12で割った余り）。
  // degree: 度数表記用。minor=小文字のローマ数字にする / suffix=ローマ数字の後ろに付ける文字
  major6: ext("6", "6", [0, 4, 7, 9], { suffix: "6" }),
  minor6: ext("m6", "m6", [0, 3, 7, 9], { minor: true, suffix: "6" }),
  add9: ext("add9", "add9", [0, 4, 7, 14], { suffix: "(add9)" }),
  minorAdd9: ext("m(add9)", "m(add9)", [0, 3, 7, 14], { minor: true, suffix: "(add9)" }),
  minor7flat5: ext("m7♭5", "m7b5", [0, 3, 6, 10], { minor: true, suffix: "ø7" }),
  diminished7: ext("dim7", "dim7", [0, 3, 6, 9], { minor: true, suffix: "°7" }),
  minorMajor7: ext("mMaj7", "mMaj7", [0, 3, 7, 11], { minor: true, suffix: "(maj7)" }),
  major7sharp5: ext("maj7♯5", "maj7#5", [0, 4, 8, 11], { suffix: "maj7♯5" }),
  dominant7sus4: ext("7sus4", "7sus4", [0, 5, 7, 10], { suffix: "7sus4" }),
  major9: ext("maj9", "maj9", [0, 4, 7, 11, 14], { suffix: "maj9" }),
  dominant9: ext("9", "9", [0, 4, 7, 10, 14], { suffix: "9" }),
  minor9: ext("m9", "m9", [0, 3, 7, 10, 14], { minor: true, suffix: "9" }),
  minor11: ext("m11", "m11", [0, 3, 7, 10, 14, 17], { minor: true, suffix: "11" }),
  minor7add11: ext("m7(11)", "m7(11)", [0, 3, 7, 10, 17], { minor: true, suffix: "7(11)" }),
  dominant13: ext("13", "13", [0, 4, 7, 10, 14, 21], { suffix: "13" }),
  major13: ext("maj13", "maj13", [0, 4, 7, 11, 14, 21], { suffix: "maj13" }),
  minorMajor9: ext("mMaj9", "mMaj9", [0, 3, 7, 11, 14], { minor: true, suffix: "(maj9)" }),
  major9sharp5: ext("maj9♯5", "maj9#5", [0, 4, 8, 11, 14], { suffix: "maj9♯5" }),
  minor9flat5: ext("m9♭5", "m9b5", [0, 3, 6, 10, 14], { minor: true, suffix: "ø9" }),
  minor7flat5add11: ext("m7♭5(11)", "m7b5(11)", [0, 3, 6, 10, 17], { minor: true, suffix: "ø7(11)" }),
  dominant7flat9: ext("7♭9", "7b9", [0, 4, 7, 10, 13], { suffix: "7♭9" }),
  dominant7sharp9: ext("7♯9", "7#9", [0, 4, 7, 10, 15], { suffix: "7♯9" }),
  dominant7flat13: ext("7♭13", "7b13", [0, 4, 7, 10, 20], { suffix: "7♭13" }),
  dominant7sharp11: ext("7♯11", "7#11", [0, 4, 7, 10, 18], { suffix: "7♯11" }),
  major7sharp11: ext("maj7♯11", "maj7#11", [0, 4, 7, 11, 18], { suffix: "maj7♯11" }),
  minor7flat9: ext("m7♭9", "m7b9", [0, 3, 7, 10, 13], { minor: true, suffix: "7♭9" }),

  // ---- 全音音階・4度堆積などの特殊和音（追記のみ）----
  dominant7flat5: ext("7♭5", "7b5", [0, 4, 6, 10], { suffix: "7♭5" }),
  dominant7sharp5: ext("7♯5", "7#5", [0, 4, 8, 10], { suffix: "7♯5" }),
  dominant9flat5: ext("9♭5", "9b5", [0, 4, 6, 10, 14], { suffix: "9♭5" }),
  dominant9sharp5: ext("9♯5", "9#5", [0, 4, 8, 10, 14], { suffix: "9♯5" }),
  quartal3: ext("4度堆積(3音)", "q3", [0, 5, 10], { suffix: "q3" }),
  quartal4: ext("4度堆積(4音)", "q4", [0, 5, 10, 15], { suffix: "q4" }),
  quintal3: ext("5度堆積(3音)", "q5", [0, 7, 14], { suffix: "q5" }),
  soWhat: ext("So What", "SoWhat", [0, 5, 10, 15, 19], { suffix: "SoWhat" }),
  mystic: ext("神秘和音", "mystic", [0, 6, 10, 16, 21], { suffix: "mystic" })
});

// 基本の9種類。MIDI読み込みのコード判定など、「ふつうのコード」に絞りたい処理が使う（拡張Qualityは含まない）
export const CHORD_QUALITY_ORDER = Object.freeze([
  "major",
  "minor",
  "dominant7",
  "major7",
  "minor7",
  "sus2",
  "sus4",
  "diminished",
  "augmented"
]);

// Chord画面の「基準音からコード種類を選ぶ」の並び。初心者が探しやすいよう、種類ごとのグループにする
export const CHORD_QUALITY_GROUPS = Object.freeze([
  { id: "basic", label: "基本", qualities: CHORD_QUALITY_ORDER },
  { id: "sixth", label: "6th・add9", qualities: Object.freeze(["major6", "minor6", "add9", "minorAdd9"]) },
  { id: "seventh", label: "7th いろいろ", qualities: Object.freeze(["minor7flat5", "diminished7", "minorMajor7", "major7sharp5", "dominant7sus4", "dominant7flat5", "dominant7sharp5"]) },
  { id: "tension", label: "9th・11th・13th", qualities: Object.freeze(["major9", "dominant9", "minor9", "minor11", "minor7add11", "dominant13", "major13", "minorMajor9", "major9sharp5", "minor9flat5", "minor7flat5add11"]) },
  { id: "altered", label: "変化音（♭9・♯9・♯11・♭13）", qualities: Object.freeze(["dominant7flat9", "dominant7sharp9", "dominant7flat13", "dominant7sharp11", "major7sharp11", "minor7flat9", "dominant9flat5", "dominant9sharp5"]) },
  { id: "special", label: "4度堆積・特殊和音", qualities: Object.freeze(["quartal3", "quartal4", "quintal3", "soWhat", "mystic"]) }
]);

export const ALL_CHORD_QUALITY_ORDER = Object.freeze(CHORD_QUALITY_GROUPS.flatMap((group) => group.qualities));

export function isChordQuality(value) {
  return Object.hasOwn(CHORD_QUALITY_DEFINITIONS, value);
}

export function chordQualityDefinition(quality) {
  const definition = CHORD_QUALITY_DEFINITIONS[quality];
  if (!definition) {
    throw new Error(`Unsupported chord quality: ${quality}`);
  }
  return definition;
}

export function chordIntervals(quality) {
  return [...chordQualityDefinition(quality).intervals];
}
