import { isChordQuality } from "../core/chord-qualities.js";
import { chordDegreeForVariant, chordSymbol, rootToPitchClass } from "./chord-theory.js";

// 好きな曲のコード進行を「度数（主音からの距離 + コードの種類）」で保存するライブラリ。
// 曲のデータ（project.json）とは別に、この端末のlocalStorageにだけ保存する。Schema変更なし。
// 度数で持つので、保存した曲と違うKeyの曲にも、そのまま当てはめられる。

const STORAGE_KEY = "demo-composer.progressionLibrary";
export const MAX_LIBRARY_ENTRIES = 50;
export const MAX_PROGRESSION_CHORDS = 32;
export const MAX_NAME_LENGTH = 40;

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `prog-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 現在のコード進行 → [{ offset(0〜11), quality }]
export function progressionFromChords(chords, key) {
  const tonic = rootToPitchClass(key);
  return chords.map((chord) => ({ offset: (chord.root - tonic + 12) % 12, quality: chord.quality }));
}

// 度数の進行 → 指定Keyのコード（project.chordsの形）
export function chordsFromProgression(items, { key, barTicks }) {
  const tonic = rootToPitchClass(key);
  return items.map((item, index) => {
    const root = (tonic + item.offset) % 12;
    return {
      root,
      quality: item.quality,
      degree: chordDegreeForVariant(root, key, item.quality),
      startTick: index * barTicks,
      durationTick: barTicks
    };
  });
}

// 画面表示用。例: "I – V – vi – IV" / "C – G – Am – F"（指定Key）
export function progressionDegreeText(items, key) {
  return chordsFromProgression(items, { key, barTicks: 1 }).map((chord) => chord.degree).join(" – ");
}

export function progressionNameText(items, key) {
  return chordsFromProgression(items, { key, barTicks: 1 }).map((chord) => chordSymbol(chord.root, chord.quality)).join(" – ");
}

function validItems(items) {
  return Array.isArray(items)
    && items.length >= 1
    && items.length <= MAX_PROGRESSION_CHORDS
    && items.every((item) => Number.isInteger(item?.offset) && item.offset >= 0 && item.offset <= 11 && isChordQuality(item.quality));
}

// 壊れたデータは捨てて、使えるものだけ返す
export function normalizeLibrary(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => typeof entry?.id === "string" && typeof entry?.name === "string" && validItems(entry.chords))
    .slice(0, MAX_LIBRARY_ENTRIES)
    .map((entry) => ({
      id: entry.id,
      name: entry.name.slice(0, MAX_NAME_LENGTH),
      chords: entry.chords.map((item) => ({ offset: item.offset, quality: item.quality }))
    }));
}

export function loadLibrary(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? normalizeLibrary(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

// 保存できたらtrue
export function saveLibrary(list, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeLibrary(list)));
    return true;
  } catch {
    return false;
  }
}

// 追加。名前が空なら「好きな進行 N」。上限・空の進行はエラー
export function addEntry(list, { name, chords, key }) {
  if (chords.length === 0) throw new Error("コードがまだありません。");
  if (chords.length > MAX_PROGRESSION_CHORDS) throw new Error(`保存できるのは${MAX_PROGRESSION_CHORDS}小節までです。`);
  if (list.length >= MAX_LIBRARY_ENTRIES) throw new Error(`保存できるのは${MAX_LIBRARY_ENTRIES}件までです。不要な進行を削除してください。`);

  const trimmed = String(name ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const entry = {
    id: createId(),
    name: trimmed || `好きな進行 ${list.length + 1}`,
    chords: progressionFromChords(chords, key)
  };
  return [...list, entry];
}

export function removeEntry(list, id) {
  return list.filter((entry) => entry.id !== id);
}
