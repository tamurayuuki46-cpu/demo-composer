// Counter Melody（裏メロ）: メインMelodyを邪魔しない範囲で、役割の違う3系統の候補を作る。
// 完全自動ではなく「候補を聴く → 選ぶ → 必要なら別候補にする / 消す」。選んだSectionだけに当てる。
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
    id: "sparse",
    label: "Sparse（隙間型）",
    description: "休符の隙間に短い返事を入れる。音数は少なめで、主旋律を立てる。※イメージ：米津系（特定曲のコピーではありません）"
  },
  {
    id: "active",
    label: "Active（動く型）",
    description: "8分音符中心で下側を動き、①コードトーン型 → ②テンション型 → ③薄い別コード感型を混ぜて色を足す。※イメージ：YOASOBI / Ayase系（特定曲のコピーではありません）"
  },
  {
    id: "hook",
    label: "Hook（フック型）",
    description: "少ない音の覚えやすい型を繰り返し、もう1つの歌えるフックを作る。※イメージ：Oasis系（特定曲のコピーではありません）"
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

function overlappingNotes(notes, startTick, endTick) {
  return notes.filter((note) => note.startTick < endTick && note.startTick + note.durationTick > startTick);
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

// コード構成音以外のKey内音。9th / 11th / 13thなどの「色」に使う。
function tensionPitchClasses(project, bar) {
  const scale = scalePitchClasses(project);
  const chord = chordPitchClasses(project, bar);
  const tensions = scale.filter((pc) => !chord.includes(pc));
  return tensions.length > 0 ? tensions : scale;
}

// 現在コードの3度上のScale Degreeから作る3音を「薄い別コード感」として使う。
// 例: C Major上のCでは E-G-B となり、土台Cを変えずにEm系の輪郭を薄く重ねられる。
function upperStructurePitchClasses(project, bar) {
  const scale = scalePitchClasses(project);
  const chord = project.chords[bar];
  if (!chord) return scale;
  const rootIndex = scale.indexOf(chord.root % 12);
  if (rootIndex === -1) return chordPitchClasses(project, bar);
  const upperRoot = (rootIndex + 2) % scale.length;
  return [0, 2, 4].map((offset) => scale[(upperRoot + offset) % scale.length]);
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

// 候補の音を選ぶ。目標の高さに近い許可音のうち、同時に鳴るメロディとぶつかりにくいものを選ぶ
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
      if (pitch > note.pitch - 2) score += 10; // できるだけメロディより下に置く
    });
    if (previous !== null && previous !== undefined) score += Math.abs(pitch - previous) * 0.4;
    if (best === null || score < best.score) best = { pitch, score };
  }
  return best ? best.pitch : null;
}

// 音階の中で pitch から degrees だけ下へ
function scaleStepDown(pitch, degrees, scale) {
  let current = pitch;
  let remaining = degrees;
  while (remaining > 0 && current > 0) {
    current -= 1;
    if (scale.includes(current % 12)) remaining -= 1;
  }
  return current;
}

// 音階の中で pitch から degrees だけ上へ
function scaleStepUp(pitch, degrees, scale) {
  let current = pitch;
  let remaining = degrees;
  while (remaining > 0 && current < 127) {
    current += 1;
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

// Sparse: メロディの隙間だけに短い「返事」を置く。詰まっている小節は休む。
function buildSparse(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 8;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const occupied = inBar.length === 0
      ? [true, true, true, true, false, false, false, false]
      : occupiedSteps(inBar, barStart, barTicks);
    const runs = freeRuns(occupied).filter((run) => run.length >= 2);
    if (runs.length === 0) continue;

    const run = runs.reduce((best, item) => (item.length >= best.length ? item : best));
    const runStart = barStart + run.start * STEP;
    const overlap = overlappingNotes(inBar, runStart, runStart + Math.min(run.length, 3) * STEP);
    const pitch = pickPitch({ pcs: chordPitchClasses(project, bar), target, overlapping: overlap, previous });
    if (pitch === null) continue;

    if (run.length >= 3) {
      const answer = scaleStepDown(pitch, 1, scale);
      notes.push(
        makeNote(pitch, runStart, STEP, 66),
        makeNote(answer, runStart + STEP, STEP * 2, 60)
      );
      previous = answer;
    } else {
      notes.push(makeNote(pitch, runStart, STEP * 2, 64));
      previous = pitch;
    }
  }
  return notes;
}

// Active: 8分音符中心。強拍はコードトーン、間にテンションと「薄い別コード感」を混ぜて推進力を出す。
function buildActive(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 10;
  const notes = [];
  let previous = null;
  const positions = [0, 1, 2, 4, 5, 6]; // 4拍すべてを埋めず、息継ぎを残す
  const targetMoves = [0, 2, 4, 2, -1, 1];

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const chordPcs = chordPitchClasses(project, bar);
    const tensionPcs = tensionPitchClasses(project, bar);
    const upperPcs = upperStructurePitchClasses(project, bar);
    const anchor = pickPitch({ pcs: chordPcs, target, overlapping: inBar, previous });
    if (anchor === null) continue;

    // ①Chord Tone → ②Tension → ③Upper Structure を2回まわす。
    // 土台コードは変えず、主旋律とは違う度数を使って「薄い第二のハーモニー」を作る。
    const palettes = [chordPcs, tensionPcs, upperPcs, chordPcs, tensionPcs, upperPcs];

    positions.forEach((step, index) => {
      const startTick = barStart + step * STEP;
      const endTick = startTick + STEP;
      const overlap = overlappingNotes(inBar, startTick, endTick);
      const move = targetMoves[index];
      const desired = move >= 0
        ? scaleStepUp(anchor, Math.round(move / 2), scale)
        : scaleStepDown(anchor, Math.abs(move), scale);
      const pitch = pickPitch({ pcs: palettes[index], target: desired, overlapping: overlap, previous });
      if (pitch === null) return;
      notes.push(makeNote(pitch, startTick, STEP, index === 0 || index === 3 ? 65 : 58));
      previous = pitch;
    });
  }
  return notes;
}

// Hook: 各小節で同じ3音の輪郭を繰り返す。コードが変わっても「上がって戻る」形は維持する。
function buildHook(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 9;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const chordPcs = chordPitchClasses(project, bar);
    const anchor = pickPitch({ pcs: chordPcs, target, overlapping: inBar, previous });
    if (anchor === null) continue;

    const upperTarget = scaleStepUp(anchor, 2, scale);
    const first = pickPitch({
      pcs: chordPcs,
      target: anchor,
      overlapping: overlappingNotes(inBar, barStart, barStart + STEP * 2),
      previous
    });
    const second = pickPitch({
      pcs: scale,
      target: upperTarget,
      overlapping: overlappingNotes(inBar, barStart + STEP * 2, barStart + STEP * 4),
      previous: first
    });
    const third = pickPitch({
      pcs: chordPcs,
      target: anchor,
      overlapping: overlappingNotes(inBar, barStart + STEP * 4, barStart + STEP * 8),
      previous: second
    });
    if (first === null || second === null || third === null) continue;

    notes.push(
      makeNote(first, barStart, STEP * 2, 64),
      makeNote(second, barStart + STEP * 2, STEP * 2, 60),
      makeNote(third, barStart + STEP * 4, STEP * 4, 63)
    );
    previous = third;
  }
  return notes;
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

  const builders = { sparse: buildSparse, active: buildActive, hook: buildHook };
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
