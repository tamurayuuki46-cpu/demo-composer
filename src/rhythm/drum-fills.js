import { DRUM_PITCH } from "./rhythm-grid.js";

// ドラムフィル: Sectionの最後の小節の「後半（3・4拍）」だけを変えて、次のSectionへの切り替わりを作る。
// 前半（1・2拍）は、いまのドラムをそのまま残す。叩き台なので、あとから16マスで直せる。

const VELOCITY = { kick: 105, snare: 100, hh: 88 };

export const DRUM_FILLS = Object.freeze([
  {
    id: "snare-8th",
    label: "スネア8分",
    description: "後半をスネアの8分で刻んで、次へ勢いをつける定番のフィル。",
    steps: { kick: [8], snare: [8, 10, 12, 14], hh: [] }
  },
  {
    id: "snare-roll",
    label: "スネアロール",
    description: "最後の2拍を細かいスネアで駆け上がる。盛り上がるサビ前向き。",
    steps: { kick: [8], snare: [8, 10, 12, 13, 14, 15], hh: [] }
  },
  {
    id: "break",
    label: "ブレイク",
    description: "後半を止めて、最後だけスネアを入れる。サビ前の「ため」に。",
    steps: { kick: [], snare: [12, 14, 15], hh: [] }
  }
]);

// 小節が空のときに足す前半（1・2拍）。基本の8ビートの前半と同じ
const FIRST_HALF = { kick: [0], snare: [4], hh: [0, 2, 4, 6] };

const PITCH = { kick: DRUM_PITCH.kick, snare: DRUM_PITCH.snare, hh: DRUM_PITCH.hh };
const DRUM_PITCHES = new Set(Object.values(PITCH));

export function getDrumFill(fillId) {
  return DRUM_FILLS.find((fill) => fill.id === fillId) ?? DRUM_FILLS[0];
}

function createNoteId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 指定の小節にフィルを入れた、ドラム全体のノート配列を返す（元の配列は変更しない）
export function applyDrumFill(notes, { fillId, barStartTick, stepTicks }) {
  const fill = getDrumFill(fillId);
  const halfTick = barStartTick + stepTicks * 8;
  const barEndTick = barStartTick + stepTicks * 16;
  const inBar = (note) => note.startTick >= barStartTick && note.startTick < barEndTick && DRUM_PITCHES.has(note.pitch);
  const hadDrums = notes.some(inBar);

  // 後半（step 8〜15）のKick / Snare / HHだけを取り除く。前半は残す
  const retained = notes.filter((note) => !(inBar(note) && note.startTick >= halfTick));

  const make = (part, step) => ({
    id: createNoteId(),
    pitch: PITCH[part],
    startTick: barStartTick + step * stepTicks,
    durationTick: stepTicks,
    velocity: VELOCITY[part]
  });
  const created = [];
  if (!hadDrums) {
    Object.entries(FIRST_HALF).forEach(([part, steps]) => steps.forEach((step) => created.push(make(part, step))));
  }
  Object.entries(fill.steps).forEach(([part, steps]) => steps.forEach((step) => created.push(make(part, step))));

  return [...retained, ...created].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

// 各Sectionの最後の小節（0始まり）の一覧。Sectionが無いときは空
export function sectionLastBars(ranges) {
  return ranges.map((range) => range.endBar - 1);
}

// 全Sectionの最後にフィルを入れる（曲の最後のSectionは締めなので除く）
export function applyDrumFillToSectionEnds(notes, { fillId, ranges, barTicks, stepTicks }) {
  let next = notes;
  sectionLastBars(ranges.slice(0, -1)).forEach((bar) => {
    next = applyDrumFill(next, { fillId, barStartTick: bar * barTicks, stepTicks });
  });
  return next;
}
