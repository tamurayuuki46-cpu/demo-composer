// MIDI読み込み: parseMidi() の結果を、Demo Composerのproject（Chord / Melody / Bass / Drums / 裏メロ）へ変換する。
// 完全自動ではなく「トラックごとの役割を提案 → 人が直す → 取り込む」。純粋関数で、UIにもAudioにも依存しない。
// 取り込みでは、音符を16分音符（120 tick）の格子に丸め、コードは和音から小節ごとに判定する（あとでChord画面で直せる）。

import { chordIntervals, CHORD_QUALITY_ORDER } from "../core/chord-qualities.js";
import { createDefaultProject, validateProject } from "../core/project-state.js";
import { chordDegreeForVariant, NOTE_NAMES } from "../chord/chord-theory.js";

const PPQ = 480;
const BAR = PPQ * 4;
const GRID = 120;
export const MAX_IMPORT_BARS = 128;

export const IMPORT_ROLES = Object.freeze([
  { id: "none", label: "使わない" },
  { id: "chord", label: "Chord（和音）" },
  { id: "melody", label: "Melody" },
  { id: "bass", label: "Bass" },
  { id: "drums", label: "Drums" },
  { id: "counter", label: "裏メロ" }
]);

const KICK = 36;
const SNARE = 38;
const HH = 42;
const DRUM_MAP = new Map([[35, KICK], [36, KICK], [37, SNARE], [38, SNARE], [40, SNARE], [42, HH], [44, HH], [46, HH]]);
const KRUMHANSL = {
  major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
};

// ------------------------------------------------------------------ 役割の提案

export function trackStats(track) {
  const notes = track.notes;
  const pitches = notes.map((note) => note.pitch);
  let overlap = 0;
  notes.forEach((note) => {
    overlap += notes.filter((other) => other.startTick <= note.startTick && other.startTick + other.durationTick > note.startTick).length;
  });
  return {
    count: notes.length,
    min: Math.min(...pitches),
    max: Math.max(...pitches),
    average: pitches.reduce((sum, pitch) => sum + pitch, 0) / pitches.length,
    polyphony: overlap / notes.length
  };
}

function guessRole(track, stats) {
  const name = track.name.toLowerCase();
  if (track.channels.includes(9) || /drum|perc|ドラム|リズム/.test(name)) return "drums";
  if (/counter|裏メロ/.test(name)) return "counter";
  if (/chord|pad|keys|piano|guitar|コード/.test(name)) return "chord";
  if (/bass|ベース/.test(name)) return "bass";
  if (/melody|lead|vocal|メロ|主旋律/.test(name)) return "melody";
  if (stats.polyphony >= 2.2) return "chord";
  if (stats.average < 52) return "bass";
  return "melody";
}

// 各トラックの役割の提案（同じ役割は1トラックだけ。2つ目以降は「使わない」）
export function suggestRoles(parsed) {
  const used = new Set();
  return parsed.tracks.map((track) => {
    const role = guessRole(track, trackStats(track));
    if (used.has(role)) return "none";
    used.add(role);
    return role;
  });
}

// ------------------------------------------------------------------ 変換の部品

const scaleTick = (tick, division) => (tick * PPQ) / division;
const snap = (tick) => Math.round(tick / GRID) * GRID;

function quantizedNotes(track, division, maxTick) {
  const out = [];
  track.notes.forEach((note) => {
    const startTick = snap(scaleTick(note.startTick, division));
    if (startTick >= maxTick) return;
    const durationTick = Math.max(GRID, snap(scaleTick(note.durationTick, division)));
    out.push({
      pitch: note.pitch,
      startTick,
      durationTick: Math.min(durationTick, maxTick - startTick),
      velocity: Math.min(127, Math.max(1, note.velocity))
    });
  });
  return out;
}

// 単音にする: 同じ位置は高い音（Bassは低い音）を残し、重なる前の音は次の頭で切る
function monophonic(notes, keepLowest) {
  const byStart = new Map();
  notes.forEach((note) => {
    const kept = byStart.get(note.startTick);
    if (!kept || (keepLowest ? note.pitch < kept.pitch : note.pitch > kept.pitch)) byStart.set(note.startTick, note);
  });
  const sorted = [...byStart.values()].sort((a, b) => a.startTick - b.startTick);
  return sorted.map((note, index) => {
    const next = sorted[index + 1];
    const durationTick = next ? Math.min(note.durationTick, next.startTick - note.startTick) : note.durationTick;
    return { ...note, durationTick: Math.max(GRID, durationTick) };
  });
}

