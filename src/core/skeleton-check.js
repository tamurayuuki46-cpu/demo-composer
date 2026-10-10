// 骨子完成チェック: 「PCを起動する前に決めておきたいこと」が埋まっているかを ✓ / △ / － で見る。
// 曲の良し悪しは採点しない。Projectを読むだけで、書き換えない純粋関数。

import { energyFlowText, getSections, sectionEnergy, sectionProgress, totalSectionBars } from "./section-ops.js";
import { counterBarCount } from "./counter-melody.js";

const DEFAULT_TARGET_BARS = 8;
// メロ・ベース・ドラムは休みの小節があってもよいので、この割合以上の小節に入っていれば ✓ とする
const FILLED_RATIO = 0.75;
const SOUND_PARTS = ["chord", "melody", "bass"];

export const SKELETON_MARKS = Object.freeze({ done: "✓", part: "△", none: "－" });

function markFor(filled, total, ratio) {
  if (filled <= 0) return "none";
  return filled >= Math.ceil(total * ratio) ? "done" : "part";
}

function partItem({ id, label, screen, progress, ratio, doneText, partText, noneText }) {
  const { filled, total } = progress;
  const mark = markFor(filled, total, ratio);
  return {
    id,
    label,
    screen,
    mark,
    detail: `${filled}/${total}小節`,
    hint: mark === "done" ? doneText : (mark === "part" ? partText : noneText)
  };
}

// 骨子の各項目。optional は完成数に入れない（あとで足す項目）
export function skeletonCheck(project) {
  const sections = getSections(project);
  const hasSections = sections.length > 0;
  const total = hasSections ? totalSectionBars(sections) : DEFAULT_TARGET_BARS;
  const progress = sectionProgress(project, 0, total);

  const items = [
    partItem({
      id: "chord",
      label: "Chord",
      screen: "chord",
      progress: progress.chord,
      ratio: 1,
      doneText: "全部の小節にコードが入っています。",
      partText: "コードが途中までです。続きを足すと、メロディやベースを決めやすくなります。",
      noneText: "まずコード進行を決めましょう（Hubの出発点やChordのPresetが近道です）。"
    }),
    partItem({
      id: "melody",
      label: "Melody",
      screen: "melody",
      progress: progress.melody,
      ratio: FILLED_RATIO,
      doneText: "メロディが全体に入っています。",
      partText: "メロディが一部だけです。サビなど大事な場所から埋めると決めやすいです。",
      noneText: "メロディはまだありません。候補を聴いて選ぶところから始められます。"
    }),
    partItem({
      id: "bass",
      label: "Bass",
      screen: "rhythm",
      progress: progress.bass,
      ratio: FILLED_RATIO,
      doneText: "ベースが全体に入っています。",
      partText: "ベースが一部だけです。コードの根音から入れると早いです。",
      noneText: "ベースはまだありません。Rhythmの候補から選べます。"
    }),
    partItem({
      id: "drums",
      label: "Drums",
      screen: "rhythm",
      progress: progress.drums,
      ratio: FILLED_RATIO,
      doneText: "ドラムが全体に入っています。",
      partText: "ドラムが一部だけです。Presetを全体に広げると形になります。",
      noneText: "ドラムはまだありません。Presetから選べます。"
    })
  ];

  // 構成: 区切りが2つ以上あれば「曲の形」がある。1つだけはループの段階
  const structureMark = sections.length >= 2 ? "done" : (sections.length === 1 ? "part" : "none");
  items.push({
    id: "structure",
    label: "Structure",
    screen: "arrange",
    mark: structureMark,
    detail: hasSections ? `${sections.length}つ・全${total}小節` : "未設定",
    hint: structureMark === "done"
      ? "曲の構成が決まっています。"
      : (structureMark === "part" ? "Sectionが1つだけ（ループの段階）です。Aメロ・サビなどに増やすと曲らしくなります。" : "曲の構成が未設定です。Arrangeで叩き台を選べます。")
  });

  // 盛り上がり: Sectionの間で High/Mid/Low に差があるか
  const levels = new Set(sections.map((section) => sectionEnergy(section)));
  const energyMark = !hasSections ? "none" : (levels.size >= 2 ? "done" : "part");
  items.push({
    id: "energy",
    label: "Energy",
    screen: "arrange",
    mark: energyMark,
    detail: hasSections ? energyFlowText(sections) : "未設定",
    hint: energyMark === "done"
      ? "盛り上がりの山と谷が決まっています。"
      : (energyMark === "part" ? "どのSectionも同じ盛り上がりです。サビをHighにするなど、差をつけてみましょう。" : "先に曲の構成を決めると、盛り上がりを設計できます。")
  });

  // 音色の方向性: Chord / Melody / Bass のうち、方向性を選んだパートの数
  const chosen = SOUND_PARTS.filter((part) => (project.instruments ?? []).some((entry) => entry.part === part));
  const soundMark = chosen.length === SOUND_PARTS.length ? "done" : (chosen.length > 0 ? "part" : "none");
  items.push({
    id: "sound",
    label: "Sound Direction",
    screen: "sound",
    mark: soundMark,
    detail: `${chosen.length}/${SOUND_PARTS.length}パート`,
    hint: soundMark === "done"
      ? "音色の方向性が決まっています。"
      : (soundMark === "part" ? "音色の方向性を選んだのは一部のパートです。" : "音色の方向性は未選択です。Soundで選ぶと、PCでの音作りの目安になります。")
  });

  // 任意: 裏メロ（骨子の完成数には入れない）
  const counterBars = counterBarCount(project, 0, total);
  const optional = [{
    id: "counter",
    label: "裏メロ",
    screen: "arrange",
    mark: counterBars > 0 ? "done" : "none",
    detail: counterBars > 0 ? `${counterBars}小節` : "なし",
    hint: counterBars > 0 ? "裏メロが入っています。" : "裏メロは任意です。サビなどに入れると厚みが出ます（Arrangeのセクションから）。"
  }];

  const doneCount = items.filter((item) => item.mark === "done").length;
  const next = items.find((item) => item.mark !== "done") ?? null;

  return {
    items,
    optional,
    doneCount,
    total: items.length,
    complete: doneCount === items.length,
    next
  };
}
