import { createDefaultProject, validateProject } from "../core/project-state.js";
import { chordDegreeForVariant, chordSymbol, rootToPitchClass } from "../chord/chord-theory.js";

// AI候補JSONを、一時的な試聴専用Projectへ変換する。
// Demo Project Schema 3 / IndexedDB / SongProject v1は変更しない。
export const MAX_AI_CHORD_IMPORT_BYTES = 128 * 1024;
const QUALITY = Object.freeze({
  maj7: "major7", m7: "minor7", "7": "dominant7",
  maj9: "major9", m9: "minor9", m7b5: "minor7flat5"
});
const ROOT = Object.freeze({
  C: "C", "C#": "C#", Db: "C#", D: "D", "D#": "D#", Eb: "D#",
  E: "E", F: "F", "F#": "F#", Gb: "F#", G: "G", "G#": "G#", Ab: "G#",
  A: "A", "A#": "A#", Bb: "A#", B: "B"
});
const object = (x) => x && typeof x === "object" && !Array.isArray(x);
const escapeHtml = (x) => String(x).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function parseAiChordBatch(text) {
  if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > MAX_AI_CHORD_IMPORT_BYTES) {
    throw new Error("AIコード候補JSONが大きすぎます（128KBまで）。");
  }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("AIコード候補JSONとして読み取れませんでした。"); }
  if (!object(data) || data.kind !== "chord-candidate-batch" || data.schemaVersion !== 1) {
    throw new Error("AIコード候補の形式が違います。kindとschemaVersionを確認してください。");
  }
  if (typeof data.songId !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(data.songId)) {
    throw new Error("songIdは英数字・_・-で32文字以内にしてください。");
  }
  const settings = data.settings;
  if (!object(settings) || settings.bars !== 8 || settings.chordsPerBar !== 2 ||
      settings.meter !== "4/4" || settings.ppq !== 480 || settings.scale !== "major" ||
      typeof settings.key !== "string" || !Object.hasOwn(ROOT, settings.key) ||
      !Number.isInteger(settings.bpm) || settings.bpm < 40 || settings.bpm > 240) {
    throw new Error("MVPでは8小節・各2コード・4/4・PPQ480・Major・BPM40〜240のみ対応します。");
  }
  if (!Array.isArray(data.candidates) || data.candidates.length < 1 || data.candidates.length > 8) {
    throw new Error("候補は1〜8件必要です。");
  }
  const ids = new Set();
  const candidates = data.candidates.map((candidate, index) => {
    if (!object(candidate) || typeof candidate.candidateId !== "string" ||
        !/^[A-Za-z0-9_-]{1,32}$/.test(candidate.candidateId) || ids.has(candidate.candidateId)) {
      throw new Error("候補IDが不正または重複しています（候補" + (index + 1) + "）。");
    }
    ids.add(candidate.candidateId);
    if (typeof candidate.description !== "string" || candidate.description.length > 120) {
      throw new Error(candidate.candidateId + "の説明が不正です。");
    }
    if (!Array.isArray(candidate.chords) || candidate.chords.length !== 16) {
      throw new Error(candidate.candidateId + "は16コード必要です。");
    }
    const positions = new Set();
    const chords = candidate.chords.map((chord) => {
      if (!object(chord) || !Number.isInteger(chord.bar) || chord.bar < 1 || chord.bar > 8 ||
          (chord.beat !== 1 && chord.beat !== 3) ||
          typeof chord.root !== "string" || !Object.hasOwn(ROOT, chord.root) ||
          typeof chord.quality !== "string" || !Object.hasOwn(QUALITY, chord.quality)) {
        throw new Error(candidate.candidateId + "のコード指定が不正です。");
      }
      const position = (chord.bar - 1) * 4 + chord.beat;
      if (positions.has(position)) throw new Error(candidate.candidateId + "の小節・拍が重複しています。");
      positions.add(position);
      return {
        bar: chord.bar, beat: chord.beat, root: chord.root, quality: chord.quality,
        rootPitchClass: rootToPitchClass(ROOT[chord.root]),
        demoQuality: QUALITY[chord.quality]
      };
    }).sort((a, b) => a.bar - b.bar || a.beat - b.beat);
    return { candidateId: candidate.candidateId, description: candidate.description, chords };
  });
  return {
    kind: data.kind, schemaVersion: 1, songId: data.songId,
    version: typeof data.version === "string" ? data.version.slice(0, 32) : "v1",
    settings: { bpm: settings.bpm, key: ROOT[settings.key] },
    candidates
  };
}

