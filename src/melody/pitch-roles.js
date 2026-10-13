import { chordIntervals } from "../core/chord-qualities.js";
import { rootToPitchClass } from "../chord/chord-theory.js";

// Melody画面の色分け用。1小節ぶんの「どの音名（ピッチクラス）が、どの役割か」を返す純粋関数。
// Projectは読むだけで、保存しない（見た目のみ・Schema変更なし）。
//
//   chord   : そのコードの構成音（1・3・5・7相当）   → 青
//   tension : 9・11・13相当（ルートから2 / 5 / 9半音）で、構成音でないもの → 緑
//   outside : 選択Scale（Key + Major / Minor）の7音に入っていない音   → 黄（鍵盤側に印）
//   avoid   : 構成音でなく、構成音の半音上にあるScale内の音（アボイドノート）→ 赤く光る
//
// 色が重なるとき: avoid > chord > tension > outside。ただし outside はコードの構成音でも鍵盤側の黄の印で残す。

const SCALE_INTERVALS = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
});
const TENSION_SEMITONES = Object.freeze([2, 5, 9]);

export function scalePitchClassSet(key, scale) {
  const tonic = rootToPitchClass(key);
  const intervals = SCALE_INTERVALS[scale] ?? SCALE_INTERVALS.major;
  return new Set(intervals.map((interval) => (tonic + interval) % 12));
}

// 戻り値: 長さ12の配列。要素は { tone: "chord"|"tension"|null, outside: boolean, avoid: boolean }
export function pitchClassRoles({ key, scale, chord }) {
  const scalePcs = scalePitchClassSet(key, scale);
  const chordPcs = chord
    ? new Set(chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12))
    : new Set();
  const tensionPcs = chord
    ? new Set(TENSION_SEMITONES.map((semitones) => (chord.root + semitones) % 12))
    : new Set();

  return Array.from({ length: 12 }, (_, pc) => {
    const isChord = chordPcs.has(pc);
    const outside = !scalePcs.has(pc);
    const avoid = Boolean(chord) && !isChord && !outside && chordPcs.has((pc + 11) % 12);
    let tone = null;
    if (isChord) tone = "chord";
    else if (tensionPcs.has(pc)) tone = "tension";
    return { tone: avoid ? null : tone, outside, avoid };
  });
}

export const PITCH_ROLE_LABELS = Object.freeze({
  chord: "コード構成音",
  tension: "テンション",
  outside: "スケール外",
  avoid: "アボイド"
});

// 画面読み上げ・aria-label用の短い文字列（無ければ空）
export function pitchRoleText(role) {
  if (role.avoid) return PITCH_ROLE_LABELS.avoid;
  const parts = [];
  if (role.tone) parts.push(PITCH_ROLE_LABELS[role.tone]);
  if (role.outside) parts.push(PITCH_ROLE_LABELS.outside);
  return parts.join("・");
}
