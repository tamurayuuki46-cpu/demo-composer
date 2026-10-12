import { chordIntervals } from "../core/chord-qualities.js";
import { placeMonophonicNote } from "../core/note-placement.js";

const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const DRUM_PITCH = {
  kick: 36,
  snare: 38,
  hh: 42
};

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTrackNotes(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

export function pitchName(pitch) {
  const name = KEY_NAMES[pitch % 12];
  const octave = Math.floor(pitch / 12) - 1;
  return `${name}${octave}`;
}

export function bassPitchForBar(project, barIndex) {
  const keyRoot = KEY_NAMES.indexOf(project.basic.key);
  const root = project.chords[barIndex]?.root ?? Math.max(0, keyRoot);
  return 36 + root;
}

// Bassのマスをタップしたときに選べる音程。コードのルートからの半音数で表す。
// 3度 / 5度 / 7度は、その小節のコードの構成音（Major / Minor / sus 等）に合わせる。
const INTERVAL_NAMES = { 1: "♭9度", 2: "2度", 3: "3度", 4: "3度", 5: "4度", 6: "5度", 7: "5度", 8: "5度", 9: "6度", 10: "7度", 11: "7度" };
const INTERVAL_SHORT = { 1: "♭9", 2: "2", 3: "3", 4: "3", 5: "4", 6: "5", 7: "5", 8: "5", 9: "6", 10: "7", 11: "7" };

export function bassChoicesForBar(project, barIndex) {
  const quality = project.chords[barIndex]?.quality ?? "major";
  // 9th / 11th / 13thは1オクターブ上の位置で持っているので、Bassは1オクターブ内に折りたたむ（重複と0は除く）
  const intervals = [...new Set(chordIntervals(quality).slice(1).map((interval) => interval % 12))].filter((interval) => interval !== 0).sort((a, b) => a - b);
  const choices = [{ id: "root", label: "ルート", short: "R", semitones: 0 }];

  intervals.forEach((semitones) => {
    choices.push({
      id: `interval-${semitones}`,
      label: INTERVAL_NAMES[semitones] ?? `+${semitones}`,
      short: INTERVAL_SHORT[semitones] ?? String(semitones),
      semitones
    });
  });

  choices.push({ id: "octave-up", label: "オクターブ上", short: "8", semitones: 12 });
  choices.push({ id: "octave-down", label: "ルート下", short: "R↓", semitones: -12 });
  return choices;
}

// Bassのnoteが、その小節のルートから見てどの音程か（セル表示用の短い文字）
export function bassShortLabel(project, barIndex, pitch) {
  const semitones = pitch - bassPitchForBar(project, barIndex);
  const found = bassChoicesForBar(project, barIndex).find((choice) => choice.semitones === semitones);
  if (found) return found.short;
  // 半音ずらした音は、ルートからの半音数で表示する（例: +1 / -1）
  return semitones > 0 ? `+${semitones}` : String(semitones);
}

export const MAX_BASS_SHIFT = 6;

// 見た目の区別用。「主役」= ルート系（ルート / オクターブ）とコードの5度、「飾り」= それ以外（3度・7度・ずらした音など）。
// データには保存せず、Bassのpitchとコードから毎回計算する。
export function bassRoleForPitch(project, barIndex, pitch) {
  const semitones = ((pitch - bassPitchForBar(project, barIndex)) % 12 + 12) % 12;
  const quality = project.chords[barIndex]?.quality ?? "major";
  const fifth = chordIntervals(quality)[2] ?? 7;
  return semitones === 0 || semitones === fifth ? "main" : "ornament";
}

// Bassは1音ずつ。長さ(durationTick)は小節の終わり(limitTick)と次の音の手前までに収める。
export function toggleBassStep(notes, options) {
  return placeMonophonicNote(notes, options);
}

export function toggleDrumStep(notes, { pitch, startTick, durationTick, velocity = 100 }) {
  const exists = notes.some((note) => note.startTick === startTick && note.pitch === pitch);

  if (exists) {
    return notes.filter((note) => !(note.startTick === startTick && note.pitch === pitch));
  }

  return [
    ...notes,
    { id: createNoteId(), pitch, startTick, durationTick, velocity }
  ].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function clearRhythmBar(notes, { barStartTick, barDurationTick }) {
  const barEndTick = barStartTick + barDurationTick;
  return notes.filter((note) => note.startTick < barStartTick || note.startTick >= barEndTick);
}

// 長いBassがコピー先の範囲に食い込んでいたら、範囲の手前までに短くする
function trimCrossing(notes, rangeStartTick) {
  return notes.map((note) => (
    note.startTick < rangeStartTick && note.startTick + note.durationTick > rangeStartTick
      ? { ...note, durationTick: rangeStartTick - note.startTick }
      : note
  ));
}

export function copyRhythmBeat(notes, {
  sourceBeatStartTick,
  targetBeatStartTick,
  beatDurationTick,
  pitch = null,
  pitchShift = 0
}) {
  const sourceBeatEndTick = sourceBeatStartTick + beatDurationTick;
  const targetBeatEndTick = targetBeatStartTick + beatDurationTick;
  const tickOffset = targetBeatStartTick - sourceBeatStartTick;

  const retained = trimCrossing(notes.filter(
    (note) => note.startTick < targetBeatStartTick || note.startTick >= targetBeatEndTick
  ), targetBeatStartTick);
  const copied = notes
    .filter((note) => note.startTick >= sourceBeatStartTick && note.startTick < sourceBeatEndTick)
    .map((note) => ({
      ...note,
      id: createNoteId(),
      pitch: pitch ?? note.pitch + pitchShift,
      startTick: note.startTick + tickOffset,
      durationTick: Math.min(note.durationTick, targetBeatEndTick - (note.startTick + tickOffset))
    }));

  return [...retained, ...copied].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function copyRhythmBar(notes, {
  sourceBarStartTick,
  targetBarStartTick,
  barDurationTick,
  pitch = null,
  pitchShift = 0
}) {
  const sourceBarEndTick = sourceBarStartTick + barDurationTick;
  const targetBarEndTick = targetBarStartTick + barDurationTick;
  const tickOffset = targetBarStartTick - sourceBarStartTick;

  const retained = trimCrossing(notes.filter(
    (note) => note.startTick < targetBarStartTick || note.startTick >= targetBarEndTick
  ), targetBarStartTick);
  const copied = notes
    .filter((note) => note.startTick >= sourceBarStartTick && note.startTick < sourceBarEndTick)
    .map((note) => ({
      ...note,
      id: createNoteId(),
      pitch: pitch ?? note.pitch + pitchShift,
      startTick: note.startTick + tickOffset,
      durationTick: Math.min(note.durationTick, targetBarEndTick - (note.startTick + tickOffset))
    }));

  return [...retained, ...copied].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}
