import { DESIGN_FIELDS, DESIGN_AXES, designOf, undecidedItems } from "../core/decision-design.js";
// 「Cubase / Cubasisでやることメモ」。Demo Composerで決めた内容を、本制作の作業リストにして渡す（Hubの責務）。
// Projectを読むだけで、書き換えない（純粋関数）。音色は「方向性」のメモであり、Demo Composerの音を再現するものではない。

import { chordQualityDefinition } from "../core/chord-qualities.js";
import { SOUND_PARTS, SOUND_TONES, getSoundSelection } from "../core/sound-presets.js";
import { TRANSITIONS, energyLabel, getSections, sectionEnergy, sectionRanges, sectionTransition } from "../core/section-ops.js";
import { BACKING_PATTERNS, getBackingPattern, getBackingPatternSelection } from "../core/backing-patterns.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 方向性タグ → 本制作での音作りのヒント
export const TONE_HINTS = Object.freeze({
  natural: "素直な音。まずはそのまま鳴らして確認",
  bright: "高域を出して明るく。EQで少し持ち上げる",
  soft: "角を丸めてやわらかく。アタックをゆるめる",
  warm: "太めで丸い音。低中域を少し足す",
  dark: "高域を抑えて暗めに。ローパスを下げる",
  airy: "空気感を足す。リバーブや広がりを多めに",
  aggressive: "歪みや強いアタックで前に出す"
});

const PRESET_HINTS = Object.freeze({
  chord: { keys: "エレピ / キー系の音源", pad: "Pad系の音源（ゆっくり立ち上がる）", piano: "ピアノ音源" },
  melody: { lead: "Lead系シンセ", keys: "キー系 / ピアノ系", pluck: "Pluck系（短く切れる音）" },
  bass: { "soft-bass": "やわらかいベース（フィンガー系・サイン系）", "synth-bass": "シンセベース", "deep-bass": "低域が太いサブベース" }
});

function notesOf(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

function chordName(chord) {
  return `${NOTE_NAMES[chord.root]}${chordQualityDefinition(chord.quality).suffix}`;
}

// 使ったコードを、登場順に重複なしで並べる
function uniqueChords(project) {
  const seen = new Set();
  const list = [];
  project.chords.forEach((chord) => {
    const key = `${chord.root}:${chord.quality}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(`${chordName(chord)}（${chord.degree || "-"}）`);
  });
  return list;
}

export function buildCubaseMemo(project) {
  const { metadata, basic } = project;
  const chords = project.chords;
  const melody = notesOf(project, "melody");
  const bass = notesOf(project, "bass");
  const drums = notesOf(project, "drums");
  const sections = sectionRanges(getSections(project));

  const lines = [
    "【Cubase / Cubasis でやることメモ】",
    `曲名: ${metadata.title || "Untitled Project"}`,
    `BPM ${basic.bpm} / Key ${basic.key} ${basic.scale === "major" ? "Major" : "Minor"} / 拍子 ${basic.timeSignature}`,
    "",
    "■ 1. プロジェクトを作る",
    `- テンポを ${basic.bpm}、拍子を ${basic.timeSignature} に設定する`,
    "- Song.mid を読み込む（全パートが1ファイルに入っている）。パートごとに分けたいときは下の個別MIDIを使う"
  ];

  lines.push("", "■ 2. 取り込むMIDI");
  const files = [["Chord.mid", chords.length > 0], ["Melody.mid", melody.length > 0], ["Bass.mid", bass.length > 0], ["Drums.mid", drums.length > 0]];
  files.forEach(([name, filled]) => lines.push(`- ${name}${filled ? "" : "（まだ中身がありません）"}`));
  if (notesOf(project, "counter").length > 0) lines.push("- CounterMelody.mid（裏メロ。Song.midにも入っています）");

  lines.push("", "■ 3. 使ったコード");
  if (chords.length === 0) lines.push("- まだありません");
  else {
    lines.push(`- 登場順: ${uniqueChords(project).join(" / ")}`);
    lines.push(`- 進行（度数）: ${chords.slice(0, 16).map((chord) => chord.degree || "-").join(" – ")}${chords.length > 16 ? " …" : ""}`);
    const backing = getBackingPattern(getBackingPatternSelection(project.instruments));
    if (backing) lines.push(`- Demo Composerでの鳴らし方: ${backing.label}（本制作ではコードの刻み方の参考に）`);
  }

  lines.push("", "■ 4. 音色の方向性（本制作で音源を選ぶときの目安）");
  SOUND_PARTS.forEach((part) => {
    const selection = getSoundSelection(project.instruments, part.id);
    const preset = part.presets.find((item) => item.id === selection.preset) ?? part.presets[0];
    const tone = SOUND_TONES.find((item) => item.id === selection.tone) ?? SOUND_TONES[0];
    lines.push(`- ${part.label}: ${PRESET_HINTS[part.id]?.[preset.id] ?? preset.label} ／ ${tone.label}（${TONE_HINTS[tone.id]}）`);
  });
  lines.push("- ドラム: Kick=C1(36) / Snare=D1(38) / Closed HH=F#1(42)。使うドラム音源のマッピングに合わせて確認する");

  lines.push("", "■ 5. 曲の構成（Song.midにMarkerとして入っています）");
  if (sections.length === 0) lines.push("- 構成はまだ決めていません");
  else {
    sections.forEach((range) => {
      const transition = sectionTransition(range.section);
      const next = range.index < sections.length - 1 && transition !== "keep"
        ? ` → 次へ ${TRANSITIONS.find((item) => item.id === transition).label}（${TRANSITIONS.find((item) => item.id === transition).description}）`
        : "";
      lines.push(`- ${range.section.name}: Bar ${range.startBar + 1}–${range.endBar} / 盛り上がり ${energyLabel(sectionEnergy(range.section))}${next}`);
    });
  }

  lines.push(
    "",
    "■ 6. 次にやること（チェックリスト）",
    "- [ ] 各MIDIトラックに音源（楽器）を割り当てる",
    "- [ ] ベースとキックの低音がぶつからないか聴く",
    "- [ ] 各パートの音量バランスをざっくり整える",
    "- [ ] メロディの音域と音色が歌いやすいか確認する",
    "- [ ] 気になる所は、Demo Composerの「AI相談」でテキストを作って相談する",
    "",
    "※ Demo Composerの音は仮の音色です。ここに書いたのは「どんな方向の音にするか」の目安です。"
  );

  const design = designOf(project);
  lines.push("", "■ 曲の設計意図・5軸");
  Object.entries(DESIGN_FIELDS).forEach(([key, label]) => { if (design[key]) lines.push(`${label}: ${design[key]}`); });
  Object.entries(DESIGN_AXES).forEach(([key, label]) => { if (design.axes[key]) lines.push(`${label}: ${design.axes[key]}`); });
  (project.structure?.sections ?? []).forEach(section => { if (section.purpose) lines.push(`${section.name}の役割: ${section.purpose}`); });
  project.chords.forEach((chord, index) => { if (chord.purposes?.length) lines.push(`Bar ${index + 1}のコード目的: ${chord.purposes.join(" / ")}`); });
  for (const role of ["melody", "counter"]) if (design.tags[role].length) lines.push(`${role === "melody" ? "主旋律" : "裏メロ"}の自分の分析タグ: ${design.tags[role].join(" / ")}`);
  lines.push("", "■ 未決定項目", ...undecidedItems(project).map(item => item.label));
  lines.push("", "■ 最近の採用理由", ...design.decisions.slice(-5).map(log => `${log.label}: ${log.reason || "未記入"}`));
  return lines.join("\n");
}
