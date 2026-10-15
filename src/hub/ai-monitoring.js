import { loadActiveProject } from "../storage/indexeddb-storage.js";

const STORAGE_KEY = "demo-composer.ai-monitoring.v1";
const MAX_EVENTS = 240;

export const AI_MONITORING_FEATURES = [
  { id: "hub", name: "Hub", category: "基本", tip: "曲全体の状態確認や保存の起点として使います。", selector: '[data-screen="hub"]' },
  { id: "project-settings", name: "Project基本設定", category: "基本", tip: "BPM・Key・Scaleを曲の意図に合わせて整えます。", selector: "#project-title,#project-bpm,#project-key,#project-scale", event: "change" },
  { id: "save", name: "Save Now", category: "基本", tip: "区切りのよいところで明示保存も試します。", selector: "#save-project" },
  { id: "history", name: "Undo / Redo", category: "基本", tip: "比較しながら編集するときに取り消し履歴を使います。", selector: "#history-undo,#history-redo" },
  { id: "playback", name: "Demo再生", category: "試聴", tip: "変更後は短く再生して耳で確認します。", selector: "#player-play,#player-stop" },
  { id: "loop", name: "Loop試聴", category: "試聴", tip: "気になる部分を繰り返して判断します。", selector: "#player-loop" },
  { id: "part-switch", name: "パート切替", category: "試聴", tip: "パートをON/OFFして役割を確認します。", selector: "#player-parts,#part-all,#part-none,#part-solo,[data-part]" },
  { id: "export", name: "Export", category: "入出力", tip: "MIDIやproject.jsonを書き出して外部作業へつなげます。", selector: "#toggle-export,#export-all-midi,[data-midi-file],#export-project-json" },
  { id: "project-import", name: "Project JSON読込", category: "入出力", tip: "バックアップ復元の流れを一度確認しておくと安心です。", selector: "#import-project-json" },
  { id: "midi-import", name: "MIDI読込", category: "入出力", tip: "手持ちMIDIを読み込んで作曲素材として使います。", selector: "#import-midi" },
  { id: "ai-consult", name: "AI相談", category: "補助", tip: "迷った段階で曲データをまとめて相談に使います。", selector: "#toggle-consult" },
  { id: "skeleton", name: "曲の骨組みチェック", category: "補助", tip: "構成の抜けを早めに確認します。", selector: "#toggle-skeleton" },
  { id: "guide", name: "作曲手引き", category: "補助", tip: "未着手工程を見つけるチェックリストとして使います。", selector: "#toggle-guide,[data-guide-step]" },
  { id: "song-card", name: "曲の特徴カード", category: "補助", tip: "曲の特徴を言語化して方向性を固定します。", selector: "#toggle-song-card" },
  { id: "cubase-memo", name: "Cubaseメモ", category: "補助", tip: "DAWへ移す内容をメモして作業漏れを防ぎます。", selector: "[data-cubase-memo],#cubase-memo" },
  { id: "sheet-link", name: "作曲シート連携", category: "補助", tip: "曲の意図や参考情報を作曲シートと往復します。", selector: "[data-sheet-link],#open-sheet-link,#composition-sheet-link" },
  { id: "chord", name: "Chord画面", category: "作曲", tip: "コード進行を先に固めたいときに使います。", selector: '[data-screen="chord"]' },
  { id: "chord-candidates", name: "コード候補", category: "作曲", tip: "候補を比較して進行を決めます。", selector: "[data-chord-root],[data-chord-quality],[data-chord-candidate]" },
  { id: "chord-presets", name: "コード進行プリセット", category: "作曲", tip: "定番進行から出発して変化を付けます。", selector: "[data-chord-preset],[data-preset-id]" },
  { id: "chord-spice", name: "発展コード / Spice", category: "作曲", tip: "借用和音などで響きの差を試します。", selector: "#toggle-spice,[data-spice-chord]" },
  { id: "chord-scale-sets", name: "スケール / コードセット", category: "作曲", tip: "キー内外の候補をまとめて比較します。", selector: "#toggle-scale-sets,[data-scale-family],[data-scale-level]" },
  { id: "melody-chords", name: "メロディからコード", category: "作曲", tip: "メロディ先行の曲ではコード候補を逆算します。", selector: "#toggle-melody-chords,[data-melody-chord-candidate]" },
  { id: "melody", name: "Melody画面", category: "作曲", tip: "主旋律の輪郭・音域・リズムを整えます。", selector: '[data-screen="melody"]' },
  { id: "phrase", name: "フレーズ生成 / 候補", category: "作曲", tip: "候補を複数出して比較し、気に入った要素だけ残します。", selector: "#toggle-phrase,[data-phrase-candidate],[data-phrase-action]" },
  { id: "counter", name: "裏メロ", category: "作曲", tip: "主旋律の休符や語尾に短い応答を試します。", selector: '[data-screen="counter"]' },
  { id: "rhythm", name: "Rhythm画面", category: "作曲", tip: "ベースとドラムの噛み合わせを確認します。", selector: '[data-screen="rhythm"]' },
  { id: "rhythm-presets", name: "Rhythmプリセット", category: "作曲", tip: "基本パターンを当ててから細部を調整します。", selector: "[data-rhythm-preset],[data-drum-preset],[data-bass-candidate]" },
  { id: "arrange", name: "Arrange画面", category: "アレンジ", tip: "Sectionごとの密度と展開を決めます。", selector: '[data-screen="arrange"]' },
  { id: "section-tools", name: "Section編集", category: "アレンジ", tip: "Aメロ・Bメロ・サビの役割と長さを整理します。", selector: "[data-section-action],[data-section-id],[data-section-variation]" },
  { id: "compare", name: "比較試聴 / A-B", category: "アレンジ", tip: "変更前後を短く比較して判断します。", selector: "[data-compare-action],[data-ab-compare]" },
  { id: "sound", name: "Sound画面", category: "仕上げ", tip: "最後に音色の方向性をまとめます。", selector: '[data-screen="sound"]' },
  { id: "display", name: "表示設定", category: "基本", tip: "スマホで見やすい文字サイズへ調整します。", selector: "[data-text-size-option]" }
];

