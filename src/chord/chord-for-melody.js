import { chordIntervals } from "../core/chord-qualities.js";
import { chordRole } from "./chord-role.js";
import { suggestNextChords } from "./chord-next.js";
import { chordSymbol, getDiatonicChords } from "./chord-theory.js";

// 鼻歌（メロディ）を先に作ったあと、「この小節に合うコード候補を3つ」出す。
// AIが決めるのではなく、メロの音がどれだけコードの構成音に乗っているかを数えて、人間が選ぶ叩き台にする。
// 候補はKey/Scaleのダイアトニックコード（7つ）から選ぶ。

const BEAT = 480;

function barNotes(project, barIndex) {
  const ppq = project.basic?.ppq ?? 480;
  const barTicks = ppq * 4;
  const start = barIndex * barTicks;
  const end = start + barTicks;
  const melody = (project.tracks ?? []).find((track) => track.role === "melody");
  return (melody?.notes ?? [])
    .filter((note) => note.startTick >= start && note.startTick < end)
    .sort((a, b) => a.startTick - b.startTick)
    .map((note) => ({ ...note, offset: note.startTick - start }));
}

// メロディの入っている小節数（最後の音がある小節まで）。
export function melodyBarCount(project) {
  const ppq = project.basic?.ppq ?? 480;
  const barTicks = ppq * 4;
  const melody = (project.tracks ?? []).find((track) => track.role === "melody");
  const notes = melody?.notes ?? [];
  if (notes.length === 0) return 0;
  return Math.max(...notes.map((note) => Math.floor(note.startTick / barTicks))) + 1;
}

// 音の重み: 長い音と、拍の頭の音ほど「コードに合っていてほしい音」として強く数える。
function noteWeight(note, ppq) {
  const beat = ppq || BEAT;
  const lengthWeight = Math.min(note.durationTick / beat, 4);
  const onBeat = note.offset % beat === 0 ? 0.5 : 0;
  return 0.5 + lengthWeight + onBeat;
}

function scoreChord(chord, notes, ppq) {
  const tones = new Set(chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12));
  let total = 0;
  let fit = 0;
  let fitCount = 0;
  for (const note of notes) {
    const weight = noteWeight(note, ppq);
    total += weight;
    if (tones.has(((note.pitch % 12) + 12) % 12)) {
      fit += weight;
      fitCount += 1;
    }
  }
  return { fit: total === 0 ? 0 : fit / total, fitCount };
}

// barIndex小節目のコード候補を3つ返す。メロが無い小節は candidates が空。
// previousChords: その小節より前のコード（流れの加点に使う）。
export function suggestChordsForBar(project, barIndex, previousChords = []) {
  const ppq = project.basic?.ppq ?? 480;
  const { key, scale } = project.basic;
  const notes = barNotes(project, barIndex);
  if (notes.length === 0) return { notes: 0, candidates: [] };

  const diatonic = getDiatonicChords(key, scale);
  const flow = new Set(
    suggestNextChords(previousChords, { key, scale }).map((c) => `${c.root}:${c.quality}`)
  );
  const previous = previousChords[previousChords.length - 1];

  const scored = diatonic.map((chord, order) => {
    const { fit, fitCount } = scoreChord(chord, notes, ppq);
    const inFlow = flow.has(`${chord.root}:${chord.quality}`);
    const repeat = previous && previous.root === chord.root && previous.quality === chord.quality;
    // 構成音との合い具合が主役。流れ（王道）は小さな加点、同じコードの連続は小さな減点。
    const score = fit + (inFlow ? 0.06 : 0) - (repeat ? 0.03 : 0);
    return { chord, order, fit, fitCount, inFlow, score };
  });

  scored.sort((a, b) => (b.score - a.score) || (a.order - b.order));

  const candidates = scored.slice(0, 3).map(({ chord, fit, fitCount, inFlow }) => {
    const role = chordRole(chord, { key, scale }).label;
    const percent = Math.round(fit * 100);
    const base = fitCount === notes.length
      ? "メロの音がすべて構成音"
      : `メロの音の${percent}%が構成音`;
    return {
      root: chord.root,
      quality: chord.quality,
      degree: chord.degree,
      symbol: chordSymbol(chord.root, chord.quality),
      fit,
      reason: `${base}${inFlow ? "・王道の流れ" : ""}`,
      role
    };
  });

  return { notes: notes.length, candidates };
}

// 小節 barIndex のコードを pick に差し替えた（または追加した）コード配列を返す。
// コードは1小節目から隙間なく並ぶ決まりなので、barIndex は「いまのコード数」以下に限る。
export function chordsWithBarChord(project, barIndex, pick) {
  const ppq = project.basic?.ppq ?? 480;
  const barTicks = ppq * 4;
  if (!Number.isInteger(barIndex) || barIndex < 0 || barIndex > project.chords.length) {
    throw new Error("コードは1小節目から順に付けてください。");
  }
  const chord = {
    startTick: barIndex * barTicks,
    durationTick: barTicks,
    root: pick.root,
    quality: pick.quality,
    degree: pick.degree
  };
  const next = project.chords.map((existing) => ({ ...existing }));
  next[barIndex] = chord;
  return next;
}

// メロディのある全小節に、1つ目の候補を付けた叩き台を作る（コードが空の小節から順に、メロのある所まで）。
// メロが途切れた小節で止める。戻り値: { chords, filled }
export function draftChordsFromMelody(project) {
  const ppq = project.basic?.ppq ?? 480;
  const barTicks = ppq * 4;
  const bars = melodyBarCount(project);
  const chords = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const { candidates } = suggestChordsForBar(project, bar, chords);
    if (candidates.length === 0) break;
    const pick = candidates[0];
    chords.push({
      startTick: bar * barTicks,
      durationTick: barTicks,
      root: pick.root,
      quality: pick.quality,
      degree: pick.degree
    });
  }
  return { chords, filled: chords.length };
}
