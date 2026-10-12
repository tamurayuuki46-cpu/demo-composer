// 4小節フレーズ生成（メインMelody）。
// 「型（起承転結）」「モチーフの展開」「コード変わり目への着地」「輪郭（上行 / 下降 / 平坦）」を組み合わせ、3つの型の候補を作る。
// 完全自動ではなく「聴く → 選ぶ → Piano Rollで直す」ための叩き台。ProjectをUIにもAudioにも依存せずに読む純粋関数で、元のProjectは変更しない。
// 保存先は通常の tracks[role=melody].notes[]（Schema変更なし）。

import { rootToPitchClass } from "../chord/chord-theory.js";
import { chordIntervals } from "../core/chord-qualities.js";

const SCALE_INTERVALS = Object.freeze({ major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] });
const STEPS = 8; // 1小節 = 8分音符 × 8
const WINDOW_SEMITONES = 19; // 下端から約1.5オクターブ
export const PHRASE_VARIATION_COUNT = 4;
export const PHRASE_BAR_CHOICES = Object.freeze([2, 4, 8]);

export const PHRASE_CONTOURS = Object.freeze([
  { id: "auto", label: "おまかせ", note: "候補ごとに、その型に合う形になります。" },
  { id: "rise", label: "上行", note: "だんだん高くなります。盛り上がり・前進感。" },
  { id: "fall", label: "下降", note: "だんだん低くなります。落ち着き・切なさ。" },
  { id: "flat", label: "平坦", note: "高さをあまり変えません。語りかけ・ささやき。" }
]);

// motif: { step, len, off }。off は、その小節の「基準の音」から何スケール音ぶん上下するか。
// 小節頭（step 0）は必ず off 0 ＝ コードトーンから始める。
const MOTIFS = Object.freeze([
  [{ step: 0, len: 2, off: 0 }, { step: 2, len: 1, off: 1 }, { step: 3, len: 1, off: 2 }, { step: 4, len: 3, off: 1 }, { step: 7, len: 1, off: 0 }],
  [{ step: 0, len: 1, off: 0 }, { step: 1, len: 1, off: 1 }, { step: 3, len: 1, off: 2 }, { step: 4, len: 2, off: 1 }, { step: 6, len: 1, off: 2 }, { step: 7, len: 1, off: 1 }],
  [{ step: 0, len: 3, off: 0 }, { step: 3, len: 1, off: -1 }, { step: 4, len: 2, off: 0 }, { step: 6, len: 2, off: 1 }],
  [{ step: 0, len: 2, off: 0 }, { step: 2, len: 2, off: -1 }, { step: 4, len: 1, off: -2 }, { step: 5, len: 1, off: -1 }, { step: 6, len: 2, off: 0 }]
]);
const DENSE_MOTIF = MOTIFS[1];

// 味付け（フレーバー）。plain=従来 / twoSix=2度・6度を多用 / dense=16分を含む高密度（YOASOBI系の“参考イメージ”。特定曲のコピーではない）
export const PHRASE_FLAVORS = Object.freeze([
  { id: "plain", label: "ふつう", note: "味付けなし。コードトーン中心の素直な形。" },
  { id: "twoSix", label: "2度・6度", note: "キーの2度と6度を、弱い拍で多く使います。浮遊感・ペンタ寄りの空気。小節頭と着地はコードトーンのまま。" },
  { id: "dense", label: "高密度", note: "16分を含む細かいリズム、同音連打 → 跳躍、拍の裏から入る先取り、後ろから2小節目で音域を上げる。※YOASOBI系のイメージ（特定曲のコピーではありません）" }
]);

// 盛り上がり（ArrangeのSection Energy）。音域・音数・強さを変える
export const PHRASE_ENERGIES = Object.freeze([
  { id: "low", label: "Low", note: "低めの音域で音数を減らし、やさしく。Aメロ・イントロ向き。", shift: -3, velocity: -10 },
  { id: "mid", label: "Mid", note: "ふつうの音域・音数。", shift: 0, velocity: 0 },
  { id: "high", label: "High", note: "高めの音域で強く。サビ向き。", shift: 4, velocity: 8 }
]);

