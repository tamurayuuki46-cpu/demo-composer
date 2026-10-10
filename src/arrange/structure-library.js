import { createSection, ENERGY_LEVELS, MAX_SECTION_BARS, MAX_TOTAL_BARS, SECTION_KINDS, sectionEnergy } from "../core/section-ops.js";

// 好きな曲の「構成」だけ（Sectionの種類・小節数・盛り上がり）を保存するライブラリ。
// 曲の中身（コード・メロディ）は保存しない。曲のデータ（project.json）とは別に、この端末のlocalStorageにだけ保存する。
// Schema変更なし。進行ライブラリ（chord/progression-library.js）の構成版。

const STORAGE_KEY = "demo-composer.structureLibrary";
export const MAX_STRUCTURE_ENTRIES = 30;
export const MAX_STRUCTURE_SECTIONS = 20;
export const MAX_NAME_LENGTH = 40;

// 初めてでも使える見本（読み取り専用）。
export const STRUCTURE_SAMPLES = Object.freeze([
  {
    id: "sample-jpop",
    name: "見本: J-POP王道（フル尺）",
    sections: [
      { kind: "intro", bars: 4, energy: "low" }, { kind: "verse", bars: 8, energy: "low" },
      { kind: "prechorus", bars: 8, energy: "mid" }, { kind: "chorus", bars: 8, energy: "high" },
      { kind: "interlude", bars: 4, energy: "mid" }, { kind: "verse", bars: 8, energy: "low" },
      { kind: "prechorus", bars: 8, energy: "mid" }, { kind: "chorus", bars: 8, energy: "high" },
      { kind: "bridge", bars: 8, energy: "mid" }, { kind: "chorus", bars: 8, energy: "high" },
      { kind: "outro", bars: 4, energy: "low" }
    ]
  },
  {
    id: "sample-short",
    name: "見本: 短め（サビ先行）",
    sections: [
      { kind: "chorus", bars: 8, energy: "high" }, { kind: "verse", bars: 8, energy: "low" },
      { kind: "prechorus", bars: 4, energy: "mid" }, { kind: "chorus", bars: 8, energy: "high" },
      { kind: "outro", bars: 4, energy: "low" }
    ]
  },
  {
    id: "sample-dance",
    name: "見本: ダンス（ビルドとドロップ）",
    sections: [
      { kind: "intro", bars: 8, energy: "low" }, { kind: "prechorus", bars: 8, energy: "mid" },
      { kind: "chorus", bars: 16, energy: "high" }, { kind: "interlude", bars: 8, energy: "low" },
      { kind: "prechorus", bars: 8, energy: "mid" }, { kind: "chorus", bars: 16, energy: "high" },
      { kind: "outro", bars: 8, energy: "low" }
    ]
  }
]);

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `struct-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 現在のSection → [{ kind, bars, energy }]
export function structureFromSections(sections) {
  return sections.map((section) => ({ kind: section.kind, bars: section.bars, energy: sectionEnergy(section) }));
}

// 保存した構成 → Section（名前は「サビ2」のように番号を振る）。Transitionは持ち込まない。
export function sectionsFromStructure(items) {
  return items.reduce((sections, item) => {
    const section = createSection(item.kind, item.bars, sections);
    return [...sections, { ...section, energy: item.energy }];
  }, []);
}

export function structureText(items) {
  const total = items.reduce((sum, item) => sum + item.bars, 0);
  return `${items.map((item) => `${SECTION_KINDS[item.kind].label}${item.bars}`).join(" → ")}（全${total}小節）`;
}

function validItems(items) {
  return Array.isArray(items)
    && items.length >= 1
    && items.length <= MAX_STRUCTURE_SECTIONS
    && items.every((item) => Object.hasOwn(SECTION_KINDS, item?.kind)
      && Number.isInteger(item.bars) && item.bars >= 1 && item.bars <= MAX_SECTION_BARS
      && ENERGY_LEVELS.some((level) => level.id === item.energy))
    && items.reduce((sum, item) => sum + item.bars, 0) <= MAX_TOTAL_BARS;
}

// 壊れたデータは捨てて、使えるものだけ返す
export function normalizeLibrary(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => typeof entry?.id === "string" && typeof entry?.name === "string" && validItems(entry.sections))
    .slice(0, MAX_STRUCTURE_ENTRIES)
    .map((entry) => ({
      id: entry.id,
      name: entry.name.slice(0, MAX_NAME_LENGTH),
      sections: entry.sections.map((item) => ({ kind: item.kind, bars: item.bars, energy: item.energy }))
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

// 追加。名前が空なら「好きな構成 N」。構成が空・長すぎる・上限超えはエラー
export function addEntry(list, { name, sections }) {
  if (sections.length === 0) throw new Error("構成がまだありません。");
  const items = structureFromSections(sections);
  if (!validItems(items)) throw new Error(`保存できる構成は${MAX_STRUCTURE_SECTIONS}Section・全${MAX_TOTAL_BARS}小節までです。`);
  if (list.length >= MAX_STRUCTURE_ENTRIES) throw new Error(`保存できるのは${MAX_STRUCTURE_ENTRIES}件までです。不要な構成を削除してください。`);

  const trimmed = String(name ?? "").trim().slice(0, MAX_NAME_LENGTH);
  return [...list, { id: createId(), name: trimmed || `好きな構成 ${list.length + 1}`, sections: items }];
}

export function removeEntry(list, id) {
  return list.filter((entry) => entry.id !== id);
}
