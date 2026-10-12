import assert from "node:assert/strict";
import { chordIntervals } from "../src/core/chord-qualities.js";
import { rootToPitchClass } from "../src/chord/chord-theory.js";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import { buildMidiExports } from "../src/midi/midi-export.js";
import {
  PHRASE_BAR_CHOICES, PHRASE_CONTOURS, PHRASE_FORMS, PHRASE_VARIATION_COUNT,
  applyPhraseNotes, melodyNoteCountIn, phraseCandidates, phraseDots, phraseRange, withPhraseNotes
} from "../src/melody/phrase-generator.js";

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
// 主音からの半音数で書く（Keyに合わせて移調される）
const PROGRESSIONS = {
  major: [[0, "major"], [7, "major"], [9, "minor"], [5, "major"], [0, "major7"], [2, "minor7"], [7, "dominant7"], [0, "major"]],
  minor: [[0, "minor"], [8, "major"], [3, "major"], [10, "major"], [0, "minor7"], [5, "minor"], [7, "minor"], [0, "minor"]]
};

function makeProject(key, scale, chords = PROGRESSIONS[scale]) {
  const project = createDefaultProject();
  project.basic.key = key;
  project.basic.scale = scale;
  const barTicks = project.basic.ppq * 4;
  project.chords = chords.map(([root, quality], bar) => ({ startTick: bar * barTicks, durationTick: barTicks, root: (root + rootToPitchClass(key)) % 12, quality, degree: "I" }));
  return project;
}

assert.deepEqual(PHRASE_FORMS.map((f) => f.id), ["motif", "qa", "peak"]);
assert.deepEqual(PHRASE_CONTOURS.map((c) => c.id), ["auto", "rise", "fall", "flat"]);
assert.deepEqual(PHRASE_BAR_CHOICES, [2, 4, 8]);

for (const [key, scale] of [["C", "major"], ["G", "major"], ["D#", "major"], ["A", "minor"], ["F#", "minor"]]) {
  const project = makeProject(key, scale);
  const barTicks = project.basic.ppq * 4;
  const tonic = rootToPitchClass(key);
  const scalePcs = new Set(SCALES[scale].map((i) => (tonic + i) % 12));

  for (const bars of [2, 4, 8]) {
    for (const contour of PHRASE_CONTOURS.map((c) => c.id)) {
      for (let variation = 0; variation < PHRASE_VARIATION_COUNT; variation += 1) {
        const candidates = phraseCandidates(project, { startBar: 0, bars, contour, variation });
        assert.equal(candidates.length, 3);
        const label = `${key} ${scale} ${bars}bars ${contour} v${variation}`;

        for (const candidate of candidates) {
          const { notes } = candidate;
          assert.ok(notes.length >= bars * 2, `${label}/${candidate.id}: enough notes`);
          assert.equal(candidate.endBar - candidate.startBar, bars);
          let previousEnd = -1;
          notes.forEach((note) => {
            assert.ok(note.pitch >= 36 && note.pitch <= 96, `${label}: pitch range`);
            assert.ok(scalePcs.has(note.pitch % 12), `${label}/${candidate.id}: ${note.pitch} stays inside the scale`);
            assert.ok(note.startTick >= previousEnd, `${label}/${candidate.id}: monophonic, no overlap`);
            previousEnd = note.startTick + note.durationTick;
            const bar = Math.floor(note.startTick / barTicks);
            assert.ok(bar >= candidate.startBar && bar < candidate.endBar);
            assert.ok(note.startTick + note.durationTick <= (bar + 1) * barTicks, `${label}: note stays inside its bar`);
          });

          // 各小節の頭の音は、その小節のコードトーン
          for (let bar = candidate.startBar; bar < candidate.endBar; bar += 1) {
            const chord = project.chords[bar];
            const pcs = new Set(chordIntervals(chord.quality).map((i) => (chord.root + i) % 12));
            const first = notes.find((n) => n.startTick === bar * barTicks);
            assert.ok(first && pcs.has(first.pitch % 12), `${label}/${candidate.id}: bar ${bar} starts on a chord tone`);
          }
          // 最後の音は、最後のコードのコードトーンで、長く置く
          const lastNote = notes.at(-1);
          const lastChord = project.chords[candidate.endBar - 1];
          const lastPcs = new Set(chordIntervals(lastChord.quality).map((i) => (lastChord.root + i) % 12));
          assert.ok(lastPcs.has(lastNote.pitch % 12), `${label}/${candidate.id}: lands on a chord tone`);
          assert.ok(lastNote.durationTick >= barTicks / 4, `${label}/${candidate.id}: landing note is long`);
        }
      }
    }
  }

  // 輪郭: 上行は最後のほうが高く、下降は低く、平坦は小さく動く
  const rise = phraseCandidates(project, { startBar: 0, bars: 4, contour: "rise" });
  const fall = phraseCandidates(project, { startBar: 0, bars: 4, contour: "fall" });
  const flat = phraseCandidates(project, { startBar: 0, bars: 4, contour: "flat" });
  rise.forEach((c) => assert.ok(c.anchors[2] > c.anchors[0], `${key} ${scale} rise: ${c.anchors}`));
  fall.forEach((c) => assert.ok(c.anchors[2] < c.anchors[0], `${key} ${scale} fall: ${c.anchors}`));
  flat.forEach((c) => assert.ok(Math.max(...c.anchors) - Math.min(...c.anchors) <= 5, `${key} ${scale} flat: ${c.anchors}`));

  // 3つの型は別の音になる
  const auto = phraseCandidates(project, { startBar: 0, bars: 4 });
  const signature = (c) => c.notes.map((n) => `${n.pitch}@${n.startTick}/${n.durationTick}`).join(",");
  assert.equal(new Set(auto.map(signature)).size, 3, "3 candidates differ");
  // 更新すると別の候補になる
  assert.notEqual(signature(auto[0]), signature(phraseCandidates(project, { startBar: 0, bars: 4, variation: 1 })[0]));
}

