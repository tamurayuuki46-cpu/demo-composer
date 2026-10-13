import { arrangedNotes } from './core.js';

// Legacy export name is kept for source compatibility; the current Arrangement Lab build is v0.6-dev.
export const ARRANGER_V05_VERSION = 'v0.6-dev';

const PART_NAMES = {
  melody: 'Melody',
  harmony: 'Harmony',
  bass: 'Bass',
  drums: 'Drums',
  counter: 'Counter',
  'counter-a': 'Counter A',
  'counter-b': 'Counter B',
};
const DEFAULT_CHANNELS = { melody: 2, harmony: 5, bass: 3, drums: 10, counter: 4, 'counter-a': 6, 'counter-b': 7 };

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function ascii(text) { return [...text].map((char) => char.charCodeAt(0)); }
function u32(value) { return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]; }
function encodeVlq(value) {
  let buffer = Math.max(0, Math.floor(value)) & 0x7f;
  const out = [];
  while ((value >>= 7)) { buffer <<= 8; buffer |= ((value & 0x7f) | 0x80); }
  while (true) { out.push(buffer & 0xff); if (buffer & 0x80) buffer >>= 8; else break; }
  return out;
}
function metaText(type, text) {
  const bytes = [...new TextEncoder().encode(String(text))];
  return [0xff, type, ...encodeVlq(bytes.length), ...bytes];
}
function trackChunk(events) {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order);
  const data = [];
  let lastTick = 0;
  for (const event of sorted) {
    data.push(...encodeVlq(Math.max(0, event.tick - lastTick)), ...event.bytes);
    lastTick = event.tick;
  }
  data.push(0x00, 0xff, 0x2f, 0x00);
  return [...ascii('MTrk'), ...u32(data.length), ...data];
}
function sourceChannel(source, part) {
  if (part === 'counter-a' || part === 'counter-b' || part === 'harmony') return DEFAULT_CHANNELS[part] - 1;
  const sourceRole = part === 'counter-a' || part === 'counter-b' ? 'counter' : part;
  const track = source.tracks.find((item) => item.role === sourceRole);
  const channel = track?.midiChannel || DEFAULT_CHANNELS[part] || 1;
  return part === 'drums' ? 9 : clamp(channel - 1, 0, 15);
}

export function createSongMidi(source, candidate) {
  const ppq = source.basic.ppq || 480;
  const bpm = source.basic.bpm || 120;
  const micros = Math.round(60000000 / bpm);
  const conductor = [
    { tick: 0, order: 0, bytes: metaText(0x03, 'Arrangement Lab Song') },
    { tick: 0, order: 0, bytes: [0xff, 0x58, 4, 4, 2, 24, 8] },
    { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff] },
  ];
  for (const section of source.sections) conductor.push({ tick: section.startTick, order: 0, bytes: metaText(0x06, section.name) });

  const parts = ['melody', 'harmony', 'bass', 'drums'];
  const counterA = arrangedNotes(source, candidate, 'counter-a');
  const counterB = arrangedNotes(source, candidate, 'counter-b');
  if (counterA.length || counterB.length) {
    if (counterA.length) parts.push('counter-a');
    if (counterB.length) parts.push('counter-b');
  } else {
    parts.push('counter');
  }

  const musicalTracks = [];
  for (const part of parts) {
    const notes = part === 'counter-a' ? counterA : part === 'counter-b' ? counterB : arrangedNotes(source, candidate, part);
    if (!notes.length) continue;
    const channel = sourceChannel(source, part);
    const events = [{ tick: 0, order: 0, bytes: metaText(0x03, `Arrangement Lab ${PART_NAMES[part] || part}`) }];
    for (const note of notes) {
      const pitch = clamp(note.pitch, 0, 127);
      const velocity = clamp(note.velocity || 90, 1, 127);
      const startTick = Math.max(0, Math.floor(note.startTick));
      const endTick = startTick + Math.max(1, Math.floor(note.durationTick));
      events.push({ tick: endTick, order: 1, bytes: [0x80 | channel, pitch, 0] });
      events.push({ tick: startTick, order: 2, bytes: [0x90 | channel, pitch, velocity] });
    }
    musicalTracks.push(trackChunk(events));
  }
  if (!musicalTracks.length) return null;
  const chunks = [trackChunk(conductor), ...musicalTracks];
  const trackCount = chunks.length;
  return new Uint8Array([
    ...ascii('MThd'), 0, 0, 0, 6, 0, 1, (trackCount >> 8) & 0xff, trackCount & 0xff, (ppq >> 8) & 0xff, ppq & 0xff,
    ...chunks.flat(),
  ]);
}

