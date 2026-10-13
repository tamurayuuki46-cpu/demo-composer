import { ALL_CHORD_QUALITY_ORDER, CHORD_QUALITY_GROUPS, CHORD_QUALITY_ORDER, chordQualityDefinition } from "../core/chord-qualities.js";

export const NOTE_NAMES = Object.freeze(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);

const SCALE_PATTERNS = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ["major", "minor", "minor", "major", "major", "minor", "diminished"],
    degrees: ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
  },
  minor: {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ["minor", "diminished", "major", "minor", "minor", "major", "major"],
    degrees: ["i", "ii°", "III", "iv", "v", "VI", "VII"]
  }
};

const CHROMATIC_DEGREES = Object.freeze([
  "I",
  "♭II",
  "II",
  "♭III",
  "III",
  "IV",
  "♯IV",
  "V",
  "♭VI",
  "VI",
  "♭VII",
  "VII"
]);

// 基準音のボタン用: 現在のKey / Scaleでの度数名（ローマ数字）。ScaleのダイアトニックはそのScaleの数え方、外れた音は♭ / ♯で示す。
// Major: I ♭II II ♭III III IV ♯IV V ♭VI VI ♭VII VII / Minor: I ♭II II III ♯III IV ♯IV V VI ♯VI VII ♯VII
const ROOT_DEGREE_NAMES = Object.freeze({
  major: CHROMATIC_DEGREES,
  minor: Object.freeze(["I", "♭II", "II", "III", "♯III", "IV", "♯IV", "V", "VI", "♯VI", "VII", "♯VII"])
});

export function rootDegreeName(root, key, scale = "major") {
  const distance = (((root - rootToPitchClass(key)) % 12) + 12) % 12;
  return (ROOT_DEGREE_NAMES[scale] ?? ROOT_DEGREE_NAMES.major)[distance];
}

export function rootToPitchClass(key) {
  const pitchClass = NOTE_NAMES.indexOf(key);
  if (pitchClass === -1) {
    throw new Error(`Unsupported key: ${key}`);
  }
  return pitchClass;
}

export function chordSymbol(root, quality) {
  const name = NOTE_NAMES[root];
  if (!name) return "?";

  return `${name}${chordQualityDefinition(quality).suffix}`;
}

function lowercaseRoman(value) {
  return value.replace(/[IV]+/g, (match) => match.toLowerCase());
}

// ローマ数字の土台（base。大文字）と Quality から度数表記を作る。
// 基本の9種類は従来の表記（ii / ii7 / vii° / I7 / Imaj7 / Isus2 / I+ ...）を保つ。拡張Qualityは Quality定義の degree（小文字にするか / 後ろに付ける文字）で作る。
export function degreeFromBase(base, quality) {
  if (quality === "major") return base;
  if (quality === "minor") return lowercaseRoman(base);
  if (quality === "minor7") return `${lowercaseRoman(base)}7`;
  if (quality === "diminished") return `${lowercaseRoman(base)}°`;
  if (quality === "dominant7") return `${base}7`;
  if (quality === "major7") return `${base}maj7`;
  if (quality === "sus2") return `${base}sus2`;
  if (quality === "sus4") return `${base}sus4`;
  if (quality === "augmented") return `${base}+`;

  const degree = chordQualityDefinition(quality).degree;
  if (!degree) return base;
  return `${degree.minor ? lowercaseRoman(base) : base}${degree.suffix ?? ""}`;
}

export function chordDegreeForVariant(root, key, quality) {
  const tonic = rootToPitchClass(key);
  const distance = (root - tonic + 12) % 12;
  return degreeFromBase(CHROMATIC_DEGREES[distance], quality);
}

function variantFor(root, key, quality) {
  return {
    root,
    quality,
    degree: chordDegreeForVariant(root, key, quality),
    symbol: chordSymbol(root, quality),
    label: chordQualityDefinition(quality).label
  };
}

// 基本の9種類（従来どおり）
export function getChordVariants(root, key) {
  return CHORD_QUALITY_ORDER.map((quality) => variantFor(root, key, quality));
}

// 拡張を含む全種類（ALL_CHORD_QUALITY_ORDER の順）。画面の data-add-variant の番号は、この配列の番号
export function getAllChordVariants(root, key) {
  return ALL_CHORD_QUALITY_ORDER.map((quality) => variantFor(root, key, quality));
}

// 画面表示用のグループ。各variantの index は getAllChordVariants() の番号
export function getChordVariantGroups(root, key) {
  const all = getAllChordVariants(root, key);
  return CHORD_QUALITY_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    variants: group.qualities.map((quality) => {
      const index = ALL_CHORD_QUALITY_ORDER.indexOf(quality);
      return { ...all[index], index };
    })
  }));
}

export function getDiatonicChords(key, scale) {
  const pattern = SCALE_PATTERNS[scale];
  if (!pattern) {
    throw new Error(`Unsupported scale: ${scale}`);
  }

  const tonic = rootToPitchClass(key);

  return pattern.intervals.map((interval, index) => {
    const root = (tonic + interval) % 12;
    const quality = pattern.qualities[index];

    return {
      root,
      quality,
      degree: pattern.degrees[index],
      symbol: chordSymbol(root, quality)
    };
  });
}
