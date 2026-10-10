import { getSections, sectionProgress, sectionRanges } from "./section-ops.js";

// 「8小節ループを先に作り、Sectionに増やして、少しずつ変えて曲にする」流れの案内。
// いまのProjectを読んで、どの段階か・次に何をすればよいかを返す純粋関数（データは変えない）。
// ループ = 最初のSection。

const STEP_DEFS = [
  { id: "loop", label: "ループを作る" },
  { id: "grow", label: "複製して増やす" },
  { id: "vary", label: "違う版にする" }
];

// Sectionの中身の「かたち」（コード・メロ・ベース・ドラムを、Section先頭からの位置で並べた文字列）。
function signature(project, range) {
  const barTicks = project.basic.ppq * 4;
  const start = range.startBar * barTicks;
  const end = range.endBar * barTicks;
  const part = (items, map) => items
    .filter((item) => item.startTick >= start && item.startTick < end)
    .map((item) => `${item.startTick - start}:${map(item)}`)
    .join(",");
  const parts = [part(project.chords, (chord) => `${chord.root}${chord.quality}`)];
  ["melody", "bass", "drums", "counter"].forEach((role) => {
    const notes = project.tracks.find((track) => track.role === role)?.notes ?? [];
    parts.push(part([...notes].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch), (note) => `${note.pitch}/${note.durationTick}`));
  });
  return parts.join("|");
}

// phase: start（構成なし）/ build（ループ作り中）/ grow（増やす）/ vary（違う版にする）/ done
export function loopGuide(project) {
  const sections = getSections(project);
  const steps = STEP_DEFS.map((step) => ({ ...step, status: "todo" }));
  const finish = (phase, extra = {}) => {
    const order = { start: 0, build: 0, grow: 1, vary: 2, done: 3 }[phase];
    steps.forEach((step, index) => { step.status = index < order ? "done" : index === order ? "now" : "todo"; });
    return { phase, steps, sectionCount: sections.length, identical: [], loopReady: false, ...extra };
  };

  if (sections.length === 0) return finish("start");

  const ranges = sectionRanges(sections);
  const loop = ranges[0];
  const progress = sectionProgress(project, loop.startBar, loop.endBar);
  // ループができた = コードが全小節にあり、メロ・ベース・ドラムのどれかも入っている
  const loopReady = progress.chord.filled === progress.chord.total
    && (progress.melody.filled + progress.bass.filled + progress.drums.filled) > 0;
  if (!loopReady) return finish("build", { progress });

  if (sections.length < 2) return finish("grow", { loopReady, loopBars: loop.section.bars });

  const loopSignature = signature(project, loop);
  const identical = ranges
    .slice(1)
    .filter((range) => range.section.bars === loop.section.bars && signature(project, range) === loopSignature)
    .map((range) => range.index);
  if (identical.length > 0) return finish("vary", { loopReady, identical, loopBars: loop.section.bars });

  return finish("done", { loopReady, loopBars: loop.section.bars });
}

// ループを複製して追加するときの、おすすめのSectionの種類（2つ目はサビ、あとはAメロ...）。
export function suggestedCopyKind(sectionCount) {
  return sectionCount <= 1 ? "chorus" : sectionCount === 2 ? "prechorus" : "verse";
}
