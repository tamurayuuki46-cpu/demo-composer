// Counter Melody（裏メロ）: メインMelodyの隙間や下側に、そっと寄り添う旋律の候補を3つ作る。
// 完全自動ではなく「候補を聴く → 選ぶ → 直す（別の候補にする / 消す）」。選んだSectionだけに当てる。
// 保存先は tracks[] の role:"counter"（Schema追記のみ。無い古いProjectはそのまま有効）。
// ProjectをUIにもAudioにも依存せずに読む純粋関数。元のProjectは変更しない。

import { chordIntervals } from "./chord-qualities.js";

export const COUNTER_ROLE = "counter";
const STEP = 240; // 8分音符
const LOW = 48;
const HIGH = 76;
const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const COUNTER_STYLES = Object.freeze([
  {
    id: "long",
    label: "ロングトーン",
    description: "コードの音を長くのばす。メロディの下で空気を作る、いちばん控えめな裏メロ。"
  },
  {
    id: "response",
    label: "レスポンス",
    description: "メロディが休んでいる隙間だけに、短い返事のフレーズを入れる。メロディが詰まっている小節は休む。"
  },
  {
    id: "simple",
    label: "寄り添い（3度下）",
    description: "メロディの長めの音に、音階で3度下を重ねる。シンプルなハモリ風。"
  }
]);

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function barTicksOf(project) {
  return project.basic.ppq * 4;
}

export function counterNotes(project) {
  return project.tracks.find((track) => track.role === COUNTER_ROLE)?.notes ?? [];
}

export function hasCounter(project) {
  return counterNotes(project).length > 0;
}

function notesIn(notes, startTick, endTick) {
  return notes.filter((note) => note.startTick >= startTick && note.startTick < endTick);
}

function keyPitchClass(project) {
  return Math.max(0, KEY_NAMES.indexOf(project.basic.key));
}

function scalePitchClasses(project) {
  const tonic = keyPitchClass(project);
  return (SCALE_INTERVALS[project.basic.scale] ?? SCALE_INTERVALS.major).map((interval) => (tonic + interval) % 12);
}

// この小節のコードの構成音（pitch class）。コードが無い小節はKeyの主和音を使う
function chordPitchClasses(project, bar) {
  const chord = project.chords[bar];
  if (chord) return chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);
  const tonic = keyPitchClass(project);
  const third = project.basic.scale === "minor" ? 3 : 4;
  return [tonic, (tonic + third) % 12, (tonic + 7) % 12];
}

// 8分(240tick)8マスの使用状況。メロディが鳴っているマスは true
function occupiedSteps(melody, barStart, barTicks) {
  const steps = new Array(barTicks / STEP).fill(false);
  melody.forEach((note) => {
    const from = Math.max(0, Math.floor((note.startTick - barStart) / STEP));
    const to = Math.min(steps.length, Math.ceil((note.startTick + note.durationTick - barStart) / STEP));
    for (let step = from; step < to; step += 1) steps[step] = true;
  });
  return steps;
}

function freeRuns(steps) {
  const runs = [];
  let start = null;
  steps.forEach((taken, step) => {
    if (!taken && start === null) start = step;
    if ((taken || step === steps.length - 1) && start !== null) {
      const end = taken ? step : step + 1;
      runs.push({ start, length: end - start });
      start = null;
    }
  });
  return runs;
}

// 候補の音を選ぶ。目標の高さに近いコード構成音のうち、同時に鳴るメロディとぶつからないものを選ぶ
function pickPitch({ pcs, target, overlapping, previous }) {
  let best = null;
  for (let pitch = LOW; pitch <= HIGH; pitch += 1) {
    if (!pcs.includes(pitch % 12)) continue;
    let score = Math.abs(pitch - target);
    overlapping.forEach((note) => {
      const distance = Math.abs(pitch - note.pitch) % 12;
      if (distance === 1 || distance === 11) score += 20;
      else if (distance === 0) score += 6;
      else if (distance === 6) score += 8;
      if (pitch > note.pitch - 2) score += 10; // メロディより下に置く
    });
    if (previous !== null && previous !== undefined) score += Math.abs(pitch - previous) * 0.4;
    if (best === null || score < best.score) best = { pitch, score };
  }
  return best ? best.pitch : null;
}

// 音階の中で pitch から degrees だけ下へ（音階外の音は、すぐ下の音階音から数える）
function scaleStepDown(pitch, degrees, scale) {
  let current = pitch;
  let remaining = degrees;
  while (remaining > 0 && current > 0) {
    current -= 1;
    if (scale.includes(current % 12)) remaining -= 1;
  }
  return current;
}

function makeNote(pitch, startTick, durationTick, velocity) {
  return { id: createId(), pitch, startTick, durationTick, velocity };
}

function averageMelodyPitch(melody) {
  if (melody.length === 0) return 66;
  return melody.reduce((sum, note) => sum + note.pitch, 0) / melody.length;
}