export const DECISION_PROGRESS_STATUSES = Object.freeze(["未着手", "探索中", "比較中", "保留", "採用", "完了", "任意"]);

export function emptyUsageState(now = Date.now()) {
  return { version: 1, createdAt: now, updatedAt: now, sessions: 0, features: {}, events: [] };
}

function normalizeState(value) {
  const base = emptyUsageState();
  if (!value || typeof value !== "object") return base;
  return {
    version: 1,
    createdAt: Number(value.createdAt) || base.createdAt,
    updatedAt: Number(value.updatedAt) || base.updatedAt,
    sessions: Number(value.sessions) || 0,
    features: value.features && typeof value.features === "object" ? value.features : {},
    events: Array.isArray(value.events) ? value.events.slice(-MAX_EVENTS) : []
  };
}

export function summarizeUsage(state, catalog = AI_MONITORING_FEATURES) {
  const normalized = normalizeState(state);
  const used = catalog.filter((feature) => Number(normalized.features?.[feature.id]?.count) > 0);
  const usedIds = new Set(used.map((feature) => feature.id));
  const unused = catalog.filter((feature) => !usedIds.has(feature.id));
  const total = catalog.length || 1;
  const usedPercent = Math.round((used.length / total) * 100);
  const categories = [...new Set(catalog.map((feature) => feature.category))].map((category) => {
    const all = catalog.filter((feature) => feature.category === category);
    const count = all.filter((feature) => Number(normalized.features?.[feature.id]?.count) > 0).length;
    return { category, used: count, total: all.length, percent: Math.round((count / all.length) * 100) };
  });
  const ranked = used
    .map((feature) => ({ ...feature, count: Number(normalized.features?.[feature.id]?.count) || 0, lastUsed: Number(normalized.features?.[feature.id]?.lastUsed) || 0 }))
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
  return { used, unused, usedPercent, unusedPercent: 100 - usedPercent, categories, ranked, sessions: normalized.sessions };
}

