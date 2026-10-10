// 曲の構成（Section）のデータ定義と操作。UIにもAudioにも依存しない純粋関数だけを置く。
//
// 考え方:
// - `structure.sections` は、曲の先頭（Bar 1）から順に並ぶ「小節の名前付きの区切り」。
// - Chord / Melody / Bass / Drumsのデータは今までどおりtickで持つ。Sectionは区切りを付けるだけで、
//   音符データをSectionの中に入れない（Schema変更なし）。
// - Chordは `chords[index] = Bar index+1` として先頭から隙間なく並べる前提なので、
//   Sectionの長さを変える操作は「音符もコードも一緒に前後へずらす」。コードの隙間ができる場合は拒否する。
// - Sectionをまたぐ複数Moduleのデータをまとめて変えるため、Hubの移調と同じ「Global Operation」として
//   Coreに置く（各Moduleのデータを別Moduleが直接書き換えるのではなく、Coreが整合性を保つ）。

export const SECTION_KINDS = Object.freeze({
  intro: { label: "イントロ", defaultBars: 4 },
  verse: { label: "Aメロ", defaultBars: 8 },
  prechorus: { label: "Bメロ", defaultBars: 8 },
  chorus: { label: "サビ", defaultBars: 8 },
  interlude: { label: "間奏", defaultBars: 4 },
  bridge: { label: "Cメロ", defaultBars: 8 },
  outro: { label: "アウトロ", defaultBars: 4 }
});

// 曲の盛り上がり設計（Section Energy）と、次のSectionへのつなぎ方（Transition）。
// どちらも `structure.sections[]` の任意の項目（Schemaの追記のみ）。無い古いProjectは、Sectionの種類ごとの初期値で扱う。
// 設計のラベルであり、音を自動では変えない（音を変えるのはVariation / Fillなどの候補から選んだとき）。
export const ENERGY_LEVELS = Object.freeze([
  { id: "low", label: "Low", rank: 1 },
  { id: "mid", label: "Mid", rank: 2 },
  { id: "high", label: "High", rank: 3 }
]);

export const DEFAULT_ENERGY_BY_KIND = Object.freeze({
  intro: "low",
  verse: "low",
  prechorus: "mid",
  chorus: "high",
  interlude: "mid",
  bridge: "mid",
  outro: "low"
});

export const TRANSITIONS = Object.freeze([
  { id: "keep", label: "Keep", description: "そのままつなぐ" },
  { id: "fill", label: "Fill", description: "ドラムフィルなどでつなぐ" },
  { id: "stop", label: "Stop", description: "一瞬止めてから入る（ブレイク）" },
  { id: "build", label: "Build", description: "少しずつ盛り上げてつなぐ" },
  { id: "drop", label: "Drop", description: "ためてから、ドンと入る" }
]);

export const MAX_SECTIONS = 24;
export const MAX_SECTION_BARS = 32;
export const MAX_TOTAL_BARS = 128;

// 「3候補から選んで、あとから直す」ための構成の叩き台。
export const SECTION_TEMPLATES = Object.freeze([
  {
    id: "one-chorus",
    label: "1コーラス（32小節）",
    description: "イントロ → Aメロ → Bメロ → サビ → アウトロ。まず1コーラス作るときの基本形。",
    sections: [
      { kind: "intro", bars: 4 },
      { kind: "verse", bars: 8 },
      { kind: "prechorus", bars: 8 },
      { kind: "chorus", bars: 8 },
      { kind: "outro", bars: 4 }
    ]
  },
  {
    id: "full-song",
    label: "フル尺（60小節）",
    description: "間奏をはさんで2コーラス。J-POP / ボカロの一般的な長さ。",
    sections: [
      { kind: "intro", bars: 4 },
      { kind: "verse", bars: 8 },
      { kind: "prechorus", bars: 8 },
      { kind: "chorus", bars: 8 },
      { kind: "interlude", bars: 4 },
      { kind: "verse", bars: 8 },
      { kind: "prechorus", bars: 8 },
      { kind: "chorus", bars: 8 },
      { kind: "outro", bars: 4 }
    ]
  },
  {
    id: "loop-8",
    label: "8小節ループ（8小節）",
    description: "まず8小節だけ作る。サビやAメロのアイデア出し向け。あとからSectionを足せる。",
    sections: [{ kind: "verse", bars: 8 }]
  }
]);

