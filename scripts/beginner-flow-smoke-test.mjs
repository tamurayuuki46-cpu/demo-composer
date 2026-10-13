import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BEGINNER_FLOW, BEGINNER_MODE_DEFAULT, MORE_IDEAS } from "../src/hub/beginner-flow.js";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../src/hub/beginner-flow.css", import.meta.url), "utf8");
const source = await readFile(new URL("../src/hub/beginner-flow.js", import.meta.url), "utf8");

assert.equal(BEGINNER_MODE_DEFAULT, true, "Beginner mode should be the default");
assert.deepEqual(
  BEGINNER_FLOW.map((step) => step.screen),
  ["hub", "chord", "melody", "rhythm", "arrange"],
  "The beginner route must stay one clear path"
);

for (const step of BEGINNER_FLOW) {
  assert.equal(MORE_IDEAS[step.screen].length, 5, `${step.screen} must expose exactly five more-to-try ideas`);
}

assert.match(source, /仮決めでOK。あとからいつでも戻って直せます。/);
assert.match(source, /もっと試す — 候補を5つ見る/);
assert.match(source, /寄り道：/);
assert.match(source, /beginner-return/);
assert.match(source, /beginner-extra-next/);
assert.match(source, /Arrangement Labへ/);
assert.doesNotMatch(source, /完了条件/);
assert.match(html, /src\/hub\/beginner-flow\.css/);
assert.match(html, /src\/hub\/beginner-flow-entry\.js/);
assert.match(css, /data-screen="counter"/);
assert.match(css, /data-screen="sound"/);
assert.match(css, /beginner-more-open/);

console.log("Beginner guided flow smoke test passed: one path, reversible detours, five optional ideas.");
