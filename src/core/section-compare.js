import { getSections, sectionRanges } from "./section-ops.js";
import { pitchLabel, chordDegreeBreakdown } from "./melody-analysis.js";

const CHORD_DEGREE_NAMES = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];

// Sectionごとのメロディの特徴を並べて、「AメロとサビのSectionの差が足りているか」に気づくための数字。
// 良い / 悪いの評価ではなく、差を見る道具。Projectを読むだけの純粋関数（Melody Analyzerの一部）。

// 各Sectionの音域 / 音数 / リズム密度（1小節あたりの音数）/ 平均の高さ。メロが無いSectionは noteCount 0。
export function compareSections(project) {
  const sections = getSections(project);
  if (sections.length === 0) return [];

  const barTicks = project.basic.ppq * 4;
  const melody = project.tracks.find((track) => track.role === "melody")?.notes ?? [];

  return sectionRanges(sections).map(({ section, index, startBar, endBar }) => {
    const notes = melody.filter((note) => note.startTick >= startBar * barTicks && note.startTick < endBar * barTicks);
    const base = { index, kind: section.kind, name: section.name, startBar, endBar, bars: section.bars, noteCount: notes.length };
    if (notes.length === 0) return { ...base, range: null, avgPitch: null, density: 0, barsWithNotes: 0, chordDegrees: null };

    // コードのルートから見た度数の使用率（コードがある小節の音のみ）
    const breakdown = chordDegreeBreakdown(project, notes);
    const chordDegrees = breakdown.counted
      ? {
        counted: breakdown.counted,
        // 構成音率（安定感）/ スケール外率（緊張・個性）
        toneRate: breakdown.degrees.reduce((sum, d) => sum + d.chord, 0) / breakdown.counted,
        tensionRate: breakdown.degrees.reduce((sum, d) => sum + d.tension, 0) / breakdown.counted,
        outsideRate: breakdown.degrees.reduce((sum, d) => sum + d.outside, 0) / breakdown.counted,
        rates: breakdown.degrees.map((d) => (d.chord + d.tension + d.outside + d.other) / breakdown.counted),
        degrees: breakdown.degrees
      }
      : null;

    const pitches = notes.map((note) => note.pitch);
    const low = Math.min(...pitches);
    const high = Math.max(...pitches);
    const barsWithNotes = new Set(notes.map((note) => Math.floor(note.startTick / barTicks))).size;
    return {
      ...base,
      range: { low, high, span: high - low },
      avgPitch: pitches.reduce((sum, pitch) => sum + pitch, 0) / pitches.length,
      density: notes.length / section.bars,
      barsWithNotes,
      chordDegrees
    };
  });
}

const signed = (value, unit) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}${unit}`;

// サビを、その直前にあるメロ入りのAメロ / Bメロと比べる（サビが無ければ空）。
// lacking: 差が小さく、盛り上がりの差が足りないかもしれないとき true。
export function contrastHints(rows) {
  const chorusAt = rows.findIndex((row) => row.kind === "chorus" && row.noteCount > 0);
  if (chorusAt === -1) return null;
  const chorus = rows[chorusAt];

  let ref = null;
  for (let i = chorusAt - 1; i >= 0; i -= 1) {
    if ((rows[i].kind === "verse" || rows[i].kind === "prechorus") && rows[i].noteCount > 0) {
      ref = rows[i];
      break;
    }
  }
  if (!ref) return null;

  const highDiff = chorus.range.high - ref.range.high;
  const avgDiff = Math.round(chorus.avgPitch - ref.avgPitch);
  const spanDiff = chorus.range.span - ref.range.span;
  const densityDiff = Math.round((chorus.density - ref.density) * 10) / 10;

  const lacking = Math.abs(highDiff) < 3 && Math.abs(avgDiff) < 2 && Math.abs(densityDiff) < 1;
  const lines = [
    `最高音: ${pitchLabel(chorus.range.high)}（${ref.name}より ${signed(highDiff, "半音")}）`,
    `平均の高さ: ${signed(avgDiff, "半音")}`,
    `音域のひろさ: ${signed(spanDiff, "半音")}`,
    `リズム密度: 1小節あたり ${signed(densityDiff, "音")}`
  ];
  // 度数の使い方の差: サビで増えた / 減った度数（使用率が10ポイント以上動いたもの）
  let degreeLine = null;
  if (chorus.chordDegrees && ref.chordDegrees) {
    const moves = chorus.chordDegrees.rates
      .map((rate, index) => ({ index, diff: Math.round((rate - ref.chordDegrees.rates[index]) * 100) }))
      .filter((item) => Math.abs(item.diff) >= 10)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);
    degreeLine = moves.length
      ? `コード度数: ${moves.map((item) => `${CHORD_DEGREE_NAMES[item.index]} ${item.diff > 0 ? "+" : "−"}${Math.abs(item.diff)}%`).join("・")}`
      : "コード度数: 大きな差なし（使う度数が似ています）";
  }
  if (degreeLine) lines.push(degreeLine);
  if (chorus.chordDegrees && ref.chordDegrees) {
    const pct = (value) => Math.round(value * 100);
    const toneDiff = pct(chorus.chordDegrees.toneRate) - pct(ref.chordDegrees.toneRate);
    const outDiff = pct(chorus.chordDegrees.outsideRate) - pct(ref.chordDegrees.outsideRate);
    const mood = toneDiff >= 10 ? "安定感が増えています" : toneDiff <= -10 ? "コード構成音が減り、動きや緊張が増えています" : "安定感は近いです";
    lines.push(`構成音率: ${pct(chorus.chordDegrees.toneRate)}%（${ref.name} ${pct(ref.chordDegrees.toneRate)}%）・スケール外 ${pct(chorus.chordDegrees.outsideRate)}%（${ref.name} ${pct(ref.chordDegrees.outsideRate)}%）→ ${outDiff >= 10 && toneDiff > -10 ? "スケール外が増え、緊張が強まっています" : mood}`);
  }
  const advice = lacking
    ? `${chorus.name}と${ref.name}の差が小さめです。サビの音域をひろげる・高めに置く・音の数を変えると、盛り上がりの差が出ます。`
    : `${chorus.name}と${ref.name}に差があります。意図した盛り上がり方か、聴いて確かめてみましょう。`;
  return { target: chorus.name, ref: ref.name, lines, lacking, advice };
}
