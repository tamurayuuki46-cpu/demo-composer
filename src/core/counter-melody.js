// Counter Melody（裏メロ）: メインMelodyを邪魔しない範囲で、役割の違う4系統の候補を作る。
// 完全自動ではなく「候補を聴く → 選ぶ → 必要なら別候補にする / 消す」。選んだSectionだけに当てる。
// 保存先は tracks[] の role:"counter"（Schema追記のみ。無い古いProjectはそのまま有効）。
// ProjectをUIにもAudioにも依存せずに読む純粋関数。元のProjectは変更しない。

import { chordIntervals } from "./chord-qualities.js";

export const COUNTER_ROLE = "counter";
const STEP = 240; // 8分音符
const LOW = 48;
const HIGH = 76;
const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const COUNTER_STYLES = Object.freeze([
  {
    id: "sparse",
    label: "Sparse（隙間型）",
    description: "休符の隙間に短い返事を入れる。音数は少なめで、主旋律を立てる。※イメージ：米津系（特定曲のコピーではありません）"
  },
  {
    id: "active",
    label: "Active（動く型）",
    description: "8分音符中心で下側を動き、①コードトーン型 → ②テンション型 → ③薄い別コード感型を混ぜて色を足す。※イメージ：YOASOBI / Ayase系（特定曲のコピーではありません）"
  },
  {
    id: "hook",
    label: "Hook（フック型）",
    description: "少ない音の覚えやすい型を繰り返し、もう1つの歌えるフックを作る。※イメージ：Oasis系（特定曲のコピーではありません）"
  },
  {
    id: "answer",
    label: "Answer（応答型）",
    description: "主旋律の語尾や小節後半に、3度・7度などコードの色が出る音で少し長めの返しを置く。※イメージ：Mr.Children系（特定曲のコピーではありません）"
  },
  {
    id: "arpeggio",
    label: "Arpeggio（分散和音型）",
    description: "コードの構成音を8分で上下に流す、ピアノ風の細かい動き。主旋律が鳴っている間は音数を減らし、止まると走り出し、小節の終わりで次のコードへつなぐ。※イメージ：ピアノが走るYOASOBI / Ayase系（特定曲のコピーではありません）"
  },
  {
    id: "riff",
    label: "Riff（ギターリフ型）",
    description: "低めの音域で、ルート・5度中心の短いリフを繰り返す。コードが変わっても形を保ち、4小節目に駆け上がる。※イメージ：ギターバンド系 / Oasis系（特定曲のコピーではありません）"
  },
  {
    id: "pentaMinor",
    label: "Minor Penta Hook（マイナーペンタ）",
    description: "Keyのマイナーペンタ（ド・ミ♭・ファ・ソ・シ♭）だけで作る、ブルージーで歌えるフック。2小節で型を繰り返し、3小節目で少し変化、4小節目でコードトーンに着地する。メジャーKeyの上では少しブルース寄りの色になる。※イメージ：ロック / ギターバンド系（特定曲のコピーではありません）"
  },
  {
    id: "pentaMajor",
    label: "Major Penta Hook（メジャーペンタ）",
    description: "Keyのメジャーペンタ（ド・レ・ミ・ソ・ラ）だけで作る、明るく素直なフック。半音のぶつかりがなく、どのコードの上でも歌いやすい。2小節で型を繰り返し、3小節目で上へ、4小節目でコードトーンに着地する。※イメージ：爽やかなバンド / J-POP系（特定曲のコピーではありません）"
  }
]);

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function barTicksOf(project) {
  return project.basic.ppq * 4;
}

export function counterNotes(project) {
  return project.tracks.find((track) => track.role === COUNTER_ROLE)?.notes ?? [];
}

export function hasCounter(project) {
  return counterNotes(project).length > 0;
}

function notesIn(notes, startTick, endTick) {
  return notes.filter((note) => note.startTick >= startTick && note.startTick < endTick);
}

function overlappingNotes(notes, startTick, endTick) {
  return notes.filter((note) => note.startTick < endTick && note.startTick + note.durationTick > startTick);
}

function keyPitchClass(project) {
  return Math.max(0, KEY_NAMES.indexOf(project.basic.key));
}

function scalePitchClasses(project) {
  const tonic = keyPitchClass(project);
  return (SCALE_INTERVALS[project.basic.scale] ?? SCALE_INTERVALS.major).map((interval) => (tonic + interval) % 12);
}

