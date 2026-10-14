import { songProjectToDemoProject, validateSongProject } from '../../src/shared/song-project.js';

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function nowIso(now) { return now || new Date().toISOString(); }

const KEY_TO_PC = Object.freeze({
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
});

const MAJOR_PALETTE = Object.freeze([
  { offset: 0, quality: 'major', degree: 'I', bias: 4 },
  { offset: 2, quality: 'minor', degree: 'ii', bias: 1 },
  { offset: 4, quality: 'minor', degree: 'iii', bias: 0 },
  { offset: 5, quality: 'major', degree: 'IV', bias: 2 },
  { offset: 7, quality: 'major', degree: 'V', bias: 3 },
  { offset: 9, quality: 'minor', degree: 'vi', bias: 2 },
]);

const MINOR_PALETTE = Object.freeze([
  { offset: 0, quality: 'minor', degree: 'i', bias: 4 },
  { offset: 3, quality: 'major', degree: 'III', bias: 1 },
  { offset: 5, quality: 'minor', degree: 'iv', bias: 2 },
  { offset: 7, quality: 'major', degree: 'V', bias: 3 },
  { offset: 8, quality: 'major', degree: 'VI', bias: 2 },
  { offset: 10, quality: 'major', degree: 'VII', bias: 1 },
]);

function pc(value) { return ((Number(value) % 12) + 12) % 12; }

function maxMusicalEndTick(songProject) {
  const composition = songProject?.composition || {};
  const items = [
    ...(composition.chords || []),
    ...(composition.melody || []),
    ...(composition.counterMelody || []),
    ...(composition.bass || []),
    ...(composition.drums || []),
  ];
  return items.reduce((max, item) => {
    const start = Number(item?.startTick) || 0;
    const duration = Math.max(1, Number(item?.durationTick) || 1);
    return Math.max(max, start + duration);
  }, 0);
}

function demoMusicalItems(demoProject) {
  return [
    ...(Array.isArray(demoProject?.chords) ? demoProject.chords : []),
    ...(Array.isArray(demoProject?.tracks) ? demoProject.tracks.flatMap((track) => Array.isArray(track?.notes) ? track.notes : []) : []),
  ];
}

function demoMusicalBounds(demoProject) {
  const items = demoMusicalItems(demoProject);
  if (!items.length) return null;
  let minStart = Infinity;
  let maxEnd = 0;
  for (const item of items) {
    const start = Math.max(0, Number(item?.startTick) || 0);
    const duration = Math.max(1, Number(item?.durationTick) || 1);
    minStart = Math.min(minStart, start);
    maxEnd = Math.max(maxEnd, start + duration);
  }
  return Number.isFinite(minStart) ? { minStart, maxEnd, span: Math.max(0, maxEnd - minStart) } : null;
}

function rebaseCompactSketchTimeline(songProject, demoProject) {
  const next = clone(demoProject);
  const bounds = demoMusicalBounds(next);
  if (!bounds || bounds.minStart <= 0) return next;

  const ppq = Number(songProject?.basic?.ppq) || Number(next.basic?.ppq) || 480;
  const ticksPerBar = Math.max(1, ppq * 4);
  if (bounds.span > ticksPerBar) return next;

  const sections = Array.isArray(next.structure?.sections) ? next.structure.sections : [];
  const declaredBars = sections.reduce((sum, section) => sum + Math.max(1, Number(section?.bars) || 1), 0);
  const declaredTicks = declaredBars * ticksPerBar;
  const isOneBarExcerpt = declaredBars === 1 && bounds.maxEnd > declaredTicks;
  const isSectionlessCompactSketch = sections.length === 0;
  if (!isOneBarExcerpt && !isSectionlessCompactSketch) return next;

  const shift = bounds.minStart;
  next.chords = (Array.isArray(next.chords) ? next.chords : []).map((chord) => ({
    ...chord,
    startTick: Math.max(0, (Number(chord?.startTick) || 0) - shift),
  }));
  next.tracks = (Array.isArray(next.tracks) ? next.tracks : []).map((track) => ({
    ...track,
    notes: (Array.isArray(track?.notes) ? track.notes : []).map((note) => ({
      ...note,
      startTick: Math.max(0, (Number(note?.startTick) || 0) - shift),
    })),
  }));
  return next;
}

