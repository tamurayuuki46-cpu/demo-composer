import { getCompositionIntent, subscribeCompositionIntent } from "../core/composition-intent.js";
import {
  CHORD_MOOD_TAG_GROUPS,
  chordPresetMoodText,
  chordPresetsForTags
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
// タブ（曲想/質感/場面）ごとに1つのタグを選んで一覧にする（UI状態のみ）。null = 未選択
let listGroup = null; // null = どのタブも開いていない
const MAX_TAGS = 5;
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

// タブ（感情/質感/場面）をまたいで複数のタグを選ぶ。選んだタグは、どのタブを開いていてもいつも上に見える。
export function moodPickerHtml({ tags = [...selectedTags], group = listGroup, mode = "major", key = "C", showAll = listShowAll } = {}) {
  const selected = new Set(tags);
  const groupId = CHORD_MOOD_TAG_GROUPS[group] ? group : null;
  const { rows, matchedAll } = chordPresetsForTags([...selected], { mode });
  const shown = showAll ? rows : rows.slice(0, LIST_LIMIT);
  const modeLabel = `${key} ${mode === "minor" ? "Minor" : "Major"}`;

  const groupOfTag = (id) => Object.keys(CHORD_MOOD_TAG_GROUPS).find((g) => CHORD_MOOD_TAG_GROUPS[g].some((tag) => tag.id === id));
  const selectedHtml = selected.size
    ? `<div class="mood-selected" aria-label="選んでいるタグ">
        <div class="mood-selected-head"><span class="mood-selected-label">選択中 ${selected.size}/${MAX_TAGS}</span><button type="button" class="mood-clear" data-chord-mood-clear>すべて外す</button></div>
        <div class="mood-selected-pills">
          ${[...selected].map((id) => `<button type="button" class="mood-pill g-${escapeHtml(groupOfTag(id) ?? "x")}" data-chord-mood-tag="${escapeHtml(id)}" aria-label="${escapeHtml(TAG_BY_ID.get(id)?.label ?? id)}を外す"><small>${escapeHtml(GROUP_LABELS[groupOfTag(id)] ?? "")}</small>${escapeHtml(TAG_BY_ID.get(id)?.label ?? id)}<b aria-hidden="true">×</b></button>`).join("")}
        </div>
      </div>`
    : `<p class="mood-selected-empty">タブから気になるタグを選ぶ（複数OK・タブをまたげます・最大${MAX_TAGS}つ）</p>`;

  const tabsHtml = Object.keys(CHORD_MOOD_TAG_GROUPS).map((id) => {
    const count = CHORD_MOOD_TAG_GROUPS[id].filter((tag) => selected.has(tag.id)).length;
    return `<button type="button" role="tab" class="mood-tab${id === groupId ? " active" : ""}" data-chord-tab="${escapeHtml(id)}" aria-selected="${id === groupId}">
      <span>${escapeHtml(GROUP_LABELS[id] ?? id)}</span>${count ? `<i>${count}</i>` : ""}<em aria-hidden="true">${id === groupId ? "▲" : "▼"}</em>
    </button>`;
  }).join("");

  const chipsHtml = groupId ? `
    <div class="mood-chips" role="group" aria-label="${escapeHtml(GROUP_LABELS[groupId])}のタグ">
      ${CHORD_MOOD_TAG_GROUPS[groupId].map((tag) => `
        <button type="button" class="mood-chip${selected.has(tag.id) ? " on" : ""}" data-chord-mood-tag="${escapeHtml(tag.id)}" aria-pressed="${selected.has(tag.id)}">${escapeHtml(tag.label)}</button>
      `).join("")}
    </div>` : "";

  let resultHtml = "";
  if (selected.size > 0 && rows.length === 0) {
    resultHtml = `<p class="chord-mood-empty">この組み合わせに合う進行は、このScaleでは見つかりません。タグを1つ外してみてください。</p>`;
  } else if (rows.length > 0) {
    resultHtml = `
      <p class="mood-count">${matchedAll ? `選んだ全部に合う進行 <b>${rows.length}</b> 件` : `全部に合う進行は無いので、いちばん多く合う進行 <b>${rows.length}</b> 件`}（${escapeHtml(modeLabel)} のコード名）</p>
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
      ${rows.length > LIST_LIMIT ? `<button type="button" class="chord-emotion-more" data-chord-emotion-more>${showAll ? "上位だけ表示" : `全${rows.length}件を表示`}</button>` : ""}`;
  }

  return `
    <div class="mood-picker">
      ${selectedHtml}
      <div class="mood-tabs" role="tablist" aria-label="タグの種類">${tabsHtml}</div>
      ${chipsHtml}
      ${resultHtml}
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
  adjusted = manualAdjusted,
  key = currentKey(),
  group = listGroup
} = {}) {
  const fromHub = inheritedLabels(intentValues);
  const sourceHtml = fromHub.length
    ? `<p class="hint chord-mood-source">Hubの曲想から自動選択: ${escapeHtml(fromHub.join("・"))}${adjusted ? "（Chordで調整中）" : ""}</p>`
    : "";

  return `
    <section class="chord-mood-panel" aria-label="曲想からコード進行を選ぶ">
      <div class="chord-mood-heading">
        <div>
          <h3>曲想から選ぶ</h3>
          <p>感情・質感・場面のタグを選ぶと、合うコード進行が一覧に出ます。</p>
        </div>
      </div>
      ${sourceHtml}
      ${moodPickerHtml({ tags, group, mode, key })}
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
    presetPanel.insertAdjacentHTML("beforebegin", chordMoodPanelHtml({ mode: currentMode(), key: currentKey() }));
    bindPanelEvents();
  } finally {
    rendering = false;
  }
}

function bindPanelEvents() {
  document.querySelectorAll("[data-chord-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      listGroup = listGroup === button.dataset.chordTab ? null : button.dataset.chordTab;
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
      else if (selectedTags.size < MAX_TAGS) selectedTags.add(tagId);
      listShowAll = false;
      manualAdjusted = true;
      renderPanel();
    });
  });

  document.querySelector("[data-chord-mood-clear]")?.addEventListener("click", () => {
    selectedTags.clear();
    listShowAll = false;
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
