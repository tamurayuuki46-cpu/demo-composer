import assert from "node:assert/strict";
import { applyPeakGuide, buildPeakGuide, currentPeak, defaultPeakBar, PEAK_SHAPES } from "../src/melody/peak-guide.js";
import { chordIntervals } from "../src/core/chord-qualities.js";

const BAR = 1920;
const chord = (bar, root, quality) => ({ startTick: bar * BAR, durationTick: BAR, root, quality, degree: "?" });
const project = (extra = {}) => ({
  basic: { ppq: 480, key: "C", scale: "major" },
  structure: { sections: [] },
  chords: [chord(0, 0, "major"), chord(1, 9, "minor"), chord(2, 5, "major"), chord(3, 7, "major"), chord(4, 0, "major"), chord(5, 9, "minor")],
  tracks: [{ role: "melody", notes: [] }],
  ...extra
});

// 3つの形すべてで: 山の小節が最も高く、全部コードの構成音、範囲内
for (const shape of PEAK_SHAPES) {
  const p = project();
  const guide = buildPeakGuide(p, { peakBar: 3, shapeId: shape.id });
  const peak = guide.bars.find((b) => b.role === "peak");
  assert.equal(peak.bar, 3, shape.id);
  const others = guide.bars.filter((b) => b.role !== "peak");
  assert.ok(others.every((b) => b.pitch < peak.pitch), `${shape.id}: peak highest`);
  guide.bars.forEach((b) => {
    const c = p.chords[b.bar];
    const tones = chordIntervals(c.quality).map((i) => (c.root + i) % 12);
    assert.ok(tones.includes(b.pitch % 12), `${shape.id} bar ${b.bar} chord tone`);
    assert.ok(b.pitch >= 48 && b.pitch <= 88);
  });
}
// 形のちがい: じわじわ上るは手前が段階的に上がり、「余韻」は山の次の小節がある
const rise = buildPeakGuide(project(), { peakBar: 3, shapeId: "rise" });
assert.deepEqual(rise.bars.map((b) => b.bar), [0, 1, 2, 3]);
assert.ok(rise.bars[0].pitch <= rise.bars[2].pitch);
const arc = buildPeakGuide(project(), { peakBar: 3, shapeId: "arc" });
assert.equal(arc.bars.at(-1).role, "after");
assert.equal(arc.bars.at(-1).bar, 4);
assert.ok(arc.bars.at(-1).pitch < arc.bars.find((b) => b.role === "peak").pitch);

// 山が先頭近くなら、手前の小節は減る（負の小節は作らない）
assert.deepEqual(buildPeakGuide(project(), { peakBar: 1, shapeId: "rise" }).bars.map((b) => b.bar), [0, 1]);
// コードが無い小節は主音のコードで代用
const noChords = buildPeakGuide(project({ chords: [] }), { peakBar: 3, shapeId: "rise" });
assert.equal(noChords.bars.length, 4);
assert.ok(noChords.bars.every((b) => [0, 4, 7].includes(b.pitch % 12)));
assert.throws(() => buildPeakGuide(project(), { peakBar: -1, shapeId: "rise" }));

// 適用: 空の小節にだけ置く。入力済みの小節は触らない
const existing = [{ id: "e", pitch: 62, startTick: BAR, durationTick: 480, velocity: 90 }];
const applied = applyPeakGuide(existing, rise, { barTicks: BAR });
assert.equal(applied.placed, 3);
assert.equal(applied.skipped, 1);
assert.ok(applied.notes.some((n) => n.id === "e"));
assert.equal(applied.notes.filter((n) => n.startTick === BAR).length, 1);
assert.equal(applied.notes.find((n) => n.startTick === 3 * BAR).durationTick, BAR);

// いまの最高音 / 初期の山の小節
assert.equal(currentPeak(project()), null);
const withMelody = project({ tracks: [{ role: "melody", notes: [{ id: "a", pitch: 60, startTick: 0, durationTick: 480, velocity: 90 }, { id: "b", pitch: 72, startTick: 2 * BAR, durationTick: 480, velocity: 90 }] }] });
assert.deepEqual(currentPeak(withMelody), { bar: 2, pitch: 72 });
assert.equal(defaultPeakBar(withMelody), 2);
assert.equal(defaultPeakBar(project()), 3);
assert.equal(defaultPeakBar(project({ structure: { sections: [{ id: "1", kind: "verse", name: "Aメロ", bars: 8 }, { id: "2", kind: "chorus", name: "サビ", bars: 8 }] } })), 8);

console.log("peak-guide smoke test passed");