// Kept for backward-compatible callers. Usage is now secondary information, not a completion score.
export function buildFeedback(summary) {
  const best = summary.ranked[0] || null;
  const suggestions = summary.unused.slice(0, 3);
  return {
    positive: best ? `よく使っている機能は「${best.name}」です。` : "まだ利用傾向を判断するほど記録がありません。",
    negative: "未使用機能があっても問題ありません。曲に必要な機能だけ使えば十分です。",
    suggestions
  };
}

export function beginnerRecommendation(summary) {
  const feedback = buildFeedback(summary);
  const next = feedback.suggestions[0] || null;
  return {
    positive: feedback.positive,
    improvement: feedback.negative,
    next,
    nextTitle: next ? `必要なら「${next.name}」も試せます` : "必要な機能だけ使えていれば十分です"
  };
}

function featureCount(usageState, featureId) {
  return Number(normalizeState(usageState).features?.[featureId]?.count) || 0;
}

function notesFor(project, role) {
  return project?.tracks?.find?.((track) => track?.role === role)?.notes ?? [];
}

function decisionLogs(project) {
  const logs = project?.metadata?.composition?.decisions;
  return Array.isArray(logs) ? logs : [];
}

function hasDecision(project, kind) {
  return decisionLogs(project).some((entry) => entry?.kind === kind);
}

function hasDirection(project) {
  const design = project?.metadata?.composition;
  if (!design || typeof design !== "object") return false;
  const fields = [design.hook, design.highlight, design.tension, design.chorus, design.reference];
  const axes = design.axes && typeof design.axes === "object" ? Object.values(design.axes) : [];
  return [...fields, ...axes].some((value) => typeof value === "string" && value.trim());
}

function statusItem(id, label, status, note) {
  return { id, label, status, note };
}

