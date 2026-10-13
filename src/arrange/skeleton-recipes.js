// 骨子レシピ: 完成曲ではなく「作曲判断の流れ」のPreset（v0.3 骨子作り支援 第1段階）。
// レシピ = 感情の言葉 + Sectionの並び（kind / bars / energy / transition）。
// 適用すると structure.sections を置き換える（既存の項目だけを使う。Schema変更なし）。音符・コード・ドラムは変えない。
// Projectを読み書きしない純粋データと、Sectionの配列を作る関数だけを置く。

import {
  ENERGY_LEVELS,
  MAX_SECTION_BARS,
  MAX_SECTIONS,
  MAX_TOTAL_BARS,
  SECTION_KINDS,
  TRANSITIONS,
  createSection
} from "../core/section-ops.js";

// 各Sectionの役割（表示のみ・保存しない）。初心者が「ここで何をするか」を迷わないための一言
export const SECTION_ROLES = Object.freeze({
  intro: "雰囲気を示す",
  verse: "情報を出す",
  prechorus: "期待を上げる",
  chorus: "一番覚えてほしい",
  interlude: "息継ぎ",
  bridge: "景色を変える",
  outro: "余韻"
});

// s(種類, 小節, Energy, 次へのつなぎ, 感情の言葉)
const s = (kind, bars, energy, transition = "keep", feeling = "") => ({ kind, bars, energy, transition, feeling });

