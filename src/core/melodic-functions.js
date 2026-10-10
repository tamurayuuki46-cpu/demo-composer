// Melody Analyzer向けの「音の働き」分析。
// Projectを読むだけの派生分析で、Note / Chord / Schemaは変更しない。
// 自動判定は説明可能な保守的ルールだけに限定し、リック / リフのような文脈依存概念は学習ガイドとして扱う。

import { chordIntervals } from "./chord-qualities.js";

const STEP_MAX = 2;
const LEAP_MIN = 3;
const TENSION_INTERVALS = new Set([2, 5, 9]); // 9th / 11th / 13th相当（単純化）
const GUIDE_INTERVALS = new Set([3, 4, 10, 11]); // 3rd / 7th系

function degreeIndex(pitchClass, rootPitchClass) {
  return ((pitchClass - rootPitchClass) % 12 + 12) % 12;
}

function chordAt(project, tick, barTicks) {
  return project.chords[Math.floor(tick / barTicks)] ?? null;
}

function chordRole(note, chord) {
  if (!chord) return { chordTone: false, guideTone: false, tension: false };
  const relative = degreeIndex(note.pitch % 12, chord.root);
  const intervals = chordIntervals(chord.quality);
  const chordTone = intervals.includes(relative);
  return {
    chordTone,
    guideTone: chordTone && GUIDE_INTERVALS.has(relative),
    tension: !chordTone && TENSION_INTERVALS.has(relative)
  };
}

function signedStep(a, b) {
  return b.pitch - a.pitch;
}

function isStep(value) {
  const amount = Math.abs(value);
  return amount >= 1 && amount <= STEP_MAX;
}

function sameChord(project, notes, indices, barTicks) {
  const bars = indices.map((index) => Math.floor(notes[index].startTick / barTicks));
  return bars.every((bar) => bar === bars[0]) ? chordAt(project, notes[indices[0]].startTick, barTicks) : null;
}

function classifyInteriorNote(project, notes, index, barTicks) {
  if (index <= 0 || index >= notes.length - 1) return null;
  const prev = notes[index - 1];
  const note = notes[index];
  const next = notes[index + 1];
  const chord = sameChord(project, notes, [index - 1, index, index + 1], barTicks);
  if (!chord) return null;

  const prevRole = chordRole(prev, chord);
  const role = chordRole(note, chord);
  const nextRole = chordRole(next, chord);
  if (role.chordTone) return null;

  const into = signedStep(prev, note);
  const out = signedStep(note, next);

  // 刺繍音: 同じコードトーンから隣へ寄って戻る。
  if (prev.pitch === next.pitch && prevRole.chordTone && nextRole.chordTone && isStep(into) && isStep(out)) {
    return "neighbor";
  }

  // 経過音: 2つのコードトーンを同方向の順次進行でつなぐ。
  if (prevRole.chordTone && nextRole.chordTone && isStep(into) && isStep(out) && Math.sign(into) === Math.sign(out)) {
    return "passing";
  }

  // 倚音: 跳躍で非和声音へ入り、順次進行でコードトーンへ解決。
  if (Math.abs(into) >= LEAP_MIN && isStep(out) && nextRole.chordTone) {
    return "appoggiatura";
  }

  // 逸音: コードトーンから順次進行で外れ、反対方向へ跳躍して離れる。
  if (prevRole.chordTone && isStep(into) && Math.abs(out) >= LEAP_MIN && Math.sign(into) !== Math.sign(out)) {
    return "escape";
  }

  // アプローチノート: 次のコードトーンへ半音/全音で接近する非和声音。
  if (isStep(out) && nextRole.chordTone) return "approach";
  return null;
}

function countAnticipations(project, notes, barTicks) {
  const beatTicks = project.basic.ppq;
  return notes.filter((note) => {
    const bar = Math.floor(note.startTick / barTicks);
    const withinBar = note.startTick - bar * barTicks;
    if (withinBar < barTicks - beatTicks) return false;
    const current = project.chords[bar];
    const next = project.chords[bar + 1];
    if (!current || !next) return false;
    return !chordRole(note, current).chordTone && chordRole(note, next).chordTone;
  }).length;
}