// 16分(0.5step)を含む高密度モチーフ。小節頭は必ず off 0（コードトーン）
const DENSE_MOTIFS = Object.freeze([
  // 同音連打 → 跳躍 → 細かく下りて、また連打 → 駆け上がり
  [
    { step: 0, len: 0.5, off: 0 }, { step: 0.5, len: 0.5, off: 0 }, { step: 1, len: 0.5, off: 0 }, { step: 1.5, len: 1, off: 3 },
    { step: 2.5, len: 0.5, off: 2 }, { step: 3, len: 1, off: 1 }, { step: 4, len: 0.5, off: 2 }, { step: 4.5, len: 0.5, off: 2 },
    { step: 5, len: 0.5, off: 2 }, { step: 5.5, len: 0.5, off: 4 }, { step: 6, len: 1, off: 3 }, { step: 7, len: 1, off: 1 }
  ],
  // 先取り: 3.5 から入って次の強拍をまたぐ。スケール音で細かく上下
  [
    { step: 0, len: 1, off: 0 }, { step: 1, len: 0.5, off: 1 }, { step: 1.5, len: 0.5, off: 2 }, { step: 2, len: 0.5, off: 1 },
    { step: 2.5, len: 1, off: 3 }, { step: 3.5, len: 1, off: 2 }, { step: 4.5, len: 0.5, off: 1 }, { step: 5, len: 0.5, off: 2 },
    { step: 5.5, len: 0.5, off: 3 }, { step: 6, len: 0.5, off: 4 }, { step: 6.5, len: 0.5, off: 3 }, { step: 7, len: 1, off: 2 }
  ]
]);

export const PHRASE_FORMS = Object.freeze([
  { id: "motif", label: "モチーフ反復型", description: "短い音型を作り、高さをずらして繰り返す。最後はコードトーンで着地" },
  { id: "qa", label: "問いと答え型", description: "前半は“問い”で少し浮いたまま止まり、後半で答えて着地する" },
  { id: "peak", label: "ピーク型", description: "だんだん音数と高さが増え、後ろから2小節目で頂点、最後に着地する" }
]);

function positiveMod(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

// ---- 音の材料 ----

function scaleIntervalsOf(project, scaleIntervals) {
  if (Array.isArray(scaleIntervals) && scaleIntervals.length >= 5) return scaleIntervals;
  return SCALE_INTERVALS[project.basic.scale] ?? SCALE_INTERVALS.major;
}

// shift: 音域の窓を半音単位で上下にずらす（Energy用）
function scaleList(project, octave, scaleIntervals, shift = 0) {
  const tonic = rootToPitchClass(project.basic.key);
  const intervals = scaleIntervalsOf(project, scaleIntervals);
  const pcs = new Set(intervals.map((interval) => (tonic + interval) % 12));
  const lo = (octave + 1) * 12 + shift;
  const pitches = [];
  for (let pitch = lo; pitch <= lo + WINDOW_SEMITONES; pitch += 1) {
    if (pcs.has(pitch % 12)) pitches.push(pitch);
  }
  return { pitches, pcs, tonic };
}

// 小節ごとのコード情報。コードが無い小節は、Keyの主和音（1・3・5度）を使う
function barInfo(project, bar, scale, scaleIntervals) {
  const chord = project.chords[bar];
  const intervals = scaleIntervalsOf(project, scaleIntervals);
  const fallback = [0, intervals[2] ?? 4, intervals[4] ?? 7].map((interval) => (scale.tonic + interval) % 12);
  const chordPcs = chord
    ? new Set(chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12))
    : new Set(fallback);
  const root = chord ? chord.root : scale.tonic;
  return { chordPcs, root, hasChord: Boolean(chord) };
}

function isChordTone(scale, index, info) {
  return info.chordPcs.has(scale.pitches[index] % 12);
}

// 指定位置の近くにあるコードトーン（同じ距離なら下を優先。prefer: 1 のときは上を優先）
function nearestChordTone(scale, target, info, { maxDistance = 6, prefer = -1 } = {}) {
  const last = scale.pitches.length - 1;
  const start = clamp(target, 0, last);
  for (let distance = 0; distance <= maxDistance; distance += 1) {
    for (const index of [start + prefer * distance, start - prefer * distance]) {
      if (index >= 0 && index <= last && isChordTone(scale, index, info)) return index;
    }
  }
  return start;
}

