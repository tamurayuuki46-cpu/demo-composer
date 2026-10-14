import assert from "node:assert/strict";
import {
  AI_MONITORING_FEATURES,
  beginnerRecommendation,
  buildFeedback,
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
assert.ok(summary.categories.some((item) => item.category === "作曲"));

const feedback = buildFeedback(summary);
assert.match(feedback.positive, /Hub|主要機能|記録/);
assert.ok(feedback.negative.length > 0);
assert.ok(feedback.suggestions.length > 0 && feedback.suggestions.length <= 3);
assert.ok(feedback.suggestions.every((feature) => summary.unused.some((unused) => unused.id === feature.id)));

const beginner = beginnerRecommendation(summary);
assert.equal(beginner.next?.id, feedback.suggestions[0]?.id);
assert.match(beginner.nextTitle, /まずは/);
assert.ok(beginner.positive.length > 0);
assert.ok(beginner.improvement.length > 0);

const complete = emptyUsageState(1);
for (const feature of AI_MONITORING_FEATURES) complete.features[feature.id] = { count: 1, lastUsed: 1 };
const completeSummary = summarizeUsage(complete);
assert.equal(completeSummary.usedPercent, 100);
assert.equal(completeSummary.unusedPercent, 0);
assert.equal(buildFeedback(completeSummary).suggestions.length, 0);
assert.equal(beginnerRecommendation(completeSummary).next, null);
assert.match(beginnerRecommendation(completeSummary).nextTitle, /一通り/);

console.log(`AI monitoring smoke test passed (${AI_MONITORING_FEATURES.length} monitored features, beginner view included)`);
