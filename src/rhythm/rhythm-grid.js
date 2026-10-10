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

export function toggleBassStep(notes, { pitch, startTick, durationTick, velocity = 96 }) {
  const existing = notes.find((note) => note.startTick === startTick);

  if (existing?.pitch === pitch) {
    return notes.filter((note) => note.startTick !== startTick);
  }

  return [
    ...notes.filter((note) => note.startTick !== startTick),
    { id: createNoteId(), pitch, startTick, durationTick, velocity }
  ].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
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

export function copyRhythmBeat(notes, {
  sourceBeatStartTick,
  targetBeatStartTick,
  beatDurationTick,
  pitch = null
}) {
  const sourceBeatEndTick = sourceBeatStartTick + beatDurationTick;
  const targetBeatEndTick = targetBeatStartTick + beatDurationTick;
  const tickOffset = targetBeatStartTick - sourceBeatStartTick;

  const retained = notes.filter(
    (note) => note.startTick < targetBeatStartTick || note.startTick >= targetBeatEndTick
  );
  const copied = notes
    .filter((note) => note.startTick >= sourceBeatStartTick && note.startTick < sourceBeatEndTick)
    .map((note) => ({
      ...note,
      id: createNoteId(),
      pitch: pitch ?? note.pitch,
      startTick: note.startTick + tickOffset
    }));

  return [...retained, ...copied].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function copyRhythmBar(notes, {
  sourceBarStartTick,
  targetBarStartTick,
  barDurationTick,
  pitch = null
}) {
  const sourceBarEndTick = sourceBarStartTick + barDurationTick;
  const targetBarEndTick = targetBarStartTick + barDurationTick;
  const tickOffset = targetBarStartTick - sourceBarStartTick;

  const retained = notes.filter(
    (note) => note.startTick < targetBarStartTick || note.startTick >= targetBarEndTick
  );
  const copied = notes
    .filter((note) => note.startTick >= sourceBarStartTick && note.startTick < sourceBarEndTick)
    .map((note) => ({
      ...note,
      id: createNoteId(),
      pitch: pitch ?? note.pitch,
      startTick: note.startTick + tickOffset
    }));

  return [...retained, ...copied].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}
