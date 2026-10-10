import { chordIntervals } from "../core/chord-qualities.js";
import { chordSymbol, getDiatonicChords, rootToPitchClass } from "../chord/chord-theory.js";
import { getSections, sectionRanges } from "../core/section-ops.js";

// 「山（最高音）をどの小節に置くか」を先に決めて、そこへ向かうメロディの目安を出す。
// 候補は3つの形（じわじわ上る / 溜めてから一気に / 山のあとに余韻）。各小節に、そのコードの構成音を1つずつ目安として置く。
// 完成したメロではなく骨組み。置いたあとは、Piano Rollで音を足したり直したりする。
// 自分のProjectを読んで、置く音の一覧を返す純粋関数（データは変えない）。

export const PEAK_SHAPES = Object.freeze([
  { id: "rise", label: "じわじわ上る", description: "1小節ずつ、少しずつ高くして山へ。自然に盛り上がる", heights: [0, 0.35, 0.7, 1], after: null },
  { id: "spring", label: "溜めてから一気に", description: "しばらく低めで溜めて、山の小節で一気に上がる", heights: [0, 0.1, 0.25, 1], after: null },
  { id: "arc", label: "山のあとに余韻", description: "山まで上って、次の小節で少し戻る。歌い終わりが落ち着く", heights: [0, 0.35, 0.7, 1], after: 0.45 }
]);

const PEAK_SPAN = 4; // 山の小節を含めて、手前の何小節ぶんを目安にするか
const PEAK_LIFT = 14; // 低い位置から山まで、およそ何半音上げるか（9度ほど）

export function getPeakShape(id) {
  return PEAK_SHAPES.find((shape) => shape.id === id) ?? PEAK_SHAPES[0];
}

// いまのメロディの最高音（無ければ null）。同じ高さなら最初の小節。
export function currentPeak(project) {
  const notes = project.tracks.find((track) => track.role === "melody")?.notes ?? [];
  if (notes.length === 0) return null;
  const barTicks = project.basic.ppq * 4;
  const top = notes.reduce((best, note) => (note.pitch > best.pitch || (note.pitch === best.pitch && note.startTick < best.startTick) ? note : best));
  return { bar: Math.floor(top.startTick / barTicks), pitch: top.pitch };
}

// 山の小節の初期値: メロがあればその最高音の小節、無ければ最初のサビの頭、それも無ければ4小節目。
export function defaultPeakBar(project) {
  const peak = currentPeak(project);
  if (peak) return peak.bar;
  const chorus = sectionRanges(getSections(project)).find((range) => range.section.kind === "chorus");
  return chorus ? chorus.startBar : 3;
}

function lowBase(key) {
  const base = 60 + rootToPitchClass(key); // C4〜B4
  return base > 66 ? base - 12 : base;
}

// 小節ごとのコード。コードが無い小節は主音のコード（Keyのダイアトニックの1つ目）で代用する。
function barChord(project, bar) {
  return project.chords[bar] ?? getDiatonicChords(project.basic.key, project.basic.scale)[0];
}

// target 付近で、コードの構成音になっている音を選ぶ（歌いやすい範囲 48〜84 に収める）。
function nearestChordTone(chord, target) {
  const tones = new Set(chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12));
  let best = null;
  for (let pitch = 48; pitch <= 84; pitch += 1) {
    if (!tones.has(pitch % 12)) continue;
    if (best === null || Math.abs(pitch - target) < Math.abs(best - target)) best = pitch;
  }
  return best;
}

// 戻り値: { peakBar, shape, bars: [{ bar, pitch, role: "rise" | "peak" | "after", chord }] }
export function buildPeakGuide(project, { peakBar, shapeId }) {
  if (!Number.isInteger(peakBar) || peakBar < 0) throw new Error("山の小節が不正です。");
  const shape = getPeakShape(shapeId);
  const base = lowBase(project.basic.key);
  const top = base + PEAK_LIFT;

  const bars = [];
  const first = Math.max(peakBar - (PEAK_SPAN - 1), 0);
  for (let bar = first; bar <= peakBar; bar += 1) {
    const heightIndex = shape.heights.length - 1 - (peakBar - bar);
    const target = base + (top - base) * shape.heights[heightIndex];
    const chord = barChord(project, bar);
    bars.push({ bar, role: bar === peakBar ? "peak" : "rise", pitch: nearestChordTone(chord, target), chord });
  }
  if (shape.after !== null) {
    const chord = barChord(project, peakBar + 1);
    bars.push({ bar: peakBar + 1, role: "after", pitch: nearestChordTone(chord, base + (top - base) * shape.after), chord });
  }

  // 山は、手前の小節より必ず高くする（コードによっては同じ高さになるため）
  const peak = bars.find((item) => item.role === "peak");
  const others = bars.filter((item) => item.role !== "peak");
  const highest = Math.max(...others.map((item) => item.pitch), 0);
  if (peak.pitch <= highest) {
    const tones = new Set(chordIntervals(peak.chord.quality).map((interval) => (peak.chord.root + interval) % 12));
    for (let pitch = highest + 1; pitch <= 88; pitch += 1) {
      if (tones.has(pitch % 12)) { peak.pitch = pitch; break; }
    }
  }

  return {
    peakBar,
    shape,
    bars: bars.map((item) => ({ bar: item.bar, role: item.role, pitch: item.pitch, chordText: chordSymbol(item.chord.root, item.chord.quality) }))
  };
}

function createNoteId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 目安の音を、メロディが空の小節にだけ置く。入力済みの小節は触らない。
// 戻り値: { notes（置いたあとの全音符）, placed, skipped }
export function applyPeakGuide(notes, guide, { barTicks }) {
  const next = [...notes];
  let placed = 0;
  let skipped = 0;
  for (const item of guide.bars) {
    const start = item.bar * barTicks;
    if (notes.some((note) => note.startTick >= start && note.startTick < start + barTicks)) {
      skipped += 1;
      continue;
    }
    next.push({
      id: createNoteId(),
      pitch: item.pitch,
      startTick: start,
      durationTick: item.role === "peak" ? barTicks : barTicks / 2,
      velocity: item.role === "peak" ? 104 : 90
    });
    placed += 1;
  }
  return { notes: next.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch), placed, skipped };
}