function findSection(source, sectionId) {
  const section = source.sections.find((item) => item.id === sectionId);
  if (!section) throw new Error('Sectionが見つかりません。');
  return section;
}
function sectionNotes(source, candidate, part, section) {
  return arrangedNotes(source, candidate, part)
    .filter((note) => note.startTick < section.endTick && note.startTick + note.durationTick > section.startTick)
    .map((note) => ({ ...note, startTick: Math.max(note.startTick, section.startTick), durationTick: Math.min(note.startTick + note.durationTick, section.endTick) - Math.max(note.startTick, section.startTick) }))
    .filter((note) => note.durationTick > 0);
}
function trimFrom(notes, tick) {
  return notes.flatMap((note) => {
    const end = note.startTick + note.durationTick;
    if (note.startTick >= tick) return [];
    if (end <= tick) return [note];
    return [{ ...note, durationTick: tick - note.startTick }];
  });
}
function makeNote(prefix, index, pitch, startTick, durationTick, velocity) {
  return { id: `${prefix}-${index}-${startTick}`, pitch: clamp(pitch, 0, 127), startTick: Math.max(0, Math.round(startTick)), durationTick: Math.max(1, Math.round(durationTick)), velocity: clamp(velocity, 1, 127) };
}

export function buildDrumFillCandidates(source, candidate, sectionId) {
  const section = findSection(source, sectionId);
  const ppq = source.basic.ppq || 480;
  const fillStart = Math.max(section.startTick, section.endTick - ppq);
  const step = Math.max(1, Math.round(ppq / 4));
  const duration = Math.max(1, Math.round(step * 0.55));
  const base = trimFrom(sectionNotes(source, candidate, 'drums', section), fillStart);
  const variants = [
    { id: 'snare-build', label: 'スネア加速', description: '最後の1拍を4連のスネアで持ち上げる。', pitches: [38, 38, 38, 38], velocities: [72, 82, 94, 108] },
    { id: 'tom-run', label: 'タム移動', description: '低いタムから高いタムへ4音で移動する。', pitches: [45, 47, 48, 50], velocities: [78, 86, 96, 108] },
    { id: 'kick-snare', label: 'Kick / Snare', description: 'KickとSnareを交互に置く短いPop Fill。', pitches: [36, 38, 36, 38], velocities: [86, 92, 94, 108] },
  ];
  return variants.map((variant) => ({
    ...variant,
    part: 'drums',
    notes: [...base, ...variant.pitches.map((pitch, index) => makeNote(`fill-${variant.id}`, index, pitch, fillStart + index * step, duration, variant.velocities[index]))].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch),
  }));
}

function effectiveSectionChords(source, candidate, section) {
  const plan = candidate.sections.find((item) => item.sectionId === section.id);
  const chords = plan?.reharmonization?.chords?.length ? plan.reharmonization.chords : source.chords;
  return chords.filter((chord) => chord.startTick >= section.startTick && chord.startTick < section.endTick).sort((a, b) => a.startTick - b.startTick);
}
function rootPitch(root) { return 36 + (((Number(root) || 0) % 12) + 12) % 12; }
function replaceMonophonicWindow(notes, start, end, replacement) {
  const out = [];
  for (const note of notes) {
    const noteEnd = note.startTick + note.durationTick;
    if (noteEnd <= start || note.startTick >= end) { out.push(note); continue; }
    if (note.startTick < start) out.push({ ...note, durationTick: start - note.startTick });
    if (noteEnd > end) out.push({ ...note, startTick: end, durationTick: noteEnd - end });
  }
  out.push(replacement);
  return out.filter((note) => note.durationTick > 0).sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}
