import { chordDegreeForVariant, chordSymbol, getDiatonicChords, rootToPitchClass } from "./chord-theory.js";

const ROMANS = Object.freeze({
  major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  minor: ["i", "ii°", "III", "iv", "v", "VI", "VII"]
});

// 先頭6件は既存Preset（id / label は互換のため変更しない）。
const BASE_PRESETS = [
  {
    id: "pop-1564",
    label: "Pop 1564",
    category: "bright",
    description: "I–V–vi–IV。明るいポップの基本形として使いやすい4小節。",
    degreeIndexes: [0, 4, 5, 3]
  },
  {
    id: "jpop-4536",
    label: "J-POP 4536",
    category: "sad",
    description: "IV–V–iii–vi。J-POPでよく使われる流れの叩き台。",
    degreeIndexes: [3, 4, 2, 5]
  },
  {
    id: "pop-1645",
    label: "Pop 1645",
    category: "bright",
    description: "I–vi–IV–V。まとまりがよく、歌ものの土台にしやすい4小節。",
    degreeIndexes: [0, 5, 3, 4]
  },
  {
    id: "pop-6415",
    label: "Pop 6415",
    category: "sad",
    description: "vi–IV–I–V。少し切なさを出しやすいポップ向けの流れ。",
    degreeIndexes: [5, 3, 0, 4]
  },
  {
    id: "cadence-2511",
    label: "2-5-1",
    category: "jazz",
    description: "ii–V–I–I。終止感を確認しやすい4小節の基本形。",
    degreeIndexes: [1, 4, 0, 0]
  },
  {
    id: "canon",
    label: "カノン進行",
    category: "bright",
    description: "I–V–vi–iii–IV–I–IV–V。8小節で流れを作る定番パターン。",
    degreeIndexes: [0, 4, 5, 2, 3, 0, 3, 4]
  }
];

// カテゴリ。mode はローマ数字の表記基準（minor は i / iv / VI 表記）。
export const CHORD_PRESET_CATEGORIES = Object.freeze([
  { id: "bright", label: "王道・明るい", mode: "major", note: "明るく前向きな流れ。" },
  { id: "sad", label: "J-POP・切ない", mode: "major", note: "少し切なさが出る流れ。" },
  { id: "rock", label: "ロック・力強い", mode: "major", note: "同じ場所を押し込む力強い流れ。" },
  { id: "ballad", label: "バラード・やさしい", mode: "major", note: "ゆったり歌いやすい流れ。" },
  { id: "loop", label: "ダンス・ループ", mode: "major", note: "短い往復を繰り返すループ向き。" },
  { id: "jazz", label: "ジャズ・おしゃれ", mode: "major", note: "2-5を軸にした少し大人っぽい流れ。" },
  {
    id: "minor",
    label: "マイナー・暗め",
    mode: "minor",
    note: "マイナーキー向けの暗めの流れ。メジャーキーで使うと7度が減和音(dim)になります。"
  },
  {
    id: "seventh",
    label: "7th・大人っぽい",
    mode: "major",
    chromatic: true,
    note: "7thコードで少し大人っぽくした流れ。メジャーキー向け（マイナーキーでは主音を基準に展開）。"
  },
  {
    id: "borrowed",
    label: "借用和音・ドラマチック",
    mode: "major",
    chromatic: true,
    note: "♭VII・♭VI・ivなどの借用和音や、副次ドミナントで色付けした流れ。メジャーキー向け（マイナーキーでは主音を基準に展開）。"
  }
]);

// 追加Preset。数字は度数（1=I … 7=vii）で、4桁=4小節 / 8桁=8小節。
const EXTRA_SEQUENCES = Object.freeze({
  bright: "1451 1541 1465 1546 1456 1634 1625 1654 1345 1346 1436 1415 4151 4156 4165 5145 1425 1245 1234 3456",
  sad: "6451 6541 6345 6251 6145 4365 4561 2536 3625 3645 6325 6514 5641 5634",
  rock: "1144 1441 1514 5411 1454 4155 6411 1155 1445 5544 1545 4415",
  ballad: "13641451 16451645 15634151 14651465 1341 1251 1325 4321 1641 1561 1461 1361",
  loop: "1616 6464 1515 4545 1414 6565 6161 6465 1516 4645 6645 6455",
  jazz: "2516 2514 2513 2255 2525 4736 36251451 16251625 47362511 14736251 2564 2451",
  minor: "1765 1767 1671 1637 1476 1376 1676 1764 1567 1367 1716 1741"
});