export function makeAiChordPreviewProject(batch, candidateId) {
  const candidate = batch?.candidates?.find((x) => x.candidateId === candidateId);
  if (!candidate) throw new Error("試聴候補が見つかりません。");
  const project = createDefaultProject();
  project.metadata.title = batch.songId + " / " + candidate.candidateId;
  project.basic.bpm = batch.settings.bpm;
  project.basic.key = batch.settings.key;
  project.basic.scale = "major";
  project.chords = candidate.chords.map((chord) => ({
    root: chord.rootPitchClass,
    quality: chord.demoQuality,
    degree: chordDegreeForVariant(chord.rootPitchClass, batch.settings.key, chord.demoQuality),
    startTick: ((chord.bar - 1) * 4 + chord.beat - 1) * 480,
    durationTick: 960
  }));
  project.structure.sections = [{ id: "ai-preview-chorus", kind: "chorus", name: "サビ", bars: 8 }];
  project.instruments = [
    { part: "chord", preset: "keys", tone: "warm" },
    { part: "chord-backing", preset: "block", tone: "natural" }
  ];
  validateProject(project);
  return project;
}

export function aiChordImportHtml(batch, selectedId) {
  const intro = '<section class="card" aria-label="AIコード進行の読み込みと試聴">' +
    '<h3>🎹 AIコード進行 Import（試聴専用）</h3>' +
    '<p class="hint">候補JSONを読み込み、現在の曲を変更せずに聴き比べます。</p>' +
    '<div class="actions"><button id="ai-chord-import-open" class="small-action" type="button">候補JSONを読み込む</button>' +
    '<input id="ai-chord-import-file" type="file" accept=".json,application/json" hidden>' +
    (batch ? '<button id="ai-chord-import-clear" class="small-action" type="button">候補を閉じる</button>' : '') +
    '</div>';
  if (!batch) return intro + '<p class="hint">形式: chord-candidate-batch / schemaVersion 1</p></section>';
  const current = batch.candidates.find((x) => x.candidateId === selectedId) ?? batch.candidates[0];
  const choices = batch.candidates.map((item) =>
    '<button type="button" data-ai-chord-play="' + escapeHtml(item.candidateId) +
    '" class="small-action" aria-pressed="' + String(item.candidateId === current.candidateId) + '">' +
    '▶ ' + escapeHtml(item.candidateId) + '　' + escapeHtml(item.description) + '</button>'
  ).join("");
  const progression = Array.from({ length: 8 }, (_, bar) => {
    const pair = current.chords.filter((chord) => chord.bar === bar + 1);
    return '<li>' + (bar + 1) + '小節: ' +
      pair.map((chord) => escapeHtml(chord.root + chordSymbol(0, chord.demoQuality).slice(1))).join(' → ') +
      '</li>';
  }).join("");
  return intro + '<p class="hint">' + escapeHtml(batch.songId) + ' / ' + escapeHtml(batch.version) +
    ' / ' + batch.settings.bpm + ' BPM / ' + escapeHtml(batch.settings.key) + ' Major</p>' +
    '<div class="actions" role="group" aria-label="コード候補を試聴">' + choices + '</div>' +
    '<button type="button" id="ai-chord-import-stop" class="small-action">■ 再生停止</button>' +
    '<h4>選択中: ' + escapeHtml(current.candidateId) + '</h4><ol class="hint">' + progression + '</ol>' +
    '<p class="hint">仮音色の比較試聴です。元Projectの保存・反映、Cubaseでの確認は行いません。</p></section>';
}
