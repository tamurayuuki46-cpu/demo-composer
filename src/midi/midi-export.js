import {
  createMidiFile,
  keySignatureEvent,
  noteEvents,
  tempoEvent,
  timeSignatureEvent,
  trackNameEvent
} from "./midi-writer.js";

const MAJOR_KEY_SIGNATURES = {
  C: 0,
  "C#": 7,
  D: 2,
  "D#": -3,
  E: 4,
  F: -1,
  "F#": 6,
  G: 1,
  "G#": -4,
  A: 3,
  "A#": -2,
  B: 5
};

const MINOR_KEY_SIGNATURES = {
  C: -3,
  "C#": 4,
  D: -1,
  "D#": 6,
  E: 1,
  F: -4,
  "F#": 3,
  G: -2,
  "G#": 5,
  A: 0,
  "A#": -5,
  B: 2
};

function conductorEvents(project) {
  const signatureMap = project.basic.scale === "minor"
    ? MINOR_KEY_SIGNATURES
    : MAJOR_KEY_SIGNATURES;

  return [
    trackNameEvent("Conductor"),
    tempoEvent(project.basic.bpm),
    timeSignatureEvent(),
    keySignatureEvent(signatureMap[project.basic.key] ?? 0, project.basic.scale === "minor")
  ];
}

function chordIntervals(quality) {
  if (quality === "minor") return [0, 3, 7];
  if (quality === "diminished") return [0, 3, 6];
  return [0, 4, 7];
}

function chordTrackEvents(project) {
  const events = [trackNameEvent("Chord")];

  project.chords.forEach((chord) => {
    chordIntervals(chord.quality).forEach((interval) => {
      events.push(...noteEvents({
        channel: 0,
        pitch: 60 + chord.root + interval,
        velocity: 72,
        startTick: chord.startTick,
        durationTick: chord.durationTick
      }));
    });
  });

  return events;
}

function projectTrackEvents(project, role, fallbackName, fallbackChannel) {
  const track = project.tracks.find((candidate) => candidate.role === role);
  const events = [trackNameEvent(track?.name || fallbackName)];
  const channel = Math.min(15, Math.max(0, (track?.midiChannel ?? fallbackChannel) - 1));

  (track?.notes ?? []).forEach((note) => {
    events.push(...noteEvents({
      channel,
      pitch: note.pitch,
      velocity: note.velocity,
      startTick: note.startTick,
      durationTick: note.durationTick
    }));
  });

  return events;
}

function songTracks(project) {
  return [
    conductorEvents(project),
    chordTrackEvents(project),
    projectTrackEvents(project, "melody", "Melody", 2),
    projectTrackEvents(project, "bass", "Bass", 3),
    projectTrackEvents(project, "drums", "Drums", 10)
  ];
}

function partFile(project, events) {
  return createMidiFile({
    format: 1,
    division: project.basic.ppq,
    tracks: [conductorEvents(project), events]
  });
}

export function buildMidiExports(project) {
  return {
    "Song.mid": createMidiFile({
      format: 1,
      division: project.basic.ppq,
      tracks: songTracks(project)
    }),
    "Chord.mid": partFile(project, chordTrackEvents(project)),
    "Melody.mid": partFile(project, projectTrackEvents(project, "melody", "Melody", 2)),
    "Bass.mid": partFile(project, projectTrackEvents(project, "bass", "Bass", 3)),
    "Drums.mid": partFile(project, projectTrackEvents(project, "drums", "Drums", 10))
  };
}

export function downloadBytes(bytes, filename, mimeType = "audio/midi") {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadMidiBundle(project) {
  const files = buildMidiExports(project);
  Object.entries(files).forEach(([filename, bytes]) => {
    downloadBytes(bytes, filename);
  });
}

export function downloadProjectJson(project) {
  const text = JSON.stringify(project, null, 2);
  downloadBytes(new TextEncoder().encode(text), "project.json", "application/json");
}
