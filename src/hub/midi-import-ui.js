// Hub: MIDI読み込みの確認パネル。トラックごとの役割を人が確かめ・直してから取り込む。
// 画面の状態だけを扱い、Projectを直接書き換えない（取り込みはmain.js経由でStoreへ）。

import { buildProjectFromMidi, IMPORT_ROLES, trackStats } from "../midi/midi-import.js";
import { NOTE_NAMES } from "../chord/chord-theory.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pitchName(pitch) {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

// state: { fileName, parsed, roles: string[], key: string | null, scale: string | null }
export function midiImportConvert(state) {
  return buildProjectFromMidi(state.parsed, state.roles, {
    title: state.fileName.replace(/\.[^.]+$/, ""),
    ...(state.key ? { key: state.key } : {}),
    ...(state.scale ? { scale: state.scale } : {})
  });
}

export function midiImportHtml(state) {
  let result = null;
  let problem = "";
  try {
    result = midiImportConvert(state);
  } catch (error) {
    problem = error instanceof Error ? error.message : "読み込めません。";
  }

  const rows = state.parsed.tracks.map((track, index) => {
    const stats = trackStats(track);
    return `
      <div class="midi-track">
        <div>
          <strong>${escapeHtml(track.name || `トラック${index + 1}`)}</strong>
          <small>${stats.count}音 ・ ${pitchName(stats.min)}〜${pitchName(stats.max)}${track.channels.includes(9) ? " ・ ドラム" : ""}</small>
        </div>
        <select data-midi-role="${index}" aria-label="${escapeHtml(track.name || `トラック${index + 1}`)}の役割">
          ${IMPORT_ROLES.map((role) => `<option value="${role.id}"${state.roles[index] === role.id ? " selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}
        </select>
      </div>`;
  }).join("");

  const report = result?.report;
  const keyLabel = report ? `${report.key} ${report.scale === "major" ? "Major" : "Minor"}` : "";
  return `
    <section class="midi-import" aria-label="MIDIの取り込み">
      <h3>🎹 MIDIの取り込み</h3>
      <p>「${escapeHtml(state.fileName)}」を読み込みました。役割を確かめてから取り込みます。</p>
      <div class="midi-tracks">${rows}</div>
      <div class="midi-key">
        <label>キー
          <select id="midi-key" aria-label="キー">
            <option value="">自動${report ? `（${escapeHtml(`${report.detectedKey} ${report.detectedScale === "major" ? "Major" : "Minor"}`)}）` : ""}</option>
            ${NOTE_NAMES.map((name) => `<option value="${name}"${state.key === name ? " selected" : ""}>${name}</option>`).join("")}
          </select>
        </label>
        <label>調
          <select id="midi-scale" aria-label="Major / Minor">
            <option value="">自動</option>
            <option value="major"${state.scale === "major" ? " selected" : ""}>Major</option>
            <option value="minor"${state.scale === "minor" ? " selected" : ""}>Minor</option>
          </select>
        </label>
      </div>
      ${problem ? `<p class="midi-problem">${escapeHtml(problem)}</p>` : `
        <p class="midi-summary">BPM ${report.bpm} ・ ${report.bars}小節 ・ ${escapeHtml(keyLabel)}<br />
          コード${report.chords}小節 ・ メロ${report.melody}音 ・ ベース${report.bass}音 ・ ドラム${report.drums}音 ・ 裏メロ${report.counter}音</p>
        ${report.warnings.map((text) => `<small class="midi-warning">・${escapeHtml(text)}</small>`).join("")}
      `}
      <div class="midi-actions">
        <button id="midi-import-apply" class="primary-action"${problem ? " disabled" : ""}>この内容で取り込む</button>
        <button id="midi-import-cancel">やめる</button>
      </div>
      <small>いまの曲は置き換わります（画面上部の ↶ で元に戻せます）。</small>
    </section>`;
}