function countSuspensions(project, notes, barTicks) {
  return notes.filter((note) => {
    const startBar = Math.floor(note.startTick / barTicks);
    const endTick = note.startTick + note.durationTick;
    const boundary = (startBar + 1) * barTicks;
    if (endTick <= boundary) return false;
    const current = project.chords[startBar];
    const next = project.chords[startBar + 1];
    if (!current || !next) return false;
    return chordRole(note, current).chordTone && !chordRole(note, next).chordTone;
  }).length;
}

export function analyzeMelodicFunctions(project, notes, barTicks) {
  let counted = 0;
  let chordTones = 0;
  let guideTones = 0;
  let tensions = 0;
  let otherNonChord = 0;

  notes.forEach((note) => {
    const chord = chordAt(project, note.startTick, barTicks);
    if (!chord) return;
    counted += 1;
    const role = chordRole(note, chord);
    if (role.chordTone) {
      chordTones += 1;
      if (role.guideTone) guideTones += 1;
    } else if (role.tension) {
      tensions += 1;
    } else {
      otherNonChord += 1;
    }
  });

  const functions = {
    passing: 0,
    neighbor: 0,
    approach: 0,
    appoggiatura: 0,
    escape: 0,
    anticipation: countAnticipations(project, notes, barTicks),
    suspension: countSuspensions(project, notes, barTicks)
  };

  notes.forEach((_, index) => {
    const kind = classifyInteriorNote(project, notes, index, barTicks);
    if (kind) functions[kind] += 1;
  });

  return {
    harmony: { counted, chordTones, guideTones, tensions, otherNonChord },
    functions
  };
}

function functionSummary(functions) {
  const items = [
    ["経過", functions.passing],
    ["刺繍", functions.neighbor],
    ["接近", functions.approach],
    ["倚音", functions.appoggiatura],
    ["逸音", functions.escape],
    ["先取", functions.anticipation],
    ["係留", functions.suspension]
  ].filter(([, count]) => count > 0);
  return items.length ? items.map(([label, count]) => `${label}${count}`).join("・") : "明確な型は未検出";
}

export function melodicFunctionRows(analysis) {
  if (!analysis) return [];
  const { harmony, functions } = analysis;
  const harmonyValue = harmony.counted
    ? `Guide ${harmony.guideTones}・Chord ${harmony.chordTones}・Tension ${harmony.tensions}・Other ${harmony.otherNonChord}`
    : "—";

  return [
    {
      id: "melodic-role-heading",
      label: "メロディの働き",
      value: "和声 + 非和声音",
      comment: "同じ音でも、コードとの関係と前後の動きで役割が変わります。自動判定は分かりやすい型だけを数えます。"
    },
    {
      id: "harmony-role",
      label: "和声での役割",
      value: harmonyValue,
      comment: harmony.counted
        ? "Guide=コードトーンの3rd/7th系。Tension=コード外の9th/11th/13th相当。Other=それ以外の非和声音。"
        : "コードを入れるとGuide Tone / Chord Tone / Tension / 非和声音の内訳を表示します。"
    },
    {
      id: "non-chord-function",
      label: "非和声音の使い方",
      value: functionSummary(functions),
      comment: "経過音・刺繍音・アプローチ・倚音・逸音・先取音・係留音を、前後関係が明確な場合だけ数えます。"
    },
    {
      id: "phrase-vocabulary",
      label: "フレーズ語彙",
      value: "モチーフ / リック / リフ / シーケンス",
      comment: "モチーフ=短い核、リック=使い回せる語彙、リフ=反復する特徴的パターン、シーケンス=高さを変えた反復。リック/リフは文脈依存なので自動判定しません。"
    }
  ];
}
