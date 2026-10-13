import { chordIntervals } from "../core/chord-qualities.js";
import { DRUM_PITCH, bassPitchForBar } from "./rhythm-grid.js";

// Bass候補は完成形ではなく、方向性を聴き比べるための叩き台。
// 5タイプから選んだ後は、通常の16 stepで1音ずつ修正できる。

const STEPS = 16;

function sortedUnique(items) {
  const byStep = new Map();
  for (const item of items) {
    if (item.step < 0 || item.step >= STEPS || byStep.has(item.step)) continue;
    byStep.set(item.step, item);
  }
  return [...byStep.values()].sort((a, b) => a.step - b.step);
}

function funkSteps(kickSteps, color, fifth) {
  const anchors = kickSteps.length > 0 ? kickSteps : [0, 6, 8, 14];
  const notes = [];

  anchors.forEach((step, index) => {
    notes.push({ step, semitones: index % 3 === 1 ? fifth : 0, length: 1 });

    // Kickの直後に短い返しを置き、休符を残したまま裏拍感を作る。
    if (index % 2 === 0 && step + 2 < STEPS) {
      notes.push({ step: step + 2, semitones: index % 4 === 0 ? color : fifth, length: 1 });
    }
  });

  return sortedUnique(notes);
}

// Bass × Kick: 候補がKickとどういう関係かを一言で。Kickが無いときは判定せず、Kickを入れるよう案内する。
export function kickRelation(steps, kickSteps) {
  if (kickSteps.length === 0) return "Kickがまだありません。Kickを入れると、Bassとの関係が分かります。";
  const bassSteps = steps.map((item) => item.step);
  const together = bassSteps.filter((step) => kickSteps.includes(step)).length;
  const alone = bassSteps.length - together;
  const offbeat = bassSteps.filter((step) => step % 4 === 2 && !kickSteps.includes(step)).length;
  if (alone === 0 || together / bassSteps.length >= 0.7) return "Kickと一緒に鳴る（低音が揃って、重く安定する）";
  if (offbeat >= 2) return "裏拍でBassが動く（Kickの間を埋めて、ノリが出る）";
  if (together / bassSteps.length < 0.5) return "Bassだけ動く（Kickは土台、Bassが動きをつける）";
  return "Kickと一部が重なる（土台は揃えて、ところどころ動く）";
}

export function bassCandidatesForBar(project, barIndex, { barTicks, stepTicks }) {
  const barStartTick = barIndex * barTicks;
  const quality = project.chords[barIndex]?.quality ?? "major";
  const intervals = chordIntervals(quality);
  const color = intervals[1] ?? 3;
  const fifth = intervals[2] ?? intervals[1] ?? 7;

  const kickSteps = [...new Set(
    (project.tracks.find((track) => track.role === "drums")?.notes ?? [])
      .filter((note) => note.pitch === DRUM_PITCH.kick
        && note.startTick >= barStartTick && note.startTick < barStartTick + barTicks)
      .map((note) => Math.round((note.startTick - barStartTick) / stepTicks))
  )].filter((step) => step >= 0 && step < STEPS).sort((a, b) => a - b);

  const candidates = [
    {
      id: "root-long",
      label: "ルート型",
      description: "音数を減らして土台を作る。まず迷ったときの基本形",
      steps: [
        { step: 0, semitones: 0, length: 8 },
        { step: 8, semitones: 0, length: 8 }
      ]
    },
    {
      id: "hook-riff",
      label: "リフ型",
      description: "短い反復と空白で、低音そのものをフックにする",
      steps: [
        { step: 0, semitones: 0, length: 2 },
        { step: 3, semitones: fifth, length: 1 },
        { step: 6, semitones: 0, length: 2 },
        { step: 8, semitones: 12, length: 2 },
        { step: 11, semitones: fifth, length: 1 },
        { step: 14, semitones: 0, length: 2 }
      ]
    },
    {
      id: "funk-sync",
      label: "ファンク型",
      description: kickSteps.length > 0
        ? "Kickに噛ませつつ、短い返しを入れてシンコペーションを作る"
        : "休符と短い返しでシンコペーションを作る。Kick追加後は位置も反映",
      steps: funkSteps(kickSteps, color, fifth)
    },
    {
      id: "synthwave-eighth",
      label: "シンセウェーブ型",
      description: "8分の一定駆動。ルートとオクターブで前へ進める",
      steps: [0, 2, 4, 6, 8, 10, 12, 14].map((step, index) => ({
        step,
        semitones: index % 2 === 0 ? 0 : 12,
        length: 2
      }))
    },
    {
      id: "melodic-counter",
      label: "裏メロ型",
      description: "コードトーンで小さな旋律を作り、Bassにも流れを持たせる",
      steps: [
        { step: 0, semitones: 0, length: 4 },
        { step: 4, semitones: color, length: 2 },
        { step: 6, semitones: fifth, length: 2 },
        { step: 8, semitones: 0, length: 4 },
        { step: 12, semitones: fifth, length: 2 },
        { step: 14, semitones: color, length: 2 }
      ]
    }
  ];
  return candidates.map((candidate) => ({ ...candidate, kickRelation: kickRelation(candidate.steps, kickSteps) }));
}

// 16文字の見た目（● = 音あり）
export function bassPatternDots(steps) {
  const on = new Set(steps.map((item) => item.step));
  return Array.from({ length: STEPS }, (_, step) => (on.has(step) ? "●" : "・")).join("");
}

// 候補を現在の小節へ適用した、Bass全体のノート配列を返す（元の配列は変更しない）。
export function applyBassCandidate(project, notes, barIndex, candidate, { barTicks, stepTicks, createId }) {
  const barStartTick = barIndex * barTicks;
  const basePitch = bassPitchForBar(project, barIndex);
  const retained = notes.filter((note) => note.startTick < barStartTick || note.startTick >= barStartTick + barTicks);
  const added = candidate.steps.map((item) => ({
    id: createId(),
    pitch: basePitch + item.semitones,
    startTick: barStartTick + item.step * stepTicks,
    durationTick: Math.min(item.length * stepTicks, barTicks - item.step * stepTicks),
    velocity: 100
  }));
  return [...retained, ...added].sort((a, b) => a.startTick - b.startTick);
}
