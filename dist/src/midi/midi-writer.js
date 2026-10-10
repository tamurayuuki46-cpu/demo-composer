function ascii(text) {
  return Array.from(text, (character) => character.charCodeAt(0));
}

function uint16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function uint32(value) {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  ];
}

export function variableLength(value) {
  let safe = Math.max(0, Math.floor(value));
  let buffer = safe & 0x7f;
  const bytes = [];

  while ((safe >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (safe & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}

function metaMessage(type, data = []) {
  return [0xff, type, ...variableLength(data.length), ...data];
}

function textData(text) {
  return Array.from(new TextEncoder().encode(text));
}

export function trackNameEvent(name) {
  return { tick: 0, order: -100, bytes: metaMessage(0x03, textData(name)) };
}

export function tempoEvent(bpm) {
  const microseconds = Math.max(1, Math.round(60000000 / bpm));
  return {
    tick: 0,
    order: -90,
    bytes: metaMessage(0x51, [
      (microseconds >> 16) & 0xff,
      (microseconds >> 8) & 0xff,
      microseconds & 0xff
    ])
  };
}

export function timeSignatureEvent() {
  return {
    tick: 0,
    order: -80,
    bytes: metaMessage(0x58, [4, 2, 24, 8])
  };
}

export function keySignatureEvent(sharpsFlats, isMinor) {
  return {
    tick: 0,
    order: -70,
    bytes: metaMessage(0x59, [sharpsFlats & 0xff, isMinor ? 1 : 0])
  };
}

export function markerEvent(tick, text) {
  return {
    tick,
    order: -50,
    bytes: metaMessage(0x06, textData(text))
  };
}

export function noteEvents({ channel, pitch, velocity, startTick, durationTick }) {
  const midiChannel = Math.min(15, Math.max(0, channel));
  const safePitch = Math.min(127, Math.max(0, pitch));
  const safeVelocity = Math.min(127, Math.max(1, velocity));
  const endTick = startTick + Math.max(1, durationTick);

  return [
    {
      tick: startTick,
      order: 10,
      bytes: [0x90 | midiChannel, safePitch, safeVelocity]
    },
    {
      tick: endTick,
      order: 0,
      bytes: [0x80 | midiChannel, safePitch, 0]
    }
  ];
}

function trackChunk(events) {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = [];
  let lastTick = 0;

  sorted.forEach((event) => {
    const tick = Math.max(lastTick, Math.floor(event.tick));
    body.push(...variableLength(tick - lastTick), ...event.bytes);
    lastTick = tick;
  });

  body.push(0x00, 0xff, 0x2f, 0x00);
  return [...ascii("MTrk"), ...uint32(body.length), ...body];
}

export function createMidiFile({ format = 1, division = 480, tracks }) {
  const safeTracks = tracks.length ? tracks : [[]];
  const header = [
    ...ascii("MThd"),
    ...uint32(6),
    ...uint16(format),
    ...uint16(safeTracks.length),
    ...uint16(division)
  ];

  const bytes = [...header];
  safeTracks.forEach((events) => bytes.push(...trackChunk(events)));
  return new Uint8Array(bytes);
}