function nearestTargetPitch(notes, chord) {
  const near = notes.find((note) => Math.abs(note.startTick - chord.startTick) <= 60);
  if (near) return near.pitch;
  return rootPitch(chord.root);
}

export function buildBassApproachCandidates(source, candidate, sectionId) {
  const section = findSection(source, sectionId);
  const ppq = source.basic.ppq || 480;
  const chords = effectiveSectionChords(source, candidate, section);
  if (chords.length < 2) return [];
  let base = sectionNotes(source, candidate, 'bass', section);
  if (!base.length) {
    base = chords.map((chord, index) => {
      const nextTick = chords[index + 1]?.startTick || Math.min(section.endTick, chord.startTick + chord.durationTick);
      return makeNote('bass-root', index, rootPitch(chord.root), chord.startTick, Math.max(1, Math.min(ppq, nextTick - chord.startTick)), 88);
    });
  }
  const variants = [
    { id: 'chromatic-below', label: '半音下から', description: '次のRootへ半音下から近づく。', offset: -1 },
    { id: 'chromatic-above', label: '半音上から', description: '次のRootへ半音上から落ち着く。', offset: 1 },
    { id: 'whole-below', label: '全音下から', description: '次のRootへ全音下から進む少し柔らかいApproach。', offset: -2 },
  ];
  return variants.map((variant) => {
    let notes = clone(base);
    chords.slice(1).forEach((chord, index) => {
      const end = chord.startTick;
      const start = Math.max(section.startTick, end - Math.max(1, Math.round(ppq / 2)));
      if (end <= start) return;
      const target = nearestTargetPitch(notes, chord);
      const pitch = clamp(target + variant.offset, 24, 72);
      notes = replaceMonophonicWindow(notes, start, end, makeNote(`bass-${variant.id}`, index, pitch, start, end - start, 86 + index % 3 * 4));
    });
    return { ...variant, part: 'bass', notes };
  });
}

