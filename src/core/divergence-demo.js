import { suggestNextChords } from "../chord/chord-next.js";
import { counterCandidates, withCounterNotes } from "./counter-melody.js";
import { getSections, sectionRanges } from "./section-ops.js";
import { applySectionVariation } from "./section-variation.js";
import { SOUND_PARTS, SOUND_TONES, getSoundSelection, upsertSoundSelection } from "./sound-presets.js";

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function pick(array, random) {
  if (!array.length) return null;
  return array[Math.min(array.length - 1, Math.floor(random() * array.length))];
}

function shuffled(array, random) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function rangeFor(project, sectionIndex) {
  const sections = getSections(project);
  const ranges = sectionRanges(sections);
  if (Number.isInteger(sectionIndex) && ranges[sectionIndex]) {
    return { sectionIndex, ...ranges[sectionIndex] };
  }
  const barTicks = project.basic.ppq * 4;
  const noteEndBars = (project.tracks ?? []).flatMap((track) => track.notes ?? [])
    .map((note) => Math.ceil((note.startTick + note.durationTick) / barTicks));
  const endBar = Math.max(project.chords?.length ?? 0, ...noteEndBars, 1);
  return { sectionIndex: null, startBar: 0, endBar, section: { name: "Whole Song", bars: endBar } };
}

function mutateHarmony(project, range, context) {
  if (!Array.isArray(project.chords) || project.chords.length === 0) return { project, changed: 0 };
  const next = clone(project);
  const bars = [];
  for (let bar = range.startBar; bar < Math.min(range.endBar, next.chords.length); bar += 1) {
    if (next.chords[bar]) bars.push(bar);
  }
  if (!bars.length) return { project, changed: 0 };

  const targetCount = Math.min(bars.length, Math.max(1, Math.ceil(context.distance / 2)));
  let changed = 0;
  for (const bar of shuffled(bars, context.random).slice(0, targetCount)) {
    const current = next.chords[bar];
    const suggestions = suggestNextChords(next.chords.slice(0, bar), {
      key: next.basic.key,
      scale: next.basic.scale
    });
    const width = context.distance <= 2 ? 1 : context.distance <= 4 ? 2 : 3;
    const available = suggestions
      .slice(0, width)
      .filter((item) => item.root !== current.root || item.quality !== current.quality);
    const choice = pick(available.length ? available : suggestions, context.random);
    if (!choice || (choice.root === current.root && choice.quality === current.quality)) continue;
    next.chords[bar] = { ...current, root: choice.root, quality: choice.quality };
    changed += 1;
  }
  return { project: changed ? next : project, changed };
}

function mutateCounter(project, range, context) {
  try {
    const variation = Math.min(3, Math.max(0, context.distance - 2));
    const candidates = counterCandidates(project, {
      startBar: range.startBar,
      endBar: range.endBar,
      variation
    });
    const usable = candidates.filter((candidate) => candidate.notes?.length);
    if (!usable.length) return { project, changed: 0, label: "" };
    const poolSize = context.distance <= 2 ? Math.min(3, usable.length) : usable.length;
    const chosen = pick(usable.slice(0, poolSize), context.random);
    return {
      project: withCounterNotes(project, range.startBar, range.endBar, chosen.notes),
      changed: chosen.notes.length,
      label: chosen.label
    };
  } catch {
    return { project, changed: 0, label: "" };
  }
}

function mutateSound(project, context) {
  let next = clone(project);
  const parts = SOUND_PARTS.filter((part) => part.presets.length > 1);
  if (!parts.length) return { project, changed: 0, label: "" };

  const changeCount = Math.min(parts.length, context.distance >= 5 ? 3 : context.distance >= 3 ? 2 : 1);
  const order = shuffled(parts, context.random).slice(0, changeCount);
  const labels = [];
  let changed = 0;

  for (const part of order) {
    const current = getSoundSelection(next.instruments, part.id);
    const presets = part.presets.filter((preset) => preset.id !== current.preset);
    const preset = pick(presets, context.random) ?? part.presets[0];
    const tonePool = context.distance <= 2
      ? SOUND_TONES.filter((tone) => ["natural", "warm", "soft", "bright"].includes(tone.id))
      : SOUND_TONES;
    const tone = pick(tonePool.filter((item) => item.id !== current.tone), context.random) ?? SOUND_TONES[0];
    next.instruments = upsertSoundSelection(next.instruments, {
      part: part.id,
      preset: preset.id,
      tone: tone.id
    });
    labels.push(`${part.label}: ${preset.label} / ${tone.label}`);
    changed += 1;
  }

  return { project: changed ? next : project, changed, label: labels.join("、") };
}

export function composerDivergenceTransform(sourceProject, context, { sectionIndex = 0 } = {}) {
  let project = clone(sourceProject);
  const range = rangeFor(project, sectionIndex);
  const changedAxes = [];
  const details = [];

  if (!context.locks.melody && range.sectionIndex !== null) {
    const times = context.distance >= 4 ? 2 : 1;
    let count = 0;
    for (let index = 0; index < times; index += 1) {
      const choices = context.distance <= 2 ? ["melody-pitch"] : ["melody-pitch", "melody"];
      const choice = pick(choices, context.random);
      const result = applySectionVariation(project, range.sectionIndex, choice);
      project = result.project;
      count += result.changed;
    }
    if (count > 0) {
      changedAxes.push("melody");
      details.push(`主旋律 ${count}箇所`);
    }
  }

  if (!context.locks.counterMelody) {
    const result = mutateCounter(project, range, context);
    project = result.project;
    if (result.changed > 0) {
      changedAxes.push("counterMelody");
      details.push(`裏メロ ${result.label || `${result.changed}音`}`);
    }
  }

  if (!context.locks.harmony) {
    const result = mutateHarmony(project, range, context);
    project = result.project;
    if (result.changed > 0) {
      changedAxes.push("harmony");
      details.push(`コード ${result.changed}小節`);
    }
  }

  if (!context.locks.rhythm && range.sectionIndex !== null) {
    const drum = applySectionVariation(project, range.sectionIndex, "drums");
    project = drum.project;
    let count = drum.changed;
    if (context.distance >= 3) {
      const melodyRhythm = applySectionVariation(project, range.sectionIndex, "melody-rhythm");
      project = melodyRhythm.project;
      count += melodyRhythm.changed;
    }
    if (count > 0) {
      changedAxes.push("rhythm");
      details.push(`リズム ${count}箇所`);
    }
  }

  if (!context.locks.sound) {
    const result = mutateSound(project, context);
    project = result.project;
    if (result.changed > 0) {
      changedAxes.push("sound");
      details.push(result.label);
    }
  }

  return {
    project,
    changedAxes,
    meta: {
      sectionIndex: range.sectionIndex,
      sectionName: range.section?.name ?? "Whole Song",
      summary: details.length ? details.join(" / ") : "変更できる要素がありませんでした"
    }
  };
}
