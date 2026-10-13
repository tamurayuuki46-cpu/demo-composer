// Section Variation: 「Aメロ2 = Aメロ1のコピー」で終わらず、少しだけ違う版を作る。
// 完全自動ではなく、3つの候補（ドラム / ベース / メロディ）から選んで、選んだSectionだけに当てる。
// Chord / Melody / Bass / Drumsをまたぐ操作なので、Section操作と同じくCoreのGlobal Operationとして置く。
// ProjectをUIにもAudioにも依存せずに読み書きする純粋関数。元のProjectは変更しない。

import { chordIntervals } from "./chord-qualities.js";
import { getSections, sectionRanges } from "./section-ops.js";

const KICK = 36;
const SNARE = 38;
const HH = 42;
const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const SECTION_VARIATIONS = Object.freeze([
  {
    id: "drums",
    label: "ドラムを少し増やす",
    description: "2・4…小節目にキックを1つ、1・3…小節目の終わりにハイハットを足す（Sectionの最後の小節はフィル用にそのまま）。"
  },
  {
    id: "bass",
    label: "ベースを少し動かす",
    description: "ベースがある小節の終わり近くに、5度を1音足す。Sectionの最後の小節は、オクターブ上を足して次へつなぐ。"
  },
  {
    id: "melody",
    label: "メロディの終わりを変える",
    description: "4小節ごとの区切りの最後の音だけを、近くのコードの音に差し替える。メロディの形は大きく変えない。"
  },
  {
    id: "melody-pitch",
    label: "メロディの音程だけ少し変える",
    description: "リズムはそのまま。各小節の2つ目・4つ目の音を、Keyの音階で1つ上（偶数小節）/ 下（奇数小節）へ。小節の1つ目の音は残るのでモチーフが保たれる。"
  },
  {
    id: "melody-rhythm",
    label: "メロディのリズムだけ変える",
    description: "音程はそのまま。各小節の2つ目・4つ目の音が拍の頭なら、8分だけ後ろへずらす（ひとつ先の音にぶつからない時だけ）。ノリが少し変わる。"
  }
]);

const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trackNotes(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

function setTrackNotes(project, role, notes) {
  const sorted = [...notes].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  const existing = project.tracks.find((track) => track.role === role);
  if (existing) existing.notes = sorted;
  else project.tracks.push({ role, notes: sorted });
}

// 1小節ぶんのBass / Melody（1音ずつ）に、重ならずに置けるか
function isFree(notes, startTick, durationTick) {
  return !notes.some((note) => note.startTick < startTick + durationTick && note.startTick + note.durationTick > startTick);
}

function bassRootPitch(project, bar) {
  const keyRoot = Math.max(0, KEY_NAMES.indexOf(project.basic.key));
  return 36 + (project.chords[bar]?.root ?? keyRoot);
}

function varyDrums(project, range, barTicks, stepTicks) {
  let drums = [...trackNotes(project, "drums")];
  let changed = 0;
  const has = (pitch, tick) => drums.some((note) => note.pitch === pitch && note.startTick === tick);
  const add = (pitch, tick, velocity) => {
    if (has(pitch, tick)) return;
    drums.push({ id: createId(), pitch, startTick: tick, durationTick: stepTicks, velocity });
    changed += 1;
  };

  for (let bar = range.startBar; bar < range.endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = drums.filter((note) => note.startTick >= barStart && note.startTick < barStart + barTicks);
    if (inBar.length === 0) continue; // ドラムが無い小節は触らない

    const index = bar - range.startBar;
    const isLastBar = bar === range.endBar - 1;
    if (isLastBar) continue; // 最後の小節はフィルなどに使うため、そのまま

    if (index % 2 === 1) {
      add(KICK, barStart + stepTicks * 10, 90);
    } else if (inBar.some((note) => note.pitch === HH)) {
      add(HH, barStart + stepTicks * 13, 72);
      add(HH, barStart + stepTicks * 15, 72);
    }
  }

  setTrackNotes(project, "drums", drums);
  return changed;
}

function varyBass(project, range, barTicks, stepTicks) {
  const bass = [...trackNotes(project, "bass")];
  let changed = 0;

  for (let bar = range.startBar; bar < range.endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = bass.filter((note) => note.startTick >= barStart && note.startTick < barStart + barTicks);
    if (inBar.length === 0) continue;

    const index = bar - range.startBar;
    const isLastBar = bar === range.endBar - 1;
    const chord = project.chords[bar];
    const fifth = chordIntervals(chord?.quality ?? "major")[2] ?? 7;
    const root = bassRootPitch(project, bar);

    let pitch = null;
    let step = 14;
    if (isLastBar) {
      pitch = root + 12;
      step = 12;
    } else if (index % 2 === 1) {
      pitch = root + fifth;
    }
    if (pitch === null || pitch > 127) continue;

    const startTick = barStart + stepTicks * step;
    const durationTick = Math.min(stepTicks * 2, barStart + barTicks - startTick);
    if (!isFree(bass, startTick, durationTick)) continue;
    bass.push({ id: createId(), pitch, startTick, durationTick, velocity: 96 });
    changed += 1;
  }

  setTrackNotes(project, "bass", bass);
  return changed;
}

function varyMelody(project, range, barTicks) {
  const melody = trackNotes(project, "melody").map((note) => ({ ...note }));
  let changed = 0;

  for (let bar = range.startBar; bar < range.endBar; bar += 1) {
    const index = bar - range.startBar;
    const isPhraseEnd = index % 4 === 3 || bar === range.endBar - 1;
    if (!isPhraseEnd) continue;

    const chord = project.chords[bar];
    if (!chord) continue;
    const barStart = bar * barTicks;
    const inBar = melody.filter((note) => note.startTick >= barStart && note.startTick < barStart + barTicks);
    if (inBar.length === 0) continue;

    const last = inBar.reduce((a, b) => (b.startTick > a.startTick ? b : a));
    const tones = chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);

    // 近いコードの音。元と違う高さのうち、近い順（同じ近さなら高い方）
    const candidates = [];
    for (let pitch = last.pitch - 5; pitch <= last.pitch + 5; pitch += 1) {
      if (pitch !== last.pitch && pitch >= 0 && pitch <= 127 && tones.includes(pitch % 12)) candidates.push(pitch);
    }
    candidates.sort((a, b) => Math.abs(a - last.pitch) - Math.abs(b - last.pitch) || b - a);
    if (candidates.length === 0) continue;

    last.pitch = candidates[0];
    changed += 1;
  }

  setTrackNotes(project, "melody", melody);
  return changed;
}

