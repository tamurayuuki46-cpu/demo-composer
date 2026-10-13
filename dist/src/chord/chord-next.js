import { chordDegreeForVariant, chordSymbol, getDiatonicChords, rootToPitchClass } from "./chord-theory.js";

// 次のコード候補を3つ出す。AIが決めるのではなく、「次に来やすい3つ」を見せて人間が選ぶための叩き台。
// 候補はダイアトニックコード（Key / Scaleの7和音）の中から、直前のコードに応じて選ぶ。
// 各項目は [ダイアトニックの番号(0=I/i), ひとこと理由]。

const NEXT_MAJOR = [
  [[4, "王道。前へ進む"], [5, "切なさが出る"], [3, "ひらけた感じ"]],
  [[4, "王道。Iへ向かう"], [3, "やわらかい"], [5, "しっとり"]],
  [[5, "切ない流れ"], [3, "ひらけた感じ"], [1, "ひとひねり"]],
  [[4, "王道。盛り上がる"], [0, "落ち着く"], [1, "やわらかい"]],
  [[0, "王道。解決する"], [5, "意外。終わらず続く"], [3, "ひらけた感じ"]],
  [[3, "王道。ひらける"], [1, "やわらかい"], [4, "盛り上がる"]],
  [[0, "解決する"], [2, "しっとり"], [5, "切ない流れ"]]
];

const NEXT_MINOR = [
  [[5, "王道。ひらける"], [3, "しっとり"], [6, "前へ進む"]],
  [[4, "Vへ向かう"], [0, "落ち着く"], [3, "しっとり"]],
  [[5, "ひらける"], [3, "しっとり"], [6, "前へ進む"]],
  [[6, "前へ進む"], [0, "落ち着く"], [4, "張りつめる"]],
  [[0, "王道。解決する"], [5, "意外。終わらず続く"], [3, "しっとり"]],
  [[6, "王道。前へ進む"], [2, "明るくなる"], [3, "しっとり"]],
  [[2, "明るくなる"], [0, "落ち着く"], [5, "ひらける"]]
];

const START_MAJOR = [[0, "いちばん安定した始まり"], [5, "切なく始まる"], [3, "ひらけた始まり"]];
const START_MINOR = [[0, "安定した始まり"], [5, "ひらけた始まり"], [3, "しっとり始まる"]];

function findDiatonicIndex(chord, diatonic) {
  return diatonic.findIndex((candidate) => candidate.root === chord.root && candidate.quality === chord.quality);
}

// chords: 現在のコード進行。空なら「曲の始まり」の候補を返す。
// 戻り値: [{ root, quality, degree, symbol, reason }] 常に3つ。
export function suggestNextChords(chords, { key, scale }) {
  const diatonic = getDiatonicChords(key, scale);
  const isMajor = scale === "major";
  const last = chords[chords.length - 1];
  const lastIndex = last ? findDiatonicIndex(last, diatonic) : -1;

  let picks;
  if (!last || lastIndex === -1) {
    // 空、またはダイアトニック外のコードの直後は、始まり（落ち着ける場所）の候補を出す
    picks = isMajor ? START_MAJOR : START_MINOR;
  } else {
    picks = (isMajor ? NEXT_MAJOR : NEXT_MINOR)[lastIndex];
  }

  return picks.map(([index, reason]) => {
    const chord = diatonic[index];
    return {
      root: chord.root,
      quality: chord.quality,
      degree: chord.degree,
      symbol: chordSymbol(chord.root, chord.quality),
      reason
    };
  });
}

// ひとスパイス: 同主調（同じ主音のMajor / Minor）から和音を1つ借りる候補。
// Majorの曲ではMinor側から、Minorの曲ではMajor側から借りる。使いすぎず、1つだけ混ぜるのがコツ。
const SPICE_MAJOR = [
  { semitones: 5, quality: "minor", reason: "切ない影が差す（Fm系）" },
  { semitones: 10, quality: "major", reason: "ロックっぽく抜ける（♭VII）" },
  { semitones: 8, quality: "major", reason: "ドラマチックに広がる（♭VI）" }
];
const SPICE_MINOR = [
  { semitones: 5, quality: "major", reason: "ぱっと明るくなる（IV）" },
  { semitones: 7, quality: "major", reason: "強くIへ向かう（V）" },
  { semitones: 0, quality: "major", reason: "最後に光が差す（I）" }
];

export function suggestSpiceChords({ key, scale }) {
  const tonic = rootToPitchClass(key);
  return (scale === "major" ? SPICE_MAJOR : SPICE_MINOR).map(({ semitones, quality, reason }) => {
    const root = (tonic + semitones) % 12;
    return {
      root,
      quality,
      degree: chordDegreeForVariant(root, key, quality),
      symbol: chordSymbol(root, quality),
      reason
    };
  });
}
