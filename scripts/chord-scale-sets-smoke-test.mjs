import assert from "node:assert/strict";
import {
  ALL_CHORD_QUALITY_ORDER, CHORD_QUALITY_DEFINITIONS, CHORD_QUALITY_GROUPS, CHORD_QUALITY_ORDER, chordIntervals, isChordQuality
} from "../src/core/chord-qualities.js";
import { chordSymbol, getAllChordVariants, getChordVariantGroups, getDiatonicChords, rootToPitchClass } from "../src/chord/chord-theory.js";
import { SCALE_FAMILIES, SCALE_SET_LEVELS, EXTRA_SCALE_GROUPS, SCALE_PANEL_LEVELS, getScaleFamily, scaleFamiliesForProject, scaleFamilyGroups, scaleLevelRows, scaleSetChords, scaleTensionChords } from "../src/chord/chord-scale-sets.js";
import { resolveScaleFamilyId } from "../src/chord/chord-scale-sets-ui.js";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import { buildMidiExports } from "../src/midi/midi-export.js";
import { bassChoicesForBar } from "../src/rhythm/rhythm-grid.js";
import { detectChord } from "../src/midi/midi-import.js";

// ---- Quality定義: 9種類の基本 + 拡張、すべてグループに入っている
const ids = Object.keys(CHORD_QUALITY_DEFINITIONS);
assert.equal(CHORD_QUALITY_ORDER.length, 9, "基本の9種類は変えない");
assert.equal(ids.length, 44);
assert.deepEqual([...ALL_CHORD_QUALITY_ORDER].sort(), [...ids].sort(), "全Qualityがグループに入っている");
assert.equal(new Set(ids.map((id) => CHORD_QUALITY_DEFINITIONS[id].suffix)).size, ids.length, "表記（suffix）が重複しない");
assert.ok(CHORD_QUALITY_GROUPS.every((group) => group.qualities.length > 0));
ids.forEach((id) => {
  const intervals = chordIntervals(id);
  assert.equal(intervals[0], 0, `${id} starts at the root`);
  assert.ok(intervals.every((value, index) => index === 0 || value > intervals[index - 1]), `${id} ascending`);
  assert.ok(Math.max(...intervals) <= 21, `${id} within 13th`);
});

// ---- 表記と度数
const sym = (root, quality) => chordSymbol(root, quality);
assert.equal(sym(0, "minor7flat5"), "Cm7b5");
assert.equal(sym(0, "minorMajor7"), "CmMaj7");
assert.equal(sym(7, "dominant7flat9"), "G7b9");
assert.equal(sym(0, "major9"), "Cmaj9");
assert.equal(sym(7, "dominant13"), "G13");
assert.equal(sym(0, "add9"), "Cadd9");
const variantsOfC = getAllChordVariants(0, "C");
assert.equal(variantsOfC.length, 44);
assert.equal(variantsOfC.find((v) => v.quality === "dominant9").degree, "I9");
assert.equal(variantsOfC.find((v) => v.quality === "minor9").degree, "i9");
assert.equal(variantsOfC.find((v) => v.quality === "minor7flat5").degree, "iø7");
assert.equal(variantsOfC.find((v) => v.quality === "diminished7").degree, "i°7");
assert.equal(variantsOfC.find((v) => v.quality === "dominant7").degree, "I7", "従来の表記のまま");
const groups = getChordVariantGroups(2, "C");
assert.equal(groups.reduce((sum, group) => sum + group.variants.length, 0), 44);
groups.forEach((group) => group.variants.forEach((v) => assert.equal(getAllChordVariants(2, "C")[v.index].quality, v.quality, "indexがgetAllChordVariantsと一致")));

// ---- Project / MIDI / Bass: 全Qualityを全ルートで通す
const store = createProjectStore(createDefaultProject());
store.updateChords(ids.map((quality, bar) => ({ root: (bar * 5) % 12, quality, degree: "I", startTick: bar * 1920, durationTick: 1920 })));
const project = store.getSnapshot();
validateProject(project);
const midi = buildMidiExports(project);
assert.ok(midi["Draft.mid"].length > 100 && midi["Chord.mid"].length > 100);
for (const quality of ids) for (let root = 0; root < 12; root += 1) {
  assert.ok(60 + root + Math.max(...chordIntervals(quality)) <= 127, `${quality} within MIDI range`);
}
ids.forEach((quality, bar) => {
  const choices = bassChoicesForBar(project, bar);
  assert.ok(choices.every((choice) => choice.semitones <= 12 && choice.semitones >= -12), `${quality} bass choices stay within an octave`);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, choices.length, `${quality} bass choices have unique ids`);
});

