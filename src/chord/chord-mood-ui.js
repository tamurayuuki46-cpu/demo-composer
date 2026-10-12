import { getCompositionIntent, subscribeCompositionIntent } from "../core/composition-intent.js";
import {
  CHORD_MOOD_TAG_GROUPS,
  chordPresetMoodText,
  chordPresetsForEmotion,
  recommendChordPresetsByMood
} from "./chord-mood-tags.js";
import { chordPresetNames } from "./chord-presets.js";

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

const ALL_TAGS = Object.freeze(Object.values(CHORD_MOOD_TAG_GROUPS).flat());
const TAG_BY_ID = new Map(ALL_TAGS.map((tag) => [tag.id, tag]));
const TAG_ALIAS = new Map([
  ...ALL_TAGS.flatMap((tag) => [[tag.id, tag.id], [tag.label, tag.id]]),
  ["やさしい", "gentle"],
  ["優しい", "gentle"]
]);

const selectedTags = new Set();
// 曲想を1つ選んで一覧にする（UI状態のみ）。null = 未選択
let listEmotion = null;
let listShowAll = false;
const LIST_LIMIT = 10;
let observer = null;
let rendering = false;
let unsubscribeIntent = null;
let lastIntentSignature = null;
let inheritedMoodValues = [];
let manualAdjusted = false;

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

