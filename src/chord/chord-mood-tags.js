import { CHORD_PRESETS, CHORD_PRESET_CATEGORIES } from "./chord-presets.js";

// コード進行の印象を断定するためではなく、Preset探索を助けるためのタグ。
// id は内部用。label はUI表示用。既存Hub Moodの bright / sad / night / strong / gentle と互換。
export const CHORD_MOOD_TAG_GROUPS = Object.freeze({
  emotion: Object.freeze([
    { id: "bright", label: "明るい" },
    { id: "sad", label: "切ない" },
    { id: "hope", label: "希望" },
    { id: "uplifting", label: "高揚" },
    { id: "gentle", label: "優しい" },
    { id: "wistful", label: "哀愁" },
    { id: "tension", label: "緊張" },
    { id: "calm", label: "安心" },
    { id: "strong", label: "力強い" }
  ]),
  texture: Object.freeze([
    { id: "floating", label: "浮遊感" },
    { id: "transparent", label: "透明" },
    { id: "warm", label: "暖かい" },
    { id: "dark", label: "ダーク" },
    { id: "grand", label: "壮大" },
    { id: "open", label: "開放感" },
    { id: "urban", label: "都会的" },
    { id: "dreamy", label: "幻想的" },
    { id: "driving", label: "疾走感" }
  ]),
  scene: Object.freeze([
    { id: "night", label: "夜" },
    { id: "youth", label: "青春" },
    { id: "rain", label: "雨" },
    { id: "drive", label: "ドライブ" },
    { id: "farewell", label: "別れ" },
    { id: "departure", label: "旅立ち" },
    { id: "nostalgia", label: "回想" }
  ])
});

export const CHORD_MOOD_TAGS = Object.freeze(
  Object.entries(CHORD_MOOD_TAG_GROUPS).flatMap(([group, tags]) =>
    tags.map((tag) => Object.freeze({ ...tag, group }))
  )
);

const BASE_PRESET_IDS = new Set([
  "pop-1564",
  "jpop-4536",
  "pop-1645",
  "pop-6415",
  "cadence-2511",
  "canon"
]);

const CATEGORY_WEIGHTS = Object.freeze({
  bright: {
    bright: 5, hope: 4, uplifting: 3, open: 4, youth: 4, departure: 3
  },
  sad: {
    sad: 5, wistful: 4, transparent: 3, youth: 4, farewell: 3, nostalgia: 3
  },
  rock: {
    strong: 5, uplifting: 4, driving: 5, open: 3, drive: 4
  },
  ballad: {
    gentle: 5, calm: 4, warm: 5, wistful: 3, nostalgia: 4
  },
  loop: {
    uplifting: 4, driving: 5, open: 3, drive: 4, night: 2
  },
  jazz: {
    gentle: 3, calm: 2, warm: 3, urban: 5, night: 5, floating: 2
  },
  minor: {
    sad: 4, wistful: 5, tension: 4, dark: 5, night: 4, rain: 3
  }
});

function mergeWeights(...maps) {
  const merged = {};
  for (const map of maps) {
    for (const [tagId, weight] of Object.entries(map ?? {})) {
      merged[tagId] = Math.max(merged[tagId] ?? 0, weight);
    }
  }
  return merged;
}

function sequenceWeights(preset) {
  const degrees = preset.degreeIndexes;
  const first = degrees[0];
  const last = degrees.at(-1);
  const unique = new Set(degrees).size;
  const weights = {};

  // vi / VI始まりは、明暗をまたいだ「切なさ＋前進感」を作りやすい。
  if (first === 5) Object.assign(weights, { sad: 4, wistful: 3, driving: 3 });

  // V終わりは次のIへ進みたくなる未解決感。
  if (last === 4) Object.assign(weights, { tension: 3, hope: 2 });

  // I終わりは安定。vi終わりは余韻。vii°を含むと緊張を強める。
  if (last === 0) Object.assign(weights, { calm: 4 });
  if (last === 5) Object.assign(weights, { sad: 4, wistful: 4, farewell: 2 });
  if (degrees.includes(6)) Object.assign(weights, { tension: 4, dark: 3 });

  // 同じ度数を往復する短いLoopは推進感を付けやすい。
  if (unique <= 2 && degrees.length === 4) Object.assign(weights, { driving: 4 });

  // 8小節Presetは4小節より物語的な展開を作りやすい。
  if (degrees.length >= 8) Object.assign(weights, { grand: 3, departure: 2 });

  return weights;
}