// ---- MIDI読み込みのコード判定は、基本の9種類だけから選ぶ（拡張名に化けない）
const am7 = new Array(12).fill(0);
[9, 0, 4, 7].forEach((pc) => { am7[pc] = 1920; });
assert.equal(detectChord(am7, 9).quality, "minor7");

// ---- スケール系の一覧
assert.deepEqual(SCALE_FAMILIES.map((family) => family.id), ["major", "natural-minor", "harmonic-minor", "melodic-minor"]);
assert.deepEqual(scaleFamiliesForProject("major").map((family) => family.id), ["major", "harmonic-minor", "melodic-minor"]);
assert.deepEqual(scaleFamiliesForProject("minor").map((family) => family.id), ["natural-minor", "harmonic-minor", "melodic-minor"]);
assert.equal(resolveScaleFamilyId("minor", "major"), "natural-minor", "曲のScaleに無い系統は先頭へ戻す");
assert.equal(resolveScaleFamilyId("major", "melodic-minor"), "melodic-minor");

// 3和音は、既存のダイアトニックと一致する
for (const key of ["C", "G", "A", "D#"]) {
  assert.deepEqual(
    scaleSetChords({ key, familyId: "major", level: "triad" }).map(({ root, quality, degree }) => ({ root, quality, degree })),
    getDiatonicChords(key, "major").map(({ root, quality, degree }) => ({ root, quality, degree }))
  );
  assert.deepEqual(
    scaleSetChords({ key, familyId: "natural-minor", level: "triad" }).map(({ root, quality, degree }) => ({ root, quality, degree })),
    getDiatonicChords(key, "minor").map(({ root, quality, degree }) => ({ root, quality, degree }))
  );
}

// どの系統・段階でも、コードの構成音はそのスケールの7音に収まる（テンションもスケール内）
for (const family of SCALE_FAMILIES) {
  for (const level of SCALE_SET_LEVELS) {
    for (const key of ["C", "F#", "A"]) {
      const tonic = { C: 0, "F#": 6, A: 9 }[key];
      const scalePcs = new Set(family.intervals.map((interval) => (tonic + interval) % 12));
      const chords = scaleSetChords({ key, familyId: family.id, level: level.id });
      assert.equal(chords.length, 7);
      chords.forEach((chord, index) => {
        assert.ok(isChordQuality(chord.quality));
        assert.equal(chord.root, (tonic + family.intervals[index]) % 12);
        chordIntervals(chord.quality).forEach((interval) => {
          assert.ok(scalePcs.has((chord.root + interval) % 12), `${family.id}/${level.id}/${key}: ${chord.symbol} (${chord.degree}) stays inside the scale`);
        });
      });
    }
  }
}

// 代表例（Cキー）
const text = (familyId, level) => scaleSetChords({ key: "C", familyId, level }).map((chord) => `${chord.symbol}`).join(" ");
assert.equal(text("major", "seventh"), "Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5");
assert.equal(text("harmonic-minor", "seventh"), "CmMaj7 Dm7b5 D#maj7#5 Fm7 G7 G#maj7 Bdim7");
assert.equal(text("harmonic-minor", "tension"), "CmMaj9 Dm7b5(11) D#maj9#5 Fm9 G7b9 G#maj7#11 Bdim7");
assert.equal(text("melodic-minor", "seventh"), "CmMaj7 Dm7 D#maj7#5 F7 G7 Am7b5 Bm7b5");
assert.equal(text("melodic-minor", "tension"), "CmMaj9 Dm7b9 D#maj9#5 F7#11 G7b13 Am9b5 Bm7b5");
assert.equal(scaleSetChords({ key: "C", familyId: "major", level: "seventh" })[4].degree, "V7");
assert.equal(scaleSetChords({ key: "C", familyId: "harmonic-minor", level: "tension" })[4].degree, "V7♭9");
assert.throws(() => scaleSetChords({ key: "C", familyId: "major", level: "nope" }), /Unsupported/);

