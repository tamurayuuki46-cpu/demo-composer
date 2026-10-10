import assert from "node:assert/strict";
import { createDefaultProject } from "../src/core/project-state.js";
import { skeletonCheck } from "../src/core/skeleton-check.js";
import { withCounterNotes } from "../src/core/counter-melody.js";

const BAR = 1920;
const ids = (check) => check.items.map((item) => item.id);
const marks = (check) => Object.fromEntries(check.items.map((item) => [item.id, item.mark]));

// --- 空のProject: すべて「－」、次はChord
const empty = createDefaultProject();
const emptyCheck = skeletonCheck(empty);
assert.deepEqual(ids(emptyCheck), ["chord", "melody", "bass", "drums", "structure", "energy", "sound"]);
assert.ok(emptyCheck.items.every((item) => item.mark === "none"));
assert.equal(emptyCheck.doneCount, 0);
assert.equal(emptyCheck.complete, false);
assert.equal(emptyCheck.next.id, "chord");
assert.equal(emptyCheck.next.screen, "chord");

function track(role, notes) {
  return { role, name: role, midiChannel: 2, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes };
}
const noteAt = (bar, pitch = 60) => ({ id: `${bar}-${pitch}`, pitch, startTick: bar * BAR, durationTick: 480, velocity: 90 });
const bars = (count) => Array.from({ length: count }, (_, bar) => bar);

// --- 構成なしは8小節を目標にする。コードが一部 → △
const partial = createDefaultProject();
partial.chords = bars(4).map((bar) => ({ root: 0, quality: "major", degree: "I", startTick: bar * BAR, durationTick: BAR }));
assert.equal(marks(skeletonCheck(partial)).chord, "part");
assert.equal(skeletonCheck(partial).items[0].detail, "4/8小節");

// --- 全部そろったProject
const full = createDefaultProject();
full.structure.sections = [
  { id: "a", kind: "verse", name: "Aメロ", bars: 4, energy: "low" },
  { id: "b", kind: "chorus", name: "サビ", bars: 4, energy: "high" }
];
full.chords = bars(8).map((bar) => ({ root: 0, quality: "major", degree: "I", startTick: bar * BAR, durationTick: BAR }));
full.tracks = [
  track("melody", bars(8).map((bar) => noteAt(bar, 72))),
  track("bass", bars(8).map((bar) => noteAt(bar, 36))),
  track("drums", bars(8).map((bar) => noteAt(bar, 36)))
];
full.instruments = [
  { part: "chord", preset: "keys", tone: "warm" },
  { part: "melody", preset: "lead", tone: "bright" },
  { part: "bass", preset: "soft-bass", tone: "soft" }
];
const fullCheck = skeletonCheck(full);
assert.ok(fullCheck.items.every((item) => item.mark === "done"), JSON.stringify(marks(fullCheck)));
assert.equal(fullCheck.complete, true);
assert.equal(fullCheck.next, null);
assert.equal(fullCheck.doneCount, 7);

// --- 部分的: メロディが小節の半分以下 → △ / すべて同じEnergy → △ / Sectionが1つ → △ / 音色が一部 → △
const partialFull = JSON.parse(JSON.stringify(full));
partialFull.tracks[0].notes = bars(8).slice(0, 3).map((bar) => noteAt(bar, 72));
partialFull.structure.sections = [{ id: "a", kind: "verse", name: "Aメロ", bars: 8, energy: "low" }];
partialFull.instruments = [{ part: "melody", preset: "lead", tone: "bright" }];
const partialCheck = skeletonCheck(partialFull);
assert.equal(marks(partialCheck).melody, "part");
assert.equal(marks(partialCheck).structure, "part");
assert.equal(marks(partialCheck).energy, "part");
assert.equal(marks(partialCheck).sound, "part");
assert.equal(partialCheck.next.id, "melody", "next item follows the order of the list");

// 8割弱でも埋まっていれば ✓（休みの小節は許す）: 8小節中6小節
const mostly = JSON.parse(JSON.stringify(full));
mostly.tracks[0].notes = bars(8).slice(0, 6).map((bar) => noteAt(bar, 72));
assert.equal(marks(skeletonCheck(mostly)).melody, "done");

// Sectionの盛り上がりが無い古いProject（初期値で判定: verse=low / chorus=high）
const legacy = JSON.parse(JSON.stringify(full));
legacy.structure.sections.forEach((section) => delete section.energy);
assert.equal(marks(skeletonCheck(legacy)).energy, "done");

// --- 裏メロは任意: 完成数に入らず、入れると ✓
assert.equal(fullCheck.optional[0].id, "counter");
assert.equal(fullCheck.optional[0].mark, "none");
const withCounter = withCounterNotes(full, 4, 8, [{ id: "c1", pitch: 60, startTick: 4 * BAR, durationTick: BAR, velocity: 60 }]);
const counterCheck = skeletonCheck(withCounter);
assert.equal(counterCheck.optional[0].mark, "done");
assert.equal(counterCheck.total, 7, "optional items are not counted");

// --- 読むだけ: Projectを変更しない
const before = JSON.stringify(full);
skeletonCheck(full);
assert.equal(JSON.stringify(full), before);

console.log("Skeleton check smoke test passed.");
