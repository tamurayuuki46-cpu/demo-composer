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

export function getScaleFamily(id) {
  return SCALE_FAMILIES.find((family) => family.id === id) ?? SCALE_FAMILIES[0];
}

// ダイアトニックは、曲のScale（major / minor）に合わせた1つ。それ以外は2つのMinor系
export function scaleFamiliesForProject(scale) {
  const diatonic = getScaleFamily(scale === "minor" ? "natural-minor" : "major");
  return [diatonic, getScaleFamily("harmonic-minor"), getScaleFamily("melodic-minor")];
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

// テンション段階用: 各度ごとに、構成音が すべてそのスケールの音 に収まるテンション系コードを全部返す。
// 対象は 6th・add9 / 9th・11th・13th / 変化音 のグループ（スケール外の音を含むものは出さない）。
const TENSION_GROUP_IDS = Object.freeze(["sixth", "tension", "altered"]);

export function scaleTensionChords({ key, familyId }) {
  const family = getScaleFamily(familyId);
  const tonic = rootToPitchClass(key);
  const scalePcs = new Set(family.intervals.map((interval) => (tonic + interval) % 12));
  const qualities = CHORD_QUALITY_GROUPS
    .filter((group) => TENSION_GROUP_IDS.includes(group.id))
    .flatMap((group) => group.qualities);

  return family.intervals.map((interval, index) => {
    const root = (tonic + interval) % 12;
    const chords = qualities
      .filter((quality) => chordIntervals(quality).every((tone) => scalePcs.has((root + tone) % 12)))
      .map((quality) => ({
        root,
        quality,
        degree: degreeFromBase(ROMAN_BASES[index], quality),
        symbol: chordSymbol(root, quality)
      }));
    return { index, root, base: ROMAN_BASES[index], chords };
  });
}