// 強拍・長い音は、近くのコードトーンへ寄せる（2スケール音以内にあれば）
function snapStrong(scale, index, info) {
  const last = scale.pitches.length - 1;
  for (const delta of [0, 1, -1, 2, -2]) {
    const candidate = index + delta;
    if (candidate >= 0 && candidate <= last && isChordTone(scale, candidate, info)) return candidate;
  }
  return clamp(index, 0, last);
}

// 浮かせる音（“問い”の終わり）: コードトーンでなく、コードトーンの半音上でもない（アボイドでない）スケール音
function suspendedTone(scale, near, info) {
  const last = scale.pitches.length - 1;
  for (const delta of [1, -1, 2, -2, 0]) {
    const index = near + delta;
    if (index < 0 || index > last) continue;
    const pc = scale.pitches[index] % 12;
    const avoid = info.chordPcs.has((pc + 11) % 12);
    if (!info.chordPcs.has(pc) && !avoid) return index;
  }
  return clamp(near, 0, last);
}

// ---- 型・輪郭 ----

function roleSequence(form, bars) {
  if (bars <= 1) return ["land"];
  if (bars === 2) return ["state", "land"];
  const roles = ["state"];
  for (let bar = 1; bar < bars - 1; bar += 1) {
    const fromEnd = bars - 1 - bar; // 1 = 最後の1つ前
    if (form === "qa") roles.push(bar === Math.floor(bars / 2) - 1 ? "question" : (fromEnd === 1 ? "develop" : "repeat"));
    else if (form === "peak") roles.push(fromEnd === 1 ? "peak" : "repeat");
    else roles.push(fromEnd === 1 ? "develop" : "repeat");
  }
  roles.push("land");
  return roles;
}

// 小節の基準位置（スケール音の個数）。contour は rise / fall / flat / auto
function trendFor(contour, form, bar, bars) {
  const t = bars > 1 ? bar / (bars - 1) : 0;
  if (contour === "rise") return Math.round(6 * t);
  if (contour === "fall") return Math.round(6 * (1 - t));
  if (contour === "flat") return 0;
  if (form === "qa") return Math.round(3 * Math.sin(Math.PI * Math.min(1, t * 1.15)));
  if (form === "peak") return bar <= bars - 2 ? Math.round((4 * bar) / Math.max(1, bars - 2)) : 1;
  return Math.round(2 * t);
}

// ---- 1候補 ----

