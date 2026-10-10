export const CHORD_QUALITY_DEFINITIONS = Object.freeze({
  major: Object.freeze({ label: "Major", suffix: "", intervals: Object.freeze([0, 4, 7]) }),
  minor: Object.freeze({ label: "Minor", suffix: "m", intervals: Object.freeze([0, 3, 7]) }),
  dominant7: Object.freeze({ label: "7", suffix: "7", intervals: Object.freeze([0, 4, 7, 10]) }),
  major7: Object.freeze({ label: "Maj7", suffix: "maj7", intervals: Object.freeze([0, 4, 7, 11]) }),
  minor7: Object.freeze({ label: "m7", suffix: "m7", intervals: Object.freeze([0, 3, 7, 10]) }),
  sus2: Object.freeze({ label: "sus2", suffix: "sus2", intervals: Object.freeze([0, 2, 7]) }),
  sus4: Object.freeze({ label: "sus4", suffix: "sus4", intervals: Object.freeze([0, 5, 7]) }),
  diminished: Object.freeze({ label: "dim", suffix: "dim", intervals: Object.freeze([0, 3, 6]) }),
  augmented: Object.freeze({ label: "aug", suffix: "aug", intervals: Object.freeze([0, 4, 8]) })
});

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
