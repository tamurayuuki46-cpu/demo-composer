import assert from "node:assert/strict";
import { pitchClassRoles, pitchRoleText, scalePitchClassSet } from "../src/melody/pitch-roles.js";

const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, B = 11;
const rolesOf = (key, scale, chord) => pitchClassRoles({ key, scale, chord });
const names = (roles, pick) => roles.map((role, pc) => (pick(role) ? pc : null)).filter((pc) => pc !== null);

// Scale: Cメジャーの7音以外 = 黄（outside）
const none = rolesOf("C", "major", undefined);
assert.deepEqual(names(none, (r) => !r.outside), [C, D, E, F, G, A, B]);
assert.deepEqual(names(none, (r) => r.outside), [1, 3, 6, 8, 10]);
assert.ok(none.every((r) => r.tone === null && r.avoid === false), "コード未設定なら青・緑・赤は出さない");
assert.deepEqual([...scalePitchClassSet("A", "minor")].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);

// C（C E G）: 構成音=青、9・11・13相当（D F A）= 緑 → ただしFは構成音Eの半音上でアボイド（赤）
const c = rolesOf("C", "major", { root: C, quality: "major" });
assert.deepEqual(names(c, (r) => r.tone === "chord"), [C, E, G]);
assert.deepEqual(names(c, (r) => r.tone === "tension"), [D, A]);
assert.deepEqual(names(c, (r) => r.avoid), [F]);
assert.equal(c[F].tone, null, "アボイドは赤が優先");
assert.equal(pitchRoleText(c[F]), "アボイド");
assert.equal(pitchRoleText(c[1]), "スケール外");

// Cmaj7: Bも構成音（青）。Fは同じくアボイド
const cm7 = rolesOf("C", "major", { root: C, quality: "major7" });
assert.deepEqual(names(cm7, (r) => r.tone === "chord"), [C, E, G, B]);
assert.deepEqual(names(cm7, (r) => r.avoid), [F]);

// Am（A C E）in Cメジャー: 9=B, 11=D, 13=F#（F#はスケール外で黄）。Fは構成音Eの半音上でアボイド
const am = rolesOf("C", "major", { root: A, quality: "minor" });
assert.deepEqual(names(am, (r) => r.tone === "chord"), [C, E, A]);
assert.equal(am[B].tone, "tension");
assert.equal(am[D].tone, "tension");
assert.deepEqual(names(am, (r) => r.avoid), [F]);
assert.equal(am[6].outside, true);
assert.equal(am[6].tone, "tension", "スケール外でも、テンション位置なら緑 + 黄の印");

// Dm（D F A）in Cメジャー: スケール内にアボイドは無い（Dorianのii）
const dm = rolesOf("C", "major", { root: D, quality: "minor" });
assert.deepEqual(names(dm, (r) => r.avoid), []);

// G7（G B D F）: Cは構成音Bの半音上でアボイド（sus4の音）
const g7 = rolesOf("C", "major", { root: G, quality: "dominant7" });
assert.deepEqual(names(g7, (r) => r.avoid), [C]);

// 借用和音: Cメジャーの曲でFm（F G# C）。G#（8）は構成音だがスケール外 → 青 + 黄の印
const fm = rolesOf("C", "major", { root: F, quality: "minor" });
assert.equal(fm[8].tone, "chord");
assert.equal(fm[8].outside, true);
assert.equal(pitchRoleText(fm[8]), "コード構成音・スケール外");

console.log("Pitch roles smoke test passed.");
