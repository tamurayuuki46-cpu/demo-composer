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

function sampleProject() {
  const project = createDefaultProject();
  project.structure.sections = [
    { id: "s1", kind: "verse", name: "Aメロ", bars: 4, energy: "low" },
    { id: "s2", kind: "chorus", name: "サビ", bars: 4, energy: "high" }
  ];
  const roots = [0, 9, 5, 7, 0, 9, 5, 7];
  const qualities = ["major", "minor", "major", "major", "major", "minor", "major", "major"];
  project.chords = roots.map((root, index) => ({ root, quality: qualities[index], degree: "I", startTick: index * BAR, durationTick: BAR }));
  // メロディ: 各小節の前半だけ鳴らし、後半は休む（隙間がある）。サビの最後の小節は詰める
  const notes = [];
  for (let bar = 0; bar < 8; bar += 1) {
    const pitches = [72, 74, 76, 72];
    pitches.slice(0, 2).forEach((pitch, step) => {
      notes.push({ id: `m-${bar}-${step}`, pitch, startTick: bar * BAR + step * 480, durationTick: 480, velocity: 90 });
    });
  }
  for (let step = 0; step < 8; step += 1) {
    notes.push({ id: `dense-${step}`, pitch: 76, startTick: 7 * BAR + step * 240, durationTick: 240, velocity: 90 });
  }
  project.tracks.push({ role: "melody", name: "Melody", midiChannel: 2, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes });
  return project;
}

const project = sampleProject();
assert.equal(hasCounter(project), false);
assert.equal(COUNTER_ROLE, "counter");

// --- 候補は3つで、どれも範囲内・MIDI範囲内・メロディより下
const candidates = counterCandidates(project, { startBar: 0, endBar: 4 });
assert.deepEqual(candidates.map((item) => item.id), COUNTER_STYLES.map((style) => style.id));
assert.equal(candidates.length, 3);
candidates.forEach((candidate) => {
  assert.ok(candidate.notes.length > 0, `${candidate.id} has notes in a section with gaps`);
  assert.ok(candidate.notes.every((note) => note.startTick >= 0 && note.startTick < 4 * BAR), `${candidate.id} stays in range`);
  assert.ok(candidate.notes.every((note) => note.pitch >= 0 && note.pitch <= 127 && note.durationTick >= 1 && note.velocity >= 1 && note.velocity <= 127));
  assert.ok(candidate.notes.every((note) => note.startTick + note.durationTick <= 4 * BAR), `${candidate.id} does not run past the section`);
  assert.equal(new Set(candidate.notes.map((note) => note.id)).size, candidate.notes.length, "unique ids");
});

// ロングトーン: 同じコード音が続いたら1本にまとまる / 全部メロディより下
const long = candidates.find((item) => item.id === "long");
assert.ok(long.notes.every((note) => note.pitch < 72), "long tones sit below the melody");

// レスポンス: メロディが鳴っている前半(0〜1拍目)とは重ならない
const response = candidates.find((item) => item.id === "response");
response.notes.forEach((note) => {
  const inBar = note.startTick % BAR;
  assert.ok(inBar >= 960, `response note starts in the gap (${inBar})`);
});

// 寄り添い: 長め(4分以上)のメロディ音だけに、音階で3度下
const simple = candidates.find((item) => item.id === "simple");
assert.ok(simple.notes.length > 0);
assert.ok(simple.notes.every((note) => [60, 62, 64, 65, 67, 69, 71].includes(note.pitch) || note.pitch < 72));

// 詰まった小節(サビの最後)ではレスポンスは休む
const chorusResponse = counterCandidates(project, { startBar: 4, endBar: 8 }).find((item) => item.id === "response");
assert.ok(chorusResponse.notes.every((note) => Math.floor(note.startTick / BAR) !== 7), "dense bar is left empty");

// 土台が無いSectionは例外
const empty = createDefaultProject();
assert.throws(() => counterCandidates(empty, { startBar: 0, endBar: 4 }), /コードもメロディもありません/);

// --- 適用 / 消去 / 範囲外は触らない / Undo
const store = createProjectStore(project);
const revisionBefore = store.getSnapshot().revision;
store.applyCounterMelody({ startBar: 0, endBar: 4, notes: long.notes });
assert.equal(store.getSnapshot().revision, revisionBefore + 1);
let snapshot = store.getSnapshot();
assert.equal(snapshot.tracks.find((track) => track.role === "counter").midiChannel, 4);
assert.equal(counterBarCount(snapshot, 0, 4), 4);
assert.equal(counterBarCount(snapshot, 4, 8), 0);
validateProject(snapshot);

store.applyCounterMelody({ startBar: 4, endBar: 8, notes: counterCandidates(snapshot, { startBar: 4, endBar: 8 })[0].notes });
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
const preview = withCounterNotes(project, 0, 4, long.notes);
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
