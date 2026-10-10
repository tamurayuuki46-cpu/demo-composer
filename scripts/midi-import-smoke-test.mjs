import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import { buildMidiExports } from "../src/midi/midi-export.js";
import { createMidiFile, noteEvents, tempoEvent, trackNameEvent } from "../src/midi/midi-writer.js";
import { parseMidi } from "../src/midi/midi-reader.js";
import { buildProjectFromMidi, detectChord, detectKey, suggestRoles } from "../src/midi/midi-import.js";

const BAR = 1920;
const note = (id, pitch, startTick, durationTick, velocity = 90) => ({ id, pitch, startTick, durationTick, velocity });

// ---- 元になる曲（Aマイナー、コード5種類、メロ・ベース・ドラム・裏メロ）
function sampleProject() {
  const store = createProjectStore(createDefaultProject());
  store.updateHub({ metadata: { title: "Round Trip" }, basic: { bpm: 96, key: "A", scale: "minor" } });
  const specs = [[9, "minor"], [5, "major"], [7, "major"], [4, "dominant7"], [9, "minor"], [2, "minor"], [5, "major7"], [4, "major"]];
  store.updateChords(specs.map(([root, quality], bar) => ({ root, quality, degree: "i", startTick: bar * BAR, durationTick: BAR })));
  const melody = [];
  const bass = [];
  const drums = [];
  const bassRoots = [45, 41, 43, 40, 45, 38, 41, 40];
  for (let bar = 0; bar < 8; bar += 1) {
    [72, 76, 74, 71].forEach((pitch, step) => melody.push(note(`m${bar}-${step}`, pitch, bar * BAR + step * 480, 480)));
    bass.push(note(`b${bar}`, bassRoots[bar], bar * BAR, 1800));
    drums.push(note(`k${bar}`, 36, bar * BAR, 120), note(`s${bar}`, 38, bar * BAR + 960, 120), note(`h${bar}`, 42, bar * BAR + 480, 120, 60));
  }
  store.updateMelodyNotes(melody);
  store.updateRhythmNotes({ bassNotes: bass, drumNotes: drums });
  const project = store.getSnapshot();
  project.tracks.push({
    role: "counter", name: "Counter Melody", midiChannel: 4, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0,
    notes: [note("c1", 60, 0, BAR), note("c2", 62, 4 * BAR, BAR)]
  });
  validateProject(project);
  return project;
}

const original = sampleProject();
const files = buildMidiExports(original);
const parsed = parseMidi(files["Song.mid"]);

// ---- 読み取り
assert.equal(parsed.division, 480);
assert.equal(Math.round(parsed.tempos[0].bpm), 96);
assert.deepEqual(parsed.tracks.map((track) => track.name), ["Chord", "Melody", "Bass", "Drums", "Counter Melody"]);
assert.equal(parsed.tracks[1].notes.length, 32);
assert.equal(parsed.timeSignatures[0].numerator, 4);

// ---- 役割の提案（トラック名から）
assert.deepEqual(suggestRoles(parsed), ["chord", "melody", "bass", "drums", "counter"]);

// ---- 取り込み: 往復で内容が戻る
const { project, report } = buildProjectFromMidi(parsed, suggestRoles(parsed), { title: "Round Trip" });
validateProject(project);
assert.equal(project.basic.bpm, 96);
assert.equal(report.bars, 8);
assert.equal(report.key, "A");
assert.equal(report.scale, "minor", "key is detected from the notes");
assert.deepEqual(
  project.chords.map((chord) => [chord.root, chord.quality]),
  original.chords.map((chord) => [chord.root, chord.quality]),
  "chords are recognised bar by bar (triads / 7th / maj7)"
);
assert.ok(project.chords.every((chord, bar) => chord.startTick === bar * BAR && chord.durationTick === BAR));
const notesOf = (p, role) => p.tracks.find((track) => track.role === role)?.notes ?? [];
assert.deepEqual(
  notesOf(project, "melody").map(({ pitch, startTick, durationTick }) => [pitch, startTick, durationTick]),
  notesOf(original, "melody").map(({ pitch, startTick, durationTick }) => [pitch, startTick, durationTick])
);
assert.equal(notesOf(project, "bass").length, 8);
assert.equal(notesOf(project, "drums").length, 24);
assert.equal(notesOf(project, "counter").length, 2);
assert.equal(project.tracks.find((track) => track.role === "counter").midiChannel, 4);
// 取り込んだものを、もう一度書き出せる
assert.ok(buildMidiExports(project)["Song.mid"].length > 100);

