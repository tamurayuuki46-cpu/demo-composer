import { buildCubaseMemo } from "./cubase-memo.js";
import { copyText } from "./clipboard.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 開いているか（画面の状態のみ）
let open = false;

export function cubaseMemoHtml(project) {
  return `
    <button id="toggle-cubase-memo" class="song-card-toggle" aria-expanded="${open}">Cubaseでやることメモ${open ? " ▲" : " ▼"}</button>
    ${open ? `
      <section class="export-panel cubase-memo-panel">
        <textarea id="cubase-memo-text" rows="14" readonly aria-label="Cubaseでやることメモ">${escapeHtml(buildCubaseMemo(project))}</textarea>
        <button id="cubase-memo-copy" class="export-primary consult-copy">メモをコピー</button>
        <p class="hint">いまの曲から自動で作ったメモです。コードや音色を変えると内容も変わります。コピーして、メモアプリやCubase側の作業メモに貼れます。</p>
      </section>
    ` : ""}
  `;
}

export function bindCubaseMemo({ projectStore, setMessage, rerender }) {
  document.querySelector("#toggle-cubase-memo")?.addEventListener("click", () => {
    open = !open;
    rerender();
  });

  document.querySelector("#cubase-memo-copy")?.addEventListener("click", async () => {
    const ok = await copyText(buildCubaseMemo(projectStore.getSnapshot()));
    setMessage(
      ok ? "Cubase用メモをコピーしました。" : "コピーできませんでした。テキスト欄を長押しして全体を選択してコピーしてください。",
      !ok
    );
  });
}
