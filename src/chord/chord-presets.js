import { chordSymbol, getDiatonicChords } from "./chord-theory.js";
import { chordSongReference } from "./chord-song-references.js";

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

function presetNumber(preset) {
  return preset.degreeIndexes.map((degreeIndex) => degreeIndex + 1).join("");
}

// 選択肢の文字。key/scaleを渡すと、いまのKeyでのコード名（C–Em–Am–F…）も添える（度数だけだと、実際に何のコードか分かりにくいため）
export function chordPresetOptionLabel(preset, { key = null, scale = null } = {}) {
  const number = presetNumber(preset);
  const base = preset.label.includes(number) ? preset.label : `${number} ${preset.label}`;
  const names = key && scale ? `｜${chordPresetNames(preset, { key, scale })}` : "";
  const reference = chordSongReference(preset.id);
  return reference ? `${base}${names}｜${reference.song} / ${reference.artist}` : `${base}${names}`;
}

// いまのKey / Scaleでのコード名だけをつないだ文字（例: C–Em–Am–F）
export function chordPresetNames(presetOrId, { key, scale }) {
  const preset = typeof presetOrId === "string" ? getChordPreset(presetOrId) : presetOrId;
  const diatonic = getDiatonicChords(key, scale);
  return preset.degreeIndexes.map((degreeIndex) => {
    const chord = diatonic[degreeIndex];
    return chordSymbol(chord.root, chord.quality);
  }).join("–");
}

function withLearningReference(preset) {
  const reference = chordSongReference(preset.id);
  if (!reference) return Object.freeze(preset);

  return Object.freeze({
    ...preset,
    description: `${preset.description} 参考曲: ${reference.song} / ${reference.artist}。${reference.note}`,
    reference
  });
}

function buildExtraPresets() {
  const presets = [];
  for (const category of CHORD_PRESET_CATEGORIES) {
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
  [...BASE_PRESETS, ...buildExtraPresets()].map(withLearningReference)
);

export function chordPresetsByCategory(options = {}) {
  return CHORD_PRESET_CATEGORIES.map((category) => ({
    ...category,
    presets: CHORD_PRESETS.filter((preset) => preset.category === category.id).map((preset) => ({
      ...preset,
      label: chordPresetOptionLabel(preset, options)
    }))
  }));
}

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