const TRACK_ROLES = ["melody", "bass", "drums", "counter"];

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function barTicksOf(project) {
  return project.basic.ppq * 4;
}

export function getSections(project) {
  return project.structure?.sections ?? [];
}

// ---------------------------------------------------------------- Validation

export function validateStructure(structure) {
  if (structure === undefined) return true;

  if (!structure || typeof structure !== "object" || !Array.isArray(structure.sections)) {
    throw new Error("曲の構成データが不正です。");
  }

  const { sections } = structure;

  if (sections.length > MAX_SECTIONS) {
    throw new Error(`Sectionは${MAX_SECTIONS}個までです。`);
  }

  const ids = new Set();
  let totalBars = 0;

  sections.forEach((section, index) => {
    const label = `Section ${index + 1}`;

    if (!section || typeof section !== "object") {
      throw new Error(`${label}が不正です。`);
    }

    if (typeof section.id !== "string" || !section.id || ids.has(section.id)) {
      throw new Error(`${label}のidが不正です。`);
    }
    ids.add(section.id);

    if (!Object.hasOwn(SECTION_KINDS, section.kind)) {
      throw new Error(`${label}の種類が不正です。`);
    }

    if (section.energy !== undefined && !ENERGY_LEVELS.some((level) => level.id === section.energy)) {
      throw new Error(`${label}の盛り上がり（Energy）が不正です。`);
    }

    if (section.transition !== undefined && !TRANSITIONS.some((item) => item.id === section.transition)) {
      throw new Error(`${label}のつなぎ（Transition）が不正です。`);
    }

    if (typeof section.name !== "string" || !section.name.trim() || section.name.length > 20) {
      throw new Error(`${label}の名前は1〜20文字にしてください。`);
    }

    if (!Number.isInteger(section.bars) || section.bars < 1 || section.bars > MAX_SECTION_BARS) {
      throw new Error(`${label}の小節数は1〜${MAX_SECTION_BARS}にしてください。`);
    }

    totalBars += section.bars;
  });

  if (totalBars > MAX_TOTAL_BARS) {
    throw new Error(`曲全体は${MAX_TOTAL_BARS}小節までです。`);
  }

  return true;
}

// ------------------------------------------------------------ Section helpers

export function createSection(kind, bars, existingSections = []) {
  const definition = SECTION_KINDS[kind];
  if (!definition) {
    throw new Error("Sectionの種類が不正です。");
  }

  const sameKind = existingSections.filter((section) => section.kind === kind).length;
  const name = sameKind === 0 ? definition.label : `${definition.label}${sameKind + 1}`;

  return {
    id: createId("section"),
    kind,
    name,
    bars: bars ?? definition.defaultBars,
    energy: DEFAULT_ENERGY_BY_KIND[kind]
  };
}

export function buildTemplateSections(templateId) {
  const template = SECTION_TEMPLATES.find((candidate) => candidate.id === templateId);
  if (!template) {
    throw new Error("構成の叩き台が見つかりません。");
  }

  return template.sections.reduce(
    (sections, { kind, bars }) => [...sections, createSection(kind, bars, sections)],
    []
  );
}

// 保存されていなければ、Sectionの種類ごとの初期値
export function sectionEnergy(section) {
  return ENERGY_LEVELS.some((level) => level.id === section.energy)
    ? section.energy
    : (DEFAULT_ENERGY_BY_KIND[section.kind] ?? "mid");
}

