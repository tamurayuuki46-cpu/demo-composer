import { chordSymbol, getDiatonicChords } from "../chord/chord-theory.js";
import { applyDrumPresetToBars, getDrumPreset } from "../rhythm/drum-presets.js";
import { getBackingPattern, upsertBackingPattern } from "../core/backing-patterns.js";
import { getSoundPart, getSoundTone, upsertSoundSelection } from "../core/sound-presets.js";

// 何も決まっていないときの「出発点」。ジャンルとMoodを選ぶと、Key / BPM / コード進行 / ドラム /
// 伴奏 / 音色の方向性をまとめた候補を3つ出す。完成させるのではなく、選んで直すための叩き台。
// 出発点はHubが持つ（基本情報はHub中心という方針）。各Moduleのデータは、そのModuleの公開関数で作る。

export const GENRES = Object.freeze([
  { id: "pop", label: "ポップ" },
  { id: "ballad", label: "バラード" },
  { id: "rock", label: "ロック" },
  { id: "dance", label: "ダンス" },
  { id: "vocaloid", label: "ボカロ風" }
]);

export const MOODS = Object.freeze([
  { id: "sad", label: "切ない" },
  { id: "bright", label: "明るい" },
  { id: "night", label: "夜" },
  { id: "strong", label: "力強い" },
  { id: "gentle", label: "やさしい" }
]);