function buildCandidate(project, { form, startBar, bars, contour, variation, octave, flavor = "plain", scaleIntervals = null, energy = "mid" }) {
  const energyInfo = PHRASE_ENERGIES.find((item) => item.id === energy) ?? PHRASE_ENERGIES[1];
  const scale = scaleList(project, octave, scaleIntervals, energyInfo.shift);
  const intervalsUsed = scaleIntervalsOf(project, scaleIntervals);
  // 2度・6度: キーの2度と6度のpitch class（無いスケールは近い度数）
  const favorPcs = new Set([
    (scale.tonic + (intervalsUsed.includes(2) ? 2 : intervalsUsed[1])) % 12,
    (scale.tonic + (intervalsUsed[5] ?? intervalsUsed[intervalsUsed.length - 1])) % 12
  ]);
  const barTicks = project.basic.ppq * 4;
  const stepTicks = barTicks / STEPS;
  const last = scale.pitches.length - 1;
  const roles = roleSequence(form, bars);
  const infos = Array.from({ length: bars }, (_, offset) => barInfo(project, startBar + offset, scale, scaleIntervals));

  // 基準位置: 1小節目のコードトーンで、音域の中ほど
  const center = scale.pitches.findIndex((pitch) => pitch >= scale.pitches[0] + 7);
  const base = nearestChordTone(scale, center, infos[0], { prefer: energyInfo.shift > 0 ? 1 : -1 });
  const motifIndex = positiveMod(variation + (form === "qa" ? 1 : form === "peak" ? 2 : 0), MOTIFS.length);

  // 各小節の基準位置（アンカー）は強拍のコードトーン
  const anchors = [];
  const direction = contour === "rise" ? 1 : contour === "fall" ? -1 : 0;
  infos.forEach((info, offset) => {
    // 高密度: 後ろから2小節目で音域を上げる（サビ前の持ち上げ）
    const lift = flavor === "dense" && bars >= 3 && offset === bars - 2 ? 2 : 0;
    const target = clamp(base + trendFor(contour, form, offset, bars) + lift, 0, last - 2);
    const previous = anchors[offset - 1];
    // コードトーンの中で目標にいちばん近いもの。上行 / 下降は、前の小節より必ず先へ進める（余地が無いときだけ同じ高さ）
    const allowed = [];
    for (let index = 0; index <= last - 2; index += 1) {
      if (isChordTone(scale, index, info)) allowed.push(index);
    }
    const forward = previous === undefined || direction === 0
      ? allowed
      : allowed.filter((index) => (index - previous) * direction > 0);
    const pool = forward.length > 0 ? forward : allowed;
    let best = pool[0] ?? clamp(target, 0, last);
    pool.forEach((index) => {
      if (Math.abs(index - target) < Math.abs(best - target)) best = index;
    });
    anchors.push(best);
  });

  const notes = [];
  roles.forEach((role, offset) => {
    const info = infos[offset];
    const nextInfo = infos[offset + 1];
    const anchor = anchors[offset];
    const barStart = (startBar + offset) * barTicks;
    const motif = flavor === "dense"
      ? DENSE_MOTIFS[role === "peak" ? 1 : positiveMod(variation, DENSE_MOTIFS.length)]
      : (role === "peak" ? DENSE_MOTIF : MOTIFS[motifIndex]);
    let shape;

    if (role === "land") {
      shape = motif.filter((item) => item.step < 4).slice(0, 3).map((item) => ({ ...item }));
    } else if (role === "develop") {
      shape = motif.slice(0, 3).map((item) => ({ ...item }));
      const tail = shape[shape.length - 1];
      tail.len = STEPS - tail.step > 4 ? 4 : STEPS - tail.step;
    } else {
      shape = motif.map((item) => ({ ...item }));
    }

    const placed = shape.map((item, index) => {
      let idx = item.fixed ?? clamp(anchor + item.off, 0, last);
      const strong = item.step === 0 || item.step === 4 || item.len >= 3;
      if (strong && item.fixed === undefined) idx = snapStrong(scale, idx, info);
      // 2度・6度: 弱い拍の音は、近くの2度 / 6度の音へ寄せる（小節頭・長い音はコードトーンのまま）
      if (flavor === "twoSix" && !strong && item.fixed === undefined) {
        for (const delta of [0, 1, -1, 2, -2]) {
          const candidate = idx + delta;
          if (candidate >= 0 && candidate <= last && favorPcs.has(scale.pitches[candidate] % 12)) { idx = candidate; break; }
        }
      }
      return { ...item, idx, index };
    });

    // Low: 弱い拍の短い音を1つおきに抜いて、音数を減らす（小節頭・長い音・小節の最後の音は残す）
    if (energyInfo.id === "low" && role !== "land") {
      let weak = 0;
      const thinned = placed.filter((item, index) => {
        if (item.step === 0 || item.len >= 2 || index === placed.length - 1) return true;
        weak += 1;
        return weak % 2 === 0;
      });
      placed.length = 0;
      placed.push(...thinned);
    }

    // 着地: 直前の音から段差が小さいコードトーン（少し下がって落ち着く向き）へ。最後は長く置く
    if (role === "land") {
      const previousIdx = placed.length > 0 ? placed[placed.length - 1].idx : anchor;
      const landing = nearestChordTone(scale, previousIdx - 1, info);
      placed.push({ step: 4, len: 4, off: 0, idx: landing, index: placed.length });
    }

    // 小節の最後の音: 次のコードへの“つなぎ”。問いは浮かせたまま、それ以外は次の基準音の隣へ
    const tail = placed[placed.length - 1];
    if (role !== "land" && tail.step >= 5 && tail.len <= 2) {
      if (role === "question") {
        tail.idx = suspendedTone(scale, tail.idx, info);
      } else if (offset + 1 < bars) {
        const nextAnchor = anchors[offset + 1];
        tail.idx = clamp(nextAnchor + (nextAnchor >= tail.idx ? -1 : 1), 0, last);
      }
    }

    placed.forEach((item) => {
      const startTick = barStart + item.step * stepTicks;
      const durationTick = Math.min(item.len, STEPS - item.step) * stepTicks;
      notes.push({
        id: createId(),
        pitch: scale.pitches[item.idx],
        startTick,
        durationTick,
        velocity: clamp((item.step === 0 ? 104 : (flavor === "dense" && item.step % 1 !== 0 ? 88 : role === "peak" ? 102 : 94)) + energyInfo.velocity, 1, 127)
      });
    });
  });

  notes.sort((a, b) => a.startTick - b.startTick);
  return {
    notes,
    anchors: anchors.map((index) => scale.pitches[index]),
    roles
  };
}

