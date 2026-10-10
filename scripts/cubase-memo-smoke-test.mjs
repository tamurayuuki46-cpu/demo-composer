import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import { buildCubaseMemo, TONE_HINTS } from "../src/hub/cubase-memo.js";
import { CONSULT_TEMPLATES, buildConsultText } from "../src/hub/consult-text.js";
import { SOUND_TONES } from "../src/core/sound-presets.js";

const BAR = 1920;
const project = createDefaultProject();

// 空の曲でも落ちず、必要な見出しが全部ある
const empty = buildCubaseMemo(project);
["■ 1.", "■ 2.", "■ 3.", "■ 4.", "■ 5.", "■ 6."].forEach((heading) => assert.ok(empty.includes(heading), heading));
assert.ok(empty.includes("まだありません"));
assert.ok(empty.includes("（まだ中身がありません）"));
assert.ok(empty.includes("構成はまだ決めていません"));

// 方向性タグのヒントが全Toneにある
SOUND_TONES.forEach((tone) => assert.ok(TONE_HINTS[tone.id], tone.id));

// コード・音色・構成が反映される
const filled = structuredClone(project);
filled.basic.bpm = 96;
filled.chords = [
  { root: 0, quality: "major", degree: "I", startTick: 0, durationTick: BAR },
  { root: 7, quality: "major", degree: "V", startTick: BAR, durationTick: BAR },
  { root: 0, quality: "major", degree: "I", startTick: BAR * 2, durationTick: BAR }
];
filled.tracks = [{ role: "melody", notes: [{ id: "m", pitch: 64, startTick: 0, durationTick: 240, velocity: 96 }] }];
filled.instruments = [{ part: "chord", preset: "pad", tone: "airy" }];
filled.structure = { ...(filled.structure ?? {}), sections: [{ id: "a", kind: "intro", name: "イントロ", bars: 4 }] };
const memo = buildCubaseMemo(filled);
assert.ok(memo.includes("BPM 96"));
assert.ok(memo.includes("登場順: C（I） / G（V）"), "unique chords in order");
assert.ok(memo.includes("I – V – I"));
assert.ok(memo.includes("Pad系") && memo.includes("Airy"));
assert.ok(memo.includes(TONE_HINTS.airy));
assert.ok(memo.includes("イントロ: Bar 1–4"));
assert.ok(memo.includes("- Melody.mid\n"), "melody exists");
assert.ok(memo.includes("- Bass.mid（まだ中身がありません）"));
assert.equal(project.chords.length, 0, "project not mutated");

// 相談テンプレート: 重複なし、文章あり、相談文に入る
assert.ok(CONSULT_TEMPLATES.length >= 5);
assert.equal(new Set(CONSULT_TEMPLATES.map((t) => t.id)).size, CONSULT_TEMPLATES.length);
assert.ok(CONSULT_TEMPLATES.every((t) => t.label && t.text.endsWith("。")));
assert.ok(buildConsultText(project, CONSULT_TEMPLATES[0].text).includes(CONSULT_TEMPLATES[0].text));

console.log("cubase memo smoke test passed");