export function deriveDecisionProgress(project, usageState = emptyUsageState()) {
  const normalizedUsage = normalizeState(usageState);
  const chords = Array.isArray(project?.chords) ? project.chords : [];
  const melody = notesFor(project, "melody");
  const bass = notesFor(project, "bass");
  const counter = notesFor(project, "counter")?.length ? notesFor(project, "counter") : notesFor(project, "counterMelody");
  const sections = Array.isArray(project?.structure?.sections) ? project.structure.sections : [];
  const instruments = Array.isArray(project?.instruments) ? project.instruments : [];
  const checks = project?.metadata?.composition?.checks ?? {};

  const chordCompared = chords.length > 0 && ["chord-candidates", "chord-presets", "chord-spice", "chord-scale-sets", "compare"].some((id) => featureCount(normalizedUsage, id) > 0);
  const melodyCompared = melody.length > 0 && ["phrase", "melody-chords", "compare"].some((id) => featureCount(normalizedUsage, id) > 0);
  const sectionCompared = sections.length > 0 && featureCount(normalizedUsage, "compare") > 0;
  const arrangementTouched = sections.length > 0 || instruments.length > 0 || featureCount(normalizedUsage, "arrange") > 0;

  let directionStatus = "未着手";
  if (hasDirection(project)) directionStatus = "完了";
  else if (featureCount(normalizedUsage, "project-settings") > 0 || featureCount(normalizedUsage, "sheet-link") > 0) directionStatus = "探索中";

  let chordStatus = "未着手";
  if (hasDecision(project, "chord")) chordStatus = "採用";
  else if (chordCompared) chordStatus = "比較中";
  else if (chords.length) chordStatus = "探索中";

  let melodyStatus = "未着手";
  if (hasDecision(project, "melody")) melodyStatus = "採用";
  else if (melodyCompared) melodyStatus = "比較中";
  else if (melody.length) melodyStatus = "探索中";

  let sectionStatus = "未着手";
  if (sections.length && sections.every((section) => typeof section?.purpose === "string" && section.purpose.trim())) sectionStatus = "完了";
  else if (sectionCompared) sectionStatus = "比較中";
  else if (sections.length) sectionStatus = "探索中";

  let bassStatus = "未着手";
  if (bass.length) bassStatus = "探索中";
  else if ((chords.length || melody.length) && (featureCount(normalizedUsage, "rhythm") > 0 || featureCount(normalizedUsage, "rhythm-presets") > 0)) bassStatus = "保留";

  let counterStatus = "任意";
  if (checks.counter === "unnecessary") counterStatus = "任意";
  else if (hasDecision(project, "counter")) counterStatus = "採用";
  else if (counter.length) counterStatus = "探索中";
  else if (featureCount(normalizedUsage, "counter") > 0) counterStatus = "保留";

  let arrangementStatus = "未着手";
  if (arrangementTouched && featureCount(normalizedUsage, "compare") > 0) arrangementStatus = "比較中";
  else if (arrangementTouched) arrangementStatus = "探索中";

  const handoffStatus = featureCount(normalizedUsage, "export") > 0 ? "探索中" : "未着手";

  const items = [
    statusItem("direction", "曲の方向性", directionStatus, directionStatus === "完了" ? "意図メモから方向性を確認できます。" : "未定のまま作り始めてもOKです。"),
    statusItem("chord", "Chord", chordStatus, chordStatus === "採用" ? "採用履歴があります。" : "候補を試しながら保留しても構いません。"),
    statusItem("melody", "Melody", melodyStatus, melodyStatus === "採用" ? "採用履歴があります。" : "探索中・比較中は正常な状態です。"),
    statusItem("section", "Section", sectionStatus, "Sectionの役割は後から決め直せます。"),
    statusItem("bass", "Bass", bassStatus, bassStatus === "保留" ? "いったん入れずに先へ進めます。" : "必要になった段階で追加できます。"),
    statusItem("counter", "Counter Melody", counterStatus, counterStatus === "任意" ? "曲に不要なら使わなくて構いません。" : "主旋律との関係を見ながら決めます。"),
    statusItem("arrangement", "Arrangement", arrangementStatus, "発散→比較→収束を行き来できます。"),
    statusItem("daw", "DAW Handoff", handoffStatus, "書き出し操作は完成率ではなく受け渡し準備として扱います。")
  ];

  return {
    items,
    projectId: project?.id ?? null,
    revision: Number(project?.revision) || null,
    hasProject: Boolean(project),
    message: "100%を目指す進捗表ではありません。探索中・比較中・保留・任意も正常な創作状態です。"
  };
}

function readState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return emptyUsageState();
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
  } catch {
    // Monitoring must never block composition when storage is unavailable.
  }
}

function recordFeature(featureId, source = "ui") {
  const feature = AI_MONITORING_FEATURES.find((entry) => entry.id === featureId);
  if (!feature) return;
  const state = readState();
  const now = Date.now();
  const previous = state.features[featureId] || { count: 0, lastUsed: 0 };
  state.features[featureId] = { count: Number(previous.count || 0) + 1, lastUsed: now };
  state.updatedAt = now;
  state.events.push({ featureId, at: now, source });
  state.events = state.events.slice(-MAX_EVENTS);
  writeState(state);
  scheduleRender();
  if (typeof setTimeout === "function") setTimeout(scheduleRender, 450);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  return ({
    "未着手": "idle",
    "探索中": "explore",
    "比較中": "compare",
    "保留": "hold",
    "採用": "adopted",
    "完了": "done",
    "任意": "optional"
  })[status] || "idle";
}

