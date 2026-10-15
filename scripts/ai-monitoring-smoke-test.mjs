import assert from "node:assert/strict";
import {
  AI_MONITORING_FEATURES,
  DECISION_PROGRESS_STATUSES,
  beginnerRecommendation,
  buildFeedback,
  deriveDecisionProgress,
  emptyUsageState,
  summarizeUsage
} from "../src/hub/ai-monitoring.js";

const state = emptyUsageState(1);
state.features.hub = { count: 4, lastUsed: 10 };
state.features.chord = { count: 2, lastUsed: 9 };
state.features.playback = { count: 3, lastUsed: 8 };

const summary = summarizeUsage(state);
assert.equal(summary.used.length, 3);
assert.equal(summary.unused.length, AI_MONITORING_FEATURES.length - 3);
assert.equal(summary.usedPercent + summary.unusedPercent, 100);
assert.equal(summary.ranked[0].id, "hub");

const feedback = buildFeedback(summary);
assert.match(feedback.positive, /Hub|記録/);
assert.match(feedback.negative, /未使用機能があっても問題ありません/);
assert.ok(feedback.suggestions.length <= 3);
const beginner = beginnerRecommendation(summary);
assert.match(beginner.nextTitle, /必要なら|十分/);

const baseProject = {
  id: "p1",
  revision: 7,
  metadata: {
    composition: {
      hook: "夜明け前の高揚感",
      highlight: "",
      tension: "",
      chorus: "",
      reference: "",
      axes: { melody: "", counter: "", harmony: "", rhythm: "", sound: "", vocal: "" },
      checks: { counter: "unnecessary", sound: "undecided", contrast: "undecided" },
      decisions: []
    }
  },
  chords: [{ root: 0 }],
  tracks: [
    { role: "melody", notes: [{ id: "m1" }] },
    { role: "bass", notes: [] },
    { role: "counter", notes: [] }
  ],
  structure: { sections: [{ id: "s1", name: "Chorus", purpose: "" }] },
  instruments: []
};

let progress = deriveDecisionProgress(baseProject, emptyUsageState(1));
const byId = Object.fromEntries(progress.items.map((item) => [item.id, item]));
assert.equal(byId.direction.status, "完了");
assert.equal(byId.chord.status, "探索中");
assert.equal(byId.melody.status, "探索中");
assert.equal(byId.section.status, "探索中");
assert.equal(byId.counter.status, "任意");
assert.equal(byId.daw.status, "未着手");
assert.match(progress.message, /100%を目指す進捗表ではありません/);
assert.ok(progress.items.every((item) => DECISION_PROGRESS_STATUSES.includes(item.status)));

const compareUsage = emptyUsageState(1);
compareUsage.features["chord-candidates"] = { count: 2, lastUsed: 2 };
compareUsage.features.phrase = { count: 1, lastUsed: 2 };
compareUsage.features.rhythm = { count: 1, lastUsed: 2 };
progress = deriveDecisionProgress(baseProject, compareUsage);
const compared = Object.fromEntries(progress.items.map((item) => [item.id, item]));
assert.equal(compared.chord.status, "比較中");
assert.equal(compared.melody.status, "比較中");
assert.equal(compared.bass.status, "保留");

const adoptedProject = structuredClone(baseProject);
adoptedProject.metadata.composition.decisions.push({ kind: "chord" }, { kind: "melody" });
progress = deriveDecisionProgress(adoptedProject, compareUsage);
const adopted = Object.fromEntries(progress.items.map((item) => [item.id, item]));
assert.equal(adopted.chord.status, "採用");
assert.equal(adopted.melody.status, "採用");

console.log(`AI monitoring decision-progress smoke test passed (${AI_MONITORING_FEATURES.length} usage signals kept as secondary data)`);
