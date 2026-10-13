import { arrangedNotes } from './core.js';

const TRACKS = Object.freeze([
  { role: 'harmony', name: 'Chords', channel: 0 },
  { role: 'melody', name: 'Melody', channel: 1 },
  { role: 'counter', name: 'Counter Melody', channel: 3 },
  { role: 'bass', name: 'Bass', channel: 2 },
  { role: 'drums', name: 'Drums', channel: 9 },
]);

function ascii(text) { return [...text].map((char) => char.charCodeAt(0)); }
function u32(value) { return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function encodeVlq(value) {
  let buffer = Math.max(0, Math.floor(value)) & 0x7f;
  const out = [];
  let remaining = Math.max(0, Math.floor(value)) >> 7;
  while (remaining) {
    buffer <<= 8;
    buffer |= (remaining & 0x7f) | 0x80;
    remaining >>= 7;
  }
  while (true) {
    out.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return out;
}

function textMeta(type, text) {
  const bytes = [...new TextEncoder().encode(String(text))];
  return [0xff, type, ...encodeVlq(bytes.length), ...bytes];
}

function timeSignatureBytes(value) {
  const match = String(value || '4/4').match(/^(\d+)\/(\d+)$/);
  const numerator = clamp(Number(match?.[1]) || 4, 1, 255);
  const denominator = Number(match?.[2]) || 4;
  const power = Number.isInteger(Math.log2(denominator)) ? Math.log2(denominator) : 2;
  return [0xff, 0x58, 0x04, numerator, power, 24, 8];
}

function trackChunk(events) {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = [];
  let lastTick = 0;
  for (const event of sorted) {
    body.push(...encodeVlq(Math.max(0, event.tick - lastTick)), ...event.bytes);
    lastTick = event.tick;
  }
  body.push(0x00, 0xff, 0x2f, 0x00);
  return [...ascii('MTrk'), ...u32(body.length), ...body];
}

function noteEvents(notes, channel) {
  const events = [];
  for (const raw of notes || []) {
    const pitch = clamp(Math.round(Number(raw.pitch) || 0), 0, 127);
    const velocity = clamp(Math.round(Number(raw.velocity) || 90), 1, 127);
    const startTick = Math.max(0, Math.round(Number(raw.startTick) || 0));
    const durationTick = Math.max(1, Math.round(Number(raw.durationTick) || 1));
    events.push({ tick: startTick, order: 2, bytes: [0x90 | channel, pitch, velocity] });
    events.push({ tick: startTick + durationTick, order: 1, bytes: [0x80 | channel, pitch, 0] });
  }
  return events;
}

function firstTrackMeta(source) {
  const bpm = clamp(Math.round(Number(source?.basic?.bpm) || 120), 1, 999);
  const micros = Math.round(60000000 / bpm);
  const events = [
    { tick: 0, order: -4, bytes: timeSignatureBytes(source?.basic?.timeSignature) },
    { tick: 0, order: -3, bytes: [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff] },
  ];
  for (const section of source?.sections || []) {
    const label = section.name || section.kind || section.id || 'Section';
    events.push({ tick: Math.max(0, Math.round(section.startTick || 0)), order: -1, bytes: textMeta(0x06, label) });
  }
  return events;
}

export function buildSongMidi(source, candidate) {
  if (!source?.basic || !Array.isArray(source?.sections) || !candidate?.sections) {
    throw new Error('Song.midを作るためのArrangement source / candidateが不正です。');
  }

  const ppq = clamp(Math.round(Number(source.basic.ppq) || 480), 1, 0x7fff);
  const chunks = TRACKS.map((definition, index) => {
    const events = [
      { tick: 0, order: -5, bytes: textMeta(0x03, definition.name) },
      ...(index === 0 ? firstTrackMeta(source) : []),
      ...noteEvents(arrangedNotes(source, candidate, definition.role), definition.channel),
    ];
    return trackChunk(events);
  });

  return new Uint8Array([
    ...ascii('MThd'),
    0, 0, 0, 6,
    0, 1,
    0, TRACKS.length,
    (ppq >> 8) & 0xff, ppq & 0xff,
    ...chunks.flat(),
  ]);
}

export const SONG_MIDI_TRACKS = TRACKS;
