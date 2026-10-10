import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import {
  COUNTER_ROLE,
  COUNTER_STYLES,
  counterBarCount,
  counterCandidates,
  counterNotes,
  hasCounter,
  withCounterNotes
} from "../src/core/counter-melody.js";
import { buildMidiExports } from "../src/midi/midi-export.js";
import { appendSectionCopy, getSections, sliceProject } from "../src/core/section-ops.js";

const BAR = 1920;
const STEP = 240;

function sampleProject() {
  const project = createDefaultProject();
  project.structure.sections = [
    { id: "s1", kind: "verse", name: "Aメロ", bars: 4, energy: "low" },
    { id: "s2", kind: "chorus", name: "サビ", bars: 4, energy: "high" }
  ];
  const roots = [0, 9, 5, 7, 0, 9, 5, 7];
  const qualities = ["major", "minor", "major", "major", "major", "minor", "major", "major"];
  project.chords = roots.map((root, index) => ({ root, quality: qualities[index], degree: "I", startTick: index * BAR, durationTick: BAR }));
  // メロディ: 各小節の前半だけ鳴らし、後半は休む（Sparse用の隙間）。サビ最後は詰める。
  const notes = [];
  for (let bar = 0; bar < 8; bar += 1) {
    const pitches = [72, 74, 76, 72];
    pitches.slice(0, 2).forEach((pitch, step) => {
      notes.push({ id: `m-${bar}-${step}`, pitch, startTick: bar * BAR + step * 480, durationTick: 480, velocity: 90 });
    });
  }
  for (let step = 0; step < 8; step += 1) {
    notes.push({ id: `dense-${step}`, pitch: 76, startTick: 7 * BAR + step * STEP, durationTick: STEP, velocity: 90 });
  }
  project.tracks.push({ role: "melody", name: "Melody", midiChannel: 2, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes });
  return project;
}

const project = sampleProject();
assert.equal(hasCounter(project), false);
assert.equal(COUNTER_ROLE, "counter");
assert.deepEqual(COUNTER_STYLES.map((item) => item.id), ["sparse", "active", "hook"]);
assert.match(COUNTER_STYLES[0].description, /米津/);
assert.match(COUNTER_STYLES[1].description, /YOASOBI/);
assert.match(COUNTER_STYLES[2].description, /Oasis/);
assert.ok(COUNTER_STYLES.every((item) => item.description.includes("特定曲のコピーではありません")));

// --- 候補は3つで、どれも範囲内・MIDI範囲内
const candidates = counterCandidates(project, { startBar: 0, endBar: 4 });
assert.deepEqual(candidates.map((item) => item.id), COUNTER_STYLES.map((style) => style.id));
assert.equal(candidates.length, 3);
candidates.forEach((candidate) => {
  assert.ok(candidate.notes.length > 0, `${candidate.id} has notes`);
  assert.ok(candidate.notes.every((note) => note.startTick >= 0 && note.startTick < 4 * BAR), `${candidate.id} stays in range`);
  assert.ok(candidate.notes.every((note) => note.pitch >= 0 && note.pitch <= 127 && note.durationTick >= 1 && note.velocity >= 1 && note.velocity <= 127));
  assert.ok(candidate.notes.every((note) => note.startTick + note.durationTick <= 4 * BAR), `${candidate.id} does not run past the section`);
  assert.equal(new Set(candidate.notes.map((note) => note.id)).size, candidate.notes.length, "unique ids");
});

// Sparse: 前半のメロディとは重ならず、後半の隙間にだけ短く返す
const sparse = candidates.find((item) => item.id === "sparse");
sparse.notes.forEach((note) => {
  const inBar = note.startTick % BAR;
  assert.ok(inBar >= 960, `sparse note starts in the gap (${inBar})`);
});

// Active: 8分中心で、Sparseより明確に音数が多い
const active = candidates.find((item) => item.id === "active");
assert.ok(active.notes.length > sparse.notes.length, "active is denser than sparse");
assert.ok(active.notes.every((note) => note.durationTick === STEP), "active uses eighth-note motion");

