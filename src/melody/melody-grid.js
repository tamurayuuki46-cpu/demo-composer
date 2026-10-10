const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

export function toggleMonophonicStep(notes, { pitch, startTick, durationTick, velocity = 96 }) {
  const existing = notes.find((note) => note.startTick === startTick);

  if (existing?.pitch === pitch) {
    return notes.filter((note) => note.startTick !== startTick);
  }

  return [
    ...notes.filter((note) => note.startTick !== startTick),
    {
      id: createNoteId(),
      pitch,
      startTick,
      durationTick,
      velocity
    }
  ].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function clearBar(notes, { barStartTick, barDurationTick }) {
  const barEndTick = barStartTick + barDurationTick;
  return notes.filter((note) => note.startTick < barStartTick || note.startTick >= barEndTick);
}