// 「その範囲に、フレーズを作れるか」: コードが1つも無ければ作れない
export function phraseRange(project, startBar, bars) {
  const available = project.chords.length;
  if (available <= 0) return null;
  const start = clamp(Math.trunc(startBar), 0, available - 1);
  const end = Math.min(available, start + Math.max(1, Math.trunc(bars)));
  return { startBar: start, endBar: end, bars: end - start };
}

export function phraseCandidates(project, { startBar = 0, bars = 4, contour = "auto", variation = 0, octave = 4, flavor = "plain", scaleIntervals = null, energy = "mid" } = {}) {
  const range = phraseRange(project, startBar, bars);
  if (!range) return [];
  const variationIndex = positiveMod(Math.trunc(variation), PHRASE_VARIATION_COUNT);
  const contourId = PHRASE_CONTOURS.some((item) => item.id === contour) ? contour : "auto";

  return PHRASE_FORMS.map((form) => {
    const built = buildCandidate(project, {
      form: form.id,
      startBar: range.startBar,
      bars: range.bars,
      contour: contourId,
      variation: variationIndex,
      octave,
      flavor: PHRASE_FLAVORS.some((item) => item.id === flavor) ? flavor : "plain",
      scaleIntervals,
      energy
    });
    return {
      id: form.id,
      label: form.label,
      description: form.description,
      startBar: range.startBar,
      endBar: range.endBar,
      contour: contourId,
      ...built
    };
  });
}

// 範囲内のMelodyだけを置き換えたノート配列（他の小節は保持）
export function applyPhraseNotes(existingNotes, startBar, endBar, notes, { barTicks }) {
  const startTick = startBar * barTicks;
  const endTick = endBar * barTicks;
  const kept = existingNotes.filter((note) => note.startTick < startTick || note.startTick >= endTick);
  return [...kept, ...clone(notes)].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

// 試聴用: Melodyだけを置き換えたProjectの複製（元のProjectは変更しない）
export function withPhraseNotes(project, startBar, endBar, notes) {
  const barTicks = project.basic.ppq * 4;
  const next = clone(project);
  const track = next.tracks.find((item) => item.role === "melody");
  if (track) track.notes = applyPhraseNotes(track.notes ?? [], startBar, endBar, notes, { barTicks });
  return next;
}

// 範囲内にいまのMelodyが何音あるか（置き換わる音の数の案内用）
export function melodyNoteCountIn(project, startBar, endBar) {
  const barTicks = project.basic.ppq * 4;
  const notes = project.tracks.find((track) => track.role === "melody")?.notes ?? [];
  return notes.filter((note) => note.startTick >= startBar * barTicks && note.startTick < endBar * barTicks).length;
}

// 8分×小節数の見た目: ● = 8分の頭から始まる音、○ = 8分の裏（16分位置）から始まる音、・ = 始まりなし
export function phraseDots(candidate) {
  const barTicks = 1920;
  const stepTicks = barTicks / STEPS;
  const bars = candidate.endBar - candidate.startBar;
  const onBeat = new Set();
  const offBeat = new Set();
  candidate.notes.forEach((note) => {
    const position = (note.startTick - candidate.startBar * barTicks) / stepTicks;
    if (Number.isInteger(position)) onBeat.add(position);
    else offBeat.add(Math.floor(position));
  });
  return Array.from({ length: bars }, (_, bar) => (
    Array.from({ length: STEPS }, (_, step) => {
      const cell = bar * STEPS + step;
      return onBeat.has(cell) ? "●" : offBeat.has(cell) ? "○" : "・";
    }).join("")
  ));
}
