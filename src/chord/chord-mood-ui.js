import {
  CHORD_MOOD_TAG_GROUPS,
  recommendChordPresetsByMood
} from "./chord-mood-tags.js";

const GROUP_LABELS = Object.freeze({
  emotion: "感情",
  texture: "質感",
  scene: "場面"
});

const DIFFICULTY_LABELS = Object.freeze({
  standard: "王道",
  expressive: "少し個性的",
  adventurous: "挑戦的"
});

const selectedTags = new Set();
let observer = null;
let rendering = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentMode() {
  const subtitle = document.querySelector("#screen .section-heading p")?.textContent ?? "";
  return subtitle.includes("Minor") ? "minor" : "major";
}

function degreeText(candidate) {
  const mode = candidate.mode;
  const romans = mode === "minor"
    ? ["i", "ii°", "III", "iv", "v", "VI", "VII"]
    : ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  return candidate.degreeIndexes.map((index) => romans[index] ?? "?").join(" → ");
}

export function chordMoodPanelHtml({ mode = "major", tags = [...selectedTags] } = {}) {
  const selected = new Set(tags);
  const candidates = recommendChordPresetsByMood([...selected], { mode, limit: 3 });

  const groupsHtml = Object.entries(CHORD_MOOD_TAG_GROUPS).map(([groupId, groupTags]) => `
    <div class="chord-mood-group">
      <strong>${escapeHtml(GROUP_LABELS[groupId] ?? groupId)}</strong>
      <div class="chord-mood-chips" role="group" aria-label="${escapeHtml(GROUP_LABELS[groupId] ?? groupId)}タグ">
        ${groupTags.map((tag) => `
          <button
            type="button"
            class="chord-mood-chip${selected.has(tag.id) ? " active" : ""}"
            data-chord-mood-tag="${escapeHtml(tag.id)}"
            aria-pressed="${selected.has(tag.id)}"
          >${escapeHtml(tag.label)}</button>
        `).join("")}
      </div>
    </div>
  `).join("");

  const resultsHtml = selected.size === 0
    ? `<p class="chord-mood-empty">気になるタグを1〜3個選ぶと、今のScaleに合う進行を3つ出します。</p>`
    : candidates.length === 0
      ? `<p class="chord-mood-empty">この組み合わせでは候補が見つかりません。タグを1つ減らしてみてください。</p>`
      : `<div class="chord-mood-results">
          ${candidates.map((candidate) => `
            <article class="chord-mood-card">
              <div class="chord-mood-card-head">
                <span class="chord-mood-difficulty">${escapeHtml(DIFFICULTY_LABELS[candidate.difficulty] ?? candidate.difficulty)}</span>
                <strong>${escapeHtml(degreeText(candidate))}</strong>
              </div>
              <div class="chord-mood-matches">
                ${candidate.matchedTags.map((tag) => `<span>${escapeHtml(tag.label)}</span>`).join("")}
              </div>
              <button type="button" data-chord-mood-preset="${escapeHtml(candidate.presetId)}">この進行を使う</button>
            </article>
          `).join("")}
        </div>`;

  return `
    <section class="chord-mood-panel" aria-label="曲想からコード進行を選ぶ">
      <div class="chord-mood-heading">
        <div>
          <h3>曲想から選ぶ</h3>
          <p>感情・質感・場面を組み合わせて、Chord Presetを3案に絞ります。</p>
        </div>
        <button type="button" class="chord-mood-clear" data-chord-mood-clear${selected.size ? "" : " disabled"}>クリア</button>
      </div>
      ${groupsHtml}
      ${resultsHtml}
      <p class="hint">※ コード進行だけで感情は決まりません。BPM・メロディ・リズム・ボイシング・音色でも印象は変わります。</p>
    </section>
  `;
}

function renderPanel() {
  if (rendering || typeof document === "undefined") return;
  const presetPanel = document.querySelector("#screen .chord-preset-panel");
  if (!presetPanel) return;

  rendering = true;
  try {
    document.querySelector("#screen .chord-mood-panel")?.remove();
    presetPanel.insertAdjacentHTML("beforebegin", chordMoodPanelHtml({ mode: currentMode() }));
    bindPanelEvents();
  } finally {
    rendering = false;
  }
}

function bindPanelEvents() {
  document.querySelectorAll("[data-chord-mood-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tagId = button.dataset.chordMoodTag;
      if (!tagId) return;
      if (selectedTags.has(tagId)) selectedTags.delete(tagId);
      else if (selectedTags.size < 3) selectedTags.add(tagId);
      renderPanel();
    });
  });

  document.querySelector("[data-chord-mood-clear]")?.addEventListener("click", () => {
    selectedTags.clear();
    renderPanel();
  });

  document.querySelectorAll("[data-chord-mood-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const presetId = button.dataset.chordMoodPreset;
      const select = document.querySelector("#chord-preset-select");
      if (!presetId || !select) return;

      select.value = presetId;
      select.dispatchEvent(new Event("change", { bubbles: true }));

      // 既存Chord Presetの適用処理をそのまま使う。Bass保護など既存安全策も維持される。
      queueMicrotask(() => document.querySelector("#apply-chord-preset")?.click());
    });
  });
}

export function initChordMoodUi() {
  if (observer || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  const screen = document.querySelector("#screen");
  if (!screen) return;

  observer = new MutationObserver(() => {
    if (document.querySelector("#screen .chord-preset-panel") && !document.querySelector("#screen .chord-mood-panel")) {
      renderPanel();
    }
  });
  observer.observe(screen, { childList: true, subtree: true });
  renderPanel();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChordMoodUi, { once: true });
  } else {
    initChordMoodUi();
  }
}
