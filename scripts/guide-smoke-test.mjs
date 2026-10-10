import assert from "node:assert/strict";
import {
  GUIDE_PHASES,
  GUIDE_STEPS,
  GUIDE_STORAGE_KEY,
  guideStepIds,
  loadGuideProgress,
  nextGuideStep,
  saveGuideProgress,
  toggleGuideStep
} from "../src/hub/guide.js";

const SCREENS = ["hub", "chord", "melody", "rhythm", "arrange", "sound"];

assert.ok(GUIDE_STEPS.length >= 12 && GUIDE_STEPS.length <= 20, "the guide stays a short list");
assert.equal(new Set(guideStepIds()).size, GUIDE_STEPS.length, "step ids are unique");
assert.ok(GUIDE_STEPS.every((step) => GUIDE_PHASES.some((phase) => phase.id === step.phase)), "every step belongs to a phase");
assert.ok(GUIDE_PHASES.every((phase) => GUIDE_STEPS.some((step) => step.phase === phase.id)), "no empty phase");
assert.ok(GUIDE_STEPS.every((step) => SCREENS.includes(step.screen)), "every step points to a real screen");
assert.ok(GUIDE_STEPS.every((step) => step.title && step.what && step.tip), "every step has title / what / tip");

// 手順は、Hub出発点 → 作曲 → 編曲 → 確認 の順に並ぶ
const phaseOrder = GUIDE_STEPS.map((step) => GUIDE_PHASES.findIndex((phase) => phase.id === step.phase));
assert.deepEqual(phaseOrder, [...phaseOrder].sort((a, b) => a - b), "phases are in order");

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    data
  };
}

// 保存と読み込み
const storage = memoryStorage();
assert.equal(loadGuideProgress(storage).size, 0, "empty by default");
let done = toggleGuideStep(new Set(), "chords");
done = toggleGuideStep(done, "melody");
assert.equal(saveGuideProgress(done, storage), true);
assert.deepEqual([...loadGuideProgress(storage)].sort(), ["chords", "melody"]);

// もう一度押すと外れる / 知らないidは無視 / 元のSetは変えない
const before = new Set(done);
const toggledOff = toggleGuideStep(done, "chords");
assert.equal(toggledOff.has("chords"), false);
assert.deepEqual([...done], [...before], "toggle returns a new set");
assert.equal(toggleGuideStep(done, "unknown-step").size, done.size);

// 壊れたデータ・知らないidでも安全
assert.equal(loadGuideProgress(memoryStorage({ [GUIDE_STORAGE_KEY]: "{broken" })).size, 0);
assert.equal(loadGuideProgress(memoryStorage({ [GUIDE_STORAGE_KEY]: "{\"a\":1}" })).size, 0);
assert.deepEqual([...loadGuideProgress(memoryStorage({ [GUIDE_STORAGE_KEY]: JSON.stringify(["chords", "old-removed-step", 5]) }))], ["chords"]);

// 保存できない端末（localStorageが使えない）でも例外を出さない
const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
assert.equal(loadGuideProgress(broken).size, 0);
assert.equal(saveGuideProgress(new Set(["chords"]), broken), false);
assert.equal(loadGuideProgress(null).size, 0);

// 次の手順は未チェックの先頭。全部済みなら null
assert.equal(nextGuideStep(new Set()).id, GUIDE_STEPS[0].id);
assert.equal(nextGuideStep(new Set([GUIDE_STEPS[0].id])).id, GUIDE_STEPS[1].id);
assert.equal(nextGuideStep(new Set(guideStepIds())), null);

console.log("Guide smoke test passed.");