// 画面の「C Major のコード選択」から Key を読む（Chord画面の見出しに出ているもの）
function currentKey() {
  if (typeof document === "undefined") return "C";
  const subtitle = document.querySelector("#screen .section-heading p")?.textContent ?? "";
  const key = subtitle.trim().split(/\s+/)[0];
  return /^[A-G][#b]?$/.test(key) ? key : "C";
}

export function emotionListHtml({ emotion = listEmotion, mode = "major", key = "C", showAll = listShowAll } = {}) {
  const emotionTags = CHORD_MOOD_TAG_GROUPS.emotion;
  const rows = emotion ? chordPresetsForEmotion(emotion, { mode }) : [];
  const shown = showAll ? rows : rows.slice(0, LIST_LIMIT);
  const label = emotionTags.find((tag) => tag.id === emotion)?.label ?? "";
  return `
    <div class="chord-emotion-list">
      <strong>曲想を1つ選んで一覧</strong>
      <div class="chord-mood-chips" role="radiogroup" aria-label="曲想を1つ選ぶ">
        ${emotionTags.map((tag) => `
          <button type="button" role="radio" class="chord-mood-chip${tag.id === emotion ? " active" : ""}" data-chord-emotion="${escapeHtml(tag.id)}" aria-checked="${tag.id === emotion}">${escapeHtml(tag.label)}</button>
        `).join("")}
      </div>
      ${emotion ? (rows.length === 0
        ? `<p class="chord-mood-empty">「${escapeHtml(label)}」に合う進行は、このScaleでは見つかりません。</p>`
        : `<p class="hint">「${escapeHtml(label)}」が強い順に ${shown.length} / ${rows.length} 件（${key} ${mode === "minor" ? "Minor" : "Major"} のコード名）</p>
          <ol class="chord-emotion-rows">
            ${shown.map((row) => `
              <li class="chord-emotion-row">
                <div class="chord-emotion-main">
                  <strong>${escapeHtml(chordPresetNames(row.presetId, { key, scale: mode }))}</strong>
                  <small>${escapeHtml(degreeText(row))}　${escapeHtml(DIFFICULTY_LABELS[row.difficulty] ?? "")}</small>
                  <small>${escapeHtml(chordPresetMoodText(row.presetId))}</small>
                </div>
                <button type="button" data-chord-mood-preset="${escapeHtml(row.presetId)}">使う</button>
              </li>
            `).join("")}
          </ol>
          ${rows.length > LIST_LIMIT ? `<button type="button" class="chord-emotion-more" data-chord-emotion-more>${showAll ? "上位だけ表示" : `全${rows.length}件を表示`}</button>` : ""}`)
        : `<p class="chord-mood-empty">曲想を1つ選ぶと、その印象が強い進行を一覧にします。</p>`}
    </div>`;
}

function degreeText(candidate) {
  const mode = candidate.mode;
  const romans = mode === "minor"
    ? ["i", "ii°", "III", "iv", "v", "VI", "VII"]
    : ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  return candidate.degreeIndexes.map((index) => romans[index] ?? "?").join(" → ");
}

export function intentMoodTagIds(moodValues, { limit = 3 } = {}) {
  const values = Array.isArray(moodValues) ? moodValues : moodValues == null ? [] : [moodValues];
  const normalized = [];

  for (const value of values) {
    const key = String(value ?? "").trim();
    const tagId = TAG_ALIAS.get(key);
    if (!tagId || normalized.includes(tagId)) continue;
    normalized.push(tagId);
    if (normalized.length >= limit) break;
  }

  return normalized;
}

function inheritedLabels(values) {
  return intentMoodTagIds(values).map((tagId) => TAG_BY_ID.get(tagId)?.label ?? tagId);
}

function applyCompositionIntent(intent) {
  const moodValues = Array.isArray(intent?.moodValues) ? intent.moodValues : [];
  const signature = JSON.stringify(moodValues);
  if (signature === lastIntentSignature) return;

  lastIntentSignature = signature;
  inheritedMoodValues = [...moodValues];
  selectedTags.clear();
  intentMoodTagIds(moodValues).forEach((tagId) => selectedTags.add(tagId));
  manualAdjusted = false;
  renderPanel();
}

export function chordMoodPanelHtml({
  mode = "major",
  tags = [...selectedTags],
  intentValues = inheritedMoodValues,
  adjusted = manualAdjusted
} = {}) {
  const selected = new Set(tags);
  const candidates = recommendChordPresetsByMood([...selected], { mode, limit: 3 });
  const fromHub = inheritedLabels(intentValues);

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

  const sourceHtml = fromHub.length
    ? `<p class="hint chord-mood-source">Hubの曲想から自動選択: ${escapeHtml(fromHub.join("・"))}${adjusted ? "（Chordで調整中）" : ""}</p>`
    : "";

  return `
    <section class="chord-mood-panel" aria-label="曲想からコード進行を選ぶ">
      <div class="chord-mood-heading">
        <div>
          <h3>曲想から選ぶ</h3>
          <p>感情・質感・場面を組み合わせて、Chord Presetを3案に絞ります。</p>
        </div>
        <button type="button" class="chord-mood-clear" data-chord-mood-clear${selected.size ? "" : " disabled"}>クリア</button>
      </div>
      ${sourceHtml}
      ${emotionListHtml({ mode, key: currentKey() })}
      <strong class="chord-mood-combine">組み合わせて3案に絞る（最大3つ）</strong>
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
  document.querySelectorAll("[data-chord-emotion]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.chordEmotion;
      listEmotion = listEmotion === id ? null : id;
      listShowAll = false;
      renderPanel();
    });
  });
  document.querySelector("[data-chord-emotion-more]")?.addEventListener("click", () => {
    listShowAll = !listShowAll;
    renderPanel();
  });

  document.querySelectorAll("[data-chord-mood-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tagId = button.dataset.chordMoodTag;
      if (!tagId) return;
      if (selectedTags.has(tagId)) selectedTags.delete(tagId);
      else if (selectedTags.size < 3) selectedTags.add(tagId);
      manualAdjusted = true;
      renderPanel();
    });
  });

  document.querySelector("[data-chord-mood-clear]")?.addEventListener("click", () => {
    selectedTags.clear();
    manualAdjusted = true;
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
  if (!unsubscribeIntent) {
    unsubscribeIntent = subscribeCompositionIntent(applyCompositionIntent);
  } else {
    applyCompositionIntent(getCompositionIntent());
  }

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