// この小節のコードの構成音（pitch class）。コードが無い小節はKeyの主和音を使う
function chordPitchClasses(project, bar) {
  const chord = project.chords[bar];
  if (chord) return chordIntervals(chord.quality).map((interval) => (chord.root + interval) % 12);
  const tonic = keyPitchClass(project);
  const third = project.basic.scale === "minor" ? 3 : 4;
  return [tonic, (tonic + third) % 12, (tonic + 7) % 12];
}

// ルート以外のコード構成音。3度・7度など、コードの明暗や色が出やすい音を優先する。
function chordColorPitchClasses(project, bar) {
  const chord = project.chords[bar];
  const pcs = chordPitchClasses(project, bar);
  if (!chord) return pcs.slice(1).length > 0 ? pcs.slice(1) : pcs;
  const root = chord.root % 12;
  const colors = pcs.filter((pc) => pc !== root);
  return colors.length > 0 ? colors : pcs;
}

// コード構成音以外のKey内音。9th / 11th / 13thなどの「色」に使う。
function tensionPitchClasses(project, bar) {
  const scale = scalePitchClasses(project);
  const chord = chordPitchClasses(project, bar);
  const tensions = scale.filter((pc) => !chord.includes(pc));
  return tensions.length > 0 ? tensions : scale;
}

// 現在コードの3度上のScale Degreeから作る3音を「薄い別コード感」として使う。
// 例: C Major上のCでは E-G-B となり、土台Cを変えずにEm系の輪郭を薄く重ねられる。
function upperStructurePitchClasses(project, bar) {
  const scale = scalePitchClasses(project);
  const chord = project.chords[bar];
  if (!chord) return scale;
  const rootIndex = scale.indexOf(chord.root % 12);
  if (rootIndex === -1) return chordPitchClasses(project, bar);
  const upperRoot = (rootIndex + 2) % scale.length;
  return [0, 2, 4].map((offset) => scale[(upperRoot + offset) % scale.length]);
}

// 8分(240tick)8マスの使用状況。メロディが鳴っているマスは true
function occupiedSteps(melody, barStart, barTicks) {
  const steps = new Array(barTicks / STEP).fill(false);
  melody.forEach((note) => {
    const from = Math.max(0, Math.floor((note.startTick - barStart) / STEP));
    const to = Math.min(steps.length, Math.ceil((note.startTick + note.durationTick - barStart) / STEP));
    for (let step = from; step < to; step += 1) steps[step] = true;
  });
  return steps;
}

function freeRuns(steps) {
  const runs = [];
  let start = null;
  steps.forEach((taken, step) => {
    if (!taken && start === null) start = step;
    if ((taken || step === steps.length - 1) && start !== null) {
      const end = taken ? step : step + 1;
      runs.push({ start, length: end - start });
      start = null;
    }
  });
  return runs;
}

// 候補の音を選ぶ。目標の高さに近い許可音のうち、同時に鳴るメロディとぶつかりにくいものを選ぶ
function pickPitch({ pcs, target, overlapping, previous }) {
  let best = null;
  for (let pitch = LOW; pitch <= HIGH; pitch += 1) {
    if (!pcs.includes(pitch % 12)) continue;
    let score = Math.abs(pitch - target);
    overlapping.forEach((note) => {
      const distance = Math.abs(pitch - note.pitch) % 12;
      if (distance === 1 || distance === 11) score += 20;
      else if (distance === 0) score += 6;
      else if (distance === 6) score += 8;
      if (pitch > note.pitch - 2) score += 10; // できるだけメロディより下に置く
    });
    if (previous !== null && previous !== undefined) score += Math.abs(pitch - previous) * 0.4;
    if (best === null || score < best.score) best = { pitch, score };
  }
  return best ? best.pitch : null;
}

// 音階の中で pitch から degrees だけ下へ
function scaleStepDown(pitch, degrees, scale) {
  let current = pitch;
  let remaining = degrees;
  while (remaining > 0 && current > 0) {
    current -= 1;
    if (scale.includes(current % 12)) remaining -= 1;
  }
  return current;
}