function difficultyForPreset(preset) {
  if (BASE_PRESET_IDS.has(preset.id)) return "standard";
  if (preset.degreeIndexes.length >= 8) return "adventurous";
  return "expressive";
}

function tagInfo(tagId) {
  return CHORD_MOOD_TAGS.find((tag) => tag.id === tagId) ?? { id: tagId, label: tagId, group: "other" };
}

export function chordMoodProfile(presetOrId) {
  const preset = typeof presetOrId === "string"
    ? CHORD_PRESETS.find((item) => item.id === presetOrId)
    : presetOrId;

  if (!preset) return null;

  const weights = mergeWeights(
    CATEGORY_WEIGHTS[preset.category],
    sequenceWeights(preset)
  );

  const tags = Object.entries(weights)
    .map(([id, weight]) => ({ ...tagInfo(id), weight }))
    .sort((a, b) => (b.weight - a.weight) || a.label.localeCompare(b.label, "ja"));

  return Object.freeze({
    presetId: preset.id,
    category: preset.category,
    mode: CHORD_PRESET_CATEGORIES.find((item) => item.id === preset.category)?.mode ?? "major",
    difficulty: difficultyForPreset(preset),
    tags: Object.freeze(tags)
  });
}

export const CHORD_MOOD_PROFILES = Object.freeze(
  CHORD_PRESETS.map((preset) => chordMoodProfile(preset))
);

function normalizeTagIds(selectedTags) {
  if (!selectedTags) return [];
  const values = Array.isArray(selectedTags)
    ? selectedTags
    : Object.values(selectedTags).flatMap((value) => Array.isArray(value) ? value : []);
  return [...new Set(values.filter((tagId) => CHORD_MOOD_TAGS.some((tag) => tag.id === tagId)))];
}

function scoreProfile(profile, tagIds) {
  const byId = new Map(profile.tags.map((tag) => [tag.id, tag.weight]));
  const matchedTags = tagIds
    .filter((tagId) => byId.has(tagId))
    .map((tagId) => ({ ...tagInfo(tagId), weight: byId.get(tagId) }))
    .sort((a, b) => b.weight - a.weight);
  const rawScore = matchedTags.reduce((sum, tag) => sum + tag.weight, 0);
  return { profile, rawScore, matchedTags };
}

export function recommendChordPresetsByMood(selectedTags, { mode = "any", limit = 3 } = {}) {
  const tagIds = normalizeTagIds(selectedTags);
  if (tagIds.length === 0) return [];

  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 10));
  const ranked = CHORD_MOOD_PROFILES
    .filter((profile) => mode === "any" || profile.mode === mode)
    .map((profile) => scoreProfile(profile, tagIds))
    .filter((item) => item.rawScore > 0)
    .sort((a, b) => {
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      if (b.matchedTags.length !== a.matchedTags.length) return b.matchedTags.length - a.matchedTags.length;
      return a.profile.presetId.localeCompare(b.profile.presetId);
    });

  // 3候補のときは、可能な範囲で「王道 / 少し個性的 / 挑戦的」を混ぜる。
  const selected = [];
  const usedIds = new Set();
  for (const difficulty of ["standard", "expressive", "adventurous"]) {
    if (selected.length >= safeLimit) break;
    const hit = ranked.find((item) => item.profile.difficulty === difficulty && !usedIds.has(item.profile.presetId));
    if (hit) {
      selected.push(hit);
      usedIds.add(hit.profile.presetId);
    }
  }
  for (const item of ranked) {
    if (selected.length >= safeLimit) break;
    if (!usedIds.has(item.profile.presetId)) {
      selected.push(item);
      usedIds.add(item.profile.presetId);
    }
  }

  return selected
    .sort((a, b) => b.rawScore - a.rawScore)
    .map(({ profile, rawScore, matchedTags }, index) => {
      const preset = CHORD_PRESETS.find((item) => item.id === profile.presetId);
      return {
        rank: index + 1,
        presetId: profile.presetId,
        label: preset?.label ?? profile.presetId,
        category: profile.category,
        mode: profile.mode,
        difficulty: profile.difficulty,
        score: Number((rawScore / (tagIds.length * 5)).toFixed(3)),
        matchedTags: matchedTags.slice(0, 3),
        degreeIndexes: [...(preset?.degreeIndexes ?? [])]
      };
    });
}

