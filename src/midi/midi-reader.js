// Standard MIDI File（.mid）の読み取り。バイト列から、トラックごとの音符とテンポなどを取り出す純粋関数。
// UIにもProjectにも依存しない。対応: Format 0 / 1（Format 0 はチャンネルごとに分ける）、ランニングステータス、
// Note On ベロシティ0 = Note Off。SMPTE時間（division の最上位ビット）は非対応。

export const MAX_MIDI_BYTES = 2 * 1024 * 1024;
const MAX_NOTES = 30000;

function fail(message) {
  throw new Error(message);
}

class Reader {
  constructor(bytes) {
    this.bytes = bytes;
    this.pos = 0;
  }

  get done() {
    return this.pos >= this.bytes.length;
  }

  u8() {
    if (this.pos >= this.bytes.length) fail("MIDIファイルが途中で終わっています。");
    return this.bytes[this.pos++];
  }

  u16() {
    return (this.u8() << 8) | this.u8();
  }

  u32() {
    return ((this.u8() << 24) | (this.u8() << 16) | (this.u8() << 8) | this.u8()) >>> 0;
  }

  text(length) {
    const slice = this.bytes.subarray(this.pos, this.pos + length);
    this.pos += length;
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(slice);
    } catch {
      return Array.from(slice, (code) => String.fromCharCode(code)).join("");
    }
  }

  variableLength() {
    let value = 0;
    for (let i = 0; i < 4; i += 1) {
      const byte = this.u8();
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    return fail("MIDIファイルの時間の値が正しくありません。");
  }
}

const DATA_LENGTH = { 0x80: 2, 0x90: 2, 0xa0: 2, 0xb0: 2, 0xc0: 1, 0xd0: 1, 0xe0: 2 };

function readTrack(reader, length, state) {
  const end = reader.pos + length;
  const track = { name: "", notes: [], channels: new Set(), programs: new Map(), tempos: [], timeSignatures: [], keySignatures: [] };
  const open = new Map(); // "channel:pitch" -> [{startTick, velocity}]
  let tick = 0;
  let status = 0;

  while (reader.pos < end) {
    tick += reader.variableLength();
    let first = reader.u8();

    if (first === 0xff) {
      const type = reader.u8();
      const size = reader.variableLength();
      const dataStart = reader.pos;
      if (type === 0x03) track.name = reader.text(size).replace(/\0/g, "").trim();
      else if (type === 0x51 && size === 3) {
        const microseconds = (reader.bytes[dataStart] << 16) | (reader.bytes[dataStart + 1] << 8) | reader.bytes[dataStart + 2];
        if (microseconds > 0) track.tempos.push({ tick, bpm: 60000000 / microseconds });
      } else if (type === 0x58 && size >= 2) {
        track.timeSignatures.push({ tick, numerator: reader.bytes[dataStart], denominator: 2 ** reader.bytes[dataStart + 1] });
      } else if (type === 0x59 && size === 2) {
        const sharps = (reader.bytes[dataStart] << 24) >> 24;
        track.keySignatures.push({ tick, sharps, minor: reader.bytes[dataStart + 1] === 1 });
      }
      reader.pos = dataStart + size;
      if (type === 0x2f) break;
      continue;
    }

    if (first === 0xf0 || first === 0xf7) {
      reader.pos += reader.variableLength();
      continue;
    }

    let firstData = null;
    if (first & 0x80) {
      status = first;
    } else {
      if (!status) fail("MIDIファイルの形式が正しくありません。");
      firstData = first;
      first = status;
    }

    const kind = status & 0xf0;
    const channel = status & 0x0f;
    const need = DATA_LENGTH[kind];
    if (!need) fail("MIDIファイルに未対応のデータが含まれています。");
    const data1 = firstData ?? reader.u8();
    const data2 = need === 2 ? reader.u8() : 0;

    if (kind === 0xc0) track.programs.set(channel, data1);
    if (kind !== 0x90 && kind !== 0x80) continue;
    track.channels.add(channel);
    const key = `${channel}:${data1}`;

    if (kind === 0x90 && data2 > 0) {
      if (!open.has(key)) open.set(key, []);
      open.get(key).push({ startTick: tick, velocity: data2 });
    } else {
      const starts = open.get(key);
      const started = starts?.shift();
      if (started) {
        track.notes.push({ pitch: data1, channel, startTick: started.startTick, durationTick: Math.max(1, tick - started.startTick), velocity: started.velocity });
      }
    }

    state.noteCount = (state.noteCount ?? 0) + 1;
    if (state.noteCount > MAX_NOTES * 2) fail("音符が多すぎるため読み込めません。");
  }

  // 終わりが来なかった音は、トラックの終わりで止める
  open.forEach((starts, key) => {
    const [channel, pitch] = key.split(":").map(Number);
    starts.forEach((started) => {
      track.notes.push({ pitch, channel, startTick: started.startTick, durationTick: Math.max(1, tick - started.startTick), velocity: started.velocity });
    });
  });

  reader.pos = end;
  track.notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  return track;
}

