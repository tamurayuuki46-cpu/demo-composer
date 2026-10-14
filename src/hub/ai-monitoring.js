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
  const unused = catalog.filter((feature) => !used.some((entry) => entry.id === feature.id));
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

export function buildFeedback(summary) {
  const best = summary.ranked[0];
  const weakest = [...summary.categories].sort((a, b) => a.percent - b.percent)[0];
  let positive = "まだ記録が少ないので、まず普段どおりに使うと傾向が見えてきます。";
  if (summary.usedPercent >= 70) positive = `主要機能の${summary.usedPercent}%を使えています。かなり幅広く機能を活用できています。`;
  else if (summary.usedPercent >= 40) positive = `主要機能の${summary.usedPercent}%を使えています。基本機能だけでなく複数工程を行き来できています。`;
  else if (best) positive = `「${best.name}」をよく使えています。得意な工程を軸に作業の流れができ始めています。`;

  let negative = `未使用機能は${summary.unusedPercent}%です。未使用率が下がると、今の作り方に合う機能を見つけやすくなります。`;
  if (weakest && weakest.percent === 0) negative = `「${weakest.category}」カテゴリがまだ未使用です。必要なときに1機能だけ試すと、作業の選択肢を増やせます。`;
  else if (summary.usedPercent >= 80) negative = "大きな未使用領域は少なくなっています。今後は使用回数の偏りを見ながら、使う価値の低い機能も見極められます。";

  const priorityOrder = ["作曲", "アレンジ", "試聴", "補助", "入出力", "仕上げ", "基本"];
  const suggestions = [...summary.unused]
    .sort((a, b) => priorityOrder.indexOf(a.category) - priorityOrder.indexOf(b.category))
    .slice(0, 3);
  return { positive, negative, suggestions };
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
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function monitoringHtml() {
  const summary = summarizeUsage(readState());
  const feedback = buildFeedback(summary);
  const categoryRows = summary.categories.map((item) => `
    <div class="ai-monitoring-category">
      <span>${escapeHtml(item.category)}</span>
      <div class="ai-monitoring-mini-bar"><i style="width:${item.percent}%"></i></div>
      <strong>${item.percent}%</strong>
    </div>`).join("");
  const suggestions = feedback.suggestions.length
    ? feedback.suggestions.map((feature) => `<li><strong>${escapeHtml(feature.name)}</strong><span>${escapeHtml(feature.tip)}</span></li>`).join("")
    : "<li><strong>主要機能を一通り使用済みです</strong><span>今後は使用回数と偏りを見ながら、必要な機能だけを残して使えます。</span></li>";
  const unusedList = summary.unused.length
    ? summary.unused.map((feature) => `<span class="ai-monitoring-chip">${escapeHtml(feature.name)}</span>`).join("")
    : '<span class="ai-monitoring-chip">未使用なし</span>';

  return `
    <section class="ai-monitoring" data-ai-monitoring-panel>
      <div class="ai-monitoring-heading">
        <div><p class="eyebrow">Usage Monitor</p><h3>AIモニタリング</h3></div>
        <span class="ai-monitoring-local">端末内のみ</span>
      </div>
      <p class="hint">アプリの使い方を記録し、使えている機能・未使用機能・次に試す機能を自動で整理します。</p>
      <div class="ai-monitoring-score-grid">
        <div class="ai-monitoring-score used"><span>使用済み</span><strong>${summary.usedPercent}%</strong><small>${summary.used.length} / ${AI_MONITORING_FEATURES.length}機能</small></div>
        <div class="ai-monitoring-score unused"><span>未使用</span><strong>${summary.unusedPercent}%</strong><small>${summary.unused.length} / ${AI_MONITORING_FEATURES.length}機能</small></div>
      </div>
      <div class="ai-monitoring-progress" role="progressbar" aria-label="主要機能の使用率" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.usedPercent}"><i style="width:${summary.usedPercent}%"></i></div>
      <div class="ai-monitoring-categories">${categoryRows}</div>
      <div class="ai-monitoring-feedback positive"><strong>ポジティブフィードバック</strong><p>${escapeHtml(feedback.positive)}</p></div>
      <div class="ai-monitoring-feedback negative"><strong>ネガティブフィードバック</strong><p>${escapeHtml(feedback.negative)}</p></div>
      <div class="ai-monitoring-suggestions"><strong>次に試す使い方</strong><ol>${suggestions}</ol></div>
      <details class="ai-monitoring-unused"><summary>未使用機能を全部見る（${summary.unused.length}）</summary><div>${unusedList}</div></details>
      <p class="ai-monitoring-note">記録対象はこのDemo Composer内の主要操作です。音声・MIDI内容・入力した曲データを外部送信しません。</p>
    </section>`;
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued || typeof requestAnimationFrame !== "function") return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    installPanel();
  });
}

function installPanel() {
  const screen = document.querySelector("#screen");
  if (!screen) return;
  const hubHeading = [...screen.querySelectorAll("h2")].find((node) => node.textContent?.trim() === "Hub");
  if (!hubHeading) return;
  const card = hubHeading.closest(".card");
  if (!card) return;
  card.querySelector("[data-ai-monitoring-panel]")?.remove();
  const holder = document.createElement("div");
  holder.innerHTML = monitoringHtml();
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

  const screen = document.querySelector("#screen");
  if (screen) new MutationObserver(scheduleRender).observe(screen, { childList: true, subtree: true });
  installPanel();
}

if (typeof document !== "undefined" && typeof localStorage !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAiMonitoring, { once: true });
  else startAiMonitoring();
}