function buildLong(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const target = averageMelodyPitch(melody) - 9;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const overlapping = notesIn(melody, barStart, barStart + barTicks);
    const pitch = pickPitch({ pcs: chordPitchClasses(project, bar), target, overlapping, previous });
    if (pitch === null) continue;

    const last = notes[notes.length - 1];
    if (last && last.pitch === pitch && last.startTick + last.durationTick === barStart) {
      last.durationTick += barTicks; // 同じ音が続くときは1本の長い音にする
    } else {
      notes.push(makeNote(pitch, barStart, barTicks, 62));
    }
    previous = pitch;
  }
  return notes;
}

function buildResponse(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 7;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    // メロディが無い小節は、後ろ半分（3〜4拍目）に返事を置く
    const occupied = inBar.length === 0
      ? [true, true, true, true, false, false, false, false]
      : occupiedSteps(inBar, barStart, barTicks);
    const runs = freeRuns(occupied).filter((run) => run.length >= 2);
    if (runs.length === 0) continue; // 詰まった小節は休む

    // いちばん長い隙間（同じ長さなら後ろ側）を使う。メロディの後に「返事」が来る形になる
    const run = runs.reduce((best, item) => (item.length >= best.length ? item : best));
    const usable = Math.min(run.length, 4);
    const runStart = barStart + run.start * STEP;
    const pitch = pickPitch({ pcs: chordPitchClasses(project, bar), target, overlapping: inBar, previous });
    if (pitch === null) continue;
    previous = pitch;

    if (usable >= 4) {
      notes.push(
        makeNote(pitch, runStart, STEP, 68),
        makeNote(scaleStepDown(pitch, 1, scale), runStart + STEP, STEP, 62),
        makeNote(pitch, runStart + STEP * 2, STEP * 2, 66)
      );
    } else if (usable === 3) {
      notes.push(
        makeNote(pitch, runStart, STEP, 68),
        makeNote(scaleStepDown(pitch, 1, scale), runStart + STEP, STEP * 2, 62)
      );
    } else {
      notes.push(makeNote(pitch, runStart, STEP * 2, 66));
    }
  }
  return notes;
}

function buildSimple(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const startTick = startBar * barTicks;
  const endTick = endBar * barTicks;

  return notesIn(melody, startTick, endTick)
    .filter((note) => note.durationTick >= STEP * 2)
    .map((note) => {
      const pitch = scaleStepDown(note.pitch, 2, scale);
      const barEnd = (Math.floor(note.startTick / barTicks) + 1) * barTicks;
      return { pitch, note, barEnd };
    })
    .filter(({ pitch }) => pitch >= 36)
    .map(({ pitch, note, barEnd }) => makeNote(
      pitch,
      note.startTick,
      Math.max(1, Math.min(note.durationTick, barEnd - note.startTick)),
      60
    ));
}

// Sectionの範囲（startBar〜endBar）に当てる候補を3つ作る。土台（コードかメロディ）が無いときは例外
export function counterCandidates(project, { startBar, endBar }) {
  const barTicks = barTicksOf(project);
  const melody = (project.tracks.find((track) => track.role === "melody")?.notes ?? [])
    .slice()
    .sort((a, b) => a.startTick - b.startTick);
  const hasMelody = notesIn(melody, startBar * barTicks, endBar * barTicks).length > 0;
  const hasChords = project.chords.slice(startBar, endBar).length > 0;

  if (!hasMelody && !hasChords) {
    throw new Error("このSectionにはコードもメロディもありません。先にどちらかを入れると、裏メロの候補を作れます。");
  }

  const builders = { long: buildLong, response: buildResponse, simple: buildSimple };
  return COUNTER_STYLES.map((style) => {
    const notes = builders[style.id](project, melody, startBar, endBar)
      .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
    return { ...style, notes };
  });
}

// 範囲（startBar〜endBar）の裏メロを notes に置き換えた新しいProjectを返す。範囲外は変えない
export function withCounterNotes(project, startBar, endBar, notes) {
  const barTicks = barTicksOf(project);
  const startTick = startBar * barTicks;
  const endTick = endBar * barTicks;
  const next = clone(project);
  const keep = counterNotes(next).filter((note) => note.startTick < startTick || note.startTick >= endTick);
  const merged = [...keep, ...clone(notes)].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  const index = next.tracks.findIndex((track) => track.role === COUNTER_ROLE);

  if (index === -1) {
    if (merged.length === 0) return next;
    next.tracks.push({
      role: COUNTER_ROLE,
      name: "Counter Melody",
      midiChannel: 4,
      instrumentId: null,
      mute: false,
      solo: false,
      volume: 1,
      pan: 0,
      notes: merged
    });
  } else {
    next.tracks[index] = { ...next.tracks[index], notes: merged };
  }
  return next;
}

// 範囲内で、裏メロが鳴っている小節の数（長くのばした音は、またぐ小節すべてに数える）
export function counterBarCount(project, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const bars = new Set();
  counterNotes(project).forEach((note) => {
    const first = Math.floor(note.startTick / barTicks);
    const last = Math.floor((note.startTick + note.durationTick - 1) / barTicks);
    for (let bar = Math.max(first, startBar); bar <= Math.min(last, endBar - 1); bar += 1) bars.add(bar);
  });
  return bars.size;
}