export function sectionTransition(section) {
  return TRANSITIONS.some((item) => item.id === section.transition) ? section.transition : "keep";
}

export function energyLabel(energyId) {
  return ENERGY_LEVELS.find((level) => level.id === energyId)?.label ?? "Mid";
}

// 新しいSection配列を返す（元は変更しない）。値が不正なら例外
export function withSectionEnergy(sections, index, energy) {
  if (!ENERGY_LEVELS.some((level) => level.id === energy)) throw new Error("盛り上がり（Energy）が不正です。");
  if (!sections[index]) throw new Error("Sectionが見つかりません。");
  return sections.map((section, i) => (i === index ? { ...section, energy } : section));
}

export function withSectionTransition(sections, index, transition) {
  if (!TRANSITIONS.some((item) => item.id === transition)) throw new Error("つなぎ（Transition）が不正です。");
  if (!sections[index]) throw new Error("Sectionが見つかりません。");
  return sections.map((section, i) => (i === index ? { ...section, transition } : section));
}

// 設計の一言ヒント。評価ではなく、気づきの材料。
export function energyHints(sections) {
  const hints = [];
  const rank = (section) => ENERGY_LEVELS.find((level) => level.id === sectionEnergy(section)).rank;

  sections.forEach((section, index) => {
    const previous = sections[index - 1];
    if (section.kind === "chorus" && previous && rank(section) < rank(previous)) {
      hints.push(`${section.name}が、前の${previous.name}より盛り上がり低めです。サビを目立たせたいなら High にしてみる。`);
    }
    const next = sections[index + 1];
    if (next && sectionTransition(section) === "build" && rank(next) <= rank(section)) {
      hints.push(`${section.name}の終わりは Build ですが、次の${next.name}は同じか低めです。`);
    }
  });

  if (sections.length >= 3 && new Set(sections.map(sectionEnergy)).size === 1) {
    hints.push("すべてのSectionが同じ盛り上がりです。サビを High、イントロを Low にするとメリハリがつきます。");
  }
  return hints.slice(0, 3);
}

// 「イントロ Low → Aメロ Low → Bメロ Mid → サビ High」
export function energyFlowText(sections) {
  return sections.map((section) => `${section.name} ${energyLabel(sectionEnergy(section))}`).join(" → ");
}

export function totalSectionBars(sections) {
  return sections.reduce((sum, section) => sum + section.bars, 0);
}

// [{ index, section, startBar, endBar }]  startBarは0始まり、endBarは含まない
export function sectionRanges(sections) {
  let startBar = 0;

  return sections.map((section, index) => {
    const range = { index, section, startBar, endBar: startBar + section.bars };
    startBar += section.bars;
    return range;
  });
}

export function sectionAtBar(sections, bar) {
  const range = sectionRanges(sections).find((candidate) => bar >= candidate.startBar && bar < candidate.endBar);
  if (!range) return null;

  return { ...range, barInSection: bar - range.startBar };
}

// Melody / Rhythm画面の見出し用。例: "サビ 3/8小節"
export function sectionLabel(project, bar) {
  const found = sectionAtBar(getSections(project), bar);
  return found ? `${found.section.name} ${found.barInSection + 1}/${found.section.bars}小節` : "";
}

// 骨子の進み具合。範囲(startBar〜endBar、endBarは含まない)のうち、パートごとに「入力のある小節」が何小節あるか。
export function sectionProgress(project, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const total = endBar - startBar;
  const hasNotes = (role, bar) => (project.tracks.find((track) => track.role === role)?.notes ?? [])
    .some((note) => Math.floor(note.startTick / barTicks) === bar);
  const count = (hasContent) => {
    let filled = 0;
    for (let bar = startBar; bar < endBar; bar += 1) {
      if (hasContent(bar)) filled += 1;
    }
    return { filled, total };
  };

  return {
    chord: count((bar) => Boolean(project.chords[bar])),
    melody: count((bar) => hasNotes("melody", bar)),
    bass: count((bar) => hasNotes("bass", bar)),
    drums: count((bar) => hasNotes("drums", bar))
  };
}

