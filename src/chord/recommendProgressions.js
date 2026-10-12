import { CHORD_EMOTION_CATALOG } from "./chordEmotionCatalog.js";

const DIFFICULTY_LABEL = Object.freeze({
  standard: "王道",
  expressive: "少し個性的",
  adventurous: "挑戦的"
});

function normalizeSelectedTags(selectedTags) {
  if (Array.isArray(selectedTags)) {
    return [...new Set(selectedTags.filter(Boolean))];
  }

  if (!selectedTags || typeof selectedTags !== "object") {
    return [];
  }

  return [...new Set(
    Object.values(selectedTags)
      .flatMap((tags) => Array.isArray(tags) ? tags : [])
      .filter(Boolean)
  )];
}

function isModeCompatible(progressionMode, requestedMode) {
  if (!requestedMode || requestedMode === "any") return true;
  return progressionMode === requestedMode || progressionMode === "mixed";
}

function scoreProgression(progression, selectedTags) {
  const weightedTags = Object.values(progression.tags ?? {})
    .flatMap((group) => Object.entries(group ?? {}));

  const weightMap = new Map(weightedTags);
  const matchedTags = selectedTags.filter((tag) => weightMap.has(tag));
  const rawScore = matchedTags.reduce((sum, tag) => sum + Number(weightMap.get(tag) || 0), 0);
  const maxScore = selectedTags.length * 5;

  return {
    ...progression,
    score: maxScore > 0 ? rawScore / maxScore : 0,
    rawScore,
    matchedTags: matchedTags
      .map((tag) => ({ tag, weight: Number(weightMap.get(tag) || 0) }))
      .sort((a, b) => b.weight - a.weight),
    difficultyLabel: DIFFICULTY_LABEL[progression.difficulty] ?? progression.difficulty
  };
}

/**
 * 曲想タグからコード進行候補を返す。
 * 感情を断定する機能ではなく、探索候補を絞るための推薦ロジック。
 *
 * @param {Object|Array<string>} selectedTags
 * @param {{ mode?: "major"|"minor"|"any", limit?: number }} options
 * @returns {Array<Object>}
 */
export function recommendProgressions(selectedTags, options = {}) {
  const normalizedTags = normalizeSelectedTags(selectedTags);
  if (normalizedTags.length === 0) return [];

  const { mode = "any", limit = 3 } = options;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 10));

  const ranked = CHORD_EMOTION_CATALOG
    .filter((progression) => isModeCompatible(progression.mode, mode))
    .map((progression) => scoreProgression(progression, normalizedTags))
    .filter((progression) => progression.rawScore > 0)
    .sort((a, b) => {
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      if (b.matchedTags.length !== a.matchedTags.length) {
        return b.matchedTags.length - a.matchedTags.length;
      }
      return a.id.localeCompare(b.id);
    });

  // 3案表示時は「王道 / 少し個性的 / 挑戦的」が可能な範囲で混ざるようにする。
  const selected = [];
  const usedIds = new Set();
  const difficultyOrder = ["standard", "expressive", "adventurous"];

  for (const difficulty of difficultyOrder) {
    if (selected.length >= safeLimit) break;
    const candidate = ranked.find(
      (item) => item.difficulty === difficulty && !usedIds.has(item.id)
    );
    if (candidate) {
      selected.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  for (const candidate of ranked) {
    if (selected.length >= safeLimit) break;
    if (!usedIds.has(candidate.id)) {
      selected.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  return selected
    .sort((a, b) => b.rawScore - a.rawScore)
    .map((item, index) => ({
      rank: index + 1,
      id: item.id,
      degrees: item.degrees,
      mode: item.mode,
      difficulty: item.difficulty,
      difficultyLabel: item.difficultyLabel,
      score: Number(item.score.toFixed(3)),
      matchedTags: item.matchedTags.slice(0, 3),
      note: item.note
    }));
}

export { normalizeSelectedTags };