export function chordMoodTagLabel(tagId) {
  return tagInfo(tagId).label;
}

// 選択肢に添える「曲想 / 質感 / 場面」の文字。各グループで1つずつ。
// カテゴリ共通のタグだけだと同じ文字が並ぶので、その進行ならではの特徴（終わり方・出だし・長さ・dim）から来たタグを少し優先する
const MOOD_GROUP_LABELS = Object.freeze({ emotion: "曲想", texture: "質感", scene: "場面" });
const SEQUENCE_BONUS = 2;
export function chordPresetMoodText(presetOrId) {
  const preset = typeof presetOrId === "string" ? CHORD_PRESETS.find((item) => item.id === presetOrId) : presetOrId;
  const profile = chordMoodProfile(preset);
  if (!profile) return "";
  const own = sequenceWeights(preset);
  return Object.entries(MOOD_GROUP_LABELS)
    .map(([group, label]) => {
      const top = profile.tags
        .filter((tag) => tag.group === group)
        .map((tag) => ({ tag, score: tag.weight + (own[tag.id] ? SEQUENCE_BONUS : 0) }))
        .sort((a, b) => (b.score - a.score) || (b.tag.weight - a.tag.weight))[0]?.tag;
      return top ? `${label} ${top.label}` : null;
    })
    .filter(Boolean)
    .join("｜");
}

// 曲想（感情）タグを1つ選んで、そのタグが強い順に並べた一覧。minWeight 未満（そのタグが弱い進行）は出さない。
// 同じ重みなら、王道 → 少し個性的 → 挑戦的 の順（まず定番から見られるように）
const DIFFICULTY_ORDER = Object.freeze({ standard: 0, expressive: 1, adventurous: 2 });
export function chordPresetsForEmotion(tagId, { mode = "any", minWeight = 3 } = {}) {
  if (!CHORD_MOOD_TAG_GROUPS.emotion.some((tag) => tag.id === tagId)) return [];
  return CHORD_MOOD_PROFILES
    .filter((profile) => mode === "any" || profile.mode === mode)
    .map((profile) => ({ profile, weight: profile.tags.find((tag) => tag.id === tagId)?.weight ?? 0 }))
    .filter((item) => item.weight >= minWeight)
    .sort((a, b) => (b.weight - a.weight)
      || (DIFFICULTY_ORDER[a.profile.difficulty] - DIFFICULTY_ORDER[b.profile.difficulty])
      || a.profile.presetId.localeCompare(b.profile.presetId))
    .map(({ profile, weight }) => {
      const preset = CHORD_PRESETS.find((item) => item.id === profile.presetId);
      return {
        presetId: profile.presetId,
        label: preset?.label ?? profile.presetId,
        mode: profile.mode,
        difficulty: profile.difficulty,
        weight,
        degreeIndexes: [...(preset?.degreeIndexes ?? [])]
      };
    });
}