// 音程だけ: リズム（startTick / durationTick）は変えず、各小節の2つ目・4つ目の音を音階で1つ動かす。
// 小節の1つ目の音は残す（モチーフを保つ）。Keyの音階に無い音（半音の経過音など）は触らない。
function varyMelodyPitch(project, range, barTicks) {
  const melody = trackNotes(project, "melody").map((note) => ({ ...note }));
  const tonic = Math.max(0, KEY_NAMES.indexOf(project.basic.key));
  const scale = (SCALE_INTERVALS[project.basic.scale] ?? SCALE_INTERVALS.major).map((interval) => (tonic + interval) % 12);
  let changed = 0;

  for (let bar = range.startBar; bar < range.endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = melody
      .filter((note) => note.startTick >= barStart && note.startTick < barStart + barTicks)
      .sort((a, b) => a.startTick - b.startTick);
    const direction = (bar - range.startBar) % 2 === 0 ? 1 : -1;

    inBar.forEach((note, i) => {
      if (i % 2 === 0) return; // 1つ目・3つ目…はそのまま
      if (!scale.includes(note.pitch % 12)) return;
      let pitch = note.pitch + direction;
      while (pitch >= 0 && pitch <= 127 && !scale.includes(pitch % 12)) pitch += direction;
      if (pitch < 0 || pitch > 127) return;
      note.pitch = pitch;
      changed += 1;
    });
  }

  setTrackNotes(project, "melody", melody);
  return changed;
}

// リズムだけ: 音程と順番は変えず、各小節の2つ目・4つ目の音が拍の頭なら8分（2step）後ろへずらす。
// 次の音（または小節の終わり）に届かない場合だけ動かし、長さは収まる範囲に縮める。ずらした音は拍の頭でなくなるので、2回当てても動かない。
function varyMelodyRhythm(project, range, barTicks, stepTicks) {
  const melody = trackNotes(project, "melody").map((note) => ({ ...note }));
  const beatTicks = stepTicks * 4;
  const shift = stepTicks * 2;
  let changed = 0;

  for (let bar = range.startBar; bar < range.endBar; bar += 1) {
    const barStart = bar * barTicks;
    const barEnd = barStart + barTicks;
    const inBar = melody
      .filter((note) => note.startTick >= barStart && note.startTick < barEnd)
      .sort((a, b) => a.startTick - b.startTick);

    inBar.forEach((note, i) => {
      if (i % 2 === 0) return;
      if ((note.startTick - barStart) % beatTicks !== 0) return;
      const limit = Math.min(inBar[i + 1]?.startTick ?? barEnd, barEnd);
      const newStart = note.startTick + shift;
      if (newStart + stepTicks > limit) return; // 後ろに1step以上の長さを残せないときは動かさない
      note.startTick = newStart;
      note.durationTick = Math.min(note.durationTick, limit - newStart);
      changed += 1;
    });
  }

  setTrackNotes(project, "melody", melody);
  return changed;
}

// 指定Sectionに、候補の1つを当てる。{ project, changed } を返す（changed=0なら何も変わっていない）。
export function applySectionVariation(project, sectionIndex, variationId) {
  const sections = getSections(project);
  if (!Number.isInteger(sectionIndex) || !sections[sectionIndex]) throw new Error("Sectionが見つかりません。");
  if (!SECTION_VARIATIONS.some((item) => item.id === variationId)) throw new Error("バリエーションの種類が不正です。");

  const next = clone(project);
  const range = sectionRanges(getSections(next))[sectionIndex];
  const barTicks = next.basic.ppq * 4;
  const stepTicks = barTicks / 16;

  const changed = variationId === "drums" ? varyDrums(next, range, barTicks, stepTicks)
    : variationId === "bass" ? varyBass(next, range, barTicks, stepTicks)
      : variationId === "melody-pitch" ? varyMelodyPitch(next, range, barTicks)
        : variationId === "melody-rhythm" ? varyMelodyRhythm(next, range, barTicks, stepTicks)
          : varyMelody(next, range, barTicks);

  return { project: changed > 0 ? next : project, changed };
}
