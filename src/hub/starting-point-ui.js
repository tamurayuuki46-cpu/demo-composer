import { applyStartingPointConfirmText, buildStartingPointPatch, describeStartingPoint, GENRES, MOODS, progressionNames, suggestStartingPoints } from "./starting-point.js";

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

function chips(items, selected, attr, label) {
  return `<div class="sp-chips" role="group" aria-label="${label}">${items.map((item) => (
    `<button class="sp-chip${item.id === selected ? " active" : ""}" ${attr}="${item.id}" aria-pressed="${item.id === selected}">${escapeHtml(item.label)}</button>`
  )).join("")}</div>`;
}

export function startingPointHtml() {
  const toggle = `<button id="toggle-starting-point" class="song-card-toggle" aria-expanded="${open}">🧭 出発点を選ぶ（ジャンル × ムード）${open ? " ▲" : " ▼"}</button>`;
  if (!open) return toggle;

  const picked = genre !== "" || mood !== "";
  const points = picked ? suggestStartingPoints({ genre, mood }) : [];
  return `
    ${toggle}
    <section class="export-panel starting-point-panel">
      <h3>ジャンル</h3>
      ${chips(GENRES, genre, "data-sp-genre", "ジャンル")}
      <h3>ムード</h3>
      ${chips(MOODS, mood, "data-sp-mood", "ムード")}
      ${picked ? `
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
      ` : `<p class="hint">ジャンルかムードを1つ選ぶと、曲の出発点を3つ出します。どちらか片方だけでも大丈夫です。</p>`}
    </section>
  `;
}

export function bindStartingPoint({ projectStore, setMessage, rerender, onPreview }) {
  document.querySelector("#toggle-starting-point")?.addEventListener("click", () => {
    open = !open;
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
      const point = suggestStartingPoints({ genre, mood })[Number(button.dataset.spPreview)];
      if (point) onPreview?.(point, { mood });
    });
  });

  document.querySelectorAll("[data-sp-apply]").forEach((button) => {
    button.addEventListener("click", () => {
      const point = suggestStartingPoints({ genre, mood })[Number(button.dataset.spApply)];
      if (!point) return;
      const project = projectStore.getSnapshot();
      const ask = applyStartingPointConfirmText(project, point);
      if (ask && !globalThis.confirm(ask)) return;
      try {
        projectStore.applyStartingPoint(buildStartingPointPatch(project, point, { mood }));
        open = false;
        rerender();
        setMessage(`「${point.label}」を入れました。Chordで進行、Rhythmでドラムを確認して、メロディを乗せてみましょう。`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "出発点を入れられませんでした。", true);
      }
    });
  });
}
