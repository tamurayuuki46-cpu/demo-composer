// Undo / Redoボタンの表示と操作。Project Storeの履歴APIだけを使い、Moduleには依存しない。
export function bindEditHistory({ projectStore, rerender, getCurrentScreen, onMessage }) {
  const undoButton = document.querySelector("#history-undo");
  const redoButton = document.querySelector("#history-redo");
  if (!undoButton || !redoButton) return () => {};

  function refresh() {
    const { canUndo, canRedo, undoCount, redoCount } = projectStore.getHistoryState();
    undoButton.disabled = !canUndo;
    redoButton.disabled = !canRedo;
    undoButton.setAttribute("aria-label", canUndo ? `元に戻す（あと${undoCount}回）` : "元に戻す（できる操作なし）");
    redoButton.setAttribute("aria-label", canRedo ? `やり直す（あと${redoCount}回）` : "やり直す（できる操作なし）");
  }

  function apply(action, message) {
    const result = action();
    if (!result) return;

    // 画面の入力状態（選択中のBarなど）は保ったまま、表示だけ最新Projectへ更新する。
    rerender(getCurrentScreen());
    onMessage?.(message);
  }

  undoButton.addEventListener("click", () => apply(() => projectStore.undo(), "操作を元に戻しました。"));
  redoButton.addEventListener("click", () => apply(() => projectStore.redo(), "操作をやり直しました。"));

  const unsubscribe = projectStore.subscribe(refresh);
  refresh();
  return unsubscribe;
}
