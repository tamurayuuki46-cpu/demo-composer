export const SONG_PROJECT_SCHEMA_VERSION = 1;
export const SONG_PROJECT_KIND = 'song-project';

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
function nowIso(now) { return now || new Date().toISOString(); }
function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `song-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function track(project, role) { return project?.tracks?.find((item) => item.role === role) || null; }
function trackNotes(project, role) { return clone(track(project, role)?.notes || []); }

export function createEmptySongProject({ projectId = makeId(), title = 'Untitled Project', now } = {}) {
  const stamp = nowIso(now);
  return {
    kind: SONG_PROJECT_KIND,
    schemaVersion: SONG_PROJECT_SCHEMA_VERSION,
    projectId,
    title,
    createdAt: stamp,
    updatedAt: stamp,
    basic: { bpm: 120, timeSignature: '4/4', key: 'C', scale: 'major', ppq: 480 },
    analysis: { keyCandidates: [], chordCandidates: [], degreeAnalysis: null, melodyAnalysis: null, bassAnalysis: null, rhythmAnalysis: null },
    composition: { chords: [], melody: [], counterMelody: [], bass: [], drums: [], sections: [] },
    arrangement: { reharmonization: null, voicing: null, density: null, instruments: null, selectedAlternatives: null, decisions: [] },
    history: { version: 1, changes: [] },
    reference: { items: [] },
    export: { lastDraftMidiAt: null, lastSongMidiAt: null },
    compatibility: {}
  };
}

export function isSongProject(value) {
  return Boolean(value && value.kind === SONG_PROJECT_KIND && value.schemaVersion === SONG_PROJECT_SCHEMA_VERSION);
}

export function validateSongProject(project) {
  if (!isSongProject(project)) throw new Error(`Unsupported SongProject schemaVersion: ${project?.schemaVersion ?? 'unknown'}`);
  if (typeof project.projectId !== 'string' || !project.projectId) throw new Error('SongProject projectId is invalid.');
  if (typeof project.title !== 'string' || !project.title.trim()) throw new Error('SongProject title is invalid.');
  if (!project.basic || !Number.isFinite(Number(project.basic.bpm))) throw new Error('SongProject basic is invalid.');
  if (!project.composition || !Array.isArray(project.composition.chords) || !Array.isArray(project.composition.sections)) throw new Error('SongProject composition is invalid.');
  for (const key of ['melody', 'counterMelody', 'bass', 'drums']) if (!Array.isArray(project.composition[key])) throw new Error(`SongProject composition.${key} is invalid.`);
  if (!project.analysis || !project.arrangement || !project.history || !project.reference || !project.export) throw new Error('SongProject sections are incomplete.');
  return true;
}

export function demoProjectToSongProject(demoProject, { now } = {}) {
  if (!demoProject || typeof demoProject !== 'object' || !demoProject.basic || !demoProject.structure) throw new Error('Demo Composer Project is invalid.');
  const stamp = nowIso(now);
  const result = createEmptySongProject({ projectId: demoProject.id || makeId(), title: demoProject.metadata?.title || 'Untitled Project', now: stamp });
  result.basic = {
    bpm: demoProject.basic.bpm,
    timeSignature: demoProject.basic.timeSignature || '4/4',
    key: demoProject.basic.key || 'C',
    scale: demoProject.basic.scale || 'major',
    ppq: demoProject.basic.ppq || 480
  };
  result.composition = {
    chords: clone(demoProject.chords || []),
    melody: trackNotes(demoProject, 'melody'),
    counterMelody: trackNotes(demoProject, 'counter'),
    bass: trackNotes(demoProject, 'bass'),
    drums: trackNotes(demoProject, 'drums'),
    sections: clone(demoProject.structure.sections || [])
  };
  result.compatibility.demoComposer = {
    schemaVersion: demoProject.schemaVersion ?? null,
    appVersion: demoProject.appVersion ?? null,
    revision: demoProject.revision ?? 1,
    metadata: clone(demoProject.metadata || {}),
    instruments: clone(demoProject.instruments || []),
    progress: clone(demoProject.progress || {}),
    exportSettings: clone(demoProject.exportSettings || {}),
    extraTracks: clone((demoProject.tracks || []).filter((item) => !['melody', 'counter', 'bass', 'drums'].includes(item.role)))
  };
  validateSongProject(result);
  return result;
}

function defaultTrack(role, notes) {
  const channels = { melody: 2, bass: 3, counter: 4, drums: 10 };
  return { role, name: role === 'counter' ? 'Counter Melody' : role[0].toUpperCase() + role.slice(1), midiChannel: channels[role], instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, ...(role === 'drums' ? { drumMap: { kick: 36, snare: 38, closedHH: 42 } } : {}), notes: clone(notes) };
}

export function songProjectToDemoProject(songProject) {
  validateSongProject(songProject);
  const legacy = clone(songProject.compatibility?.demoComposer || {});
  const metadata = legacy.metadata || {};
  metadata.title = songProject.title;
  const tracks = [
    defaultTrack('melody', songProject.composition.melody),
    defaultTrack('counter', songProject.composition.counterMelody),
    defaultTrack('bass', songProject.composition.bass),
    defaultTrack('drums', songProject.composition.drums),
    ...clone(legacy.extraTracks || [])
  ];
  return {
    schemaVersion: legacy.schemaVersion ?? 3,
    appVersion: legacy.appVersion ?? 'v0.3-dev',
    id: songProject.projectId,
    revision: legacy.revision ?? 1,
    metadata,
    basic: clone(songProject.basic),
    structure: { sections: clone(songProject.composition.sections) },
    chords: clone(songProject.composition.chords),
    tracks,
    instruments: clone(legacy.instruments || []),
    progress: clone(legacy.progress || {}),
    exportSettings: clone(legacy.exportSettings || {})
  };
}

export function mergeDemoChangesIntoSongProject(songProject, demoProject, { now } = {}) {
  validateSongProject(songProject);
  const fresh = demoProjectToSongProject(demoProject, { now });
  const next = clone(songProject);
  next.title = fresh.title;
  next.updatedAt = nowIso(now);
  next.basic = fresh.basic;
  next.composition = fresh.composition;
  next.compatibility = { ...next.compatibility, demoComposer: fresh.compatibility.demoComposer };
  return next;
}

export function serializeSongProject(project) {
  validateSongProject(project);
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseSongProjectJson(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('SongProject JSONとして読めませんでした。'); }
  validateSongProject(value);
  return value;
}