// 途中の小節 / 範囲が曲を超えるとき / コードが無いとき
const base = makeProject("C", "major");
const tail = phraseCandidates(base, { startBar: 6, bars: 4 });
assert.equal(tail[0].endBar - tail[0].startBar, 2, "曲の終わりを超えない");
assert.deepEqual(phraseRange(base, 99, 4), { startBar: 7, endBar: 8, bars: 1 });
const noChord = makeProject("C", "major", []);
assert.deepEqual(phraseCandidates(noChord, { startBar: 0, bars: 4 }), []);
assert.equal(phraseRange(noChord, 0, 4), null);

// 適用: 範囲だけ置き換わり、他の小節は残る。Project検証 / Undo / MIDI出力を通る
const store = createProjectStore(base);
const barTicks = base.basic.ppq * 4;
store.updateMelodyNotes([
  { id: "old-0", pitch: 72, startTick: 0, durationTick: 480, velocity: 90 },
  { id: "keep-5", pitch: 64, startTick: 5 * barTicks, durationTick: 480, velocity: 90 }
]);
const before = store.getSnapshot();
assert.equal(melodyNoteCountIn(before, 0, 4), 1);
const chosen = phraseCandidates(before, { startBar: 0, bars: 4 })[1];
store.updateMelodyNotes(applyPhraseNotes(before.tracks.find((t) => t.role === "melody").notes, chosen.startBar, chosen.endBar, chosen.notes, { barTicks }));
const after = store.getSnapshot();
validateProject(after);
const melody = after.tracks.find((t) => t.role === "melody").notes;
assert.ok(!melody.some((n) => n.id === "old-0"), "範囲内の古い音は置き換わる");
assert.ok(melody.some((n) => n.id === "keep-5"), "範囲外の音は残る");
assert.ok(buildMidiExports(after)["Melody.mid"].length > 100);
store.undo?.();
assert.ok(store.getSnapshot().tracks.find((t) => t.role === "melody").notes.some((n) => n.id === "old-0"), "↶で戻る");

// 試聴用の複製は元を変えない
const preview = withPhraseNotes(before, 0, 4, chosen.notes);
assert.equal(before.tracks.find((t) => t.role === "melody").notes.length, 2);
assert.ok(preview.tracks.find((t) => t.role === "melody").notes.length > 2);

assert.equal(phraseDots(chosen).length, 4);
assert.ok(phraseDots(chosen).every((row) => row.length === 8));

console.log("Phrase melody smoke test passed.");
