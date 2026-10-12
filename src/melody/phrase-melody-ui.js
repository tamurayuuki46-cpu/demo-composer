import {
  PHRASE_BAR_CHOICES,
  PHRASE_CONTOURS,
  PHRASE_VARIATION_COUNT,
  melodyNoteCountIn,
  phraseCandidates,
  phraseDots,
  phraseRange
} from "./phrase-generator.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// Chord画面の「4小節メロディをつくる」パネル。開閉・範囲・輪郭・候補番号は画面の状態（保存しない）。
export function phraseMelodyHtml({ project, open, startBar, bars, contour, variation }) {
  const header = `<button id="toggle-phrase" class="spice-toggle" aria-expanded="${open}">🎤 ${bars}小節メロディをつくる${open ? " ▲" : " ▼"}</button>`;
  if (!open) return header;

  if (project.chords.length === 0) {
    return `${header}<section class="phrase-melody"><p class="hint">先にコードを入れてください。コード進行に合わせてメロディの候補を作ります。</p></section>`;
  }

  const range = phraseRange(project, startBar, bars);
  const candidates = phraseCandidates(project, { startBar: range.startBar, bars, contour, variation });
  const active = PHRASE_CONTOURS.find((item) => item.id === contour) ?? PHRASE_CONTOURS[0];
  const replaced = melodyNoteCountIn(project, range.startBar, range.endBar);

  return `
    ${header}
    <section class="phrase-melody" aria-label="${bars}小節メロディ">
      <div class="phrase-controls">
        <label class="field">
          <span>どこから</span>
          <select id="phrase-start">
            ${project.chords.map((_, index) => `<option value="${index}"${index === range.startBar ? " selected" : ""}>${index + 1}小節目から</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>長さ</span>
          <select id="phrase-bars">
            ${PHRASE_BAR_CHOICES.map((choice) => `<option value="${choice}"${choice === bars ? " selected" : ""}>${choice}小節</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="scale-set-tabs phrase-contours" role="group" aria-label="メロディの形">
        ${PHRASE_CONTOURS.map((item) => `<button type="button" data-phrase-contour="${item.id}" class="${item.id === active.id ? "active" : ""}" aria-pressed="${item.id === active.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <p class="hint">${escapeHtml(active.note)}　${range.startBar + 1}〜${range.endBar}小節（コード${range.bars}つ）に合わせて作ります。${range.bars < bars ? "曲の終わりまでの長さです。" : ""}${replaced > 0 ? `いまのメロディ（${replaced}音）はこの範囲だけ置き換わります（↶で戻せます）。` : ""}</p>
      <div class="phrase-candidates">
        ${candidates.map((candidate) => `
          <div class="phrase-candidate">
            <strong>${escapeHtml(candidate.label)}</strong>
            <small>${escapeHtml(candidate.description)}</small>
            <code class="phrase-dots" aria-hidden="true">${phraseDots(candidate).map(escapeHtml).join("<br>")}</code>
            <div class="phrase-actions">
              <button type="button" data-phrase-play="${candidate.id}">▶ 聴く</button>
              <button type="button" class="primary" data-phrase-apply="${candidate.id}">これにする</button>
            </div>
          </div>
        `).join("")}
      </div>
      <button type="button" id="phrase-refresh">↻ 候補を更新（${variation + 1}/${PHRASE_VARIATION_COUNT}）</button>
      <p class="hint">コードは変えません。曲の流れ（型）、コード変わり目への着地、メロディの形から作った叩き台です。選んだあとはMelody画面で1音ずつ直せます。</p>
    </section>
  `;
}
