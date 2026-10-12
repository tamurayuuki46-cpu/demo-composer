import { syncCompositionIntentFromProject } from "../core/composition-intent.js";
import { applyStartingPointConfirmText, buildStartingPointPatch, describeStartingPoint, GENRES, MOODS, progressionNames, QUESTIONS, suggestByAnswers, suggestStartingPoints } from "./starting-point.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 開閉と選択は画面の状態のみ（曲のデータには入らない）
let open = false;
let genre = "";
let mood = "";
// 「質問で決める」: mode は "pick"（ジャンル×ムード）/ "wizard"（質問）。answers は質問の答え
let mode = "pick";
let answers = {};

function chips(items, selected, attr, label) {
  return `<div class="sp-chips" role="group" aria-label="${label}">${items.map((item) => (
    `<button class="sp-chip${item.id === selected ? " active" : ""}" ${attr}="${item.id}" aria-pressed="${item.id === selected}">${escapeHtml(item.label)}</button>`
  )).join("")}</div>`;
}

function cardsHtml(points) {
  return `
    <div class="sp-list">
      ${points.map((point, index) => {
        const d = describeStartingPoint(point);
        return `
          <article class="sp-card">
            <strong>${escapeHtml(point.label)}</strong>
            <span class="sp-reason">${escapeHtml(point.reason)}</span>
            <p>${escapeHtml(d.basics)}</p>
            <p class="sp-names">${escapeHtml(progressionNames(point))}</p>
            <p>${escapeHtml(point.note)}</p>
            <p>${escapeHtml(d.parts)}</p>
            <p>音色: ${escapeHtml(d.tones)}</p>
            <div class="sp-buttons">
              <button data-sp-preview="${index}">▶ 試聴</button>
              <button class="export-primary" data-sp-apply="${index}">この出発点にする</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
    <p class="hint">選ぶと Key / BPM / コード進行 / ドラム / 伴奏 / 音色の方向性がまとめて入ります（↶で戻せます）。メロディは残ります。入ったあと、ChordやRhythmで自由に直せます。</p>
  `;
}

function pickBody() {
  const picked = genre !== "" || mood !== "";
  return `
    <h3>ジャンル</h3>
    ${chips(GENRES, genre, "data-sp-genre", "ジャンル")}
    <h3>ムード</h3>
    ${chips(MOODS, mood, "data-sp-mood", "ムード")}
    ${picked ? cardsHtml(suggestStartingPoints({ genre, mood })) : `<p class="hint">ジャンルかムードを1つ選ぶと、曲の出発点を3つ出します。どちらか片方だけでも大丈夫です。</p>`}
  `;
}

// 質問は1つずつ。答えたら次へ進み、3つ答えたら結果を出す。
function wizardBody() {
  const step = QUESTIONS.findIndex((question) => answers[question.id] === undefined);
  if (step === -1) {
    return `
      <p class="hint">答えに合わせた出発点です。</p>
      ${cardsHtml(suggestByAnswers(answers))}
      <button id="sp-wizard-restart" class="sp-secondary">質問をやり直す</button>
    `;
  }
  const question = QUESTIONS[step];
  return `
    <p class="sp-step">質問 ${step + 1} / ${QUESTIONS.length}</p>
    <h3>${escapeHtml(question.title)}</h3>
    <div class="sp-answers">
      ${question.options.map((option) => `<button class="sp-answer" data-sp-answer="${question.id}:${option.id}">${escapeHtml(option.label)}</button>`).join("")}
    </div>
    ${step > 0 ? `<button id="sp-wizard-back" class="sp-secondary">← ひとつ前へ</button>` : ""}
  `;
}

function currentPoints() {
  if (mode === "wizard") {
    return QUESTIONS.every((question) => answers[question.id] !== undefined) ? suggestByAnswers(answers) : [];
  }
  return genre !== "" || mood !== "" ? suggestStartingPoints({ genre, mood }) : [];
}

export function startingPointHtml() {
  const toggle = `<button id="toggle-starting-point" class="song-card-toggle" aria-expanded="${open}">🧭 出発点を選ぶ（ジャンル × ムード / 質問）${open ? " ▲" : " ▼"}</button>`;
  if (!open) return toggle;

  return `
    ${toggle}
    <section class="export-panel starting-point-panel">
      <div class="sp-modes" role="group" aria-label="出発点の決め方">
        <button data-sp-mode="pick" class="sp-chip${mode === "pick" ? " active" : ""}" aria-pressed="${mode === "pick"}">選んで決める</button>
        <button data-sp-mode="wizard" class="sp-chip${mode === "wizard" ? " active" : ""}" aria-pressed="${mode === "wizard"}">質問で決める</button>
      </div>
      ${mode === "wizard" ? wizardBody() : pickBody()}
    </section>
  `;
}

// 適用時に metadata.mood へ入れるムード（質問では「雰囲気」の答え）
function activeMood() {
  return mode === "wizard" ? (answers.mood ?? "") : mood;
}

export function bindStartingPoint({ projectStore, setMessage, rerender, onPreview }) {
  // HubがProjectの曲想を持つ。起動時 / Hub再描画時に共有Intentへ同期する。
  syncCompositionIntentFromProject(projectStore.getSnapshot());

  document.querySelector("#toggle-starting-point")?.addEventListener("click", () => {
    open = !open;
    rerender();
  });

  document.querySelectorAll("[data-sp-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.spMode;
      rerender();
    });
  });
  document.querySelectorAll("[data-sp-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const [questionId, optionId] = button.dataset.spAnswer.split(":");
      answers = { ...answers, [questionId]: optionId };
      rerender();
    });
  });
  document.querySelector("#sp-wizard-back")?.addEventListener("click", () => {
    const last = [...QUESTIONS].reverse().find((question) => answers[question.id] !== undefined);
    if (last) {
      const { [last.id]: _removed, ...rest } = answers;
      answers = rest;
    }
    rerender();
  });
  document.querySelector("#sp-wizard-restart")?.addEventListener("click", () => {
    answers = {};
    rerender();
  });

  // 同じものをもう一度押すと選択解除
  document.querySelectorAll("[data-sp-genre]").forEach((button) => {
    button.addEventListener("click", () => {
      genre = genre === button.dataset.spGenre ? "" : button.dataset.spGenre;
      rerender();
    });
  });
  document.querySelectorAll("[data-sp-mood]").forEach((button) => {
    button.addEventListener("click", () => {
      mood = mood === button.dataset.spMood ? "" : button.dataset.spMood;
      rerender();
    });
  });

  document.querySelectorAll("[data-sp-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      const point = currentPoints()[Number(button.dataset.spPreview)];
      if (point) onPreview?.(point, { mood: activeMood() });
    });
  });

  document.querySelectorAll("[data-sp-apply]").forEach((button) => {
    button.addEventListener("click", () => {
      const point = currentPoints()[Number(button.dataset.spApply)];
      if (!point) return;
      const project = projectStore.getSnapshot();
      const ask = applyStartingPointConfirmText(project, point);
      if (ask && !globalThis.confirm(ask)) return;
      try {
        projectStore.applyStartingPoint(buildStartingPointPatch(project, point, { mood: activeMood() }));
        syncCompositionIntentFromProject(projectStore.getSnapshot());
        open = false;
        rerender();
        setMessage(`「${point.label}」を入れました。Chordで進行、Rhythmでドラムを確認して、メロディを乗せてみましょう。`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "出発点を入れられませんでした。", true);
      }
    });
  });
}
