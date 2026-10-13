import assert from "node:assert/strict";
import { fanSlotForDegree } from "../src/chord/diatonic-fan.js";

const expected = {
  I: "center-top",
  ii: "left-bottom",
  iii: "right-bottom",
  IV: "left-top",
  V: "right-top",
  vi: "center-bottom",
  "vii°": "leading",
  i: "center-bottom",
  "ii°": "leading",
  III: "center-top",
  iv: "left-bottom",
  v: "right-bottom",
  VI: "left-top",
  VII: "right-top"
};

for (const [degree, slot] of Object.entries(expected)) {
  assert.equal(fanSlotForDegree(degree), slot, `${degree} should map to ${slot}`);
}

assert.equal(fanSlotForDegree("♭II"), null, "non-diatonic degree should not be placed in the fan");

const majorSlots = ["I", "ii", "iii", "IV", "V", "vi", "vii°"].map(fanSlotForDegree);
const minorSlots = ["i", "ii°", "III", "iv", "v", "VI", "VII"].map(fanSlotForDegree);

assert.equal(new Set(majorSlots).size, 7, "major fan slots must all be unique");
assert.equal(new Set(minorSlots).size, 7, "minor fan slots must all be unique");

console.log("Diatonic fan smoke test passed.");
