import { CHORD_QUALITY_GROUPS, chordIntervals } from "../core/chord-qualities.js";
import { chordSymbol, degreeFromBase, rootToPitchClass } from "./chord-theory.js";

// スケール系ごとの「7つのコード」一覧。3和音 / 7th / テンション の3段階。
// 主音は曲のKey。ダイアトニック(Major / Minor)・ハーモニックマイナー・メロディックマイナーを同じ形で選べる。
// Projectを読み書きしない純粋データ。選んだコードは、Chord画面が通常のコードとして追加する（Schemaは増えない）。

const ROMAN_BASES = Object.freeze(["I", "II", "III", "IV", "V", "VI", "VII"]);

export const SCALE_SET_LEVELS = Object.freeze([
  { id: "triad", label: "3和音", note: "いちばん基本の形。" },
  { id: "seventh", label: "7th", note: "4和音。メジャー系は少しおしゃれ、V7は次へ進みたくなる音になります。" },
  { id: "tension", label: "テンション", note: "そのスケールの中で響きやすい9th・11th・13thなどを足した形。入れすぎず、1〜2か所に使うのがおすすめです。" }
]);

// intervals: 主音からの半音数。triad / seventh / tension: 度ごとの Quality
export const SCALE_FAMILIES = Object.freeze([
  {
    id: "major",
    label: "ダイアトニック Major",
    mode: "Major（Ionian）",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    triad: ["major", "minor", "minor", "major", "major", "minor", "diminished"],
    seventh: ["major7", "minor7", "minor7", "major7", "dominant7", "minor7", "minor7flat5"],
    tension: ["major9", "minor11", "minor7add11", "major7sharp11", "dominant13", "minor11", "minor7flat5add11"]
  },
  {
    id: "natural-minor",
    label: "ダイアトニック Minor",
    mode: "Natural Minor（Aeolian）",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    triad: ["minor", "diminished", "major", "minor", "minor", "major", "major"],
    seventh: ["minor7", "minor7flat5", "major7", "minor7", "minor7", "major7", "dominant7"],
    tension: ["minor11", "minor7flat5add11", "major9", "minor11", "minor7add11", "major9", "dominant13"]
  },
  {
    id: "harmonic-minor",
    label: "ハーモニックマイナー系",
    mode: "Harmonic Minor（7度が半音上がる）",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    triad: ["minor", "diminished", "augmented", "minor", "major", "major", "diminished"],
    seventh: ["minorMajor7", "minor7flat5", "major7sharp5", "minor7", "dominant7", "major7", "diminished7"],
    tension: ["minorMajor9", "minor7flat5add11", "major9sharp5", "minor9", "dominant7flat9", "major7sharp11", "diminished7"]
  },
  {
    id: "melodic-minor",
    label: "メロディックマイナー系",
    mode: "Melodic Minor（6度・7度が半音上がる）",
    intervals: [0, 2, 3, 5, 7, 9, 11],
    triad: ["minor", "minor", "augmented", "major", "major", "diminished", "diminished"],
    seventh: ["minorMajor7", "minor7", "major7sharp5", "dominant7", "dominant7", "minor7flat5", "minor7flat5"],
    tension: ["minorMajor9", "minor7flat9", "major9sharp5", "dominant7sharp11", "dominant7flat13", "minor9flat5", "minor7flat5"]
  }
]);

// ---- その他のスケール（7音以外も含む）。コードは固定表ではなく「そのスケールの音だけで作れるもの」を全部出す ----
// intervals: 主音（曲のKey）からの半音数。name: コード表記のスケール名（Keyを頭に付けて「C Phrygian Dominant」のように表示する）
const scale = (id, name, jp, intervals) => Object.freeze({ id, label: name, mode: jp ? `${name}（${jp}）` : name, intervals: Object.freeze(intervals), generic: true });

