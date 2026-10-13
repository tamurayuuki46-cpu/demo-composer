import assert from "node:assert/strict";
import {
  MAX_LIBRARY_ENTRIES, addEntry, chordsFromProgression, loadLibrary, normalizeLibrary,
  progressionDegreeText, progressionFromChords, progressionNameText, removeEntry, saveLibrary
} from "../src/chord/progression-library.js";

const BAR = 1920;
const chord = (root, quality) => ({ root, quality, degree: "?", startTick: 0, durationTick: BAR });

// C majorのI–V–vi–IV を度数で保存 → 別Keyへ当てはめ
const cMajor = [chord(0, "major"), chord(7, "major"), chord(9, "minor"), chord(5, "major")];
const items = progressionFromChords(cMajor, "C");
assert.deepEqual(items.map((i) => i.offset), [0, 7, 9, 5]);
assert.equal(progressionDegreeText(items, "C"), "I – V – vi – IV");
assert.equal(progressionNameText(items, "C"), "C – G – Am – F");
const inD = chordsFromProgression(items, { key: "D", barTicks: BAR });
assert.equal(progressionNameText(items, "D"), "D – A – Bm – G");
assert.deepEqual(inD.map((c) => c.startTick), [0, BAR, BAR * 2, BAR * 3], "contiguous from bar 1");
assert.ok(inD.every((c) => c.durationTick === BAR));
assert.deepEqual(inD.map((c) => c.degree), ["I", "V", "vi", "IV"]);
// 元のKeyが違っても度数は同じ（G majorで保存した I–V も同じ度数になる）
assert.deepEqual(progressionFromChords([chord(7, "major"), chord(2, "major")], "G").map((i) => i.offset), [0, 7]);
// 借用和音や7thも保存できる
const spicy = progressionFromChords([chord(0, "major7"), chord(5, "minor"), chord(10, "major")], "C");
assert.equal(progressionDegreeText(spicy, "C"), "Imaj7 – iv – ♭VII");

// 追加・削除・名前の既定
let list = [];
list = addEntry(list, { name: "  好きな曲のサビ  ", chords: cMajor, key: "C" });
assert.equal(list[0].name, "好きな曲のサビ");
list = addEntry(list, { name: "", chords: cMajor, key: "C" });
assert.equal(list[1].name, "好きな進行 2");
assert.notEqual(list[0].id, list[1].id);
assert.throws(() => addEntry(list, { name: "x", chords: [], key: "C" }), /コードがまだ/);
assert.throws(() => addEntry(list, { name: "x", chords: Array(33).fill(chord(0, "major")), key: "C" }), /32小節/);
assert.equal(removeEntry(list, list[0].id).length, 1);
let full = [];
for (let i = 0; i < MAX_LIBRARY_ENTRIES; i += 1) full = addEntry(full, { name: `n${i}`, chords: cMajor, key: "C" });
assert.throws(() => addEntry(full, { name: "over", chords: cMajor, key: "C" }), /50件/);

// 保存・読み込み・壊れたデータ・保存できない環境
const store = new Map();
const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
assert.deepEqual(loadLibrary(storage), []);
assert.equal(saveLibrary(list, storage), true);
assert.deepEqual(loadLibrary(storage), list);
store.set("demo-composer.progressionLibrary", "{broken");
assert.deepEqual(loadLibrary(storage), []);
assert.deepEqual(normalizeLibrary([{ id: "a", name: "ok", chords: [{ offset: 0, quality: "major" }] }, { id: "b", name: "bad", chords: [{ offset: 99, quality: "major" }] }, { id: "c", name: "bad2", chords: [{ offset: 0, quality: "nope" }] }, null]).map((e) => e.id), ["a"]);
const blocked = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); } };
assert.deepEqual(loadLibrary(blocked), []);
assert.equal(saveLibrary(list, blocked), false);

console.log("progression library smoke test passed");
