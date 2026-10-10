import assert from "node:assert/strict";
import { validateStructure } from "../src/core/section-ops.js";
import {
  addEntry, normalizeLibrary, removeEntry, sectionsFromStructure, STRUCTURE_SAMPLES,
  structureFromSections, structureText, loadLibrary, saveLibrary
} from "../src/arrange/structure-library.js";

// 見本はすべて、そのままProjectの構成として成立する
for (const sample of STRUCTURE_SAMPLES) {
  const sections = sectionsFromStructure(sample.sections);
  assert.doesNotThrow(() => validateStructure({ sections }), sample.id);
  assert.deepEqual(structureFromSections(sections), sample.sections);
}
const jpop = sectionsFromStructure(STRUCTURE_SAMPLES[0].sections);
assert.equal(jpop.filter((s) => s.kind === "chorus").map((s) => s.name).join(","), "サビ,サビ2,サビ3");
assert.equal(structureText(STRUCTURE_SAMPLES[1].sections), "サビ8 → Aメロ8 → Bメロ4 → サビ8 → アウトロ4（全32小節）");

// 追加・削除・名前
let list = [];
list = addEntry(list, { name: "  好きな曲A  ", sections: jpop });
assert.equal(list[0].name, "好きな曲A");
assert.equal(list[0].sections.length, 11);
list = addEntry(list, { name: "", sections: jpop });
assert.equal(list[1].name, "好きな構成 2");
assert.throws(() => addEntry(list, { name: "x", sections: [] }), /構成がまだ/);
assert.equal(removeEntry(list, list[0].id).length, 1);

// Transitionは保存しない
const withTransition = jpop.map((s) => ({ ...s, transition: "fill" }));
assert.equal(Object.hasOwn(addEntry([], { name: "t", sections: withTransition })[0].sections[0], "transition"), false);

// 壊れたデータは捨てる
assert.deepEqual(normalizeLibrary("x"), []);
assert.equal(normalizeLibrary([{ id: "a", name: "ok", sections: [{ kind: "verse", bars: 8, energy: "low" }] }, { id: "b", name: "bad", sections: [{ kind: "zzz", bars: 8, energy: "low" }] }, { id: "c", name: "bad2", sections: [{ kind: "verse", bars: 99, energy: "low" }] }]).length, 1);

// 保存と読み込み（localStorage相当）
const mem = new Map();
const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
assert.equal(saveLibrary(list, storage), true);
assert.equal(loadLibrary(storage).length, 2);
assert.equal(loadLibrary({ getItem() { throw new Error("blocked"); } }).length, 0);

console.log("structure-library smoke test passed");