export function applyPerformanceOverride(plan, sectionId, choice) {
  const next = clone(plan);
  const section = next.arrangement?.sections?.find((item) => item.sectionId === sectionId);
  if (!section || !choice?.part || !Array.isArray(choice.notes)) throw new Error('実Note候補を適用できません。');
  section.partOverrides ||= {};
  section.performanceBackup ||= {};
  if (!(choice.part in section.performanceBackup)) section.performanceBackup[choice.part] = section.partOverrides[choice.part] ? clone(section.partOverrides[choice.part]) : null;
  section.partOverrides[choice.part] = clone(choice.notes);
  section.performanceGenerator ||= {};
  section.performanceGenerator[choice.part] = { id: choice.id, label: choice.label };
  section.enabled = { ...(section.enabled || {}), [choice.part]: true };
  next.arrangerVersion = ARRANGER_V05_VERSION;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function clearPerformanceOverride(plan, sectionId, part) {
  const next = clone(plan);
  const section = next.arrangement?.sections?.find((item) => item.sectionId === sectionId);
  if (!section?.performanceGenerator?.[part]) return next;
  section.partOverrides ||= {};
  const backup = section.performanceBackup?.[part];
  if (Array.isArray(backup)) section.partOverrides[part] = clone(backup);
  else delete section.partOverrides[part];
  delete section.performanceGenerator[part];
  if (!Object.keys(section.performanceGenerator).length) delete section.performanceGenerator;
  if (section.performanceBackup) {
    delete section.performanceBackup[part];
    if (!Object.keys(section.performanceBackup).length) delete section.performanceBackup;
  }
  if (!Object.keys(section.partOverrides).length) delete section.partOverrides;
  next.arrangerVersion = ARRANGER_V05_VERSION;
  next.updatedAt = new Date().toISOString();
  return next;
}

function materializeNotes(notes, prefix) {
  return notes.map((note, index) => ({
    id: note.id || `${prefix}-${index}-${note.startTick}`,
    ...(typeof note.voice === 'string' ? { voice: note.voice } : {}),
    pitch: clamp(note.pitch, 0, 127),
    startTick: Math.max(0, Math.round(note.startTick)),
    durationTick: Math.max(1, Math.round(note.durationTick)),
    velocity: clamp(note.velocity || 90, 1, 127),
  }));
}
function arrangedChords(source, candidate) {
  const output = [];
  for (const section of source.sections) {
    const plan = candidate.sections.find((item) => item.sectionId === section.id);
    const chords = plan?.reharmonization?.chords?.length ? plan.reharmonization.chords : source.chords;
    for (const chord of chords) {
      if (chord.startTick < section.startTick || chord.startTick >= section.endTick) continue;
      output.push({
        root: ((Number(chord.root) || 0) % 12 + 12) % 12,
        quality: chord.quality || 'major',
        degree: chord.degree || '',
        startTick: Math.max(0, Math.round(chord.startTick)),
        durationTick: Math.max(1, Math.round(chord.durationTick)),
      });
    }
  }
  const seen = new Set();
  return output.filter((chord) => {
    const key = `${chord.startTick}:${chord.durationTick}:${chord.root}:${chord.quality}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.startTick - b.startTick);
}
function buildTrack(source, candidate, role, name, midiChannel, { drumMap, notes } = {}) {
  const track = source.sourceSnapshot?.tracks?.find((item) => item.role === role);
  return {
    role,
    name: track?.name || name,
    midiChannel: track?.midiChannel || midiChannel,
    mute: false,
    solo: false,
    volume: track?.volume ?? 1,
    pan: track?.pan ?? 0,
    ...(drumMap ? { drumMap: clone(drumMap) } : {}),
    notes: materializeNotes(notes ?? arrangedNotes(source, candidate, role), role),
  };
}

export function createDemoComposerProject(source, candidate) {
  const sourceProject = source.sourceSnapshot;
  if (!sourceProject) throw new Error('元project.jsonのsnapshotがありません。');
  const next = clone(sourceProject);
  const parentLineage = sourceProject.metadata?.lineage || null;
  const rootProjectId = parentLineage?.rootProjectId || source.sourceProjectId;
  const now = new Date().toISOString();
  next.id = `${source.sourceProjectId}-arr-${Date.now().toString(36)}`;
  next.revision = 1;
  next.updatedAt = now;
  next.metadata = {
    ...(next.metadata || {}),
    title: `${source.title} Arrangement`,
    lineage: {
      rootProjectId,
      parentProjectId: source.sourceProjectId,
      sourceApp: 'arrangement-lab',
      createdFrom: 'fork',
      forkReason: '編曲案をDemo Composerへ複製して戻す',
      revision: 1,
    },
  };
  next.chords = arrangedChords(source, candidate);
  next.tracks = [
    buildTrack(source, candidate, 'melody', 'Melody', 2),
    buildTrack(source, candidate, 'counter', 'Counter Melody', 4),
    buildTrack(source, candidate, 'bass', 'Bass', 3),
    buildTrack(source, candidate, 'drums', 'Drums', 10, { drumMap: { kick: 36, snare: 38, closedHH: 42 } }),
  ];
  const counterA = arrangedNotes(source, candidate, 'counter-a');
  const counterB = arrangedNotes(source, candidate, 'counter-b');
  if (counterA.length || counterB.length) {
    next.tracks[1].notes = materializeNotes([...counterA, ...counterB].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch), 'counter');
  }
  next.appVersion = ARRANGER_V05_VERSION;
  return next;
}