export function parseMidi(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > MAX_MIDI_BYTES) fail("MIDIファイルが大きすぎます（2MBまで）。");
  if (bytes.length < 14 || String.fromCharCode(...bytes.subarray(0, 4)) !== "MThd") {
    fail("MIDIファイルとして読めませんでした。.mid / .midi のファイルを選んでください。");
  }

  const reader = new Reader(bytes);
  reader.pos = 4;
  const headerLength = reader.u32();
  const format = reader.u16();
  const trackCount = reader.u16();
  const division = reader.u16();
  reader.pos = 8 + headerLength;

  if (division & 0x8000) fail("この時間形式（SMPTE）のMIDIは読み込めません。");
  if (division === 0) fail("MIDIファイルの分解能が正しくありません。");
  if (format > 2) fail("このMIDIの形式には対応していません。");

  const state = {};
  const rawTracks = [];
  while (!reader.done && rawTracks.length < Math.max(1, trackCount)) {
    if (reader.pos + 8 > bytes.length) break;
    const id = reader.text(4);
    const length = reader.u32();
    if (id !== "MTrk") {
      reader.pos += length;
      continue;
    }
    if (reader.pos + length > bytes.length) fail("MIDIファイルが途中で終わっています。");
    rawTracks.push(readTrack(reader, length, state));
  }
  if (rawTracks.length === 0) fail("MIDIファイルに音符のトラックがありません。");
  if (rawTracks.length < trackCount) fail("MIDIファイルが途中で終わっています。");

  const tempos = rawTracks.flatMap((track) => track.tempos).sort((a, b) => a.tick - b.tick);
  const timeSignatures = rawTracks.flatMap((track) => track.timeSignatures).sort((a, b) => a.tick - b.tick);
  const keySignatures = rawTracks.flatMap((track) => track.keySignatures).sort((a, b) => a.tick - b.tick);

  // Format 0 は1トラックにすべてのチャンネルが入っているので、チャンネルごとに分ける
  let tracks = rawTracks;
  if (format === 0 && rawTracks.length === 1 && rawTracks[0].channels.size > 1) {
    const [only] = rawTracks;
    tracks = [...only.channels].sort((a, b) => a - b).map((channel) => ({
      ...only,
      name: channel === 9 ? "Drums" : `Channel ${channel + 1}`,
      notes: only.notes.filter((note) => note.channel === channel),
      channels: new Set([channel])
    }));
  }

  tracks = tracks.filter((track) => track.notes.length > 0);
  const totalNotes = tracks.reduce((sum, track) => sum + track.notes.length, 0);
  if (totalNotes === 0) fail("MIDIファイルに音符がありません。");
  if (totalNotes > MAX_NOTES) fail(`音符が多すぎるため読み込めません（${MAX_NOTES}音まで）。`);

  return {
    format,
    division,
    tempos,
    timeSignatures,
    keySignatures,
    tracks: tracks.map((track) => ({
      name: track.name,
      channels: [...track.channels].sort((a, b) => a - b),
      notes: track.notes
    }))
  };
}
