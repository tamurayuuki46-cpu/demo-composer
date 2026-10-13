import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, HISTORY_LIMIT } from "../src/core/project-state.js";

const BAR = 1920;
const note = (id, pitch, startTick = 0, durationTick = 240) => ({ id, pitch, startTick, durationTick, velocity: 96 });
const chord = (index, root = 0, quality = "major", degree = "I") => ({
  startTick: index * BAR, durationTick: BAR, root, quality, degree
});
const melody = (snapshot) => snapshot.tracks.find((track) => track.role === "melody")?.notes ?? [];

// 初期状態では戻せない
const store = createProjectStore(createDefaultProject());
assert.deepEqual(store.getHistoryState(), { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 });
assert.equal(store.undo(), null, "undo without history is a no-op");
assert.equal(store.redo(), null, "redo without history is a no-op");

// 各Moduleの編集がUndo / Redoできる
store.updateHub({ metadata: { title: "A" } });
store.updateChords([chord(0)]);
store.updateMelodyNotes([note("m1", 60)]);
store.updateRhythmNotes({ bassNotes: [note("b1", 36, 0, 120)], drumNotes: [note("d1", 36, 0, 120)] });
assert.equal(store.getHistoryState().undoCount, 4);

store.undo();
assert.equal((store.getSnapshot().tracks.find((t) => t.role === "bass")?.notes ?? []).length, 0, "rhythm edit undone");
assert.equal(melody(store.getSnapshot()).length, 1, "melody edit kept");

store.undo();
assert.equal(melody(store.getSnapshot()).length, 0, "melody edit undone");

store.redo();
assert.equal(melody(store.getSnapshot()).length, 1, "melody edit redone");

// revisionは戻しても増え続ける（保存の新旧判定のため）
const revisions = [];
store.subscribe((snapshot) => revisions.push(snapshot.revision));
store.undo();
store.undo();
store.redo();
assert.ok(revisions.every((value, index) => index === 0 || value > revisions[index - 1]), "revision must keep increasing");

// 新しい編集をするとRedo履歴は捨てられる
store.undo();
assert.equal(store.getHistoryState().canRedo, true);
store.updateHub({ metadata: { title: "B" } });
assert.equal(store.getHistoryState().canRedo, false, "new edit clears redo");
assert.equal(store.redo(), null);

// 失敗した編集は履歴に残らない
const before = store.getHistoryState().undoCount;
assert.throws(() => store.updateHub({ basic: { bpm: 9999 } }));
assert.throws(() => store.updateMelodyNotes([{ id: "x", pitch: 999, startTick: 0, durationTick: 240, velocity: 96 }]));
assert.equal(store.getHistoryState().undoCount, before, "failed edits are not recorded");

// Key変更（移調）は1操作でまとめて戻る
const keyStore = createProjectStore(createDefaultProject());
keyStore.updateChords([chord(0, 0)]);
keyStore.updateMelodyNotes([note("m1", 60)]);
keyStore.updateHub({ basic: { key: "D" } });
assert.equal(keyStore.getSnapshot().chords[0].root, 2);
assert.equal(melody(keyStore.getSnapshot())[0].pitch, 62);
keyStore.undo();
assert.equal(keyStore.getSnapshot().basic.key, "C");
assert.equal(keyStore.getSnapshot().chords[0].root, 0, "chord root restored");
assert.equal(melody(keyStore.getSnapshot())[0].pitch, 60, "melody pitch restored");

// 履歴は上限を超えない
const limited = createProjectStore(createDefaultProject());
for (let index = 0; index < HISTORY_LIMIT + 10; index += 1) {
  limited.updateHub({ basic: { bpm: 60 + (index % 100) } });
}
assert.equal(limited.getHistoryState().undoCount, HISTORY_LIMIT);

// 戻した結果は元のProjectを壊さない（snapshotは複製）
const snap = store.getSnapshot();
snap.metadata.title = "tampered";
assert.notEqual(store.getSnapshot().metadata.title, "tampered");

console.log("History smoke test passed");
