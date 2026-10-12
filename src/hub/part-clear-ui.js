import { clearMusicPart, musicPartHasData } from "../core/music-clear.js";

const PART_LABELS = Object.freeze({
  chord: "コード",
  melody: "メロディ",
  bass: "ベース",
  drums: "ドラム",
  counter: "裏メロ"
});

let open = false;

export function partClearHtml() {
  const toggle = `<button id="toggle-part-clear" class="song-card-toggle" aria-expanded="${open}">🧹 パートを消去${open ? " ▲" : " ▼"}</button>`;
  if (!open) return toggle;

  return `
    ${toggle}
    <section class="export-panel part-clear-panel">
      <h3>パートを消去</h3>
      <div class="export-grid" role="group" aria-label="消去するパート">
        <button class="danger" data-clear-music-part="chord">コードを消去</button>
        <button class="danger" data-clear-music-part="melody">メロディを消去</button>
        <button class="danger" data-clear-music-part="bass">ベースを消去</button>
        <button class="danger" data-clear-music-part="drums">ドラムを消去</button>
        <button class="danger" data-clear-music-part="counter">裏メロを消去</button>
      </div>
      <p class="hint">選んだパートだけを空にします。他のパート・Key・BPM・構成・音色は残ります。消去後も画面上部の ↶ で戻せます。</p>
      <p class="hint">コードだけ消してBassを残すこともできます。新しいコード進行を作るときは、現在の安全設定ではBassを先に消去してください。</p>
    </section>
  `;
}

export function bindPartClear({ projectStore, setMessage, rerender }) {
  document.querySelector("#toggle-part-clear")?.addEventListener("click", () => {
    open = !open;
    rerender();
  });

  const project = projectStore.getSnapshot();
  document.querySelectorAll("[data-clear-music-part]").forEach((button) => {
    const part = button.dataset.clearMusicPart;
    button.disabled = !musicPartHasData(project, part);

    button.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      if (!musicPartHasData(latest, part)) return;

      const label = PART_LABELS[part] ?? part;
      if (!globalThis.confirm(`${label}だけを消去します。他のパートは残ります。よろしいですか？（↶ で戻せます）`)) return;

      try {
        document.querySelector("#player-stop")?.click();
        projectStore.replaceProject(clearMusicPart(latest, part));
        rerender();
        const bassNote = part === "chord" && musicPartHasData(projectStore.getSnapshot(), "bass")
          ? " Bassは残っています。新しいコードを入れる場合はBassも先に消去してください。"
          : "";
        setMessage(`${label}を消去しました。他のパートは残っています。↶ で戻せます。${bassNote}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : `${label}を消去できませんでした。`, true);
      }
    });
  });
}
