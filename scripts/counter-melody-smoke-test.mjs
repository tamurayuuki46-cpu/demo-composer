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

  // 各小節の前半だけメロディ、後半は休符。最後の小節だけ8分で埋める。
  const notes = [];
  for (let bar = 0; bar < 8; bar += 1) {
    [72, 74].forEach((pitch, step) => {
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
assert.deepEqual(COUNTER_STYLES.map((item) => item.id), ["sparse", "active", "hook", "answer", "arpeggio", "riff"]);
assert.match(COUNTER_STYLES[0].description, /米津/);
assert.match(COUNTER_STYLES[1].description, /YOASOBI \/ Ayase/);
assert.match(COUNTER_STYLES[1].description, /コードトーン型/);
assert.match(COUNTER_STYLES[1].description, /テンション型/);
assert.match(COUNTER_STYLES[1].description, /別コード感型/);
assert.match(COUNTER_STYLES[2].description, /Oasis/);
assert.match(COUNTER_STYLES[3].description, /Mr\.Children/);
assert.match(COUNTER_STYLES[3].description, /3度・7度/);
assert.ok(COUNTER_STYLES.every((item) => item.description.includes("特定曲のコピーではありません")));

// --- 候補は4つで、どれも範囲内・MIDI範囲内
const candidates = counterCandidates(project, { startBar: 0, endBar: 4 });
assert.deepEqual(candidates.map((item) => item.id), COUNTER_STYLES.map((style) => style.id));
assert.equal(candidates.length, 6);
candidates.forEach((candidate) => {
  assert.ok(candidate.notes.length > 0, `${candidate.id} has notes`);
  assert.ok(candidate.notes.every((note) => note.startTick >= 0 && note.startTick < 4 * BAR), `${candidate.id} stays in range`);
  assert.ok(candidate.notes.every((note) => note.pitch >= 0 && note.pitch <= 127 && note.durationTick >= 1 && note.velocity >= 1 && note.velocity <= 127));
  assert.ok(candidate.notes.every((note) => note.startTick + note.durationTick <= 4 * BAR), `${candidate.id} does not run past the section`);
  assert.equal(new Set(candidate.notes.map((note) => note.id)).size, candidate.notes.length, "unique ids");
});

const sparse = candidates.find((item) => item.id === "sparse");
sparse.notes.forEach((note) => assert.ok(note.startTick % BAR >= 960, "sparse starts in the gap"));

const active = candidates.find((item) => item.id === "active");
assert.ok(active.notes.length > sparse.notes.length, "active is denser than sparse");
assert.ok(active.notes.every((note) => note.durationTick === STEP), "active uses eighth-note motion");

const activeBar0 = active.notes.filter((note) => Math.floor(note.startTick / BAR) === 0);
assert.deepEqual(activeBar0.map((note) => note.startTick % BAR), [0, 240, 480, 960, 1200, 1440]);
const chordPcs = [0, 4, 7];
const scalePcs = [0, 2, 4, 5, 7, 9, 11];
const upperStructurePcs = [4, 7, 11];
[0, 3].forEach((index) => assert.ok(chordPcs.includes(activeBar0[index].pitch % 12)));
[1, 4].forEach((index) => {
  const pc = activeBar0[index].pitch % 12;
  assert.ok(scalePcs.includes(pc));
  assert.ok(!chordPcs.includes(pc));
});
[2, 5].forEach((index) => assert.ok(upperStructurePcs.includes(activeBar0[index].pitch % 12)));

const hook = candidates.find((item) => item.id === "hook");
for (let bar = 0; bar < 4; bar += 1) {
  const inBar = hook.notes.filter((note) => Math.floor(note.startTick / BAR) === bar);
  assert.deepEqual(inBar.map((note) => note.startTick % BAR), [0, 480, 960]);
  assert.deepEqual(inBar.map((note) => note.durationTick), [480, 480, 960]);
}

// Answer: 語尾側（後半）を優先し、Sparseより長い2拍単位の返しを作る。
// Arpeggio: 8分の細かい動きで、メロディの下に置かれ、半音でぶつからない
const arpeggio = candidates.find((item) => item.id === "arpeggio");
assert.ok(arpeggio.notes.length > sparse.notes.length, "arpeggio is denser than sparse");
assert.ok(arpeggio.notes.every((note) => note.durationTick < STEP), "arpeggio uses short eighth notes");
const mainMelody = project.tracks.find((track) => track.role === "melody").notes;
arpeggio.notes.forEach((note) => {
  mainMelody.filter((m) => m.startTick < note.startTick + note.durationTick && m.startTick + m.durationTick > note.startTick).forEach((m) => {
    const distance = Math.abs(note.pitch - m.pitch) % 12;
    assert.ok(distance !== 1 && distance !== 11, "arpeggio does not clash by a semitone");
    assert.ok(note.pitch < m.pitch - 2, "arpeggio stays below the main melody");
  });
});

// Riff: 低い音域で、各小節の頭はそのコードのルート。4小節目は駆け上がる
const riff = candidates.find((item) => item.id === "riff");
assert.ok(riff.notes.every((note) => note.pitch >= 36 && note.pitch <= 70), "riff stays in a low register");
[0, 1, 2].forEach((bar) => {
  const first = riff.notes.find((note) => note.startTick === bar * BAR);
  assert.equal(first.pitch % 12, project.chords[bar].root % 12, `riff bar ${bar + 1} starts on the chord root`);
});
const riffBar4 = riff.notes.filter((note) => Math.floor(note.startTick / BAR) === 3);
assert.equal(riffBar4.length, 8, "riff bar 4 is an eighth-note run");
assert.ok(riffBar4.every((note, index) => index === 0 || note.pitch > riffBar4[index - 1].pitch), "riff bar 4 climbs");

const answer = candidates.find((item) => item.id === "answer");
for (let bar = 0; bar < 4; bar += 1) {
  const inBar = answer.notes.filter((note) => Math.floor(note.startTick / BAR) === bar);
  assert.deepEqual(inBar.map((note) => note.startTick % BAR), [960, 1440]);
  assert.deepEqual(inBar.map((note) => note.durationTick), [480, 480]);
  assert.ok(inBar.every((note) => note.startTick % BAR >= 960), "answer stays after the main phrase");
}
const answerBar0 = answer.notes.filter((note) => Math.floor(note.startTick / BAR) === 0);
assert.ok([4, 7].includes(answerBar0[0].pitch % 12), "answer begins on a non-root chord color tone");

// 詰まった小節では隙間系は休む
const chorus = counterCandidates(project, { startBar: 4, endBar: 8 });
assert.ok(chorus.find((item) => item.id === "sparse").notes.every((note) => Math.floor(note.startTick / BAR) !== 7));
assert.ok(chorus.find((item) => item.id === "answer").notes.every((note) => Math.floor(note.startTick / BAR) !== 7));

const empty = createDefaultProject();
assert.throws(() => counterCandidates(empty, { startBar: 0, endBar: 4 }), /コードもメロディもありません/);

// --- 適用 / 消去 / 範囲外は触らない / Undo
const store = createProjectStore(project);
const revisionBefore = store.getSnapshot().revision;
store.applyCounterMelody({ startBar: 0, endBar: 4, notes: answer.notes });
assert.equal(store.getSnapshot().revision, revisionBefore + 1);
let snapshot = store.getSnapshot();
assert.equal(snapshot.tracks.find((track) => track.role === "counter").midiChannel, 4);
assert.equal(counterBarCount(snapshot, 0, 4), 4);
assert.equal(counterBarCount(snapshot, 4, 8), 0);
validateProject(snapshot);

store.applyCounterMelody({ startBar: 4, endBar: 8, notes: counterCandidates(snapshot, { startBar: 4, endBar: 8 }).find((item) => item.id === "hook").notes });
snapshot = store.getSnapshot();
assert.equal(counterBarCount(snapshot, 0, 4), 4);
assert.equal(counterBarCount(snapshot, 4, 8), 4);

store.applyCounterMelody({ startBar: 0, endBar: 4, notes: [] });
snapshot = store.getSnapshot();
assert.equal(counterBarCount(snapshot, 0, 4), 0);
assert.equal(counterBarCount(snapshot, 4, 8), 4);
store.undo();
assert.equal(counterBarCount(store.getSnapshot(), 0, 4), 4);

assert.equal(counterNotes(project).length, 0);
const preview = withCounterNotes(project, 0, 4, answer.notes);
assert.equal(counterNotes(project).length, 0);
assert.ok(counterNotes(preview).length > 0);

// --- Section操作 / Key変更 / MIDI Exportとの互換
snapshot = store.getSnapshot();
const sliced = sliceProject(snapshot, 0, 4 * BAR);
assert.ok(counterNotes(sliced).every((note) => note.startTick < 4 * BAR));
const copied = appendSectionCopy(snapshot, 0, "verse");
assert.equal(getSections(copied).length, 3);
assert.equal(counterBarCount(copied, 8, 12), counterBarCount(snapshot, 0, 4));

const beforeKey = counterNotes(store.getSnapshot()).map((note) => note.pitch);
store.updateHub({ basic: { key: "D" } });
const afterKey = counterNotes(store.getSnapshot()).map((note) => note.pitch);
assert.deepEqual(afterKey, beforeKey.map((pitch) => pitch + 2));
assert.throws(() => store.updateHub({ basic: { scale: "minor" } }), /Scale/);

const plain = buildMidiExports(sampleProject());
assert.deepEqual(Object.keys(plain), ["Song.mid", "Chord.mid", "Melody.mid", "Bass.mid", "Drums.mid"]);
const withCounter = buildMidiExports(store.getSnapshot());
assert.ok(Object.keys(withCounter).includes("CounterMelody.mid"));
assert.ok(withCounter["CounterMelody.mid"].length > 30);
assert.ok(withCounter["Song.mid"].length > plain["Song.mid"].length);

validateProject(sampleProject());
console.log("Counter melody smoke test passed.");
