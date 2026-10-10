// 画面の文字サイズ（3段階）。端末ごとの表示設定なので、project.jsonには入れず、この端末のlocalStorageにだけ保存する。
// 画面本体（#screen）だけを拡大し、上部バー・Demo Player・下部ナビは変えない（常に押しやすい大きさのまま）。

export const TEXT_SIZES = Object.freeze([
  { id: "normal", label: "標準", scale: 1 },
  { id: "large", label: "大", scale: 1.15 },
  { id: "xlarge", label: "特大", scale: 1.3 }
]);

const STORAGE_KEY = "demo-composer.textSize";

export function normalizeTextSize(value) {
  return TEXT_SIZES.some((size) => size.id === value) ? value : "normal";
}

export function loadTextSize(storage = globalThis.localStorage) {
  try {
    return normalizeTextSize(storage?.getItem(STORAGE_KEY));
  } catch {
    return "normal";
  }
}

export function saveTextSize(id, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, normalizeTextSize(id));
  } catch {
    // 保存できなくても、今のセッションでは反映される
  }
}

export function applyTextSize(id, root = globalThis.document?.documentElement) {
  if (root) root.dataset.textSize = normalizeTextSize(id);
}