// 範囲内に、コード・メロディ・ベース・ドラムのどれかが入っているか（上書きや削除の確認用）
export function barsHaveContent(project, startBar, endBar) {
  const barTicks = barTicksOf(project);
  const startTick = startBar * barTicks;
  const endTick = endBar * barTicks;
  const inRange = (item) => item.startTick >= startTick && item.startTick < endTick;

  return project.chords.some(inRange)
    || project.tracks.some((track) => (track.notes ?? []).some(inRange));
}

// ------------------------------------------------------------ Content shifting

function shiftItems(items, fromTick, deltaTick) {
  return items.map((item) => (
    item.startTick >= fromTick ? { ...item, startTick: item.startTick + deltaTick } : item
  ));
}

function mapTrackNotes(project, transform) {
  project.tracks = project.tracks.map((track) => ({
    ...track,
    notes: transform(track.notes ?? [], track)
  }));
}

function removeBars(project, fromBar, count) {
  const barTicks = barTicksOf(project);
  const fromTick = fromBar * barTicks;
  const toTick = (fromBar + count) * barTicks;
  const inRange = (item) => item.startTick >= fromTick && item.startTick < toTick;

  project.chords = shiftItems(
    project.chords.filter((chord) => !inRange(chord)),
    toTick,
    -count * barTicks
  );
  mapTrackNotes(project, (notes) => shiftItems(
    notes.filter((note) => !inRange(note)),
    toTick,
    -count * barTicks
  ));
}

function insertBars(project, atBar, count) {
  const barTicks = barTicksOf(project);

  // コードは Bar n = chords[n-1] として隙間なく並べる前提。途中に空き小節を作ると
  // 後ろのコードがずれて隙間になるため、その場合は拒否する。
  if (project.chords.length > atBar) {
    throw new Error("このSectionより後ろにコードがあるため、小節を増やせません。後ろのコードを消すか、Sectionを末尾に追加してください。");
  }

  const atTick = atBar * barTicks;
  mapTrackNotes(project, (notes) => shiftItems(notes, atTick, count * barTicks));
}

// ----------------------------------------------------------------- Operations

function assertSectionIndex(sections, index) {
  if (!Number.isInteger(index) || index < 0 || index >= sections.length) {
    throw new Error("Sectionが見つかりません。");
  }
}

export function resizeSection(project, index, bars) {
  const sections = getSections(project);
  assertSectionIndex(sections, index);

  if (!Number.isInteger(bars) || bars < 1 || bars > MAX_SECTION_BARS) {
    throw new Error(`小節数は1〜${MAX_SECTION_BARS}にしてください。`);
  }

  const next = clone(project);
  const range = sectionRanges(getSections(next))[index];
  const delta = bars - range.section.bars;

  if (delta > 0) {
    if (totalSectionBars(getSections(next)) + delta > MAX_TOTAL_BARS) {
      throw new Error(`曲全体は${MAX_TOTAL_BARS}小節までです。`);
    }
    insertBars(next, range.endBar, delta);
  } else if (delta < 0) {
    removeBars(next, range.startBar + bars, -delta);
  }

  next.structure = {
    ...next.structure,
    sections: getSections(next).map((section, sectionIndex) => (
      sectionIndex === index ? { ...section, bars } : section
    ))
  };

  return next;
}

export function removeSection(project, index) {
  const sections = getSections(project);
  assertSectionIndex(sections, index);

  const next = clone(project);
  const range = sectionRanges(getSections(next))[index];
  removeBars(next, range.startBar, range.section.bars);

  next.structure = {
    ...next.structure,
    sections: getSections(next).filter((_, sectionIndex) => sectionIndex !== index)
  };

  return next;
}