// テンション段階: 各度の候補は「スケール内の音だけ」で、全部そろっている
{
  const pcsOf = (key, familyId) => new Set(getScaleFamily(familyId).intervals.map((i) => (rootToPitchClass(key) + i) % 12));
  for (const familyId of ["major", "natural-minor", "harmonic-minor", "melodic-minor"]) {
    const rows = scaleTensionChords({ key: "C", familyId });
    assert.equal(rows.length, 7);
    const pcs = pcsOf("C", familyId);
    rows.forEach((row) => row.chords.forEach((chord) => {
      assert.ok(chordIntervals(chord.quality).every((t) => pcs.has((chord.root + t) % 12)), `${familyId} ${chord.symbol} inside scale`);
    }));
    // 固定表のテンションは必ず候補に含まれる
    getScaleFamily(familyId).tension.forEach((quality, i) => {
      if (["diminished7", "minor7flat5"].includes(quality)) return;
      assert.ok(rows[i].chords.some((c) => c.quality === quality), `${familyId} row ${i} has ${quality}`);
    });
  }
  const major = scaleTensionChords({ key: "C", familyId: "major" });
  assert.ok(major[0].chords.some((c) => c.symbol === "Cmaj9") && major[0].chords.some((c) => c.symbol === "C6"));
  assert.ok(!major[0].chords.some((c) => c.quality === "dominant7flat9"), "C7b9 has Eb: outside C major");
  assert.ok(major[4].chords.some((c) => c.symbol === "G13"));
}

// ---- その他のスケール・特殊和音
{
  const extras = EXTRA_SCALE_GROUPS.flatMap((group) => group.scales);
  assert.ok(extras.length >= 25);
  assert.equal(new Set(extras.map((e) => e.id)).size, extras.length, "scale idが重複しない");
  assert.deepEqual(SCALE_PANEL_LEVELS.map((l) => l.id), ["triad", "seventh", "tension", "special"]);
  assert.ok(extras.every((e) => e.intervals[0] === 0 && e.intervals.every((v, i) => i === 0 || v > e.intervals[i - 1]) && e.intervals.at(-1) < 12));
  for (const key of ["C", "F#"]) {
    const tonic = rootToPitchClass(key);
    for (const family of [...SCALE_FAMILIES, ...extras]) {
      for (const level of SCALE_PANEL_LEVELS) {
        const rows = scaleLevelRows({ key, familyId: family.id, level: level.id });
        assert.equal(rows.length, family.intervals.length);
        const pcs = new Set(family.intervals.map((i) => (tonic + i) % 12));
        rows.forEach((row) => row.chords.forEach((chord) => {
          assert.ok(isChordQuality(chord.quality));
          assert.ok(chordIntervals(chord.quality).every((t) => pcs.has((chord.root + t) % 12)), `${family.id}/${level.id}/${key}: ${chord.symbol} inside scale`);
        }));
      }
    }
  }
  const names = (familyId, level, i) => scaleLevelRows({ key: "C", familyId, level })[i].chords.map((c) => c.symbol);
  assert.deepEqual(names("phrygian-dominant", "triad", 0), ["C", "Caug", "Csus4"], "Cスパニッシュ(フリジアン・ドミナント)のIはC");
  assert.ok(names("phrygian-dominant", "seventh", 0).includes("C7"));
  assert.ok(names("phrygian-dominant", "triad", 3).includes("Fm"), "Fmがある");
  assert.deepEqual(names("whole-tone", "triad", 0), ["Caug"]);
  assert.ok(names("whole-tone", "seventh", 0).includes("C7b5") && names("whole-tone", "seventh", 0).includes("C7#5"));
  assert.ok(names("major-pentatonic", "triad", 0).includes("C") && names("minor-pentatonic", "seventh", 0).includes("Cm7"));
  assert.ok(names("miyako-bushi", "triad", 0).includes("Csus4"));
  assert.ok(names("major", "special", 1).includes("Dq4"), "ドの4度堆積はDのQuartalが出る");
  assert.equal(scaleFamilyGroups("major").length, 1 + EXTRA_SCALE_GROUPS.length);
  assert.equal(getScaleFamily("phrygian-dominant").mode, "Phrygian Dominant（スパニッシュ）");
  assert.equal(resolveScaleFamilyId("major", "whole-tone"), "whole-tone");
  assert.equal(resolveScaleFamilyId("minor", "major"), "natural-minor");
}

console.log("Chord scale sets smoke test passed.");