// ---- 役割を選び直す: Chordだけ / 使わないトラックは入らない
const onlyMelody = buildProjectFromMidi(parsed, ["none", "melody", "none", "none", "none"]);
assert.equal(onlyMelody.project.chords.length, 0);
assert.equal(notesOf(onlyMelody.project, "bass").length, 0);
assert.equal(onlyMelody.report.melody, 32);

// ---- Key / Scaleを指定すると、それを使う
const forced = buildProjectFromMidi(parsed, suggestRoles(parsed), { key: "C", scale: "major" });
assert.equal(forced.project.basic.key, "C");
assert.equal(forced.report.detectedKey, "A");

// ---- コード判定の部品
const triad = new Array(12).fill(0);
[0, 4, 7].forEach((pc) => { triad[pc] = 1920; });
assert.deepEqual({ root: detectChord(triad, 0).root, quality: detectChord(triad, 0).quality }, { root: 0, quality: "major" });
const seventh = new Array(12).fill(0);
[7, 11, 2, 5].forEach((pc) => { seventh[pc] = 1920; });
assert.equal(detectChord(seventh, 7).quality, "dominant7");
assert.equal(detectChord(new Array(12).fill(0), null), null);
assert.deepEqual(detectKey([note("a", 60, 0, 480), note("b", 64, 480, 480), note("c", 67, 960, 480), note("d", 60, 1440, 960)]).scale, "major");

// ---- 格子への丸め / 単音化 / ドラムの割り当て
const messy = createMidiFile({
  format: 1,
  division: 480,
  tracks: [
    [trackNameEvent("Lead"), tempoEvent(120)],
    [
      trackNameEvent("Lead"),
      ...noteEvents({ channel: 0, pitch: 72, velocity: 90, startTick: 130, durationTick: 400 }), // 130 → 120
      ...noteEvents({ channel: 0, pitch: 60, velocity: 90, startTick: 130, durationTick: 400 }), // 同じ位置の低い音は捨てる
      ...noteEvents({ channel: 0, pitch: 74, velocity: 90, startTick: 480, durationTick: 1000 }),
      ...noteEvents({ channel: 0, pitch: 76, velocity: 90, startTick: 960, durationTick: 480 }) // 前の音は960で切れる
    ],
    [
      trackNameEvent("Drums"),
      ...noteEvents({ channel: 9, pitch: 35, velocity: 100, startTick: 0, durationTick: 60 }),
      ...noteEvents({ channel: 9, pitch: 40, velocity: 100, startTick: 480, durationTick: 60 }),
      ...noteEvents({ channel: 9, pitch: 46, velocity: 100, startTick: 240, durationTick: 60 }),
      ...noteEvents({ channel: 9, pitch: 49, velocity: 100, startTick: 960, durationTick: 60 }) // クラッシュは対象外
    ]
  ]
});
const messyResult = buildProjectFromMidi(parseMidi(messy), ["melody", "drums"].map((role, index) => (index === 0 ? role : role)).slice(0, 2));
assert.equal(messyResult.report.melody, 3);
const lead = notesOf(messyResult.project, "melody");
assert.deepEqual(lead.map((n) => [n.pitch, n.startTick]), [[72, 120], [74, 480], [76, 960]]);
assert.equal(lead[1].durationTick, 480, "an overlapping note is cut at the next note");
assert.equal(messyResult.report.bpm, 120);
assert.deepEqual(notesOf(messyResult.project, "drums").map((n) => [n.pitch, n.startTick]).sort((a, b) => a[1] - b[1]), [[36, 0], [42, 240], [38, 480]]);
assert.ok(messyResult.report.warnings.some((text) => text.includes("ドラム音")), "dropped drum sounds are reported");

