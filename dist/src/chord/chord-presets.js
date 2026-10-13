import { chordSymbol, getDiatonicChords } from "./chord-theory.js";

export const CHORD_PRESETS = Object.freeze([
  {
    id: "pop-1564",
    label: "Pop 1564",
    description: "I–V–vi–IV。明るいポップの基本形として使いやすい4小節。",
    degreeIndexes: [0, 4, 5, 3]
  },
  {
    id: "jpop-4536",
    label: "J-POP 4536",
    description: "IV–V–iii–vi。J-POPでよく使われる流れの叩き台。",
    degreeIndexes: [3, 4, 2, 5]
  },
  {
    id: "pop-1645",
    label: "Pop 1645",
    description: "I–vi–IV–V。まとまりがよく、歌ものの土台にしやすい4小節。",
    degreeIndexes: [0, 5, 3, 4]
  },
  {
    id: "pop-6415",
    label: "Pop 6415",
    description: "vi–IV–I–V。少し切なさを出しやすいポップ向けの流れ。",
    degreeIndexes: [5, 3, 0, 4]
  },
  {
    id: "cadence-2511",
    label: "2-5-1",
    description: "ii–V–I–I。終止感を確認しやすい4小節の基本形。",
    degreeIndexes: [1, 4, 0, 0]
  },
  {
    id: "canon",
    label: "カノン進行",
    description: "I–V–vi–iii–IV–I–IV–V。8小節で流れを作る定番パターン。",
    degreeIndexes: [0, 4, 5, 2, 3, 0, 3, 4]
  }
]);

export function getChordPreset(presetId) {
  return CHORD_PRESETS.find((preset) => preset.id === presetId) ?? CHORD_PRESETS[0];
}

export function buildChordPreset(presetId, { key, scale, barTicks }) {
  const preset = getChordPreset(presetId);
  const diatonic = getDiatonicChords(key, scale);

  return preset.degreeIndexes.map((degreeIndex, barIndex) => {
    const chord = diatonic[degreeIndex];

    return {
      root: chord.root,
      quality: chord.quality,
      degree: chord.degree,
      startTick: barIndex * barTicks,
      durationTick: barTicks
    };
  });
}

export function chordPresetPreview(presetId, { key, scale }) {
  const preset = getChordPreset(presetId);
  const diatonic = getDiatonicChords(key, scale);

  return preset.degreeIndexes.map((degreeIndex) => {
    const chord = diatonic[degreeIndex];
    return `${chordSymbol(chord.root, chord.quality)} (${chord.degree})`;
  });
}
