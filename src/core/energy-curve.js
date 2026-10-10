import { createSection, sectionEnergy } from "./section-ops.js";

// 感情曲線（盛り上がりの山と谷）から、曲の構成（Section）を作る。
// 画面で「時間の流れ」を何列かに区切り、各列の高さ（Low / Mid / High）を選ぶと、
// 並びと高さからSectionの種類・小節数・Energyを決める叩き台にする。あとからArrangeで自由に直せる。
// Projectを読み書きしない純粋関数（構成の値を返すだけ）。

export const MIN_CURVE_COLUMNS = 4;
export const MAX_CURVE_COLUMNS = 8;
export const DEFAULT_CURVE = Object.freeze(["low", "low", "mid", "high", "low"]);

const LEVELS = ["low", "mid", "high"];

// 各列のSectionの種類と小節数を決める。
//  先頭がLow → イントロ(4) / 最後がLow → アウトロ(4) / High → サビ(8)
//  Mid → 次がHighならBメロ(8)、前にサビがあればCメロ(8)、それ以外はAメロ(8)
//  途中のLow → 前がHighなら間奏(4)、それ以外はAメロ(8)
export function curveKinds(levels) {
  const last = levels.length - 1;
  let seenChorus = false;
  return levels.map((level, i) => {
    let kind;
    if (level === "high") kind = { kind: "chorus", bars: 8 };
    else if (level === "low" && i === 0) kind = { kind: "intro", bars: 4 };
    else if (level === "low" && i === last) kind = { kind: "outro", bars: 4 };
    else if (level === "low") kind = levels[i - 1] === "high" ? { kind: "interlude", bars: 4 } : { kind: "verse", bars: 8 };
    else if (levels[i + 1] === "high") kind = { kind: "prechorus", bars: 8 };
    else kind = seenChorus ? { kind: "bridge", bars: 8 } : { kind: "verse", bars: 8 };
    if (level === "high") seenChorus = true;
    return { ...kind, energy: level };
  });
}

export function sectionsFromCurve(levels) {
  if (!Array.isArray(levels) || levels.length < MIN_CURVE_COLUMNS || levels.length > MAX_CURVE_COLUMNS) {
    throw new Error(`曲線は${MIN_CURVE_COLUMNS}〜${MAX_CURVE_COLUMNS}列にしてください。`);
  }
  if (!levels.every((level) => LEVELS.includes(level))) {
    throw new Error("曲線の高さが不正です。");
  }
  return curveKinds(levels).reduce((sections, { kind, bars, energy }) => {
    const section = createSection(kind, bars, sections);
    return [...sections, { ...section, energy }];
  }, []);
}

// いまの構成を曲線にする（編集画面の初期値）。Sectionが無い・列が範囲外ならデフォルト。
export function curveFromSections(sections) {
  if (!Array.isArray(sections) || sections.length < MIN_CURVE_COLUMNS || sections.length > MAX_CURVE_COLUMNS) {
    return [...DEFAULT_CURVE];
  }
  return sections.map((section) => sectionEnergy(section));
}
