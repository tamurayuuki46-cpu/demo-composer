import { CHORD_QUALITY_ORDER, chordQualityDefinition } from "../core/chord-qualities.js";

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

export function chordDegreeForVariant(root, key, quality) {
  const tonic = rootToPitchClass(key);
  const distance = (root - tonic + 12) % 12;
  const baseDegree = CHROMATIC_DEGREES[distance];

  if (quality === "minor") return lowercaseRoman(baseDegree);
  if (quality === "minor7") return `${lowercaseRoman(baseDegree)}7`;
  if (quality === "diminished") return `${lowercaseRoman(baseDegree)}°`;
  if (quality === "dominant7") return `${baseDegree}7`;
  if (quality === "major7") return `${baseDegree}maj7`;
  if (quality === "sus2") return `${baseDegree}sus2`;
  if (quality === "sus4") return `${baseDegree}sus4`;
  if (quality === "augmented") return `${baseDegree}+`;
  return baseDegree;
}

export function getChordVariants(root, key) {
  return CHORD_QUALITY_ORDER.map((quality) => ({
    root,
    quality,
    degree: chordDegreeForVariant(root, key, quality),
    symbol: chordSymbol(root, quality),
    label: chordQualityDefinition(quality).label
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
