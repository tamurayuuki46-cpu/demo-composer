import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAiChordBatch, makeAiChordPreviewProject, aiChordImportHtml } from "../src/hub/ai-chord-import.js";

const text = readFileSync(new URL("../examples/S001_ai_chord_candidates_v1.json", import.meta.url), "utf8");
const data = parseAiChordBatch(text);
assert.equal(data.candidates.length, 8);
assert.equal(data.candidates[0].chords.length, 16);
assert.equal(data.candidates[7].candidateId, "C08");
assert.equal(data.candidates[7].chords[0].root, "A");
assert.equal(data.candidates[7].chords[0].quality, "m7");
const project = makeAiChordPreviewProject(data, "C08");
assert.equal(project.schemaVersion, 3);
assert.equal(project.basic.bpm, 105);
assert.equal(project.basic.ppq, 480);
assert.equal(project.chords.length, 16);
assert.equal(project.chords[0].startTick, 0);
assert.equal(project.chords[1].startTick, 960);
assert.equal(project.chords[15].startTick, 14400);
assert.equal(project.chords[15].durationTick, 960);
assert.equal(project.tracks.length, 0);
assert.ok(aiChordImportHtml(data, "C08").includes("C08"));
assert.ok(aiChordImportHtml(null, null).includes("候補JSONを読み込む"));
assert.ok(aiChordImportHtml(null, null).includes("8案一括インポート"));
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
assert.ok(mainSource.includes("open-ai-chord-import-from-chord"));
assert.ok(mainSource.includes("ai-chord-import-panel"));
assert.throws(() => makeAiChordPreviewProject(data, "NOT_FOUND"));

function invalid(mutator) {
  const copy = JSON.parse(text);
  mutator(copy);
  assert.throws(() => parseAiChordBatch(JSON.stringify(copy)));
}
invalid((d) => { d.schemaVersion = 3; });
invalid((d) => { d.candidates[0].chords[0].beat = 2; });
invalid((d) => { d.candidates[0].chords[0].quality = "unknown"; });
invalid((d) => { d.candidates[1].candidateId = "C01"; });
invalid((d) => { d.candidates[0].chords.pop(); });
invalid((d) => { d.candidates[0].chords[0].bar = 99; });
invalid((d) => { d.settings.ppq = 960; });
invalid((d) => { d.candidates[0].chords[0] = { ...d.candidates[0].chords[1] }; });
assert.throws(() => parseAiChordBatch("not json"));
const malicious = JSON.parse(text);
malicious.candidates[0].description = "<script>alert(1)</script>";
const html = aiChordImportHtml(parseAiChordBatch(JSON.stringify(malicious)), "C01");
assert.ok(html.includes("&lt;script&gt;"));
assert.ok(!html.includes("<script>"));
console.log("AI chord batch Import: 8 candidates / 16 chords / validation PASS");
