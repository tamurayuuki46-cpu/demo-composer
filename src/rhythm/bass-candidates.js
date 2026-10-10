import { chordIntervals } from "../core/chord-qualities.js";
import { DRUM_PITCH, bassPitchForBar } from "./rhythm-grid.js";

// Bassの候補を3つ出す。1小節を16 stepで見て、ルート・5度・オクターブだけで作る。
// 候補は「叩き台」。選んだあとは通常の16 stepで1音ずつ直せる。

const STEPS = 16;

// steps: [{ step, semitones, length }]（lengthは16分何個分か）
function kickSynced(kickSteps) {
  return kickSteps.map((step, i) => {
    const next = kickSteps[i + 1] ?? STEPS;
    return { step, semitones: 0, length: Math.max(1, Math.min(next - step, 4)) };
  });
}

export function bassCandidatesForBar(project, barIndex, { barTicks, stepTicks }) {
  const barStartTick = barIndex * barTicks;
  const quality = project.chords[barIndex]?.quality ?? "major";
  const fifth = chordIntervals(quality)[2] ?? 7;

  const kickSteps = [...new Set(
    (project.tracks.find((track) => track.role === "drums")?.notes ?? [])
      .filter((note) => note.pitch === DRUM_PITCH.kick
        && note.startTick >= barStartTick && note.startTick < barStartTick + barTicks)
      .map((note) => Math.round((note.startTick - barStartTick) / stepTicks))
  )].filter((step) => step >= 0 && step < STEPS).sort((a, b) => a - b);

  const first = kickSteps.length > 0
    ? { id: "kick", label: "Kickに合わせる", description: "Kickと同じ位置にルートを置く", steps: kickSynced(kickSteps) }
    : { id: "root-long", label: "どっしり", description: "ルートを2回、長めに", steps: [
      { step: 0, semitones: 0, length: 8 },
      { step: 8, semitones: 0, length: 8 }
    ] };

  const candidates = [
    first,
    { id: "root-fifth", label: "ルート + 5度", description: "ルートの流れに5度を1回はさむ", steps: [
      { step: 0, semitones: 0, length: 4 },
      { step: 4, semitones: 0, length: 4 },
      { step: 8, semitones: fifth, length: 4 },
      { step: 12, semitones: 0, length: 4 }
    ] },
    { id: "octave-bounce", label: "はずむ（オクターブ）", description: "8分でオクターブを行き来", steps: [0, 2, 4, 6, 8, 10, 12, 14].map((step, i) => ({
      step,
      semitones: i % 2 === 0 ? 0 : 12,
      length: 2
    })) }
  ];

  return candidates;
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
