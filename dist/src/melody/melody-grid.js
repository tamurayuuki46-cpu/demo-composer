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