function usageDetailsHtml(summary) {
  const used = summary.ranked.slice(0, 10);
  const chips = used.length
    ? used.map((feature) => `<span class="ai-monitoring-chip">${escapeHtml(feature.name)} × ${feature.count}</span>`).join("")
    : '<span class="ai-monitoring-chip">まだ操作記録なし</span>';
  return `
    <details class="ai-monitoring-details">
      <summary>機能利用状況を見る（補助情報）</summary>
      <p class="ai-monitoring-secondary-copy">${summary.used.length} / ${AI_MONITORING_FEATURES.length}機能を使っています。未使用機能があっても完成度とは関係ありません。</p>
      <div class="ai-monitoring-usage-chips">${chips}</div>
    </details>`;
}

function monitoringHtml(progress, usageSummary) {
  const rows = progress.items.map((item) => `
    <div class="decision-progress-row" data-decision-progress="${escapeHtml(item.id)}">
      <div class="decision-progress-label"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.note)}</small></div>
      <span class="decision-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
    </div>`).join("");

  return `
    <section class="ai-monitoring decision-progress" data-ai-monitoring-panel>
      <div class="ai-monitoring-heading">
        <div><p class="eyebrow">DECISION PROGRESS</p><h3>作曲判断進捗</h3></div>
        <span class="ai-monitoring-local">100%不要</span>
      </div>
      <p class="hint">何個の機能を使ったかではなく、曲について今どんな判断状態にいるかを見ます。</p>
      <div class="decision-progress-list">${rows}</div>
      <p class="decision-progress-message">${escapeHtml(progress.message)}</p>
      ${usageDetailsHtml(usageSummary)}
      <p class="ai-monitoring-note">判断状態はProject内容とこの端末内の操作履歴から推定します。曲データやMIDIを外部送信しません。</p>
    </section>`;
}

let renderQueued = false;
let renderToken = 0;

function scheduleRender() {
  if (renderQueued || typeof requestAnimationFrame !== "function") return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    installPanel();
  });
}

async function installPanel() {
  const token = ++renderToken;
  const screen = document.querySelector("#screen");
  if (!screen) return;
  const hubHeading = [...screen.querySelectorAll("h2")].find((node) => node.textContent?.trim() === "Hub");
  if (!hubHeading) return;
  const card = hubHeading.closest(".card");
  if (!card) return;

  let project = null;
  try {
    project = await loadActiveProject();
  } catch {
    project = null;
  }
  if (token !== renderToken) return;

  const usageSummary = summarizeUsage(readState());
  const progress = deriveDecisionProgress(project, readState());
  card.querySelector("[data-ai-monitoring-panel]")?.remove();
  const holder = document.createElement("div");
  holder.innerHTML = monitoringHtml(progress, usageSummary);
  const panel = holder.firstElementChild;
  const statusMessage = card.querySelector("#hub-message");
  if (statusMessage) statusMessage.insertAdjacentElement("afterend", panel);
  else hubHeading.insertAdjacentElement("afterend", panel);
}

function findFeatureForTarget(target, eventType) {
  if (!(target instanceof Element)) return null;
  return AI_MONITORING_FEATURES.find((feature) => {
    if (feature.event && feature.event !== eventType) return false;
    if (!feature.event && eventType !== "click") return false;
    try { return Boolean(target.closest(feature.selector)); } catch { return false; }
  });
}

function startAiMonitoring() {
  const state = readState();
  state.sessions += 1;
  state.updatedAt = Date.now();
  writeState(state);
  recordFeature("hub", "initial-view");

  document.addEventListener("click", (event) => {
    const feature = findFeatureForTarget(event.target, "click");
    if (feature) recordFeature(feature.id, "click");
  }, true);
  document.addEventListener("change", (event) => {
    const feature = findFeatureForTarget(event.target, "change");
    if (feature) recordFeature(feature.id, "change");
  }, true);

  new MutationObserver(scheduleRender).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  installPanel();
}

if (typeof document !== "undefined" && typeof localStorage !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAiMonitoring, { once: true });
  else startAiMonitoring();
}