function overlapTicks(note, startTick, endTick) {
  const noteStart = Number(note?.startTick) || 0;
  const noteEnd = noteStart + Math.max(1, Number(note?.durationTick) || 1);
  return Math.max(0, Math.min(noteEnd, endTick) - Math.max(noteStart, startTick));
}

function melodyNotes(songProject, demoProject) {
  const direct = Array.isArray(songProject?.composition?.melody) ? songProject.composition.melody : [];
  if (direct.length) {
    const bounds = demoMusicalBounds(demoProject);
    if (bounds?.minStart > 0) {
      return direct.map((note) => ({ ...note, startTick: Math.max(0, (Number(note?.startTick) || 0) - bounds.minStart) }));
    }
    return direct;
  }
  return (demoProject?.tracks || [])
    .filter((track) => track?.role === 'melody')
    .flatMap((track) => Array.isArray(track.notes) ? track.notes : []);
}

function chordIntervals(quality) {
  return quality === 'minor' ? [0, 3, 7] : [0, 4, 7];
}

function chooseSketchChord(notes, startTick, endTick, tonic, palette, fallbackIndex) {
  const active = notes.filter((note) => overlapTicks(note, startTick, endTick) > 0);
  if (!active.length) return palette[fallbackIndex] || palette[0];

  const ranked = palette.map((candidate, index) => {
    const root = pc(tonic + candidate.offset);
    const chordTones = new Set(chordIntervals(candidate.quality).map((interval) => pc(root + interval)));
    let score = candidate.bias;
    let covered = 0;
    for (const note of active) {
      const weight = overlapTicks(note, startTick, endTick);
      if (!weight) continue;
      const notePc = pc(note.pitch);
      if (chordTones.has(notePc)) {
        score += weight * 4;
        covered += weight;
      } else {
        score -= weight * 0.35;
      }
      if (notePc === root) score += weight * 0.35;
    }
    return { candidate, index, score, covered };
  });

  ranked.sort((a, b) => b.score - a.score || b.covered - a.covered || a.index - b.index);
  return ranked[0]?.candidate || palette[fallbackIndex] || palette[0];
}

export function inferOneBarSketchChords(songProject, demoProject) {
  const next = clone(demoProject);
  if (Array.isArray(next.chords) && next.chords.length) return next;

  const ppq = Number(songProject?.basic?.ppq) || Number(next.basic?.ppq) || 480;
  const ticksPerBar = Math.max(1, ppq * 4);
  const maxEndTick = demoMusicalBounds(next)?.maxEnd ?? maxMusicalEndTick(songProject);
  if (maxEndTick <= 0 || maxEndTick > ticksPerBar) return next;

  const notes = melodyNotes(songProject, next);
  if (!notes.length) return next;

  const tonic = KEY_TO_PC[songProject?.basic?.key] ?? KEY_TO_PC[next.basic?.key] ?? 0;
  const scale = String(songProject?.basic?.scale || next.basic?.scale || 'major').toLowerCase();
  const minor = scale.includes('minor');
  const palette = minor ? MINOR_PALETTE : MAJOR_PALETTE;
  const half = Math.max(1, Math.round(ticksPerBar / 2));
  const first = chooseSketchChord(notes, 0, half, tonic, palette, 0);
  const second = chooseSketchChord(notes, half, ticksPerBar, tonic, palette, minor ? 3 : 4);

  next.chords = [first, second].map((candidate, index) => ({
    root: pc(tonic + candidate.offset),
    quality: candidate.quality,
    degree: `auto-${candidate.degree}`,
    startTick: index === 0 ? 0 : half,
    durationTick: index === 0 ? half : ticksPerBar - half,
  }));
  return next;
}

