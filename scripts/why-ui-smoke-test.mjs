import assert from "node:assert/strict";
import { whyHtml } from "../src/core/why-ui.js";

assert.equal(whyHtml(""), "");
assert.equal(whyHtml(null), "");
const html = whyHtml("コードトーン中心なので、安定して聞こえます。");
assert.match(html, /<details class="why"><summary>なぜ？<\/summary>/);
assert.match(html, /安定して聞こえます/);
assert.ok(!whyHtml("<b>x</b> & \"y\"").includes("<b>"), "escapes HTML");
assert.match(whyHtml("説明", { label: "理由" }), /<summary>理由<\/summary>/);
console.log("Why UI smoke test passed.");
