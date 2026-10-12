import { rootToPitchClass } from "../chord/chord-theory.js";
import { chordIntervals } from "../core/chord-qualities.js";

const SCALE_INTERVALS = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
});

const EIGHTH_STEPS = 8;
export const MELODY_CANDIDATE_VARIATION_COUNT = 4;

const STABLE_VARIANTS = Object.freeze([
  { steps: [0, 2, 4, 6], order: [0, 1, 2, 1], lengths: [2] },
  { steps: [0, 2, 5, 6], order: [1, 2, 0, 1], lengths: [2, 3, 1, 2] },
  { steps: [0, 3, 4, 6], order: [2, 1, 0, 1], lengths: [3, 1, 2, 2] },
  { steps: [0, 2, 4, 7], order: [0, 2, 1, 0], lengths: [2, 2, 3, 1] }
]);

const CATCHY_VARIANTS = Object.freeze([
  { steps: [0, 1, 3, 4, 5, 7], order: [0, 1, 2, 0, 1, 3], lengths: [1, 2, 1, 1, 2, 1] },
  { steps: [0, 1, 2, 4, 6, 7], order: [1, 2, 1, 0, 2, 3], lengths: [1, 1, 2, 2, 1, 1] },
  { steps: [0, 2, 3, 4, 5, 7], order: [0, 3, 1, 2, 1, 0], lengths: [2, 1, 1, 1, 2, 1] },
  { steps: [0, 1, 3, 5, 6, 7], order: [2, 1, 0, 3, 1, 2], lengths: [1, 2, 2, 1, 1, 1] }
]);

// 浮遊感: 2度・6度の色を混ぜつつ、長い音や休みで余白を作らず、小節の終わりまで音がつながって動く（各音は次の音の頭までのびる）
const FLOATING_VARIANTS = Object.freeze([
  { steps: [0, 2, 3, 4, 6, 7], order: [1, 0, 2, 1, 3, 0], lengths: [2, 1, 1, 2, 1, 1] },
  { steps: [0, 1, 3, 4, 6, 7], order: [0, 1, 3, 2, 1, 0], lengths: [1, 2, 1, 2, 1, 1] },
  { steps: [0, 2, 4, 5, 6, 7], order: [1, 2, 0, 1, 3, 0], lengths: [2, 2, 1, 1, 1, 1] },
  { steps: [0, 1, 2, 4, 6, 7], order: [0, 2, 1, 3, 0, 1], lengths: [1, 1, 2, 2, 1, 1] }
]);

function positiveMod(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function pitchForClass(pitchClass, octave = 4) {
  const baseC = (octave + 1) * 12;
  return Math.max(0, Math.min(127, baseC + positiveMod(pitchClass, 12)));
}

function scalePitchClasses(key, scale) {
  const tonic = rootToPitchClass(key);
  const intervals = SCALE_INTERVALS[scale] ?? SCALE_INTERVALS.major;
  return intervals.map((interval) => (tonic + interval) % 12);
}

function chordPitchClasses(project, barIndex) {
  const chord = project.chords[barIndex];
  if (!chord) return [];
  return chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);
}

function unique(values) {
  return [...new Set(values)];
}

function makeSteps(stepIndexes, pitchClasses, lengths, octave) {
  return stepIndexes.map((step, index) => ({
    step,
    pitch: pitchForClass(pitchClasses[index % pitchClasses.length], octave),
    length: Math.max(1, Math.min(lengths[index % lengths.length], EIGHTH_STEPS - step))
  }));
}

function orderedPitchClasses(source, order, fallback) {
  const pool = source.length > 0 ? source : [fallback];
  return order.map((index) => pool[index % pool.length] ?? fallback);
}

