// メロディの特徴を数える（Melody Analyzer の中身）。
// 良い / 悪いを決めるものではなく、「自分のメロディがどんな特徴か」を知るための数字と一言。
// Projectを読むだけの純粋関数。MelodyパネルとHubの「曲の特徴カード」の両方から使う。

import { chordIntervals } from "./chord-qualities.js";
import { analyzeMelodicFunctions, melodicFunctionRows } from "./melodic-functions.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LEAP_SEMITONES = 5; // 4度以上（5半音〜）を「跳躍」と数える
const DEGREE_LABELS = ["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
const CHORD_DEGREE_LABELS = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
const SCALE_INTERVALS = {
  major: new Set([0, 2, 4, 5, 7, 9, 11]),
  minor: new Set([0, 2, 3, 5, 7, 8, 10])
};

export function pitchLabel(pitch) {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

function melodyNotes(project) {
  return [...(project.tracks.find((track) => track.role === "melody")?.notes ?? [])]
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

function degreeIndex(pitchClass, rootPitchClass) {
  return ((pitchClass - rootPitchClass) % 12 + 12) % 12;
}

function degreeCounts(notes, rootPitchClass) {
  const counts = Array(12).fill(0);
  notes.forEach((note) => {
    counts[degreeIndex(note.pitch % 12, rootPitchClass)] += 1;
  });
  return counts;
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

  // Keyから見た度数。全Melody NoteをKeyの主音からの半音距離で数える。
  const keyRoot = NOTE_NAMES.indexOf(project.basic.key);
  const keyDegree = keyRoot >= 0
    ? { root: keyRoot, key: project.basic.key, counts: degreeCounts(notes, keyRoot), total: notes.length }
    : { root: null, key: project.basic.key ?? "", counts: Array(12).fill(0), total: 0 };

  // コードトーン率 + コードルートから見た度数（コードがある小節の音だけ数える）
  let counted = 0;
  let hits = 0;
  const chordDegreeCounts = Array(12).fill(0);
  notes.forEach((note) => {
    const chord = project.chords[Math.floor(note.startTick / barTicks)];
    if (!chord) return;
    counted += 1;
    const relativeDegree = degreeIndex(note.pitch % 12, chord.root);
    chordDegreeCounts[relativeDegree] += 1;
    const tones = chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);
    if (tones.includes(note.pitch % 12)) hits += 1;
  });

  // Scale内 / 外。Keyの主音から見た相対音程が現在Scaleに含まれるかを数える。
  const scaleIntervals = SCALE_INTERVALS[project.basic.scale];
  let scaleHits = 0;
  if (keyRoot >= 0 && scaleIntervals) {
    notes.forEach((note) => {
      if (scaleIntervals.has(degreeIndex(note.pitch % 12, keyRoot))) scaleHits += 1;
    });
  }
  const scaleFit = {
    key: project.basic.key ?? "",
    scale: project.basic.scale ?? "",
    counted: keyRoot >= 0 && scaleIntervals ? notes.length : 0,
    hits: keyRoot >= 0 && scaleIntervals ? scaleHits : 0,
    rate: keyRoot >= 0 && scaleIntervals ? scaleHits / notes.length : null
  };

  // モチーフ反復: 同じ音・同じ位置・同じ長さの小節が、前にもあるか
  const seen = new Set();
  let repeatedBars = 0;
  [...bars.entries()].sort((a, b) => a[0] - b[0]).forEach(([bar, barNotes]) => {
    const signature = barNotes.map((note) => `${note.startTick - bar * barTicks}:${note.pitch}:${note.durationTick}`).join("|");
    if (seen.has(signature)) repeatedBars += 1;
    seen.add(signature);
  });

  const melodicFunctions = analyzeMelodicFunctions(project, notes, barTicks);

  return {
    noteCount: notes.length,
    barsWithNotes: bars.size,
    range: { low, high, span: high - low },
    leaps: { count: leapCount, motions, ratio: motions > 0 ? leapCount / motions : 0, max: maxLeap },
    keyDegree,
    chordDegree: { counted, counts: chordDegreeCounts },
    scaleFit,
    chordTone: { counted, hits, rate: counted > 0 ? hits / counted : null },
    density: { perBar: notes.length / bars.size },
    repeats: { sameCount, maxRun, motions },
    motif: { repeatedBars, barsWithNotes: bars.size, ratio: repeatedBars / bars.size },
    melodicFunctions
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

function degreeSummary(counts, total, labels) {
  if (!total) return "—";
  return counts
    .map((count, index) => ({ count, index }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, 4)
    .map((item) => `${labels[item.index]} ${percent(item.count / total)}`)
    .join("・");
}

function scaleLabel(scale) {
  if (scale === "major") return "Major";
  if (scale === "minor") return "Minor";
  return scale || "Scale";
}

// 既存の分析値を「どこを見るか」という3方向にまとめる。似ている度の採点はしない。
function melodyPerspectiveRows(analysis) {
  const { leaps, chordDegree, scaleFit, density, motif } = analysis;
  const floatingRate = chordDegree.counted
    ? (chordDegree.counts[2] + chordDegree.counts[9]) / chordDegree.counted
    : null;
  const scaleOutside = scaleFit.rate === null ? null : scaleFit.counted - scaleFit.hits;

  return [
    {
      id: "perspective-note",
      label: "旋律の3つの見方",
      value: "参考モデル",
      comment: "特定曲のコピーや本人らしさの採点ではなく、今の分析値をどこから見るかを3方向に整理したものです。"
    },
    {
      id: "perspective-kusano",
      label: "🌿 歌心・浮遊型（草野マサムネ参考）",
      value: `跳躍 ${percent(leaps.ratio)}・2(9th)/6th ${floatingRate === null ? "—" : percent(floatingRate)}`,
      comment: "順次進行のなめらかさと、コードに対する2(9th)・6thの混ざり方を見る。"
    },
    {
      id: "perspective-yonezu",
      label: "⚡ 輪郭・違和感型（米津玄師参考）",
      value: `最大跳躍 ${leaps.max}半音・Scale外 ${scaleOutside === null ? "—" : `${scaleOutside}音`}`,
      comment: "大きな跳躍やScale外音を良し悪しではなく、旋律の輪郭や引っ掛かりとして見る。"
    },
    {
      id: "perspective-ayase",
      label: "🚀 推進・高密度型（Ayase / YOASOBI参考）",
      value: `${density.perBar.toFixed(1)}音/小節・同型反復 ${motif.repeatedBars}/${motif.barsWithNotes}小節`,
      comment: "音数の密度と短い反復が、前へ進む感覚を作っているかを見る。"
    }
  ];
}

// 画面表示用の「項目・数字・一言」。評価ではなく特徴の説明。
export function describeMelody(analysis) {
  if (!analysis) return [];
  const { range, leaps, keyDegree, chordDegree, scaleFit, chordTone, density, repeats, motif, melodicFunctions } = analysis;

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
  const keyDegreeComment = keyDegree.total
    ? `Key ${keyDegree.key} の主音を1として、よく使う度数を表示`
    : "HubでKeyを設定すると表示されます";
  const chordDegreeComment = chordDegree.counted
    ? `コードがある小節の${chordDegree.counted}音を集計（R=コードのルート）`
    : "コードを入れると、コードごとの相対度数が表示されます";
  const scaleComment = scaleFit.rate === null
    ? "HubでKey / Scaleを設定すると表示されます"
    : `${scaleFit.key} ${scaleLabel(scaleFit.scale)} 内 ${scaleFit.hits}/${scaleFit.counted}音・外 ${scaleFit.counted - scaleFit.hits}音`;

  return [
    { id: "range", label: "音域", value: `${pitchLabel(range.low)}〜${pitchLabel(range.high)}（${spanLabel(range.span)}）`, comment: rangeComment },
    { id: "key-degree", label: "Keyからの度数", value: degreeSummary(keyDegree.counts, keyDegree.total, DEGREE_LABELS), comment: keyDegreeComment },
    { id: "chord-degree", label: "Chordからの度数", value: degreeSummary(chordDegree.counts, chordDegree.counted, CHORD_DEGREE_LABELS), comment: chordDegreeComment },
    { id: "scale-fit", label: "Scale内率", value: scaleFit.rate === null ? "—" : percent(scaleFit.rate), comment: scaleComment },
    { id: "leap", label: "跳躍", value: leaps.motions === 0 ? "音が1つだけ" : `${leaps.count}回 / ${leaps.motions}（${percent(leaps.ratio)}）・最大${leaps.max}半音`, comment: leaps.motions === 0 ? "" : leapComment },
    { id: "tone", label: "コードトーン率", value: chordTone.rate === null ? "—" : percent(chordTone.rate), comment: toneComment },
    { id: "density", label: "リズム密度", value: `1小節あたり ${density.perBar.toFixed(1)}音`, comment: densityComment },
    { id: "same", label: "同音連打", value: `${repeats.sameCount}回・最長${repeats.maxRun}音`, comment: repeatComment },
    { id: "motif", label: "モチーフ反復", value: `${motif.repeatedBars} / ${motif.barsWithNotes}小節が同じパターン`, comment: motifComment },
    ...melodicFunctionRows(melodicFunctions),
    ...melodyPerspectiveRows(analysis)
  ];
}
