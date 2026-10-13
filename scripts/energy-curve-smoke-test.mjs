import assert from "node:assert/strict";
import { curveFromSections, curveKinds, DEFAULT_CURVE, sectionsFromCurve } from "../src/core/energy-curve.js";
import { validateStructure } from "../src/core/section-ops.js";

// 基本: イントロ→Aメロ…の並びができる
const k = curveKinds(["low", "mid", "high", "low", "high"]).map((x) => x.kind);
assert.deepEqual(k, ["intro", "prechorus", "chorus", "interlude", "chorus"]);
assert.deepEqual(curveKinds(DEFAULT_CURVE).map((x) => x.kind), ["intro", "verse", "prechorus", "chorus", "outro"]);
// Midの次がHighならBメロ、サビのあとのMidはCメロ
assert.deepEqual(curveKinds(["low", "low", "mid", "high", "mid", "low"]).map((x) => x.kind), ["intro", "verse", "prechorus", "chorus", "bridge", "outro"]);

// 作られた構成は検証を通り、Energyが曲線のとおり、名前が重複しない
for (const levels of [DEFAULT_CURVE, ["low", "mid", "high", "mid", "high", "high", "low", "low"], ["high", "high", "high", "high"]]) {
  const sections = sectionsFromCurve(levels);
  assert.equal(sections.length, levels.length);
  assert.deepEqual(sections.map((s) => s.energy), levels);
  assert.doesNotThrow(() => validateStructure({ sections }));
  assert.equal(new Set(sections.map((s) => s.name)).size, sections.length);
}
assert.equal(sectionsFromCurve(["low", "mid", "high", "low", "high"])[4].name, "サビ2");

// 不正な曲線
assert.throws(() => sectionsFromCurve(["low", "mid", "high"]));
assert.throws(() => sectionsFromCurve(["low", "mid", "high", "x"]));

// 構成 → 曲線
assert.deepEqual(curveFromSections([]), [...DEFAULT_CURVE]);
assert.deepEqual(curveFromSections(sectionsFromCurve(["low", "mid", "high", "low", "high"])), ["low", "mid", "high", "low", "high"]);

console.log("energy-curve smoke test passed");
