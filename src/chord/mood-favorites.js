// 曲想タグの組み合わせを「お気に入り」として端末に保存する。
// 端末のlocalStorageにだけ保存し、project.json・コード・MIDIには入れない（Schema変更なし）。
// 使えない環境（プライベートウィンドウなど）では何も保存せず、画面はそのまま動く。

const STORAGE_KEY = "demo-composer.moodFavorites.v1";
export const MAX_FAVORITES = 12;

function normalizeTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : []).filter((tag) => typeof tag === "string" && tag))].sort();
}

export function favoriteKey(tags) {
  return normalizeTags(tags).join("+");
}

export function loadMoodFavorites(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ tags: normalizeTags(item?.tags) }))
      .filter((item) => item.tags.length > 0)
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function write(list, storage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

// 追加。同じ組み合わせがあれば先頭へ移すだけ。上限を超えたら一番古いものを捨てる
export function addMoodFavorite(tags, storage = globalThis.localStorage) {
  const normalized = normalizeTags(tags);
  if (normalized.length === 0) return loadMoodFavorites(storage);
  const key = favoriteKey(normalized);
  const rest = loadMoodFavorites(storage).filter((item) => favoriteKey(item.tags) !== key);
  const next = [{ tags: normalized }, ...rest].slice(0, MAX_FAVORITES);
  write(next, storage);
  return next;
}

export function removeMoodFavorite(tags, storage = globalThis.localStorage) {
  const key = favoriteKey(tags);
  const next = loadMoodFavorites(storage).filter((item) => favoriteKey(item.tags) !== key);
  write(next, storage);
  return next;
}

export function isMoodFavorite(tags, storage = globalThis.localStorage) {
  const key = favoriteKey(tags);
  return key !== "" && loadMoodFavorites(storage).some((item) => favoriteKey(item.tags) === key);
}
