import assert from "node:assert/strict";
import {
  BACKING_PATTERNS,
  buildBackingEvents,
  getBackingPatternSelection,
  upsertBackingPattern
} from "../src/core/backing-patterns.js";

assert.equal(BACKING_PATTERNS.length, 4);
assert.equal(getBackingPatternSelection([]), "block");

const selected = upsertBackingPattern([], "eighth");
assert.equal(getBackingPatternSelection(selected), "eighth");
assert.deepEqual(selected[0], {
  part: "chord-backing",
  preset: "eighth",
  tone: "natural"
});

const triad = [0, 4, 7];
const block = buildBackingEvents("block", triad);
assert.equal(block.length, 1);
assert.deepEqual(block[0].intervals, triad);
assert.equal(block[0].duration, 1);

const eighth = buildBackingEvents("eighth", triad);
assert.equal(eighth.length, 8);
assert.ok(eighth.every((event) => event.intervals.length === 3));

const arpeggio = buildBackingEvents("arpeggio", triad);
assert.equal(arpeggio.length, 8);
assert.ok(arpeggio.every((event) => event.intervals.length === 1));
assert.deepEqual(arpeggio.slice(0, 4).map((event) => event.intervals[0]), [0, 4, 7, 0]);

const syncopation = buildBackingEvents("syncopation", triad);
assert.equal(syncopation.length, 4);
assert.deepEqual(syncopation.map((event) => event.offset), [0, 6 / 16, 10 / 16, 14 / 16]);

assert.throws(() => upsertBackingPattern([], "unknown"), /Unsupported backing pattern/);

console.log("Backing pattern smoke test passed.");
