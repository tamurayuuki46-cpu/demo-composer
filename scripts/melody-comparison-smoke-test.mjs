import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore } from "../src/core/project-state.js";
import { createMelodyComparison, comparisonIsCurrent, comparisonNotes, comparisonPreview } from "../src/core/melody-comparison.js";
import { parseProjectJson } from "../src/storage/project-import.js";
import { melodyCandidatesForBar, applyMelodyCandidate } from "../src/melody/melody-candidates.js";

const note = (id, pitch, startTick) => ({ id, pitch, startTick, durationTick: 240, velocity: 96 });
const project = createDefaultProject();
project.metadata.memo = "サビで解放する";
project.tracks = [
  { role: "melody", notes: [note("before", 60, 0), note("target", 62, 1920), note("after", 64, 3840)] },
  { role: "counter", notes: [note("counter", 67, 1920)] },
  { role: "bass", notes: [note("bass", 36, 1920)] }
];
const store = createProjectStore(project);
let notifications = 0;
store.subscribe(() => notifications++);
const candidate = melodyCandidatesForBar(project, 1)[0];
const candidates = applyMelodyCandidate(project.tracks[0].notes, 1, candidate, { barTicks: 1920 });
const session = createMelodyComparison(project, 1, candidates, candidate.label);
assert.deepEqual(project, store.getSnapshot(), "候補作成で正本を変えない");
for (const choice of ["A", "B", "A", "B"]) {
  const preview = comparisonPreview(session, store.getSnapshot(), choice);
  assert.equal(preview.lengthTick, 1920);
  assert.deepEqual(preview.project.tracks.find(t => t.role === "bass").notes,
    comparisonPreview(session, project, "A").project.tracks.find(t => t.role === "bass").notes);
  preview.project.metadata.memo = "試聴コピーだけ";
}
assert.equal(notifications, 0, "試聴はAutoSaveの通知を起こさない");
assert.equal(store.getHistoryState().undoCount, 0);
assert.equal(store.getSnapshot().revision, project.revision);
assert.equal(session.project.metadata.memo, project.metadata.memo);

store.updateMelodyNotes(comparisonNotes(session, store.getSnapshot()));
const adopted = store.getSnapshot();
assert.equal(store.getHistoryState().undoCount, 1);
assert.deepEqual(adopted.tracks.slice(1), project.tracks.slice(1), "伴奏・裏メロ保持");
assert.deepEqual(adopted.tracks[0].notes.filter(n => n.startTick !== 1920 && (n.startTick < 1920 || n.startTick >= 3840)),
  [project.tracks[0].notes[0], project.tracks[0].notes[2]], "他小節保持");
assert.equal(adopted.metadata.memo, project.metadata.memo);
assert.deepEqual(parseProjectJson(JSON.stringify(adopted)), adopted, "保存・再Import互換");
assert.ok(!JSON.stringify(adopted).includes('bNotes'), "比較状態を正本に入れない");
store.undo();
assert.deepEqual(store.getSnapshot().tracks, project.tracks);
assert.equal(comparisonIsCurrent(session, store.getSnapshot()), false, "Undo後も古い候補を拒否");
assert.throws(() => comparisonNotes(session, store.getSnapshot()));
assert.throws(() => comparisonPreview(session, store.getSnapshot(), "B"));
store.redo();
assert.deepEqual(store.getSnapshot().tracks, adopted.tracks);
assert.equal(notifications, 3, "採用・Undo・Redoのみ通知");

const identical = createMelodyComparison(project, 1, project.tracks[0].notes.map(n => ({ ...n, id: `${n.id}-copy` })), "同じ音");
assert.equal(identical.diff.unchanged, 1, "ID違いだけは音の差にしない");
assert.equal(identical.diff.added + identical.diff.removed, 0);
assert.equal(comparisonIsCurrent(session, { ...project, id: "other" }), false);
assert.equal(comparisonIsCurrent(session, { ...project, revision: 2 }), false);
const empty = createDefaultProject();
const emptySession = createMelodyComparison(empty, 0, [note("new", 60, 0)], "新規候補");
assert.equal(emptySession.diff.a, 0);
assert.equal(comparisonPreview(emptySession, empty, "B").project.tracks[0].notes.length, 1);
assert.deepEqual(empty.tracks, []);
assert.throws(() => createMelodyComparison(empty, -1, [], "不正"));
console.log("Melody A/B comparison smoke test passed");
