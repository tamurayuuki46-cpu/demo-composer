import assert from "node:assert/strict";
import { suggestNextChords, suggestSpiceChords } from "../src/chord/chord-next.js";
import { getDiatonicChords } from "../src/chord/chord-theory.js";
import { chordRole } from "../src/chord/chord-role.js";
import { degreeLabel } from "../src/melody/melody-grid.js";
import { applyBassCandidate, bassCandidatesForBar, bassPatternDots } from "../src/rhythm/bass-candidates.js";

const BAR = 1920;
const STEP = 120;

// --- 次のコード候補: 全Key / Scale / 全ダイアトニックの直後で、常に3つ・ダイアトニック内・重複なし
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
for (const scale of ["major", "minor"]) {
  for (const key of KEYS) {
    const diatonic = getDiatonicChords(key, scale);
    const inScale = new Set(diatonic.map((c) => `${c.root}:${c.quality}`));
    for (const chord of [undefined, ...diatonic]) {
      const chords = chord ? [chord] : [];
      const next = suggestNextChords(chords, { key, scale });
      assert.equal(next.length, 3, `${key} ${scale}`);
      assert.equal(new Set(next.map((c) => `${c.root}:${c.quality}`)).size, 3, "no duplicates");
      assert.ok(next.every((c) => inScale.has(`${c.root}:${c.quality}`) && c.reason && c.degree && c.symbol));
    }
  }
}
// C major: Iの次はV / vi / IV、始まりはI / vi / IV
assert.deepEqual(suggestNextChords([{ root: 0, quality: "major" }], { key: "C", scale: "major" }).map((c) => c.symbol), ["G", "Am", "F"]);
assert.deepEqual(suggestNextChords([], { key: "C", scale: "major" }).map((c) => c.symbol), ["C", "Am", "F"]);
// ダイアトニック外のコードの直後は、始まりの候補
assert.equal(suggestNextChords([{ root: 1, quality: "major" }], { key: "C", scale: "major" })[0].symbol, "C");

// --- ひとスパイス: Cmajor = Fm / B♭ / A♭、Aminor = D / E / A（Major側から借用）
assert.deepEqual(suggestSpiceChords({ key: "C", scale: "major" }).map((c) => [c.symbol, c.degree]), [["Fm", "iv"], ["A#", "♭VII"], ["G#", "♭VI"]]);
assert.deepEqual(suggestSpiceChords({ key: "A", scale: "minor" }).map((c) => [c.symbol, c.degree]), [["D", "IV"], ["E", "V"], ["A", "I"]]);
// 借用和音は、どのKey / Scaleでもダイアトニック外（＝借用になっている）で、常に3つ
for (const scale of ["major", "minor"]) {
  for (const key of KEYS) {
    const diatonic = new Set(getDiatonicChords(key, scale).map((c) => `${c.root}:${c.quality}`));
    const spice = suggestSpiceChords({ key, scale });
    assert.equal(spice.length, 3);
    assert.ok(spice.every((c) => !diatonic.has(`${c.root}:${c.quality}`)), `${key} ${scale} spice is borrowed`);
  }
}

// --- コードの役割: 全ダイアトニックに一言があり、ダイアトニック外は「借用」、コード無しは null
for (const scale of ["major", "minor"]) {
  for (const key of KEYS) {
    for (const chord of getDiatonicChords(key, scale)) {
      const role = chordRole(chord, { key, scale });
      assert.ok(role.label && role.hint, `${key} ${scale} ${chord.degree}`);
      assert.notEqual(role.label, "借用");
    }
  }
}
assert.equal(chordRole({ root: 0, quality: "major" }, { key: "C", scale: "major" }).label, "安定");
assert.equal(chordRole({ root: 7, quality: "major" }, { key: "C", scale: "major" }).label, "緊張");
assert.equal(chordRole({ root: 5, quality: "minor" }, { key: "C", scale: "major" }).label, "借用");
assert.equal(chordRole(undefined, { key: "C", scale: "major" }), null);

// --- 度数ラベル（Cをルートにした C4=R / E4=3 / G4=5、Gをルートにした B=3 / F=♭7）
assert.deepEqual([60, 64, 67, 70, 71].map((p) => degreeLabel(p, 0)), ["R", "3", "5", "♭7", "7"]);
assert.deepEqual([71, 65, 67].map((p) => degreeLabel(p, 7)), ["3", "♭7", "R"]);
assert.equal(degreeLabel(48, 7), "4", "octave independent, below root pc");

// --- Bass候補
const project = (drumNotes = [], chord = { root: 0, quality: "major" }) => ({
  basic: { key: "C", ppq: 480 },
  chords: [chord, { root: 7, quality: "major" }],
  tracks: [{ role: "bass", notes: [] }, { role: "drums", notes: drumNotes }]
});
let id = 0;
const createId = () => `n${++id}`;

const plain = bassCandidatesForBar(project(), 0, { barTicks: BAR, stepTicks: STEP });
assert.equal(plain.length, 3);
assert.equal(plain[0].id, "root-long");

const kicks = [0, 6, 8].map((s) => ({ id: `k${s}`, pitch: 36, startTick: s * STEP, durationTick: STEP, velocity: 100 }));
const synced = bassCandidatesForBar(project(kicks), 0, { barTicks: BAR, stepTicks: STEP });
assert.equal(synced[0].id, "kick");
assert.deepEqual(synced[0].steps.map((s) => s.step), [0, 6, 8]);
assert.equal(bassPatternDots(synced[0].steps), "●・・・・・●・●・・・・・・・");
// 別小節のKickは影響しない
assert.equal(bassCandidatesForBar(project(kicks), 1, { barTicks: BAR, stepTicks: STEP })[0].id, "root-long");

// 適用: 2小節目(G)に置いても1小節目は変わらず、小節をはみ出さず、重ならない
const existing = [{ id: "old0", pitch: 36, startTick: 0, durationTick: 480, velocity: 100 },
  { id: "old1", pitch: 43, startTick: BAR + 240, durationTick: 240, velocity: 100 }];
const p = project();
for (const candidate of bassCandidatesForBar(p, 1, { barTicks: BAR, stepTicks: STEP })) {
  const out = applyBassCandidate(p, existing, 1, candidate, { barTicks: BAR, stepTicks: STEP, createId });
  assert.ok(out.some((n) => n.id === "old0"), "other bar kept");
  assert.ok(!out.some((n) => n.id === "old1"), "target bar replaced");
  const inBar = out.filter((n) => n.startTick >= BAR);
  assert.ok(inBar.length >= 2);
  assert.ok(inBar.every((n) => n.startTick + n.durationTick <= BAR * 2));
  assert.ok(inBar.every((n) => n.pitch >= 36 + 7 && n.pitch <= 36 + 7 + 12), "G root based");
  for (let i = 1; i < inBar.length; i += 1) assert.ok(inBar[i - 1].startTick + inBar[i - 1].durationTick <= inBar[i].startTick);
  assert.equal(new Set(out.map((n) => n.id)).size, out.length);
}
assert.equal(existing.length, 2, "input not mutated");

// 5度はコードの種類に合わせる（Am = 7半音、dim = 6半音）
const dimFifth = bassCandidatesForBar(project([], { root: 0, quality: "diminished" }), 0, { barTicks: BAR, stepTicks: STEP })[1];
assert.ok(dimFifth.steps.some((s) => s.semitones === 6));

console.log("candidates smoke test passed");