function drumNotes(notes) {
  const seen = new Set();
  const out = [];
  let dropped = 0;
  notes.forEach((note) => {
    const pitch = DRUM_MAP.get(note.pitch);
    if (!pitch) {
      dropped += 1;
      return;
    }
    const key = `${note.startTick}:${pitch}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ pitch, startTick: note.startTick, durationTick: GRID, velocity: note.velocity });
  });
  return { notes: out, dropped };
}

// 小節ごとの和音判定: 音の長さで重みを付けた音名の集まりが、どのコードに一番近いかを選ぶ
export function detectChord(weights, lowestPitchClass) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  let best = null;
  for (let root = 0; root < 12; root += 1) {
    CHORD_QUALITY_ORDER.forEach((quality, order) => {
      const tones = chordIntervals(quality).map((interval) => (root + interval) % 12);
      const inside = tones.reduce((sum, pc) => sum + weights[pc], 0);
      const present = tones.filter((pc) => weights[pc] > total * 0.04).length;
      const score = inside / total
        + 0.6 * (present / tones.length)
        - Math.max(0, tones.length - 3) * 0.08
        - order * 0.004
        + (lowestPitchClass === root ? 0.15 : 0);
      if (!best || score > best.score) best = { root, quality, score };
    });
  }
  return best;
}

function chordsFromNotes(notes, barCount) {
  const chords = [];
  for (let bar = 0; bar < barCount; bar += 1) {
    const start = bar * BAR;
    const end = start + BAR;
    const weights = new Array(12).fill(0);
    let lowest = null;
    notes.forEach((note) => {
      const overlap = Math.min(end, note.startTick + note.durationTick) - Math.max(start, note.startTick);
      if (overlap <= 0) return;
      weights[note.pitch % 12] += overlap;
      if (!lowest || note.pitch < lowest.pitch) lowest = note;
    });
    chords.push(detectChord(weights, lowest ? lowest.pitch % 12 : null));
  }

  // 空の小節は、前の和音を続ける（先頭の空きは次の和音）。コードは1小節ずつ隙間なく並べる決まり
  const firstFilled = chords.find((chord) => chord);
  let previous = firstFilled ?? null;
  return chords.map((chord) => {
    if (chord) previous = chord;
    return previous;
  }).filter(Boolean);
}

export function detectKey(notes) {
  const weights = new Array(12).fill(0);
  notes.forEach((note) => {
    weights[note.pitch % 12] += note.durationTick;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { key: "C", scale: "major" };

  const correlation = (profile, tonic) => {
    const rotated = profile.map((_, index) => weights[(tonic + index) % 12]);
    const meanA = rotated.reduce((sum, value) => sum + value, 0) / 12;
    const meanB = profile.reduce((sum, value) => sum + value, 0) / 12;
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    rotated.forEach((value, index) => {
      numerator += (value - meanA) * (profile[index] - meanB);
      denomA += (value - meanA) ** 2;
      denomB += (profile[index] - meanB) ** 2;
    });
    return denomA === 0 || denomB === 0 ? 0 : numerator / Math.sqrt(denomA * denomB);
  };

  let best = { key: "C", scale: "major", score: -Infinity };
  for (let tonic = 0; tonic < 12; tonic += 1) {
    ["major", "minor"].forEach((scale) => {
      const score = correlation(KRUMHANSL[scale], tonic);
      if (score > best.score) best = { key: NOTE_NAMES[tonic], scale, score };
    });
  }
  return { key: best.key, scale: best.scale };
}

function trackTemplate(role, notes) {
  const base = { instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes };
  if (role === "melody") return { role, name: "Melody", midiChannel: 2, ...base };
  if (role === "bass") return { role, name: "Bass", midiChannel: 3, ...base };
  if (role === "counter") return { role, name: "Counter Melody", midiChannel: 4, ...base };
  return { role, name: "Drums", midiChannel: 10, ...base, drumMap: { kick: 36, snare: 38, closedHH: 42 } };
}

// ------------------------------------------------------------------ 取り込み本体

// assignments: parsed.tracks と同じ長さの役割ID配列。options: { title, key, scale }（key / scale を省くと自動判定）
export function buildProjectFromMidi(parsed, assignments, options = {}) {
  const warnings = [];
  const signature = parsed.timeSignatures[0];
  if (signature && (signature.numerator !== 4 || signature.denominator !== 4)) {
    throw new Error(`拍子が${signature.numerator}/${signature.denominator}のMIDIは読み込めません。Demo Composerは4/4だけに対応しています。`);
  }
  if (parsed.timeSignatures.some((item) => item.numerator !== 4 || item.denominator !== 4)) {
    warnings.push("途中で拍子が変わる部分は、4/4として読み込みました。");
  }

  const chosen = {};
  assignments.forEach((role, index) => {
    if (role && role !== "none" && !chosen[role]) chosen[role] = parsed.tracks[index];
  });
  if (Object.keys(chosen).length === 0) throw new Error("取り込むトラックがありません。役割を1つ以上選んでください。");

  const endTick = Math.max(...Object.values(chosen).flatMap((track) => track.notes.map((note) => scaleTick(note.startTick + note.durationTick, parsed.division))));
  const barCount = Math.max(1, Math.min(MAX_IMPORT_BARS, Math.ceil(endTick / BAR - 1e-6)));
  if (endTick > MAX_IMPORT_BARS * BAR) warnings.push(`${MAX_IMPORT_BARS}小節より後ろは読み込みませんでした。`);
  const maxTick = barCount * BAR;

  const quantized = {};
  Object.entries(chosen).forEach(([role, track]) => {
    quantized[role] = quantizedNotes(track, parsed.division, maxTick);
  });

  const tonalNotes = ["chord", "melody", "bass", "counter"].flatMap((role) => quantized[role] ?? []);
  const detected = detectKey(tonalNotes);
  const key = options.key ?? detected.key;
  const scale = options.scale ?? detected.scale;

  const tempo = parsed.tempos[0]?.bpm ?? 120;
  let bpm = Math.round(tempo);
  if (bpm < 40 || bpm > 240) {
    warnings.push(`テンポ${bpm}は範囲外のため、${bpm < 40 ? 40 : 240}にしました。`);
    bpm = bpm < 40 ? 40 : 240;
  }
  if (parsed.tempos.some((item) => Math.abs(item.bpm - tempo) > 0.5)) warnings.push("途中でテンポが変わる部分は、最初のテンポで読み込みました。");

  let id = 0;
  const withIds = (notes) => notes.map((note) => ({ id: `midi-${++id}`, ...note }));

  const project = createDefaultProject();
  project.metadata.title = (options.title || "MIDIから取り込み").slice(0, 80);
  project.basic.bpm = bpm;
  project.basic.key = key;
  project.basic.scale = scale;

  if (quantized.chord) {
    const chords = chordsFromNotes(quantized.chord, barCount);
    project.chords = chords.map((chord, bar) => ({
      root: chord.root,
      quality: chord.quality,
      degree: chordDegreeForVariant(chord.root, key, chord.quality),
      startTick: bar * BAR,
      durationTick: BAR
    }));
  }

  let droppedDrums = 0;
  if (quantized.melody) project.tracks.push(trackTemplate("melody", withIds(monophonic(quantized.melody, false))));
  if (quantized.bass) project.tracks.push(trackTemplate("bass", withIds(monophonic(quantized.bass, true))));
  if (quantized.drums) {
    const drums = drumNotes(quantized.drums);
    droppedDrums = drums.dropped;
    project.tracks.push(trackTemplate("drums", withIds(drums.notes)));
    if (droppedDrums > 0) warnings.push(`キック・スネア・ハイハット以外のドラム音（${droppedDrums}音）は読み込みませんでした。`);
  }
  if (quantized.counter) project.tracks.push(trackTemplate("counter", withIds(monophonic(quantized.counter, false))));
  if (quantized.melody || quantized.bass || quantized.counter) warnings.push("メロディ・ベース・裏メロは、16分音符の格子に丸め、単音にして取り込みました。");
  if (quantized.chord) warnings.push("コードは、和音から小節ごとに判定しました。Chord画面で確認してください。");

  validateProject(project);

  const count = (role) => project.tracks.find((track) => track.role === role)?.notes.length ?? 0;
  return {
    project,
    report: {
      bpm,
      key,
      scale,
      detectedKey: detected.key,
      detectedScale: detected.scale,
      bars: barCount,
      chords: project.chords.length,
      melody: count("melody"),
      bass: count("bass"),
      drums: count("drums"),
      counter: count("counter"),
      warnings
    }
  };
}
