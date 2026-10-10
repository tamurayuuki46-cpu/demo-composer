// AI相談用テキスト。ChatGPT / Claudeへそのまま貼れる形で、曲の骨子をまとめる。
// Hubの責務。Projectを読むだけで、書き換えない（純粋関数）。

import { chordQualityDefinition } from "../core/chord-qualities.js";
import { noteValueLabel } from "../core/note-placement.js";
import { getSections, sectionRanges, totalSectionBars } from "../core/section-ops.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function pitchName(pitch) {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

function chordLabel(chord) {
  const suffix = chordQualityDefinition(chord.quality).suffix;
  return `${NOTE_NAMES[chord.root]}${suffix}${chord.degree ? `(${chord.degree})` : ""}`;
}

function trimNumber(value) {
  return String(Number(value.toFixed(2)));
}

function lengthLabel(durationTick, ppq) {
  const label = noteValueLabel(durationTick, ppq);
  return label.endsWith("tick") ? `${trimNumber(durationTick / ppq)}拍` : label;
}

function notesOf(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

function barCountOf(project, barTicks) {
  const noteBars = project.tracks
    .flatMap((track) => track.notes ?? [])
    .reduce((max, note) => Math.max(max, Math.floor(note.startTick / barTicks) + 1), 0);
  return Math.max(project.chords.length, noteBars, totalSectionBars(getSections(project)));
}

function chordSection(project, barCount) {
  if (project.chords.length === 0) return ["（コードはまだありません）"];

  const sections = sectionRanges(getSections(project));
  const line = (label, from, to) => {
    const items = [];
    for (let bar = from; bar < to; bar += 1) {
      const chord = project.chords[bar];
      if (chord || bar < project.chords.length) items.push(chord ? chordLabel(chord) : "-");
    }
    return items.length > 0 ? `${label} Bar ${from + 1}–${from + items.length}: ${items.join(" | ")}` : null;
  };

  const lines = [];
  if (sections.length > 0) {
    sections.forEach((range) => {
      const text = line(range.section.name, range.startBar, range.endBar);
      if (text) lines.push(text);
    });
    const rest = line("その他", sections.at(-1).endBar, barCount);
    if (rest) lines.push(rest);
  } else {
    for (let bar = 0; bar < barCount; bar += 4) {
      const text = line("", bar, Math.min(barCount, bar + 4));
      if (text) lines.push(text.trim());
    }
  }

  return lines;
}

// 1小節ぶんの音を「拍位置:音名/長さ」で並べる（例: 1:E4/4分 3.5:G4/8分）
function noteLines(project, notes, barCount, { withChord = true } = {}) {
  const ppq = project.basic.ppq;
  const barTicks = ppq * 4;
  const lines = [];

  for (let bar = 0; bar < barCount; bar += 1) {
    const inBar = notes.filter((note) => Math.floor(note.startTick / barTicks) === bar);
    if (inBar.length === 0) continue;

    const items = inBar.map((note) => (
      `${trimNumber((note.startTick % barTicks) / ppq + 1)}:${pitchName(note.pitch)}/${lengthLabel(note.durationTick, ppq)}`
    ));
    const chord = withChord && project.chords[bar] ? ` [${chordLabel(project.chords[bar])}]` : "";
    lines.push(`Bar ${bar + 1}${chord}: ${items.join(" ")}`);
  }

  return lines;
}

function drumPatterns(project, barCount) {
  const ppq = project.basic.ppq;
  const barTicks = ppq * 4;
  const stepTicks = barTicks / 16;
  const drums = notesOf(project, "drums");
  const rows = [["K", 36], ["S", 38], ["H", 42]];

  const patterns = Array.from({ length: barCount }, (_, bar) => {
    const inBar = drums.filter((note) => Math.floor(note.startTick / barTicks) === bar);
    if (inBar.length === 0) return null;

    return rows.map(([label, pitch]) => {
      const cells = Array.from({ length: 16 }, (_, step) => (
        inBar.some((note) => note.pitch === pitch && note.startTick === bar * barTicks + step * stepTicks) ? "x" : "."
      )).join("");
      return `${label} ${cells}`;
    }).join(" / ");
  });

  // 前の小節と同じパターンは「同じ」にまとめて短くする
  const lines = [];
  let index = 0;
  while (index < barCount) {
    if (!patterns[index]) { index += 1; continue; }
    let end = index;
    while (end + 1 < barCount && patterns[end + 1] === patterns[index]) end += 1;
    lines.push(`Bar ${index + 1}${end > index ? `–${end + 1}` : ""}: ${patterns[index]}`);
    index = end + 1;
  }
  return lines;
}

function rangeSummary(notes) {
  if (notes.length === 0) return null;
  const pitches = notes.map((note) => note.pitch);
  return `音数 ${notes.length} / 音域 ${pitchName(Math.min(...pitches))}〜${pitchName(Math.max(...pitches))}`;
}

// 「いま悩んでいること」のテンプレート。タップで相談欄に入り、あとから自由に書き換えられる。
export const CONSULT_TEMPLATES = Object.freeze([
  { id: "next-chord", label: "次のコード", text: "次に続くコードの候補を知りたい（今のコード進行を活かしたまま）。" },
  { id: "chorus", label: "サビを盛り上げる", text: "サビをもっと盛り上げたい。メロディ・コード・リズムのどこを変えるとよいか知りたい。" },
  { id: "melody", label: "メロディを覚えやすく", text: "メロディをもっと覚えやすく・歌いやすくしたい。直す場所の候補を知りたい。" },
  { id: "bass", label: "ベース", text: "ベースラインをもっと動かしたい。今のコードに合う動きの候補を知りたい。" },
  { id: "contrast", label: "Aメロとサビの差", text: "Aメロとサビの差をもっとはっきり出したい。" },
  { id: "arrange", label: "構成の見直し", text: "曲の構成（Section の並びと長さ）を見直したい。" },
  { id: "daw", label: "Cubaseで次にやること", text: "この骨子をCubase / Cubasisに持っていったあと、最初にやるとよいことを順番に知りたい。" }
]);

export const CONSULT_PLACEHOLDER = "（ここに相談したいことを書いてください）";

export function buildConsultText(project, question = "") {
  const { metadata, basic } = project;
  const ppq = basic.ppq;
  const barCount = barCountOf(project, ppq * 4);
  const sections = sectionRanges(getSections(project));
  const melody = notesOf(project, "melody");
  const bass = notesOf(project, "bass");
  const drumLines = drumPatterns(project, barCount);
  const mood = Array.isArray(metadata.mood) ? metadata.mood.filter(Boolean).join(", ") : "";

  const lines = [
    "【Demo Composer 作曲相談】",
    "スマホアプリ Demo Composer で作っている曲の骨子です。",
    "完全に作り直さず、私が選んで直せるように、候補を3つ挙げて、それぞれ理由を一言添えてください。",
    "",
    "■ 基本情報",
    `曲名: ${metadata.title || "Untitled Project"}`,
    `BPM: ${basic.bpm} / Key: ${basic.key} ${basic.scale} / 拍子: ${basic.timeSignature}`
  ];
  if (metadata.genre) lines.push(`ジャンル: ${metadata.genre}`);
  if (mood) lines.push(`ムード: ${mood}`);
  if (metadata.memo) lines.push(`メモ: ${metadata.memo}`);

  lines.push("", `■ 曲の構成${barCount > 0 ? `（全${barCount}小節）` : ""}`);
  if (sections.length === 0) lines.push("（構成はまだ決めていません）");
  sections.forEach((range) => {
    lines.push(`${range.section.name}: Bar ${range.startBar + 1}–${range.endBar}（${range.section.bars}小節）`);
  });

  lines.push("", "■ コード進行（コード名(ディグリー)）", ...chordSection(project, barCount));

  lines.push("", "■ メロディ（拍位置:音名/長さ）");
  const melodyLines = noteLines(project, melody, barCount);
  if (melodyLines.length === 0) lines.push("（まだありません）");
  else lines.push(rangeSummary(melody), ...melodyLines);

  lines.push("", "■ ベース（拍位置:音名/長さ）");
  const bassLines = noteLines(project, bass, barCount);
  if (bassLines.length === 0) lines.push("（まだありません）");
  else lines.push(...bassLines);

  lines.push("", "■ ドラム（K=キック S=スネア H=ハイハット / 16マス、x=鳴る）");
  if (drumLines.length === 0) lines.push("（まだありません）");
  else lines.push(...drumLines);

  lines.push("", "■ 相談したいこと", question.trim() || CONSULT_PLACEHOLDER);

  return lines.join("\n");
}