// 7th / 借用和音のPreset。トークンは「度数 + 種類」。
// 度数: 1〜7（頭に b で半音下げ）。種類: 省略=メジャースケールの標準三和音 / maj7 / m7 / 7 / maj(長三和音) / m(短三和音)。
const CHROMATIC_SEQUENCES = Object.freeze({
  seventh: [
    "2m7 57 1maj7 1maj7",
    "1maj7 6m7 2m7 57",
    "3m7 6m7 2m7 57",
    "4maj7 3m7 2m7 1maj7",
    "1maj7 4maj7 3m7 6m7",
    "4maj7 57 3m7 6m7",
    "1maj7 57 6m7 4maj7",
    "6m7 2m7 57 1maj7",
    "1maj7 6m7 4maj7 57",
    "2m7 57 3m7 6m7",
    "1maj7 2m7 3m7 4maj7",
    "6m7 4maj7 1maj7 57",
    "2m7 57 1maj7 4maj7 3m7 6m7 2m7 57",
    "1maj7 6m7 2m7 57 3m7 6m7 2m7 57"
  ],
  borrowed: [
    "1 4 b7 1",
    "1 b6 b7 1",
    "1 b7 b6 5",
    "4 4m 1 1",
    "1 3 4 4m",
    "1 5 4 4m",
    "1 b3 4 1",
    "1 67 2m 57",
    "37 6m 4 57",
    "27 57 1 1",
    "1 5 b7 4",
    "4 b7 1 5"
  ]
});

const CHROMATIC_TOKEN = /^(b?)([1-7])(maj7|m7|7|maj|m)?$/;
const CHROMATIC_QUALITIES = Object.freeze({
  maj7: "major7",
  m7: "minor7",
  7: "dominant7",
  maj: "major",
  m: "minor"
});

function parseChromaticStep(token) {
  const match = CHROMATIC_TOKEN.exec(token);
  if (!match) throw new Error(`Invalid chord preset token: ${token}`);
  const [, flat, degree, suffix] = match;
  const base = getDiatonicChords("C", "major")[Number(degree) - 1];
  const offset = (base.root + (flat ? 11 : 0)) % 12;
  const quality = suffix ? CHROMATIC_QUALITIES[suffix] : (flat ? "major" : base.quality);
  return { offset, quality };
}

// 最後のコードの働きを短く添える（学習用のヒント）。
const ENDING_HINTS = Object.freeze({
  1: "最後は1度(主和音)で落ち着きます。",
  2: "最後は2度で、次へ進みたくなります。",
  3: "最後は3度で、ふわっと浮く終わり方です。",
  4: "最後は4度で、広がって次へ続きます。",
  5: "最後は5度で、次の頭(1度)に戻りたくなります。",
  6: "最後は6度で、切なく余韻が残ります。",
  7: "最後は7度で、強く次へ解決したくなります。"
});

function buildExtraPresets() {
  const presets = [];
  for (const category of CHORD_PRESET_CATEGORIES) {
    if (category.chromatic) {
      for (const sequence of CHROMATIC_SEQUENCES[category.id]) {
        const steps = sequence.split(" ").map(parseChromaticStep);
        const romans = steps.map((step) => chordDegreeForVariant(step.offset, "C", step.quality));
        presets.push({
          id: `${category.id}-${sequence.replaceAll(" ", "_")}`,
          label: romans.join("–"),
          category: category.id,
          description: `${romans.join("–")}。${category.note}`,
          steps
        });
      }
      continue;
    }
    for (const sequence of EXTRA_SEQUENCES[category.id].split(" ")) {
      const degrees = [...sequence].map(Number);
      const romans = degrees.map((degree) => ROMANS[category.mode][degree - 1]);
      const last = degrees.at(-1);
      presets.push({
        id: `${category.id}-${sequence}`,
        label: romans.join("–"),
        category: category.id,
        description: `${romans.join("–")}。${category.note}${ENDING_HINTS[last]}`,
        degreeIndexes: degrees.map((degree) => degree - 1)
      });
    }
  }
  return presets;
}

export const CHORD_PRESETS = Object.freeze(
  [...BASE_PRESETS, ...buildExtraPresets()].map((preset) => Object.freeze(preset))
);

export function chordPresetsByCategory() {
  return CHORD_PRESET_CATEGORIES.map((category) => ({
    ...category,
    presets: CHORD_PRESETS.filter((preset) => preset.category === category.id)
  }));
}

export function getChordPreset(presetId) {
  return CHORD_PRESETS.find((preset) => preset.id === presetId) ?? CHORD_PRESETS[0];
}

export function chordPresetLength(preset) {
  return (preset.steps ?? preset.degreeIndexes).length;
}

function presetChords(preset, key, scale) {
  if (preset.steps) {
    const tonic = rootToPitchClass(key);
    return preset.steps.map((step) => {
      const root = (tonic + step.offset) % 12;
      return { root, quality: step.quality, degree: chordDegreeForVariant(root, key, step.quality) };
    });
  }

  const diatonic = getDiatonicChords(key, scale);
  return preset.degreeIndexes.map((degreeIndex) => {
    const chord = diatonic[degreeIndex];
    return { root: chord.root, quality: chord.quality, degree: chord.degree };
  });
}

export function buildChordPreset(presetId, { key, scale, barTicks }) {
  const preset = getChordPreset(presetId);

  return presetChords(preset, key, scale).map((chord, barIndex) => ({
    ...chord,
    startTick: barIndex * barTicks,
    durationTick: barTicks
  }));
}

export function chordPresetPreview(presetId, { key, scale }) {
  const preset = getChordPreset(presetId);

  return presetChords(preset, key, scale).map((chord) => `${chordSymbol(chord.root, chord.quality)} (${chord.degree})`);
}