// ---- Format 0（1トラックに複数チャンネル）は、チャンネルごとに分かれる
const format0 = createMidiFile({
  format: 0,
  division: 480,
  tracks: [[
    tempoEvent(100),
    ...noteEvents({ channel: 0, pitch: 60, velocity: 80, startTick: 0, durationTick: 480 }),
    ...noteEvents({ channel: 2, pitch: 40, velocity: 80, startTick: 0, durationTick: 480 }),
    ...noteEvents({ channel: 9, pitch: 36, velocity: 80, startTick: 0, durationTick: 120 })
  ]]
});
const f0 = parseMidi(format0);
assert.equal(f0.tracks.length, 3);
assert.deepEqual(suggestRoles(f0), ["melody", "bass", "drums"]);

// ---- ランニングステータス / ベロシティ0のNote Off / 別の分解能（96）
const hand = new Uint8Array([
  0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96,
  0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 0x11,
  0x00, 0x90, 0x3c, 0x64, // Note On C4
  0x30, 0x3e, 0x64,        // ランニングステータス: Note On D4（48 tick後）
  0x30, 0x3c, 0x00,        // ランニングステータス: C4 を velocity 0 で止める
  0x30, 0x3e, 0x00,        // D4 を止める
  0x00, 0xff, 0x2f, 0x00
]);
const running = parseMidi(hand);
assert.equal(running.division, 96);
assert.deepEqual(running.tracks[0].notes.map((n) => [n.pitch, n.startTick, n.durationTick]), [[60, 0, 96], [62, 48, 96]]);
const scaled = buildProjectFromMidi(running, ["melody"]);
assert.equal(scaled.report.bpm, 120, "no tempo event means 120");
assert.deepEqual(notesOf(scaled.project, "melody").map((n) => n.startTick), [0, 240], "ticks are scaled to 480 per quarter note");

// ---- エラーは日本語で分かる
assert.throws(() => parseMidi(new Uint8Array([1, 2, 3])), /MIDIファイルとして読めません/);
assert.throws(() => parseMidi(new TextEncoder().encode("this is not a midi file at all")), /MIDIファイルとして読めません/);
assert.throws(() => parseMidi(new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 1, 0xe7, 0x28])), /SMPTE/);
assert.throws(() => parseMidi(files["Song.mid"].subarray(0, 60)), /途中で終わって/);
assert.throws(() => buildProjectFromMidi(parsed, ["none", "none", "none", "none", "none"]), /取り込むトラック/);
const waltz = createMidiFile({
  format: 1, division: 480,
  tracks: [[{ tick: 0, order: -80, bytes: [0xff, 0x58, 4, 3, 2, 24, 8] }], [...noteEvents({ channel: 0, pitch: 60, velocity: 90, startTick: 0, durationTick: 480 })]]
});
assert.throws(() => buildProjectFromMidi(parseMidi(waltz), ["melody"]), /3\/4/);

// ---- 長い曲は128小節で止める
const long = createMidiFile({
  format: 1, division: 480,
  tracks: [[], [...noteEvents({ channel: 0, pitch: 60, velocity: 90, startTick: 0, durationTick: 480 }), ...noteEvents({ channel: 0, pitch: 62, velocity: 90, startTick: 200 * BAR, durationTick: 480 })]]
});
const longResult = buildProjectFromMidi(parseMidi(long), ["melody"]);
assert.equal(longResult.report.bars, 128);
assert.equal(longResult.report.melody, 1);
assert.ok(longResult.report.warnings.some((text) => text.includes("128小節")));

console.log("MIDI import smoke test passed.");
