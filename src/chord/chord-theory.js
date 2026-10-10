const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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

function rootToPitchClass(key) {
  const pitchClass = NOTE_NAMES.indexOf(key);
  if (pitchClass === -1) {
    throw new Error(`Unsupported key: ${key}`);
  }
  return pitchClass;
}

export function chordSymbol(root, quality) {
  const name = NOTE_NAMES[root];
  if (!name) return "?";

  if (quality === "minor") return `${name}m`;
  if (quality === "diminished") return `${name}dim`;
  return name;
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