export function ensureArrangementSections(songProject, demoProject) {
  const next = clone(demoProject);
  next.structure = next.structure && typeof next.structure === 'object' ? next.structure : { sections: [] };
  if (Array.isArray(next.structure.sections) && next.structure.sections.length) return next;

  const maxEndTick = demoMusicalBounds(next)?.maxEnd ?? maxMusicalEndTick(songProject);
  if (maxEndTick <= 0) return next;

  const ppq = Number(songProject?.basic?.ppq) || 480;
  const ticksPerBar = Math.max(1, ppq * 4);
  const bars = Math.max(1, Math.min(32, Math.ceil(maxEndTick / ticksPerBar)));
  const hasAutoChords = Array.isArray(next.chords) && next.chords.some((chord) => String(chord?.degree || '').startsWith('auto-'));
  next.structure.sections = [{
    id: 'quick-sketch-1',
    kind: 'verse',
    name: bars === 1 ? (hasAutoChords ? '1小節スケッチ（仮コード付き）' : '1小節スケッチ') : 'スケッチ',
    bars,
    energy: 'mid',
    transition: 'keep',
  }];
  return next;
}

export function songProjectToArrangementSourceInput(songProject) {
  validateSongProject(songProject);
  const demoProject = rebaseCompactSketchTimeline(songProject, songProjectToDemoProject(songProject));
  return ensureArrangementSections(songProject, inferOneBarSketchChords(songProject, demoProject));
}

function arrangementSummary(candidate) {
  const sections = Array.isArray(candidate?.sections) ? candidate.sections : [];
  return {
    reharmonization: sections.filter((section) => section.reharmonization).map((section) => ({
      sectionId: section.sectionId,
      value: clone(section.reharmonization)
    })),
    voicing: sections.filter((section) => section.harmonyPattern || section.partOverrides?.harmony).map((section) => ({
      sectionId: section.sectionId,
      harmonyPattern: section.harmonyPattern ?? null,
      notes: clone(section.partOverrides?.harmony ?? null)
    })),
    density: sections.map((section) => ({ sectionId: section.sectionId, density: section.density })),
    instruments: sections.map((section) => ({ sectionId: section.sectionId, enabled: clone(section.enabled || {}) })),
    selectedAlternatives: candidate ? {
      id: candidate.id ?? null,
      label: candidate.label ?? null,
      styleId: candidate.styleId ?? null,
      sourceCandidateIds: clone(candidate.sourceCandidateIds || [])
    } : null,
    decisions: sections.filter((section) => section.reason || section.decisionNote || section.musicLab || section.tonalTarget || section.voiceRoles).map((section) => ({
      sectionId: section.sectionId,
      reason: section.reason ?? '',
      decisionNote: section.decisionNote ?? '',
      musicLab: clone(section.musicLab ?? null),
      tonalTarget: clone(section.tonalTarget ?? null),
      voiceRoles: clone(section.voiceRoles ?? null)
    }))
  };
}

export function mergeArrangementChangesIntoSongProject(songProject, arrangerProjectOrCandidate, { now } = {}) {
  validateSongProject(songProject);
  const next = clone(songProject);
  const candidate = arrangerProjectOrCandidate?.arrangement || arrangerProjectOrCandidate;
  if (!candidate || !Array.isArray(candidate.sections)) throw new Error('Arrangement candidate is invalid.');

  const compositionBefore = JSON.stringify(next.composition);
  const summary = arrangementSummary(candidate);
  next.arrangement = { ...next.arrangement, ...summary };
  next.updatedAt = nowIso(now);
  next.compatibility = {
    ...next.compatibility,
    arrangementLab: {
      arrangerSchemaVersion: arrangerProjectOrCandidate?.arrangerSchemaVersion ?? null,
      arrangerVersion: arrangerProjectOrCandidate?.arrangerVersion ?? null,
      arrangerProjectId: arrangerProjectOrCandidate?.id ?? null,
      selectedCandidate: clone(candidate)
    }
  };
  if (JSON.stringify(next.composition) !== compositionBefore) throw new Error('Arrangement writeback modified composition unexpectedly.');
  return next;
}