// Hook: 各小節で同じ 1拍目→2拍目→3拍目 の3音輪郭を繰り返す
const hook = candidates.find((item) => item.id === "hook");
for (let bar = 0; bar < 4; bar += 1) {
  const inBar = hook.notes.filter((note) => Math.floor(note.startTick / BAR) === bar);
  assert.deepEqual(inBar.map((note) => note.startTick % BAR), [0, 480, 960]);
  assert.deepEqual(inBar.map((note) => note.durationTick), [480, 480, 960]);
}

// 詰まった小節(サビ最後)ではSparseは休む
const chorusSparse = counterCandidates(project, { startBar: 4, endBar: 8 }).find((item) => item.id === "sparse");
assert.ok(chorusSparse.notes.every((note) => Math.floor(note.startTick / BAR) !== 7), "dense bar is left empty by sparse");

// 土台が無いSectionは例外
const empty = createDefaultProject();
assert.throws(() => counterCandidates(empty, { startBar: 0, endBar: 4 }), /コードもメロディもありません/);

// --- 適用 / 消去 / 範囲外は触らない / Undo
const store = createProjectStore(project);
const revisionBefore = store.getSnapshot().revision;
store.applyCounterMelody({ startBar: 0, endBar: 4, notes: hook.notes });
assert.equal(store.getSnapshot().revision, revisionBefore + 1);
let snapshot = store.getSnapshot();
assert.equal(snapshot.tracks.find((track) => track.role === "counter").midiChannel, 4);
assert.equal(counterBarCount(snapshot, 0, 4), 4);
assert.equal(counterBarCount(snapshot, 4, 8), 0);
validateProject(snapshot);

store.applyCounterMelody({ startBar: 4, endBar: 8, notes: counterCandidates(snapshot, { startBar: 4, endBar: 8 }).find((item) => item.id === "hook").notes });
snapshot = store.getSnapshot();
assert.equal(counterBarCount(snapshot, 0, 4), 4, "first section untouched");
assert.equal(counterBarCount(snapshot, 4, 8), 4);

store.applyCounterMelody({ startBar: 0, endBar: 4, notes: [] });
snapshot = store.getSnapshot();
assert.equal(counterBarCount(snapshot, 0, 4), 0, "cleared");
assert.equal(counterBarCount(snapshot, 4, 8), 4, "other section kept");

store.undo();
assert.equal(counterBarCount(store.getSnapshot(), 0, 4), 4, "undo restores the cleared section");

// 元のProjectは変えない
assert.equal(counterNotes(project).length, 0);
const preview = withCounterNotes(project, 0, 4, hook.notes);
assert.equal(counterNotes(project).length, 0);
assert.ok(counterNotes(preview).length > 0);

// --- 他の操作と一緒に動く: Section切り出し / Section追加コピー / Key変更
snapshot = store.getSnapshot();
const sliced = sliceProject(snapshot, 0, 4 * BAR);
assert.ok(counterNotes(sliced).every((note) => note.startTick < 4 * BAR));
const copied = appendSectionCopy(snapshot, 0, "verse");
assert.equal(getSections(copied).length, 3);
assert.equal(counterBarCount(copied, 8, 12), counterBarCount(snapshot, 0, 4), "counter copies with the section");

const beforeKey = counterNotes(store.getSnapshot()).map((note) => note.pitch);
store.updateHub({ basic: { key: "D" } });
const afterKey = counterNotes(store.getSnapshot()).map((note) => note.pitch);
assert.deepEqual(afterKey, beforeKey.map((pitch) => pitch + 2), "counter melody transposes with the key");
assert.throws(() => store.updateHub({ basic: { scale: "minor" } }), /Scale/, "scale change is blocked while counter melody exists");

// --- MIDI: 無いときは今まで通り / あるときだけ追加
const plain = buildMidiExports(sampleProject());
assert.deepEqual(Object.keys(plain), ["Song.mid", "Chord.mid", "Melody.mid", "Bass.mid", "Drums.mid"]);
const withCounter = buildMidiExports(store.getSnapshot());
assert.ok(Object.keys(withCounter).includes("CounterMelody.mid"));
assert.ok(withCounter["CounterMelody.mid"].length > 30);
assert.ok(withCounter["Song.mid"].length > plain["Song.mid"].length, "Song.mid carries the counter track");

// --- 古いProject（counterトラック無し）はそのまま有効
validateProject(sampleProject());

console.log("Counter melody smoke test passed.");