export function melodyCandidatesForBar(project, barIndex, { octave = 4, variation = 0 } = {}) {
  const scalePcs = scalePitchClasses(project.basic.key, project.basic.scale);
  const chordPcs = chordPitchClasses(project, barIndex);
  const tonic = rootToPitchClass(project.basic.key);
  const chordRoot = project.chords[barIndex]?.root ?? tonic;
  const variantIndex = positiveMod(Math.trunc(variation), MELODY_CANDIDATE_VARIATION_COUNT);

  const stablePcs = chordPcs.length > 0 ? chordPcs : scalePcs;
  const stableShape = unique([
    stablePcs[0] ?? chordRoot,
    stablePcs[1] ?? scalePcs[2] ?? chordRoot,
    stablePcs[2] ?? scalePcs[4] ?? chordRoot
  ]);

  const second = scalePcs.find((pc) => positiveMod(pc - chordRoot, 12) === 2) ?? scalePcs[1] ?? stableShape[0];
  const sixth = scalePcs.find((pc) => [8, 9].includes(positiveMod(pc - chordRoot, 12))) ?? scalePcs[5] ?? second;
  const passing = scalePcs.find((pc) => !stableShape.includes(pc)) ?? second;

  const phase = positiveMod(barIndex + variantIndex, Math.max(1, stableShape.length));
  const rotatedStable = stableShape.map((_, index) => stableShape[(index + phase) % stableShape.length]);
  const stableVariant = STABLE_VARIANTS[variantIndex];
  const catchyVariant = CATCHY_VARIANTS[variantIndex];
  const floatingVariant = FLOATING_VARIANTS[variantIndex];
  const catchyPool = [
    rotatedStable[0] ?? chordRoot,
    rotatedStable[1] ?? rotatedStable[0] ?? chordRoot,
    rotatedStable[2] ?? rotatedStable[0] ?? chordRoot,
    passing
  ];
  const floatingPool = [
    second,
    sixth,
    rotatedStable[2] ?? rotatedStable[0] ?? chordRoot,
    rotatedStable[1] ?? rotatedStable[0] ?? chordRoot
  ];

  return [
    {
      id: "stable",
      label: "安定",
      description: "コードトーン中心。歌いやすい4分主体",
      steps: makeSteps(
        stableVariant.steps,
        orderedPitchClasses(rotatedStable, stableVariant.order, chordRoot),
        stableVariant.lengths,
        octave
      )
    },
    {
      id: "catchy",
      label: "キャッチー",
      description: "8分中心。短い形を少し反復",
      steps: makeSteps(
        catchyVariant.steps,
        orderedPitchClasses(catchyPool, catchyVariant.order, chordRoot),
        catchyVariant.lengths,
        octave
      )
    },
    {
      id: "floating",
      label: "浮遊感",
      description: "2度・6度も混ぜ、切れ目なくふわっと動く",
      steps: makeSteps(
        floatingVariant.steps,
        orderedPitchClasses(floatingPool, floatingVariant.order, second),
        floatingVariant.lengths,
        octave
      )
    }
  ];
}

export function melodyCandidateDots(candidate) {
  const starts = new Set(candidate.steps.map((item) => item.step));
  return Array.from({ length: EIGHTH_STEPS }, (_, step) => (starts.has(step) ? "●" : "・")).join("");
}

export function applyMelodyCandidate(notes, barIndex, candidate, {
  barTicks,
  createId = defaultCreateId
} = {}) {
  if (!Number.isInteger(barTicks) || barTicks <= 0) {
    throw new Error("barTicks must be a positive integer");
  }
  if (!candidate?.steps?.length) {
    throw new Error("Melody candidate has no notes");
  }

  const barStartTick = barIndex * barTicks;
  const stepTicks = barTicks / EIGHTH_STEPS;
  const barEndTick = barStartTick + barTicks;
  const retained = notes.filter((note) => note.startTick < barStartTick || note.startTick >= barEndTick);
  const added = candidate.steps.map((item) => ({
    id: createId(),
    pitch: item.pitch,
    startTick: barStartTick + item.step * stepTicks,
    durationTick: Math.min(item.length * stepTicks, barEndTick - (barStartTick + item.step * stepTicks)),
    velocity: 96
  }));

  return [...retained, ...added].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

function defaultCreateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
