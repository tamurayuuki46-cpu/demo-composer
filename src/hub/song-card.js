// 曲の特徴カード。作った曲を一枚で振り返る（Hubの責務）。Projectを読むだけで、書き換えない。
// 評価ではなく「いまの曲がどんな特徴か」を知るための表示。

import { analyzeMelody, describeMelody } from "../core/melody-analysis.js";
import { energyFlowText, getSections, totalSectionBars } from "../core/section-ops.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function notesOf(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

function progressionText(project) {
  if (project.chords.length === 0) return "まだありません";
  const degrees = project.chords.slice(0, 16).map((chord) => chord.degree || NOTE_NAMES[chord.root]);
  return degrees.join(" – ") + (project.chords.length > 16 ? " …" : "");
}

function structureText(project) {
  const sections = getSections(project);
  if (sections.length === 0) return "未設定（Arrangeで決められます）";
  return `${energyFlowText(sections)}（全${totalSectionBars(sections)}小節）`;
}

export function songCardHtml(project) {
  const analysis = analyzeMelody(project);
  const rows = describeMelody(analysis);
  const pick = (id) => rows.find((row) => row.id === id);
  const melodyRows = ["range", "leap", "motif"].map(pick).filter(Boolean);
  const parts = [
    ["Chord", project.chords.length > 0],
    ["Melody", notesOf(project, "melody").length > 0],
    ["Bass", notesOf(project, "bass").length > 0],
    ["Drums", notesOf(project, "drums").length > 0]
  ];

  return `
    <div class="song-card">
      <h4>${escapeHtml(project.metadata.title || "Untitled Project")}</h4>
      <p class="song-card-meta">${escapeHtml(project.basic.key)} ${project.basic.scale === "major" ? "Major" : "Minor"} ・ BPM ${project.basic.bpm} ・ 4/4</p>
      <dl>
        <dt>構成</dt><dd>${escapeHtml(structureText(project))}</dd>
        <dt>コード進行</dt><dd>${escapeHtml(progressionText(project))}</dd>
        ${melodyRows.length > 0
          ? melodyRows.map((row) => `<dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}${row.comment ? `<small>${escapeHtml(row.comment)}</small>` : ""}</dd>`).join("")
          : "<dt>メロディ</dt><dd>まだありません</dd>"}
        <dt>入力済み</dt><dd>${parts.map(([name, filled]) => `${filled ? "✓" : "－"} ${name}`).join("　")}</dd>
      </dl>
    </div>
  `;
}