// degrees: ダイアトニックの番号（0 = I / i）。tones: パートごとの [preset, 方向性タグ]
export const STARTING_POINTS = Object.freeze([
  {
    id: "pop-bright", label: "王道ポップ", genre: "pop", moods: ["bright"],
    key: "C", scale: "major", bpm: 120, degrees: [0, 4, 5, 3], drum: "pop", backing: "eighth",
    tones: { chord: ["keys", "bright"], melody: ["lead", "bright"], bass: ["soft-bass", "natural"] },
    note: "I–V–vi–IV。明るく歌いやすい定番の形"
  },
  {
    id: "pop-sad", label: "切ないポップ", genre: "pop", moods: ["sad"],
    key: "A", scale: "minor", bpm: 112, degrees: [0, 5, 2, 6], drum: "pop", backing: "eighth",
    tones: { chord: ["piano", "soft"], melody: ["lead", "soft"], bass: ["soft-bass", "warm"] },
    note: "i–VI–III–VII。短調で流れが止まらない切ない進行"
  },
  {
    id: "jpop-sad", label: "J-POP王道（切ない）", genre: "pop", moods: ["sad"],
    key: "C", scale: "major", bpm: 128, degrees: [3, 4, 2, 5], drum: "basic-8", backing: "syncopation",
    tones: { chord: ["keys", "natural"], melody: ["lead", "bright"], bass: ["synth-bass", "natural"] },
    note: "IV–V–iii–vi。J-POPでよく聞く、切なさのある流れ"
  },
  {
    id: "pop-gentle", label: "やさしいポップ", genre: "pop", moods: ["gentle"],
    key: "G", scale: "major", bpm: 100, degrees: [0, 5, 3, 4], drum: "basic-8", backing: "arpeggio",
    tones: { chord: ["keys", "warm"], melody: ["keys", "soft"], bass: ["soft-bass", "warm"] },
    note: "I–vi–IV–V。まとまりがよく、やわらかい印象"
  },
  {
    id: "pop-night", label: "夜のチル", genre: "pop", moods: ["night", "gentle"],
    key: "D", scale: "minor", bpm: 90, degrees: [0, 3, 6, 5], drum: "half-time", backing: "eighth",
    tones: { chord: ["pad", "airy"], melody: ["keys", "soft"], bass: ["deep-bass", "dark"] },
    note: "i–iv–VII–VI。ゆったりした夜の雰囲気"
  },
  {
    id: "ballad-gentle", label: "やさしいバラード", genre: "ballad", moods: ["gentle", "bright"],
    key: "F", scale: "major", bpm: 72, degrees: [0, 5, 3, 4], drum: "half-time", backing: "arpeggio",
    tones: { chord: ["pad", "warm"], melody: ["keys", "soft"], bass: ["soft-bass", "warm"] },
    note: "I–vi–IV–V。アルペジオで静かに始めやすい"
  },
  {
    id: "ballad-sad", label: "切ないバラード", genre: "ballad", moods: ["sad"],
    key: "D", scale: "minor", bpm: 68, degrees: [0, 5, 2, 6], drum: "half-time", backing: "arpeggio",
    tones: { chord: ["piano", "soft"], melody: ["keys", "soft"], bass: ["soft-bass", "soft"] },
    note: "i–VI–III–VII。ピアノのアルペジオが映える"
  },
  {
    id: "ballad-night", label: "夜のバラード", genre: "ballad", moods: ["night", "sad"],
    key: "A", scale: "minor", bpm: 76, degrees: [0, 3, 6, 2], drum: "half-time", backing: "arpeggio",
    tones: { chord: ["pad", "dark"], melody: ["keys", "soft"], bass: ["deep-bass", "dark"] },
    note: "i–iv–VII–III。暗めで余韻のある進行"
  },
  {
    id: "rock-strong", label: "ストレートなロック", genre: "rock", moods: ["strong", "bright"],
    key: "E", scale: "major", bpm: 140, degrees: [0, 3, 4, 3], drum: "rock", backing: "eighth",
    tones: { chord: ["keys", "aggressive"], melody: ["lead", "aggressive"], bass: ["synth-bass", "aggressive"] },
    note: "I–IV–V–IV。勢いのある3コード感"
  },
  {
    id: "rock-dark", label: "ダークなロック", genre: "rock", moods: ["strong", "night"],
    key: "E", scale: "minor", bpm: 138, degrees: [0, 6, 5, 6], drum: "rock", backing: "eighth",
    tones: { chord: ["keys", "dark"], melody: ["lead", "aggressive"], bass: ["synth-bass", "dark"] },
    note: "i–VII–VI–VII。重くて前へ進む進行"
  },
  {
    id: "dance-bright", label: "明るい4つ打ち", genre: "dance", moods: ["bright", "strong"],
    key: "C", scale: "major", bpm: 124, degrees: [5, 3, 0, 4], drum: "four-floor", backing: "syncopation",
    tones: { chord: ["keys", "bright"], melody: ["lead", "bright"], bass: ["synth-bass", "bright"] },
    note: "vi–IV–I–V。踊れるノリで少し切なさも"
  },
  {
    id: "dance-night", label: "夜の4つ打ち", genre: "dance", moods: ["night", "sad"],
    key: "A", scale: "minor", bpm: 122, degrees: [0, 2, 5, 6], drum: "four-floor", backing: "syncopation",
    tones: { chord: ["pad", "airy"], melody: ["lead", "airy"], bass: ["deep-bass", "dark"] },
    note: "i–III–VI–VII。広がりのある夜のダンス"
  },
  {
    id: "vocaloid-fast", label: "疾走する切なさ", genre: "vocaloid", moods: ["sad", "strong"],
    key: "A", scale: "minor", bpm: 170, degrees: [5, 6, 0, 2], drum: "sixteenth-hh", backing: "syncopation",
    tones: { chord: ["keys", "bright"], melody: ["lead", "bright"], bass: ["synth-bass", "aggressive"] },
    note: "VI–VII–i–III。速いテンポで駆け抜ける短調"
  },
  {
    id: "vocaloid-bright", label: "明るい高速ポップ", genre: "vocaloid", moods: ["bright", "strong"],
    key: "C", scale: "major", bpm: 160, degrees: [3, 4, 2, 5], drum: "sixteenth-hh", backing: "eighth",
    tones: { chord: ["keys", "bright"], melody: ["lead", "bright"], bass: ["synth-bass", "natural"] },
    note: "IV–V–iii–vi。速くてもメロが乗りやすい進行"
  }
]);

export function genreLabel(id) { return GENRES.find((genre) => genre.id === id)?.label ?? ""; }
export function moodLabel(id) { return MOODS.find((mood) => mood.id === id)?.label ?? ""; }

// 選んだジャンル / Moodに近い順に、必ず3つ返す（どちらか片方だけでもよい）。
// 戻り値: [{ ...出発点, matched: "genre+mood" | "genre" | "mood" | "other", reason }]
export function suggestStartingPoints({ genre = "", mood = "" } = {}) {
  const scored = STARTING_POINTS.map((point, order) => {
    const genreHit = genre !== "" && point.genre === genre;
    const moodHit = mood !== "" && point.moods.includes(mood);
    const score = (genreHit ? 3 : 0) + (moodHit ? 2 : 0);
    const matched = genreHit && moodHit ? "genre+mood" : genreHit ? "genre" : moodHit ? "mood" : "other";
    return { point, order, score, matched };
  });
  scored.sort((a, b) => (b.score - a.score) || (a.order - b.order));

  return scored.slice(0, 3).map(({ point, matched }) => ({
    ...point,
    matched,
    reason: matched === "genre+mood"
      ? `${genreLabel(genre)}×${moodLabel(mood)}にぴったり`
      : matched === "genre"
        ? `${genreLabel(genre)}の別の雰囲気`
        : matched === "mood"
          ? `${moodLabel(mood)}雰囲気で別ジャンル`
          : "ちがう方向から"
  }));
}