// 音階の中で pitch から degrees だけ上へ
function scaleStepUp(pitch, degrees, scale) {
  let current = pitch;
  let remaining = degrees;
  while (remaining > 0 && current < 127) {
    current += 1;
    if (scale.includes(current % 12)) remaining -= 1;
  }
  return current;
}

function makeNote(pitch, startTick, durationTick, velocity) {
  return { id: createId(), pitch, startTick, durationTick, velocity };
}

function averageMelodyPitch(melody) {
  if (melody.length === 0) return 66;
  return melody.reduce((sum, note) => sum + note.pitch, 0) / melody.length;
}

// Sparse: メロディの隙間だけに短い「返事」を置く。詰まっている小節は休む。
function buildSparse(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 8;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const occupied = inBar.length === 0
      ? [true, true, true, true, false, false, false, false]
      : occupiedSteps(inBar, barStart, barTicks);
    const runs = freeRuns(occupied).filter((run) => run.length >= 2);
    if (runs.length === 0) continue;

    const run = runs.reduce((best, item) => (item.length >= best.length ? item : best));
    const runStart = barStart + run.start * STEP;
    const overlap = overlappingNotes(inBar, runStart, runStart + Math.min(run.length, 3) * STEP);
    const pitch = pickPitch({ pcs: chordPitchClasses(project, bar), target, overlapping: overlap, previous });
    if (pitch === null) continue;

    if (run.length >= 3) {
      const answer = scaleStepDown(pitch, 1, scale);
      notes.push(
        makeNote(pitch, runStart, STEP, 66),
        makeNote(answer, runStart + STEP, STEP * 2, 60)
      );
      previous = answer;
    } else {
      notes.push(makeNote(pitch, runStart, STEP * 2, 64));
      previous = pitch;
    }
  }
  return notes;
}

// Active: 8分音符中心。強拍はコードトーン、間にテンションと「薄い別コード感」を混ぜて推進力を出す。
function buildActive(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 10;
  const notes = [];
  let previous = null;
  const positions = [0, 1, 2, 4, 5, 6]; // 4拍すべてを埋めず、息継ぎを残す
  const targetMoves = [0, 2, 4, 2, -1, 1];

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const chordPcs = chordPitchClasses(project, bar);
    const tensionPcs = tensionPitchClasses(project, bar);
    const upperPcs = upperStructurePitchClasses(project, bar);
    const anchor = pickPitch({ pcs: chordPcs, target, overlapping: inBar, previous });
    if (anchor === null) continue;

    // ①Chord Tone → ②Tension → ③Upper Structure を2回まわす。
    // 土台コードは変えず、主旋律とは違う度数を使って「薄い第二のハーモニー」を作る。
    const palettes = [chordPcs, tensionPcs, upperPcs, chordPcs, tensionPcs, upperPcs];

    positions.forEach((step, index) => {
      const startTick = barStart + step * STEP;
      const endTick = startTick + STEP;
      const overlap = overlappingNotes(inBar, startTick, endTick);
      const move = targetMoves[index];
      const desired = move >= 0
        ? scaleStepUp(anchor, Math.round(move / 2), scale)
        : scaleStepDown(anchor, Math.abs(move), scale);
      const pitch = pickPitch({ pcs: palettes[index], target: desired, overlapping: overlap, previous });
      if (pitch === null) return;
      notes.push(makeNote(pitch, startTick, STEP, index === 0 || index === 3 ? 65 : 58));
      previous = pitch;
    });
  }
  return notes;
}

// Hook: 各小節で同じ3音の輪郭を繰り返す。コードが変わっても「上がって戻る」形は維持する。
function buildHook(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 9;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const chordPcs = chordPitchClasses(project, bar);
    const anchor = pickPitch({ pcs: chordPcs, target, overlapping: inBar, previous });
    if (anchor === null) continue;

    const upperTarget = scaleStepUp(anchor, 2, scale);
    const first = pickPitch({
      pcs: chordPcs,
      target: anchor,
      overlapping: overlappingNotes(inBar, barStart, barStart + STEP * 2),
      previous
    });
    const second = pickPitch({
      pcs: scale,
      target: upperTarget,
      overlapping: overlappingNotes(inBar, barStart + STEP * 2, barStart + STEP * 4),
      previous: first
    });
    const third = pickPitch({
      pcs: chordPcs,
      target: anchor,
      overlapping: overlappingNotes(inBar, barStart + STEP * 4, barStart + STEP * 8),
      previous: second
    });
    if (first === null || second === null || third === null) continue;

    notes.push(
      makeNote(first, barStart, STEP * 2, 64),
      makeNote(second, barStart + STEP * 2, STEP * 2, 60),
      makeNote(third, barStart + STEP * 4, STEP * 4, 63)
    );
    previous = third;
  }
  return notes;
}

