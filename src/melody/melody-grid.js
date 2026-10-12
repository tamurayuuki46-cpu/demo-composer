import { chordIntervals } from "../core/chord-qualities.js";
import { placeMonophonicNote } from "../core/note-placement.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function pitchName(pitch) {
  const note = NOTE_NAMES[pitch % 12];
  const octave = Math.floor(pitch / 12) - 1;
  return `${note}${octave}`;
}

export function getOctavePitches(octave) {
  const cPitch = (octave + 1) * 12;
  return Array.from({ length: 12 }, (_, index) => cPitch + (11 - index));
}

export function getMelodyNotes(project) {
  return project.tracks.find((track) => track.role === "melody")?.notes ?? [];
}

// durationTick: 置く長さ / limitTick: 小節の終わり（超えない） / resize: 長さ違いの同じ音は削除でなく長さ変更
export function toggleMonophonicStep(notes, options) {
  return placeMonophonicNote(notes, options);
}

export function clearBar(notes, { barStartTick, barDurationTick }) {
  const barEndTick = barStartTick + barDurationTick;
  return notes.filter((note) => note.startTick < barStartTick || note.startTick >= barEndTick);
}

// 小節の中身(メロディ)を、別の小節へ上書きコピーする。bars=2なら2小節ぶんをまとめて写す（モチーフの繰り返し用）。
export function copyMelodyBars(notes, { sourceBarIndex, targetBarIndex, bars = 1, barTicks }) {
  const sourceStart = sourceBarIndex * barTicks;
  const sourceEnd = (sourceBarIndex + bars) * barTicks;
  const targetStart = targetBarIndex * barTicks;
  const targetEnd = (targetBarIndex + bars) * barTicks;
  const offset = targetStart - sourceStart;

  const retained = notes.filter((note) => note.startTick < targetStart || note.startTick >= targetEnd);
  const copied = notes
    .filter((note) => note.startTick >= sourceStart && note.startTick < sourceEnd)
    .map((note) => ({
      ...note,
      id: createCopyId(),
      startTick: note.startTick + offset,
      durationTick: Math.min(note.durationTick, targetEnd - (note.startTick + offset))
    }));

  return [...retained, ...copied].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function hasMelodyInBars(notes, { barIndex, bars = 1, barTicks }) {
  const start = barIndex * barTicks;
  const end = (barIndex + bars) * barTicks;
  return notes.some((note) => note.startTick >= start && note.startTick < end);
}

function createCopyId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// コードの構成音（ピッチクラス 0〜11）。コード未設定なら空。Melody画面の強調表示用。
export function chordTonePitchClasses(chord) {
  if (!chord) return new Set();
  return new Set(chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12));
}

// コードのルートから見た度数ラベル（R, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7 ...）。
const DEGREE_LABELS = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];

// Keyの主音から見た度数（1, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7）。「R」の代わりに「1」を使う
export function keyDegreeLabel(pitch, tonicPitchClass) {
  const label = degreeLabel(pitch, tonicPitchClass);
  return label === "R" ? "1" : label;
}

export function degreeLabel(pitch, rootPitchClass) {
  return DEGREE_LABELS[(((pitch - rootPitchClass) % 12) + 12) % 12];
}
