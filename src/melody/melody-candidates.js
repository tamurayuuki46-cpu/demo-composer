import { rootToPitchClass } from "../chord/chord-theory.js";
import { chordIntervals } from "../core/chord-qualities.js";

const SCALE_INTERVALS = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
});

const EIGHTH_STEPS = 8;

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

export function melodyCandidatesForBar(project, barIndex, { octave = 4 } = {}) {
  const scalePcs = scalePitchClasses(project.basic.key, project.basic.scale);
  const chordPcs = chordPitchClasses(project, barIndex);
  const tonic = rootToPitchClass(project.basic.key);
  const chordRoot = project.chords[barIndex]?.root ?? tonic;

  const stablePcs = chordPcs.length > 0 ? chordPcs : scalePcs;
  const stableShape = unique([
    stablePcs[0] ?? chordRoot,
    stablePcs[1] ?? scalePcs[2] ?? chordRoot,
    stablePcs[2] ?? scalePcs[4] ?? chordRoot
  ]);

  const second = scalePcs.find((pc) => positiveMod(pc - chordRoot, 12) === 2) ?? scalePcs[1] ?? stableShape[0];
  const sixth = scalePcs.find((pc) => [8, 9].includes(positiveMod(pc - chordRoot, 12))) ?? scalePcs[5] ?? second;
  const passing = scalePcs.find((pc) => !stableShape.includes(pc)) ?? second;

  const phase = positiveMod(barIndex, Math.max(1, stableShape.length));
  const rotatedStable = stableShape.map((_, index) => stableShape[(index + phase) % stableShape.length]);

  return [
    {
      id: "stable",
      label: "安定",
      description: "コードトーン中心。歌いやすい4分主体",
      steps: makeSteps([0, 2, 4, 6], [
        rotatedStable[0],
        rotatedStable[1] ?? rotatedStable[0],
        rotatedStable[2] ?? rotatedStable[0],
        rotatedStable[1] ?? rotatedStable[0]
      ], [2], octave)
    },
    {
      id: "catchy",
      label: "キャッチー",
      description: "8分中心。短い形を少し反復",
      steps: makeSteps([0, 1, 3, 4, 5, 7], [
        stableShape[0],
        stableShape[1] ?? passing,
        stableShape[2] ?? stableShape[0],
        stableShape[0],
        stableShape[1] ?? passing,
        passing
      ], [1, 2, 1, 1, 2, 1], octave)
    },
    {
      id: "floating",
      label: "浮遊感",
      description: "2度・6度も混ぜ、長めの音で余白を作る",
      steps: makeSteps([0, 3, 5, 7], [
        second,
        stableShape[2] ?? stableShape[0],
        sixth,
        second
      ], [3, 2, 2, 1], octave)
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
