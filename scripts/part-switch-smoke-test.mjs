import assert from "node:assert/strict";
import { isPartAudible, toggleMute, toggleSolo } from "../src/audio/part-switch-ui.js";

const roles = ["chord", "melody", "bass", "drums"];
const audible = (s) => roles.filter((r) => isPartAudible(s, r));
let state = { muted: new Set(), solo: null };
assert.deepEqual(audible(state), roles, "all audible at start");

// ミュート: 押したパートだけ消える。もう一度押すと戻る
state = toggleMute(state, "melody");
assert.deepEqual(audible(state), ["chord", "bass", "drums"]);
state = toggleMute(state, "drums");
assert.deepEqual(audible(state), ["chord", "bass"]);
state = toggleMute(state, "melody");
assert.deepEqual(audible(state), ["chord", "melody", "bass"]);

// ソロ: 押したパートだけ。同じパートをもう一度押すと、ミュート状態へ戻る
state = toggleSolo(state, "bass");
assert.deepEqual(audible(state), ["bass"]);
state = toggleSolo(state, "drums");
assert.deepEqual(audible(state), ["drums"], "solo moves to the other part");
state = toggleSolo(state, "drums");
assert.deepEqual(audible(state), ["chord", "melody", "bass"], "solo off restores the earlier mute state");

// ソロ中にミュート操作をするとソロを解除する
state = toggleSolo(state, "bass");
state = toggleMute(state, "chord");
assert.equal(state.solo, null);

// 元の状態を壊さない
const before = { muted: new Set(["bass"]), solo: null };
toggleMute(before, "chord");
assert.deepEqual([...before.muted], ["bass"]);
console.log("part switch smoke test passed");