// Answer: 主旋律が言い切った後の隙間を優先し、コードの色が出る音で少し長めに返す。
// Sparseより音価を長くし、短い装飾ではなく「歌に答えるもう1フレーズ」の感覚を作る。
function buildAnswer(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const target = averageMelodyPitch(melody) - 7;
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const occupied = inBar.length === 0
      ? [true, true, true, true, false, false, false, false]
      : occupiedSteps(inBar, barStart, barTicks);
    const runs = freeRuns(occupied).filter((run) => run.length >= 2);
    if (runs.length === 0) continue;

    // 「語尾への返答」に寄せるため、最も後ろまで伸びる隙間を優先する。
    const run = runs.reduce((best, item) => {
      const bestEnd = best.start + best.length;
      const itemEnd = item.start + item.length;
      if (itemEnd !== bestEnd) return itemEnd > bestEnd ? item : best;
      return item.length > best.length ? item : best;
    });
    const runStart = barStart + run.start * STEP;
    const usableSteps = Math.min(run.length, 4);
    const colorPcs = chordColorPitchClasses(project, bar);
    const first = pickPitch({
      pcs: colorPcs,
      target,
      overlapping: overlappingNotes(inBar, runStart, runStart + usableSteps * STEP),
      previous
    });
    if (first === null) continue;

    if (usableSteps >= 4) {
      const directionTarget = bar % 2 === 0 ? scaleStepUp(first, 1, scale) : scaleStepDown(first, 1, scale);
      const second = pickPitch({
        pcs: chordPitchClasses(project, bar),
        target: directionTarget,
        overlapping: overlappingNotes(inBar, runStart + STEP * 2, runStart + STEP * 4),
        previous: first
      });
      if (second === null) continue;
      notes.push(
        makeNote(first, runStart, STEP * 2, 62),
        makeNote(second, runStart + STEP * 2, STEP * 2, 58)
      );
      previous = second;
    } else {
      notes.push(makeNote(first, runStart, usableSteps * STEP, 61));
      previous = first;
    }
  }
  return notes;
}

// Arpeggio: コードの構成音を、メインメロディの下の音域で8分の上下に流す（ピアノ風）。
// メロディが鳴っているマスは1つおきに休み、半音でぶつかる音は休む。小節の最後は次のコードの構成音へつなぐ。
function buildArpeggio(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const target = averageMelodyPitch(melody) - 9;
  const notes = [];

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const inBar = notesIn(melody, barStart, barStart + barTicks);
    const occupied = occupiedSteps(inBar, barStart, barTicks);
    const chordPcs = chordPitchClasses(project, bar);

    let tones = [];
    for (let widen = 0; widen <= 10 && tones.length < 3; widen += 5) {
      tones = [];
      for (let pitch = Math.max(LOW, target - 12 - widen); pitch <= Math.min(HIGH, target + 3 + widen); pitch += 1) {
        if (chordPcs.includes(pitch % 12)) tones.push(pitch);
      }
    }
    if (tones.length < 2) continue;

    // 上下に往復する並び
    const order = [];
    let index = 0;
    let direction = 1;
    for (let step = 0; step < 8; step += 1) {
      order.push(index);
      if (index + direction >= tones.length || index + direction < 0) direction *= -1;
      index += direction;
    }

    for (let step = 0; step < 8; step += 1) {
      const startTick = barStart + step * STEP;
      // メロディがこのマスから始まる裏拍は休み、リズムを重ねすぎない
      if (step % 2 === 1 && inBar.some((note) => note.startTick === startTick)) continue;
      let pitch = tones[order[step]];

      if (step === 7 && project.chords[bar + 1] && bar + 1 < endBar) {
        const next = pickPitch({ pcs: chordPitchClasses(project, bar + 1), target: pitch, overlapping: [], previous: null });
        if (next !== null) pitch = next;
      }

      const clash = overlappingNotes(inBar, startTick, startTick + STEP).some((note) => {
        const distance = Math.abs(pitch - note.pitch) % 12;
        return distance === 1 || distance === 11 || pitch > note.pitch - 3;
      });
      if (clash) continue;
      const under = occupied[step] ? 8 : 0; // メロディが鳴っている間は、少し小さく
      notes.push(makeNote(pitch, startTick, Math.round(STEP * 0.92), (step === 0 ? 60 : (step % 2 === 0 ? 52 : 46)) - under));
    }
  }
  return notes;
}