// 出発点を適用するための変更内容（projectStore.applyStartingPoint に渡す）を作る。
// ドラムは、出発点のコード進行と同じ小節数だけ置き換える（それ以外の小節はそのまま）。
export function buildStartingPointPatch(project, point, { mood = "" } = {}) {
  const barTicks = project.basic.ppq * 4;
  const diatonic = getDiatonicChords(point.key, point.scale);
  const chords = point.degrees.map((index, barIndex) => ({
    root: diatonic[index].root,
    quality: diatonic[index].quality,
    degree: diatonic[index].degree,
    startTick: barIndex * barTicks,
    durationTick: barTicks
  }));

  const drumNotes = applyDrumPresetToBars(
    project.tracks.find((track) => track.role === "drums")?.notes ?? [],
    { presetId: point.drum, startBar: 0, endBar: chords.length, barTicks, stepTicks: barTicks / 16 }
  );

  let instruments = upsertBackingPattern(project.instruments ?? [], point.backing);
  for (const [part, [preset, tone]] of Object.entries(point.tones)) {
    const def = getSoundPart(part);
    if (!def?.presets.some((item) => item.id === preset)) throw new Error(`Unknown sound preset: ${part}/${preset}`);
    getSoundTone(tone);
    instruments = upsertSoundSelection(instruments, { part, preset, tone });
  }

  const moodId = mood || point.moods[0];
  return {
    metadata: { genre: genreLabel(point.genre), mood: [moodLabel(moodId)] },
    basic: { bpm: point.bpm, key: point.key, scale: point.scale },
    chords,
    drumNotes,
    instruments
  };
}

// 試聴用: いまのProjectに出発点を当てた「仮のProject」を返す（保存も履歴もしない）。
// Bassは出発点のコードと合わないことがあるので、試聴では外す。
export function previewProject(project, point, options = {}) {
  const patch = buildStartingPointPatch(project, point, options);
  const preview = JSON.parse(JSON.stringify(project));
  preview.metadata = { ...preview.metadata, ...patch.metadata };
  preview.basic = { ...preview.basic, ...patch.basic };
  preview.chords = patch.chords;
  preview.instruments = patch.instruments;
  const drums = preview.tracks.find((track) => track.role === "drums");
  if (drums) drums.notes = patch.drumNotes;
  else preview.tracks.push({ role: "drums", name: "Drums", midiChannel: 10, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, drumMap: { kick: 36, snare: 38, closedHH: 42 }, notes: patch.drumNotes });
  preview.tracks = preview.tracks.filter((track) => track.role !== "bass");
  return preview;
}

// 進行をコード名で（例: Dm → A# → F → C）
export function progressionNames(point) {
  const diatonic = getDiatonicChords(point.key, point.scale);
  return point.degrees.map((index) => chordSymbol(diatonic[index].root, diatonic[index].quality)).join(" → ");
}

export function describeStartingPoint(point) {
  const scale = point.scale === "major" ? "Major" : "Minor";
  const drum = getDrumPreset(point.drum).label;
  const backing = getBackingPattern(point.backing).label;
  const tones = Object.entries(point.tones).map(([part, [, tone]]) => `${getSoundPart(part).label} ${getSoundTone(tone).label}`).join(" / ");
  return {
    basics: `${point.key} ${scale} ・ BPM ${point.bpm}`,
    parts: `ドラム ${drum} ・ 伴奏 ${backing}`,
    tones
  };
}

// 適用前の確認文。上書きされる内容が無ければ null（確認なしで入れてよい）。
export function applyStartingPointConfirmText(project, point) {
  const barTicks = project.basic.ppq * 4;
  const endTick = point.degrees.length * barTicks;
  const drums = project.tracks.find((track) => track.role === "drums")?.notes ?? [];
  const melody = project.tracks.find((track) => track.role === "melody")?.notes ?? [];
  const hasDrums = drums.some((note) => note.startTick < endTick);
  if (project.chords.length === 0 && !hasDrums) return null;

  const items = [];
  if (project.chords.length > 0) items.push("コード進行");
  if (hasDrums) items.push(`Bar 1–${point.degrees.length}のドラム`);
  items.push("Key / BPM / 音色 / 伴奏");
  const keep = melody.length > 0
    ? "メロディの音はそのまま残ります（Keyが変わっても移調はされません）。"
    : "";
  return `「${point.label}」で ${items.join("・")} を置き換えますか？${keep}（↶で戻せます）`;
}