// fromのSectionの中身（コード / メロディ / ベース / ドラム）を、toのSectionへ上書きコピーする。
// コピーするのは短いほうのSectionの小節数まで。toの外には触らない。
// Sectionを末尾に1つ足し、fromIndexの中身（コード・メロ・ベース・ドラム）をそのままコピーする。
// 小節数はコピー元と同じ。1回の編集（Undo1回）として使えるよう、純粋関数にしてある。
export function appendSectionCopy(project, fromIndex, kind) {
  const sections = getSections(project);
  assertSectionIndex(sections, fromIndex);

  const added = createSection(kind, sections[fromIndex].bars, sections);
  const withSection = clone(project);
  withSection.structure = { ...(withSection.structure ?? {}), sections: [...sections, added] };
  validateStructure(withSection.structure);

  return copySection(withSection, fromIndex, sections.length);
}

export function copySection(project, fromIndex, toIndex) {
  const sections = getSections(project);
  assertSectionIndex(sections, fromIndex);
  assertSectionIndex(sections, toIndex);

  if (fromIndex === toIndex) {
    throw new Error("コピー元とコピー先は別のSectionにしてください。");
  }

  const next = clone(project);
  const ranges = sectionRanges(getSections(next));
  const from = ranges[fromIndex];
  const to = ranges[toIndex];
  const copyBars = Math.min(from.section.bars, to.section.bars);
  const barTicks = barTicksOf(next);

  const srcStart = from.startBar * barTicks;
  const srcEnd = (from.startBar + copyBars) * barTicks;
  const dstStart = to.startBar * barTicks;
  const dstEnd = (to.startBar + copyBars) * barTicks;
  const offset = dstStart - srcStart;

  const sourceChords = next.chords.filter((chord) => chord.startTick >= srcStart && chord.startTick < srcEnd);

  if (sourceChords.length > 0 && to.startBar > next.chords.length) {
    throw new Error("コピー先の前にコードの空きがあります。先に前のSectionへコードを入れてからコピーしてください。");
  }

  const copiedChordCount = sourceChords.length;
  const dstChordEnd = dstStart + copiedChordCount * barTicks;
  next.chords = [
    ...next.chords.filter((chord) => chord.startTick < dstStart),
    ...sourceChords.map((chord) => ({ ...chord, startTick: chord.startTick + offset })),
    ...next.chords.filter((chord) => chord.startTick >= dstChordEnd)
  ].sort((a, b) => a.startTick - b.startTick);

  mapTrackNotes(next, (notes, track) => {
    if (!TRACK_ROLES.includes(track.role)) return notes;

    const copied = notes
      .filter((note) => note.startTick >= srcStart && note.startTick < srcEnd)
      .map((note) => {
        const startTick = note.startTick + offset;
        return {
          ...note,
          id: createId("note"),
          startTick,
          durationTick: Math.max(1, Math.min(note.durationTick, dstEnd - startTick))
        };
      });

    return [
      ...notes.filter((note) => note.startTick < dstStart || note.startTick >= dstEnd),
      ...copied
    ].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  });

  return next;
}

// 指定範囲だけを取り出し、範囲の先頭を0 tickにずらしたProjectを返す（Section再生用）。
export function sliceProject(project, startTick, endTick) {
  const next = clone(project);
  const inRange = (item) => item.startTick >= startTick && item.startTick < endTick;
  const length = endTick - startTick;

  next.chords = next.chords
    .filter(inRange)
    .map((chord) => ({
      ...chord,
      startTick: chord.startTick - startTick,
      durationTick: Math.min(chord.durationTick, endTick - chord.startTick)
    }));

  mapTrackNotes(next, (notes) => notes
    .filter(inRange)
    .map((note) => ({
      ...note,
      startTick: note.startTick - startTick,
      durationTick: Math.max(1, Math.min(note.durationTick, length - (note.startTick - startTick)))
    })));

  return next;
}