// Riff: 低めの音域で、ルート・5度中心の短いリフ。コードが変わっても同じ形のまま音だけ移し、
// 小節の最後は次のルートへの“つなぎ”、フレーズ4小節目は1音ずつ駆け上がる。
function buildRiff(project, melody, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const scale = scalePitchClasses(project);
  const notes = [];

  const rootFor = (bar) => {
    const chord = project.chords[bar];
    const rootPc = chord ? chord.root % 12 : keyPitchClass(project);
    for (let pitch = 43; pitch <= 54; pitch += 1) if (pitch % 12 === rootPc) return { pitch, chord };
    return { pitch: 48, chord };
  };

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const { pitch: root, chord } = rootFor(bar);
    const intervals = chord ? chordIntervals(chord.quality).map((value) => value % 12) : [0, 4, 7];
    const fifth = root + (intervals.includes(7) ? 7 : intervals.includes(6) ? 6 : intervals.includes(8) ? 8 : 7);
    const place = (step, pitch, velocity) => notes.push(makeNote(pitch, barStart + step * STEP, Math.round(STEP * 0.92), velocity));

    const inPhrase = (bar - startBar) % 4;
    if (inPhrase === 3) {
      // 駆け上がり: ルートから1音ずつ、Key内の音で8分8つ
      let pitch = root;
      for (let step = 0; step < 8; step += 1) {
        place(step, Math.min(pitch, 66), step === 0 || step === 4 ? 76 : 64);
        pitch = scaleStepUp(pitch, 1, scale);
      }
      continue;
    }

    const next = bar + 1 < endBar ? rootFor(bar + 1).pitch : root;
    place(0, root, 78);
    place(1, root, 62);
    place(2, fifth, 68);
    place(3, scaleStepUp(fifth, 1, scale), 62);
    place(4, root, 74);
    place(5, root, 62);
    place(6, fifth, 66);
    place(7, next >= root ? scaleStepDown(next, 1, scale) : scaleStepUp(next, 1, scale), 62);
  }
  return notes;
}

// Pentatonic Hook: Keyのペンタトニック（マイナー or メジャー）の音だけで、短い型を繰り返すフック。
// 2小節同じ型 → 3小節目で変化 → 4小節目でコードトーンに着地。ペンタの音を「はしご」にして上下に動く。
const PENTATONIC = Object.freeze({
  minor: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 7, 9]
});
const PENTA_MOTIFS = Object.freeze({
  //            [はしごの動き]            [開始step] [長さstep]
  minor: {
    main: { offsets: [0, 2, 1, 0], steps: [0, 2, 3, 4], lengths: [2, 1, 1, 3] },
    vary: { offsets: [0, 2, 3, 2], steps: [0, 2, 3, 4], lengths: [2, 1, 1, 3] }
  },
  major: {
    main: { offsets: [0, 1, 2, 1], steps: [0, 2, 4, 6], lengths: [2, 2, 2, 2] },
    vary: { offsets: [0, 2, 3, 2], steps: [0, 2, 4, 6], lengths: [2, 2, 2, 2] }
  }
});