export const EXTRA_SCALE_GROUPS = Object.freeze([
  {
    id: "church",
    label: "チャーチ・モード",
    scales: [
      scale("dorian", "Dorian", "ドリアン", [0, 2, 3, 5, 7, 9, 10]),
      scale("phrygian", "Phrygian", "フリジアン", [0, 1, 3, 5, 7, 8, 10]),
      scale("lydian", "Lydian", "リディアン", [0, 2, 4, 6, 7, 9, 11]),
      scale("mixolydian", "Mixolydian", "ミクソリディアン", [0, 2, 4, 5, 7, 9, 10]),
      scale("locrian", "Locrian", "ロクリアン", [0, 1, 3, 5, 6, 8, 10])
    ]
  },
  {
    id: "harmonic-modes",
    label: "ハーモニックマイナー系のモード",
    scales: [
      scale("locrian-nat6", "Locrian ♮6", "ロクリアン♮6", [0, 1, 3, 5, 6, 9, 10]),
      scale("ionian-sharp5", "Ionian ♯5", "イオニアン♯5", [0, 2, 4, 5, 8, 9, 11]),
      scale("dorian-sharp4", "Dorian ♯4", "ドリアン♯4", [0, 2, 3, 6, 7, 9, 10]),
      scale("phrygian-dominant", "Phrygian Dominant", "スパニッシュ", [0, 1, 4, 5, 7, 8, 10]),
      scale("lydian-sharp2", "Lydian ♯2", "リディアン♯2", [0, 3, 4, 6, 7, 9, 11]),
      scale("superlocrian-bb7", "Superlocrian ♭♭7", "スーパーロクリアン♭♭7", [0, 1, 3, 4, 6, 8, 9])
    ]
  },
  {
    id: "melodic-modes",
    label: "メロディックマイナー系のモード",
    scales: [
      scale("dorian-flat2", "Dorian ♭2", "ドリアン♭2", [0, 1, 3, 5, 7, 9, 10]),
      scale("lydian-augmented", "Lydian Augmented", "リディアン・オーギュメント", [0, 2, 4, 6, 8, 9, 11]),
      scale("lydian-dominant", "Lydian Dominant", "リディアン♭7", [0, 2, 4, 6, 7, 9, 10]),
      scale("mixolydian-flat6", "Mixolydian ♭6", "ミクソリディアン♭6", [0, 2, 4, 5, 7, 8, 10]),
      scale("locrian-nat2", "Locrian ♮2", "ハーフ・ディミニッシュ", [0, 2, 3, 5, 6, 8, 10]),
      scale("altered", "Altered", "オルタード", [0, 1, 3, 4, 6, 8, 10])
    ]
  },
  {
    id: "world",
    label: "スパニッシュ・東欧など",
    scales: [
      scale("double-harmonic", "Double Harmonic", "ビザンチン", [0, 1, 4, 5, 7, 8, 11]),
      scale("hungarian-minor", "Hungarian Minor", "ハンガリアン・マイナー", [0, 2, 3, 6, 7, 8, 11]),
      scale("spanish-8", "Spanish 8-Note", "スパニッシュ8音", [0, 1, 3, 4, 5, 6, 8, 10])
    ]
  },
  {
    id: "symmetric",
    label: "対称・ペンタトニック・ブルース",
    scales: [
      scale("whole-tone", "Whole Tone", "ホールトーン", [0, 2, 4, 6, 8, 10]),
      scale("diminished-wh", "Diminished W-H", "ディミニッシュ（全半）", [0, 2, 3, 5, 6, 8, 9, 11]),
      scale("diminished-hw", "Diminished H-W", "コンビネーション・オブ・ディミニッシュ（半全）", [0, 1, 3, 4, 6, 7, 9, 10]),
      scale("major-pentatonic", "Major Pentatonic", "メジャーペンタ", [0, 2, 4, 7, 9]),
      scale("minor-pentatonic", "Minor Pentatonic", "マイナーペンタ", [0, 3, 5, 7, 10]),
      scale("blues", "Blues", "ブルース", [0, 3, 5, 6, 7, 10])
    ]
  },
  {
    id: "japanese",
    label: "日本の音階",
    scales: [
      scale("miyako-bushi", "Miyako-bushi", "都節音階", [0, 1, 5, 7, 8]),
      scale("in-sen", "In Scale", "陰旋法", [0, 1, 5, 7, 10]),
      scale("ritsu", "Ritsu / Yo", "律・陽旋法", [0, 2, 5, 7, 9]),
      scale("ryukyu", "Ryukyu", "琉球音階", [0, 4, 5, 7, 11])
    ]
  }
]);

const EXTRA_SCALES = EXTRA_SCALE_GROUPS.flatMap((group) => group.scales);