export const SKELETON_RECIPES = Object.freeze([
  {
    id: "sad-to-release",
    label: "切ない → 解放",
    feelings: "静か → 期待 → 解放 → 余韻",
    description: "Aメロは静かに抑え、Bメロで期待を上げ、サビ前に一度止めてから解放する。気持ちの変化がいちばん伝わりやすい基本形。",
    sections: [s("intro", 4, "low", "keep", "静か"), s("verse", 8, "low", "keep", "静か"), s("prechorus", 8, "mid", "stop", "期待"), s("chorus", 8, "high", "keep", "解放"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "first-chorus",
    label: "王道 1番サビ型",
    feelings: "静か → 期待 → 解放 → 一息 → もう一度",
    description: "1番をそのまま2番で繰り返すJ-POPの王道。2番は1番を少し変えるだけでよいので、作る量が少ない。",
    sections: [s("intro", 4, "low", "keep", "静か"), s("verse", 8, "low", "keep", "静か"), s("prechorus", 8, "mid", "fill", "期待"), s("chorus", 8, "high", "keep", "解放"), s("interlude", 4, "mid", "keep", "一息"), s("verse", 8, "low", "keep", "もう一度"), s("prechorus", 8, "mid", "fill", "期待"), s("chorus", 8, "high", "keep", "解放"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "last-chorus-max",
    label: "ラスサビ最大型",
    feelings: "控えめ → 落とす → 最大",
    description: "1番サビはあえてMidに抑え、Cメロで落として止め、ラスサビでHighにする。最後に一番大きな山を作る。",
    sections: [s("intro", 4, "low", "keep", "控えめ"), s("verse", 8, "low", "keep", "控えめ"), s("prechorus", 8, "mid", "build", "期待"), s("chorus", 8, "mid", "keep", "少し開く"), s("bridge", 8, "low", "stop", "落とす"), s("chorus", 8, "high", "keep", "最大"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "gradual-rise",
    label: "徐々に上昇型",
    feelings: "静か → じわじわ → 最大",
    description: "Bメロを作らず、Aメロを2回目で少し強くしてサビへ。少ないSectionで右肩上がりを作る。",
    sections: [s("intro", 4, "low", "keep", "静か"), s("verse", 8, "low", "keep", "静か"), s("verse", 8, "mid", "build", "じわじわ"), s("chorus", 8, "high", "keep", "最大"), s("chorus", 8, "high", "keep", "最大"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "drop-then-max",
    label: "一度落として最後に最大",
    feelings: "解放 → 静けさ → もう一度大きく",
    description: "サビのあとCメロで一度静かにし、ためてから（Drop）最後のサビへ。落差でサビがもう一度新鮮に聞こえる。",
    sections: [s("intro", 4, "low", "keep", "静か"), s("verse", 8, "low", "keep", "静か"), s("prechorus", 8, "mid", "fill", "期待"), s("chorus", 8, "high", "keep", "解放"), s("bridge", 8, "low", "drop", "静けさ"), s("chorus", 8, "high", "keep", "もう一度大きく"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "chorus-first",
    label: "サビ先行",
    feelings: "先に聴かせる → 戻る → 解放",
    description: "いきなりサビから始めて耳をつかみ、Aメロに戻る。サビのメロディに自信があるときに。",
    sections: [s("chorus", 8, "high", "keep", "先に聴かせる"), s("verse", 8, "low", "keep", "戻る"), s("prechorus", 8, "mid", "build", "期待"), s("chorus", 8, "high", "keep", "解放"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "dance-loop",
    label: "ダンス・ループ",
    feelings: "ずっと動く → 山 → 一息 → 山",
    description: "Aメロも止まらずMidで動き続け、サビで山を作る。ノリを途切れさせない、ループ中心の曲に。",
    sections: [s("intro", 4, "low", "build", "期待"), s("verse", 8, "mid", "keep", "動く"), s("chorus", 8, "high", "fill", "山"), s("interlude", 4, "mid", "keep", "一息"), s("verse", 8, "mid", "keep", "動く"), s("chorus", 8, "high", "keep", "山"), s("outro", 4, "low", "keep", "余韻")]
  },
  {
    id: "ballad",
    label: "バラード",
    feelings: "静かに始まり → 一度だけ開いて → 静かに終わる",
    description: "Aメロを2回重ねてゆっくり語り、Bメロで少しずつ盛り上げてサビへ。長めのアウトロで余韻を残す。",
    sections: [s("intro", 4, "low", "keep", "静か"), s("verse", 8, "low", "keep", "語る"), s("verse", 8, "low", "keep", "語る"), s("prechorus", 8, "mid", "build", "高まる"), s("chorus", 8, "high", "keep", "開く"), s("outro", 8, "low", "keep", "余韻")]
  }
]);

export function getSkeletonRecipe(id) {
  return SKELETON_RECIPES.find((recipe) => recipe.id === id) ?? null;
}

export function recipeTotalBars(recipe) {
  return recipe.sections.reduce((sum, item) => sum + item.bars, 0);
}

// 山の形（▂ Low / ▅ Mid / █ High）。カードや「いまの構成の山」の表示用
const SHAPE = Object.freeze({ low: "▂", mid: "▅", high: "█" });
export function energyShape(energies) {
  return energies.map((energy) => SHAPE[energy] ?? "▅").join("");
}

// レシピ → structure.sections。最後のSectionの「つなぎ」は持たない（次が無いので）
export function sectionsFromRecipe(recipeOrId) {
  const recipe = typeof recipeOrId === "string" ? getSkeletonRecipe(recipeOrId) : recipeOrId;
  if (!recipe) throw new Error("骨子レシピが見つかりません。");
  const last = recipe.sections.length - 1;
  return recipe.sections.reduce((sections, item, index) => {
    const section = { ...createSection(item.kind, item.bars, sections), energy: item.energy };
    if (index < last && item.transition !== "keep") section.transition = item.transition;
    return [...sections, section];
  }, []);
}

// レシピ定義の自己検査（テスト用）。問題があれば例外
export function validateRecipe(recipe) {
  if (!recipe.id || !recipe.label || !recipe.feelings || !recipe.description) throw new Error(`${recipe.id}: 名前・感情・説明が必要です。`);
  if (recipe.sections.length < 3 || recipe.sections.length > MAX_SECTIONS) throw new Error(`${recipe.id}: Section数が範囲外です。`);
  if (recipeTotalBars(recipe) > MAX_TOTAL_BARS) throw new Error(`${recipe.id}: 小節数が多すぎます。`);
  recipe.sections.forEach((item, index) => {
    if (!Object.hasOwn(SECTION_KINDS, item.kind)) throw new Error(`${recipe.id}[${index}]: 種類が不正です。`);
    if (!Number.isInteger(item.bars) || item.bars < 1 || item.bars > MAX_SECTION_BARS) throw new Error(`${recipe.id}[${index}]: 小節数が不正です。`);
    if (!ENERGY_LEVELS.some((level) => level.id === item.energy)) throw new Error(`${recipe.id}[${index}]: Energyが不正です。`);
    if (!TRANSITIONS.some((transition) => transition.id === item.transition)) throw new Error(`${recipe.id}[${index}]: つなぎが不正です。`);
    if (!item.feeling) throw new Error(`${recipe.id}[${index}]: 感情の言葉が必要です。`);
  });
  if (recipe.sections[recipe.sections.length - 1].transition !== "keep") throw new Error(`${recipe.id}: 最後のSectionにつなぎは付けません。`);
  return true;
}