function buildPentaHook(project, melody, startBar, endBar, mode) {
  const barTicks = barTicksOf(project);
  const tonic = keyPitchClass(project);
  const pcs = PENTATONIC[mode].map((interval) => (tonic + interval) % 12);
  const target = Math.min(72, Math.max(57, averageMelodyPitch(melody) - 10));
  const ladder = [];
  for (let pitch = 48; pitch <= 79; pitch += 1) if (pcs.includes(pitch % 12)) ladder.push(pitch);
  const nearest = (candidates, to) => candidates.reduce((best, pitch) => (
    best === null || Math.abs(pitch - to) < Math.abs(best - to) ? pitch : best
  ), null);
  const clampIndex = (index) => Math.max(0, Math.min(ladder.length - 1, index));
  const notes = [];
  let previous = null;

  for (let bar = startBar; bar < endBar; bar += 1) {
    const barStart = bar * barTicks;
    const chordPcs = chordPitchClasses(project, bar);
    const chordTones = ladder.filter((pitch) => chordPcs.includes(pitch % 12));
    // 小節の出発点: 目標音域に近いペンタの音。コードトーンがペンタ内にあればそれを優先
    const pool = chordTones.length > 0 ? chordTones : ladder;
    const anchor = nearest(pool, previous === null ? target : Math.round((previous + target) / 2));
    const anchorIndex = ladder.indexOf(anchor);
    const inPhrase = (bar - startBar) % 4;
    const last = inPhrase === 3 || bar === endBar - 1;
    const motif = PENTA_MOTIFS[mode][inPhrase === 2 ? "vary" : "main"];

    motif.offsets.forEach((offset, index) => {
      let pitch = ladder[clampIndex(anchorIndex + offset)];
      const isLastNote = index === motif.offsets.length - 1;
      // 4小節目（と最後の小節）の最後の音は、コードトーンに着地する
      if (last && isLastNote) pitch = nearest(chordTones.length > 0 ? chordTones : ladder, anchor) ?? pitch;
      const velocity = index === 0 ? 70 : isLastNote ? 66 : 60;
      const duration = Math.round(STEP * motif.lengths[index] * (isLastNote ? 0.95 : 0.9));
      notes.push(makeNote(pitch, barStart + motif.steps[index] * STEP, duration, velocity));
      previous = pitch;
    });
  }
  return notes;
}

// Sectionの範囲（startBar〜endBar）に当てる候補を作る。土台（コードかメロディ）が無いときは例外
export function counterCandidates(project, { startBar, endBar }) {
  const barTicks = barTicksOf(project);
  const melody = (project.tracks.find((track) => track.role === "melody")?.notes ?? [])
    .slice()
    .sort((a, b) => a.startTick - b.startTick);
  const hasMelody = notesIn(melody, startBar * barTicks, endBar * barTicks).length > 0;
  const hasChords = project.chords.slice(startBar, endBar).length > 0;

  if (!hasMelody && !hasChords) {
    throw new Error("このSectionにはコードもメロディもありません。先にどちらかを入れると、裏メロの候補を作れます。");
  }

  const builders = { sparse: buildSparse, active: buildActive, hook: buildHook, answer: buildAnswer, arpeggio: buildArpeggio, riff: buildRiff,
    pentaMinor: (...args) => buildPentaHook(...args, "minor"),
    pentaMajor: (...args) => buildPentaHook(...args, "major") };
  return COUNTER_STYLES.map((style) => {
    const notes = builders[style.id](project, melody, startBar, endBar)
      .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
    return { ...style, notes };
  });
}

// 範囲（startBar〜endBar）の裏メロを notes に置き換えた新しいProjectを返す。範囲外は変えない
export function withCounterNotes(project, startBar, endBar, notes) {
  const barTicks = barTicksOf(project);
  const startTick = startBar * barTicks;
  const endTick = endBar * barTicks;
  const next = clone(project);
  const keep = counterNotes(next).filter((note) => note.startTick < startTick || note.startTick >= endTick);
  const merged = [...keep, ...clone(notes)].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  const index = next.tracks.findIndex((track) => track.role === COUNTER_ROLE);

  if (index === -1) {
    if (merged.length === 0) return next;
    next.tracks.push({
      role: COUNTER_ROLE,
      name: "Counter Melody",
      midiChannel: 4,
      instrumentId: null,
      mute: false,
      solo: false,
      volume: 1,
      pan: 0,
      notes: merged
    });
  } else {
    next.tracks[index] = { ...next.tracks[index], notes: merged };
  }
  return next;
}

// 範囲内で、裏メロが鳴っている小節の数（長くのばした音は、またぐ小節すべてに数える）
export function counterBarCount(project, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const bars = new Set();
  counterNotes(project).forEach((note) => {
    const first = Math.floor(note.startTick / barTicks);
    const last = Math.floor((note.startTick + note.durationTick - 1) / barTicks);
    for (let bar = Math.max(first, startBar); bar <= Math.min(last, endBar - 1); bar += 1) bars.add(bar);
  });
  return bars.size;
}
