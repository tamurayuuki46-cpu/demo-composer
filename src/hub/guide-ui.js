// Hub: 作編曲の手引きの表示。手順リスト + 進み具合の ✓（この端末だけに保存）+ 各画面への移動。

import { GUIDE_PHASES, GUIDE_STEPS, nextGuideStep } from "./guide.js";

const SCREEN_LABELS = { chord: "Chordへ", melody: "Melodyへ", rhythm: "Rhythmへ", arrange: "Arrangeへ", sound: "Soundへ" };

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function guideSummary(done) {
  return `作編曲の手引き ${done.size}/${GUIDE_STEPS.length}`;
}

function stepHtml(step, done) {
  const checked = done.has(step.id);
  return `
    <li class="guide-step${checked ? " done" : ""}" data-guide-row="${escapeHtml(step.id)}">
      <button class="guide-check" data-guide-toggle="${escapeHtml(step.id)}" aria-pressed="${checked}" aria-label="${escapeHtml(step.title)}を済みにする">${checked ? "✓" : ""}</button>
      <details class="guide-body">
        <summary>${escapeHtml(step.title)}</summary>
        <p>${escapeHtml(step.what)}</p>
        <p class="guide-tip">💡 ${escapeHtml(step.tip)}</p>
        ${step.screen === "hub" ? "" : `<button class="guide-go" data-guide-go="${escapeHtml(step.screen)}">${escapeHtml(SCREEN_LABELS[step.screen] ?? "開く")}</button>`}
      </details>
    </li>`;
}

export function guideHtml(done) {
  const next = nextGuideStep(done);
  return `
    <div class="guide-panel">
      <p class="guide-lead" id="guide-lead">${next
        ? `次の手順: 「${escapeHtml(next.title)}」`
        : "すべて済みました。お疲れさまです。DAWで仕上げに進めます。"}</p>
      ${GUIDE_PHASES.map((phase) => `
        <h4>${escapeHtml(phase.label)}</h4>
        <ul class="guide-list">${GUIDE_STEPS.filter((step) => step.phase === phase.id).map((step) => stepHtml(step, done)).join("")}</ul>
      `).join("")}
      <small>左の丸を押すと「済み」にできます。この端末だけに保存され、曲のデータには入りません。タイトルを押すと説明が開きます。</small>
      <button class="guide-reset" id="guide-reset">✓をすべて外す</button>
    </div>`;
}

// ✓を切り替えたとき、開いている説明を閉じないよう、表示だけをその場で更新する
export function refreshGuideDom(done) {
  GUIDE_STEPS.forEach((step) => {
    const row = document.querySelector(`[data-guide-row="${step.id}"]`);
    if (!row) return;
    const checked = done.has(step.id);
    row.classList.toggle("done", checked);
    const button = row.querySelector(".guide-check");
    if (button) {
      button.textContent = checked ? "✓" : "";
      button.setAttribute("aria-pressed", String(checked));
    }
  });
  const next = nextGuideStep(done);
  const lead = document.querySelector("#guide-lead");
  if (lead) {
    lead.textContent = next
      ? `次の手順: 「${next.title}」`
      : "すべて済みました。お疲れさまです。DAWで仕上げに進めます。";
  }
  const toggle = document.querySelector("#toggle-guide");
  if (toggle) toggle.textContent = `📖 ${guideSummary(done)} ▲`;
}