export function getScaleFamily(id) {
  return SCALE_FAMILIES.find((family) => family.id === id)
    ?? EXTRA_SCALES.find((family) => family.id === id)
    ?? SCALE_FAMILIES[0];
}

// ダイアトニックは、曲のScale（major / minor）に合わせた1つ。それ以外は2つのMinor系
export function scaleFamiliesForProject(scale) {
  const diatonic = getScaleFamily(scale === "minor" ? "natural-minor" : "major");
  return [diatonic, getScaleFamily("harmonic-minor"), getScaleFamily("melodic-minor")];
}

// セレクト用: [{ label, families[] }]。先頭はダイアトニック系（曲のScaleに合う1つ + ハーモニック / メロディックマイナー）
export function scaleFamilyGroups(scale) {
  return [
    { label: "ダイアトニック・マイナー系", families: scaleFamiliesForProject(scale) },
    ...EXTRA_SCALE_GROUPS.map((group) => ({ label: group.label, families: group.scales }))
  ];
}

export function isScaleFamilyAvailable(scale, familyId) {
  return scaleFamilyGroups(scale).some((group) => group.families.some((family) => family.id === familyId));
}

// 戻り値: 7つの { root, quality, degree, symbol }。degree は ii7 / IVmaj7 / V7♭9 のような表記
export function scaleSetChords({ key, familyId, level }) {
  const family = getScaleFamily(familyId);
  const qualities = family[level];
  if (!qualities) throw new Error(`Unsupported scale set level: ${level}`);
  const tonic = rootToPitchClass(key);

  return family.intervals.map((interval, index) => {
    const root = (tonic + interval) % 12;
    const quality = qualities[index];
    return {
      root,
      quality,
      degree: degreeFromBase(ROMAN_BASES[index], quality),
      symbol: chordSymbol(root, quality)
    };
  });
}

// ---- 「そのスケールの音だけで作れるコード」を度ごとに全部出す（テンション段階・特殊和音・その他のスケール全般） ----
// 6th・add9 / 9th・11th・13th / 変化音 のグループがテンション。スケール外の音を含むコードは出さない。
const TENSION_GROUP_IDS = Object.freeze(["sixth", "tension", "altered"]);
const groupQualities = (ids) => CHORD_QUALITY_GROUPS.filter((group) => ids.includes(group.id)).flatMap((group) => group.qualities);

const LEVEL_QUALITIES = Object.freeze({
  triad: Object.freeze(["major", "minor", "diminished", "augmented", "sus2", "sus4"]),
  seventh: Object.freeze(["dominant7", "major7", "minor7", ...groupQualities(["seventh"])]),
  tension: Object.freeze(groupQualities(TENSION_GROUP_IDS)),
  special: Object.freeze(groupQualities(["special"]))
});

export const SCALE_PANEL_LEVELS = Object.freeze([
  ...SCALE_SET_LEVELS,
  { id: "special", label: "特殊和音", note: "4度堆積・5度堆積・So What・神秘和音のうち、そのスケールの音だけでできるもの。独特の浮遊感なので、1〜2か所に。" }
]);

const CHROMATIC_BASES = Object.freeze(["I", "♭II", "II", "♭III", "III", "IV", "♭V", "V", "♭VI", "VI", "♭VII", "VII"]);

export function scaleLevelRows({ key, familyId, level }) {
  const qualities = LEVEL_QUALITIES[level];
  if (!qualities) throw new Error(`Unsupported scale set level: ${level}`);
  const family = getScaleFamily(familyId);
  const tonic = rootToPitchClass(key);
  const scalePcs = new Set(family.intervals.map((interval) => (tonic + interval) % 12));

  return family.intervals.map((interval, index) => {
    const root = (tonic + interval) % 12;
    const base = family.generic ? CHROMATIC_BASES[interval % 12] : ROMAN_BASES[index];
    const chords = qualities
      .filter((quality) => chordIntervals(quality).every((tone) => scalePcs.has((root + tone) % 12)))
      .map((quality) => ({
        root,
        quality,
        degree: degreeFromBase(base, quality),
        symbol: chordSymbol(root, quality)
      }));
    return { index, root, base, chords };
  });
}

export function scaleTensionChords({ key, familyId }) {
  return scaleLevelRows({ key, familyId, level: "tension" });
}
