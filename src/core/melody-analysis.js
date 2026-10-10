// メロディの特徴を数える（Melody Analyzer の中身）。
// 良い / 悪いを決めるものではなく、「自分のメロディがどんな特徴か」を知るための数字と一言。
// Projectを読むだけの純粋関数。MelodyパネルとHubの「曲の特徴カード」の両方から使う。

import { chordIntervals } from "./chord-qualities.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LEAP_SEMITONES = 5; // 4度以上（5半音〜）を「跳躍」と数える

export function pitchLabel(pitch) {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

function melodyNotes(project) {
  return [...(project.tracks.find((track) => track.role === "melody")?.notes ?? [])]
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

// メロディが無ければ null。
export function analyzeMelody(project) {
  const notes = melodyNotes(project);
  if (notes.length === 0) return null;

  const barTicks = project.basic.ppq * 4;
  const bars = new Map();
  notes.forEach((note) => {
    const bar = Math.floor(note.startTick / barTicks);
    if (!bars.has(bar)) bars.set(bar, []);
    bars.get(bar).push(note);
  });

  // 音域
  const pitches = notes.map((note) => note.pitch);
  const low = Math.min(...pitches);
  const high = Math.max(...pitches);

  // 跳躍・同音連打（連続する音の動き）
  let leapCount = 0;
  let maxLeap = 0;
  let sameCount = 0;
  let run = 1;
  let maxRun = 1;
  for (let i = 1; i < notes.length; i += 1) {
    const step = Math.abs(notes[i].pitch - notes[i - 1].pitch);
    if (step >= LEAP_SEMITONES) leapCount += 1;
    maxLeap = Math.max(maxLeap, step);
    if (step === 0) {
      sameCount += 1;
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }
  const motions = notes.length - 1;

  // コードトーン率（コードがある小節の音だけ数える）
  let counted = 0;
  let hits = 0;
  notes.forEach((note) => {
    const chord = project.chords[Math.floor(note.startTick / barTicks)];
    if (!chord) return;
    counted += 1;
    const tones = chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);
    if (tones.includes(note.pitch % 12)) hits += 1;
  });

  // モチーフ反復: 同じ音・同じ位置・同じ長さの小節が、前にもあるか
  const seen = new Set();
  let repeatedBars = 0;
  [...bars.entries()].sort((a, b) => a[0] - b[0]).forEach(([bar, barNotes]) => {
    const signature = barNotes.map((note) => `${note.startTick - bar * barTicks}:${note.pitch}:${note.durationTick}`).join("|");
    if (seen.has(signature)) repeatedBars += 1;
    seen.add(signature);
  });

  return {
    noteCount: notes.length,
    barsWithNotes: bars.size,
    range: { low, high, span: high - low },
    leaps: { count: leapCount, motions, ratio: motions > 0 ? leapCount / motions : 0, max: maxLeap },
    chordTone: { counted, hits, rate: counted > 0 ? hits / counted : null },
    density: { perBar: notes.length / bars.size },
    repeats: { sameCount, maxRun, motions },
    motif: { repeatedBars, barsWithNotes: bars.size, ratio: repeatedBars / bars.size }
  };
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function spanLabel(span) {
  const octaves = Math.floor(span / 12);
  const rest = span % 12;
  if (octaves === 0) return `${rest}半音`;
  return rest === 0 ? `${octaves}オクターブ` : `${octaves}オクターブ + ${rest}半音`;
}

// 画面表示用の「項目・数字・一言」。評価ではなく特徴の説明。
export function describeMelody(analysis) {
  if (!analysis) return [];
  const { range, leaps, chordTone, density, repeats, motif } = analysis;

  const rangeComment = range.span <= 7 ? "せまめ。歌いやすい音域"
    : range.span <= 12 ? "ふつう。1オクターブ以内"
      : range.span <= 19 ? "ひろめ。サビのような広がりが出る"
        : "とても広い。歌える範囲か確認してみる";
  const leapComment = leaps.ratio < 0.15 ? "ほぼ順次進行。なめらか"
    : leaps.ratio < 0.35 ? "ふつう。なめらかさと動きのバランス"
      : "跳躍が多め。動きが大きい";
  const toneComment = chordTone.rate === null ? "コードを入れると表示されます"
    : chordTone.rate < 0.4 ? "コード外の音が多め。色彩や緊張感が出やすい"
      : chordTone.rate < 0.7 ? "ふつう。安定と動きのバランス"
        : "コードに合う音が中心。安定した響き";
  const densityComment = density.perBar < 3 ? "ゆったり"
    : density.perBar < 6 ? "ふつう"
      : "細かめ。にぎやか";
  const repeatComment = repeats.maxRun >= 4 ? "同じ音が続く場所がある。動きをつけると変化が出る"
    : repeats.sameCount === 0 ? "同音連打なし"
      : "少なめ";
  const motifComment = motif.repeatedBars === 0 ? "繰り返しなし。毎小節ちがう"
    : motif.ratio < 0.4 ? "ほどよく反復している"
      : "反復が多め。覚えやすい";

  return [
    { id: "range", label: "音域", value: `${pitchLabel(range.low)}〜${pitchLabel(range.high)}（${spanLabel(range.span)}）`, comment: rangeComment },
    { id: "leap", label: "跳躍", value: leaps.motions === 0 ? "音が1つだけ" : `${leaps.count}回 / ${leaps.motions}（${percent(leaps.ratio)}）・最大${leaps.max}半音`, comment: leaps.motions === 0 ? "" : leapComment },
    { id: "tone", label: "コードトーン率", value: chordTone.rate === null ? "—" : percent(chordTone.rate), comment: toneComment },
    { id: "density", label: "リズム密度", value: `1小節あたり ${density.perBar.toFixed(1)}音`, comment: densityComment },
    { id: "same", label: "同音連打", value: `${repeats.sameCount}回・最長${repeats.maxRun}音`, comment: repeatComment },
    { id: "motif", label: "モチーフ反復", value: `${motif.repeatedBars} / ${motif.barsWithNotes}小節が同じパターン`, comment: motifComment }
  ];
}
