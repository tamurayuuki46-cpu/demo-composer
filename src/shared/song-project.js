import { defaultDesign } from '../core/decision-design.js';

export const SONG_PROJECT_SCHEMA_VERSION = 1;
export const SONG_PROJECT_KIND = 'song-project';

const CORE_ROLES = ['melody', 'counter', 'bass', 'drums'];
const VALID_KEYS = new Set(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const KEY_ALIASES = Object.freeze({
  'C♯': 'C#', 'D♭': 'C#', Db: 'C#',
  'D♯': 'D#', 'E♭': 'D#', Eb: 'D#',
  'F♯': 'F#', 'G♭': 'F#', Gb: 'F#',
  'G♯': 'G#', 'A♭': 'G#', Ab: 'G#',
  'A♯': 'A#', 'B♭': 'A#', Bb: 'A#',
});

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
function text(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }
function textList(value, maxItems = 30, maxLength = 200) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems);
}
function referenceItems(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map((item) => {
    if (typeof item === 'string') return { title: text(item, 160), artist: '', note: '' };
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const next = clone(item);
    if (Object.hasOwn(next, 'title')) next.title = text(next.title, 160);
    if (Object.hasOwn(next, 'artist')) next.artist = text(next.artist, 160);
    if (Object.hasOwn(next, 'note')) next.note = text(next.note, 500);
    if (Object.hasOwn(next, 'type')) next.type = text(next.type, 40);
    if (Object.hasOwn(next, 'name')) next.name = text(next.name, 200);
    return next;
  }).filter((item) => item && Object.keys(item).length > 0);
}

function emptyIntent() {
  return {
    scene: '',
    purpose: '',
    references: [],
    genre: [],
    mood: [],
    constraints: [],
    experiments: [],
    vocal: {
      isVocalSong: null,
      lyricsTheme: '',
      lyricalImage: '',
      direction: '',
      range: { low: null, high: null, note: '' },
    },
    notes: '',
  };
}

function emptyAssets() {
  return { files: [] };
}

function normalizeIntent(intent) {
  const base = emptyIntent();
  if (!intent || typeof intent !== 'object') return base;
  const vocal = intent.vocal && typeof intent.vocal === 'object' ? intent.vocal : {};
  return {
    scene: text(intent.scene, 1000),
    purpose: text(intent.purpose, 1000),
    references: referenceItems(intent.references),
    genre: textList(intent.genre, 10, 80),
    mood: textList(intent.mood, 10, 80),
    constraints: textList(intent.constraints, 30, 240),
    experiments: textList(intent.experiments, 30, 240),
    vocal: {
      isVocalSong: typeof vocal.isVocalSong === 'boolean' ? vocal.isVocalSong : null,
      lyricsTheme: text(vocal.lyricsTheme, 1000),
      lyricalImage: text(vocal.lyricalImage, 1000),
      direction: text(vocal.direction, 1000),
      range: {
        low: text(vocal.range?.low, 20) || null,
        high: text(vocal.range?.high, 20) || null,
        note: text(vocal.range?.note, 500),
      },
    },
    notes: text(intent.notes, 4000),
  };
}

function normalizeAssets(assets) {
  if (!assets || typeof assets !== 'object') return emptyAssets();
  const files = Array.isArray(assets.files) ? assets.files : [];
  return {
    ...clone(assets),
    files: files.slice(0, 200).map((item, index) => {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? clone(item) : {};
      const next = {
        ...source,
        id: text(source.id, 120) || `asset-${index + 1}`,
        type: text(source.type, 60) || 'file',
        name: text(source.name, 240),
        external: source.external !== false,
      };
      if (Object.hasOwn(source, 'role')) next.role = text(source.role, 60) || null;
      if (Object.hasOwn(source, 'path')) next.path = text(source.path, 500) || null;
      if (Object.hasOwn(source, 'mimeType')) next.mimeType = text(source.mimeType, 120) || null;
      if (Object.hasOwn(source, 'sha256')) next.sha256 = text(source.sha256, 128) || null;
      return next;
    }),
  };
}

function createLineage({ projectId, sourceApp = 'demo-composer', createdFrom = 'new', revision = 1 } = {}) {
  return {
    rootProjectId: projectId,
    parentProjectId: null,
    sourceApp,
    createdFrom,
    forkReason: null,
    revision,
  };
}

function normalizeLineage(lineage, projectId, fallback = {}) {
  const base = createLineage({ projectId, ...fallback });
  if (!lineage || typeof lineage !== 'object') return base;
  return {
    rootProjectId: typeof lineage.rootProjectId === 'string' && lineage.rootProjectId ? lineage.rootProjectId : base.rootProjectId,
    parentProjectId: typeof lineage.parentProjectId === 'string' && lineage.parentProjectId ? lineage.parentProjectId : null,
    sourceApp: typeof lineage.sourceApp === 'string' && lineage.sourceApp ? lineage.sourceApp : base.sourceApp,
    createdFrom: typeof lineage.createdFrom === 'string' && lineage.createdFrom ? lineage.createdFrom : base.createdFrom,
    forkReason: typeof lineage.forkReason === 'string' && lineage.forkReason ? lineage.forkReason : null,
    revision: Number.isInteger(lineage.revision) && lineage.revision >= 1 ? lineage.revision : base.revision,
  };
}

function normalizeKeyRoot(value) {
  const raw = text(value, 20);
  const mapped = KEY_ALIASES[raw] || raw.replace('♯', '#');
  return VALID_KEYS.has(mapped) ? mapped : null;
}

function parseKeyValue(value) {
  const parts = text(value, 60).replace(/\s+/g, ' ').split(' ').filter(Boolean);
  const key = normalizeKeyRoot(parts[0]);
  const scaleRaw = (parts[1] || '').toLowerCase();
  const scale = scaleRaw === 'major' || scaleRaw === 'minor' ? scaleRaw : null;
  return { key, scale };
}

export function createEmptySongProject({ projectId = makeId(), title = 'Untitled Project', now, sourceApp = 'demo-composer', createdFrom = 'new' } = {}) {
  const stamp = nowIso(now);
  return {
    kind: SONG_PROJECT_KIND,
    schemaVersion: SONG_PROJECT_SCHEMA_VERSION,
    projectId,
    title: text(title, 80) || 'Untitled Project',
    createdAt: stamp,
    updatedAt: stamp,
    lineage: createLineage({ projectId, sourceApp, createdFrom }),
    intent: emptyIntent(),
    basic: { bpm: 120, timeSignature: '4/4', key: 'C', scale: 'major', ppq: 480 },
    analysis: { keyCandidates: [], chordCandidates: [], degreeAnalysis: null, melodyAnalysis: null, bassAnalysis: null, rhythmAnalysis: null },
    composition: { chords: [], melody: [], counterMelody: [], bass: [], drums: [], sections: [] },
    arrangement: { reharmonization: null, voicing: null, density: null, instruments: null, selectedAlternatives: null, decisions: [] },
    history: { version: 1, changes: [] },
    reference: { items: [] },
    assets: emptyAssets(),
    export: { lastDraftMidiAt: null, lastSongMidiAt: null, lastDawHandoffAt: null },
    compatibility: {}
  };
}

export function isSongProject(value) {
  return Boolean(value && value.kind === SONG_PROJECT_KIND && value.schemaVersion === SONG_PROJECT_SCHEMA_VERSION);
}

export function normalizeSongProjectV1(project, { now } = {}) {
  if (!isSongProject(project)) throw new Error(`Unsupported SongProject schemaVersion: ${project?.schemaVersion ?? 'unknown'}`);
  const next = clone(project);
  next.projectId = text(next.projectId, 200) || makeId();
  next.title = text(next.title, 80) || 'Untitled Project';
  next.createdAt = text(next.createdAt, 80) || nowIso(now);
  next.updatedAt = text(next.updatedAt, 80) || next.createdAt;
  next.lineage = normalizeLineage(next.lineage, next.projectId, { sourceApp: 'unknown', createdFrom: 'legacy-song-project' });
  next.intent = normalizeIntent(next.intent);
  next.basic = { bpm: 120, timeSignature: '4/4', key: 'C', scale: 'major', ppq: 480, ...(next.basic || {}) };
  next.basic.bpm = Number.isInteger(Number(next.basic.bpm)) && Number(next.basic.bpm) >= 40 && Number(next.basic.bpm) <= 240 ? Number(next.basic.bpm) : 120;
  next.basic.key = normalizeKeyRoot(next.basic.key) || 'C';
  next.basic.scale = ['major', 'minor'].includes(String(next.basic.scale).toLowerCase()) ? String(next.basic.scale).toLowerCase() : 'major';
  next.basic.timeSignature = '4/4';
  next.basic.ppq = 480;
  next.analysis = { keyCandidates: [], chordCandidates: [], degreeAnalysis: null, melodyAnalysis: null, bassAnalysis: null, rhythmAnalysis: null, ...(next.analysis || {}) };
  next.composition = {
    chords: [], melody: [], counterMelody: [], bass: [], drums: [], sections: [], ...(next.composition || {})
  };
  next.arrangement = {
    reharmonization: null, voicing: null, density: null, instruments: null, selectedAlternatives: null, decisions: [], ...(next.arrangement || {})
  };
  next.history = { version: 1, changes: [], ...(next.history || {}) };
  next.reference = { ...(next.reference || {}), items: referenceItems(next.reference?.items) };
  next.assets = normalizeAssets(next.assets);
  next.export = { lastDraftMidiAt: null, lastSongMidiAt: null, lastDawHandoffAt: null, ...(next.export || {}) };
  next.compatibility = next.compatibility && typeof next.compatibility === 'object' ? next.compatibility : {};
  return next;
}

export function validateSongProject(project) {
  if (!isSongProject(project)) throw new Error(`Unsupported SongProject schemaVersion: ${project?.schemaVersion ?? 'unknown'}`);
  if (typeof project.projectId !== 'string' || !project.projectId) throw new Error('SongProject projectId is invalid.');
  if (typeof project.title !== 'string' || !project.title.trim()) throw new Error('SongProject title is invalid.');
  if (!project.basic || !Number.isFinite(Number(project.basic.bpm))) throw new Error('SongProject basic is invalid.');
  if (!project.composition || !Array.isArray(project.composition.chords) || !Array.isArray(project.composition.sections)) throw new Error('SongProject composition is invalid.');
  for (const key of ['melody', 'counterMelody', 'bass', 'drums']) if (!Array.isArray(project.composition[key])) throw new Error(`SongProject composition.${key} is invalid.`);
  if (!project.analysis || !project.arrangement || !project.history || !project.reference || !project.export) throw new Error('SongProject sections are incomplete.');
  if (project.intent !== undefined && (!project.intent || typeof project.intent !== 'object')) throw new Error('SongProject intent is invalid.');
  if (project.assets !== undefined && (!project.assets || typeof project.assets !== 'object' || !Array.isArray(project.assets.files))) throw new Error('SongProject assets is invalid.');
  if (project.lineage !== undefined) {
    const lineage = project.lineage;
    if (!lineage || typeof lineage !== 'object') throw new Error('SongProject lineage is invalid.');
    if (typeof lineage.rootProjectId !== 'string' || !lineage.rootProjectId) throw new Error('SongProject lineage.rootProjectId is invalid.');
    if (lineage.parentProjectId !== null && lineage.parentProjectId !== undefined && (typeof lineage.parentProjectId !== 'string' || !lineage.parentProjectId)) throw new Error('SongProject lineage.parentProjectId is invalid.');
    if (typeof lineage.sourceApp !== 'string' || !lineage.sourceApp) throw new Error('SongProject lineage.sourceApp is invalid.');
    if (typeof lineage.createdFrom !== 'string' || !lineage.createdFrom) throw new Error('SongProject lineage.createdFrom is invalid.');
    if (!Number.isInteger(lineage.revision) || lineage.revision < 1) throw new Error('SongProject lineage.revision is invalid.');
  }
  return true;
}

export function demoProjectToSongProject(demoProject, { now } = {}) {
  if (!demoProject || typeof demoProject !== 'object' || !demoProject.basic || !demoProject.structure) throw new Error('Demo Composer Project is invalid.');
  const stamp = nowIso(now);
  const projectId = demoProject.id || makeId();
  const result = createEmptySongProject({ projectId, title: demoProject.metadata?.title || 'Untitled Project', now: stamp, sourceApp: 'demo-composer', createdFrom: 'demo-project' });
  result.lineage = normalizeLineage(demoProject.metadata?.lineage, projectId, {
    sourceApp: 'demo-composer',
    createdFrom: 'demo-project',
    revision: demoProject.revision ?? 1,
  });
  result.intent.genre = textList(demoProject.metadata?.genre ? [demoProject.metadata.genre] : [], 10, 80);
  result.intent.mood = textList(demoProject.metadata?.mood || [], 10, 80);
  result.intent.notes = text(demoProject.metadata?.memo, 4000);
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
    legacyProject: clone(demoProject)
  };
  delete result.compatibility.demoComposer.legacyProject.songProjectContext;
  const context = demoProject.songProjectContext;
  if (context?.projectId === projectId && isSongProject(context)) {
    const preserved = clone(context);
    Object.assign(preserved, { title: result.title, updatedAt: stamp, basic: result.basic, composition: result.composition });
    preserved.compatibility = { ...preserved.compatibility, demoComposer: result.compatibility.demoComposer };
    validateSongProject(preserved);
    return preserved;
  }
  validateSongProject(result);
  return result;
}

function defaultTrack(role, notes) {
  const channels = { melody: 2, bass: 3, counter: 4, drums: 10 };
  return { role, name: role === 'counter' ? 'Counter Melody' : role[0].toUpperCase() + role.slice(1), midiChannel: channels[role], instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, ...(role === 'drums' ? { drumMap: { kick: 36, snare: 38, closedHH: 42 } } : {}), notes: clone(notes) };
}

function mergeCoreTracks(baseTracks, composition) {
  const notesByRole = {
    melody: composition.melody,
    counter: composition.counterMelody,
    bass: composition.bass,
    drums: composition.drums
  };
  const output = clone(Array.isArray(baseTracks) ? baseTracks : []);
  for (const role of CORE_ROLES) {
    const index = output.findIndex((item) => item?.role === role);
    if (index === -1) output.push(defaultTrack(role, notesByRole[role]));
    else output[index] = { ...output[index], notes: clone(notesByRole[role]) };
  }
  return output;
}

export function songProjectToDemoProject(songProject) {
  const normalized = normalizeSongProjectV1(songProject);
  validateSongProject(normalized);
  const legacy = clone(normalized.compatibility?.demoComposer || {});
  const base = clone(legacy.legacyProject || {});
  const context = clone(normalized);
  if (context.compatibility?.demoComposer?.legacyProject) delete context.compatibility.demoComposer.legacyProject.songProjectContext;
  const metadata = {
    ...(base.metadata || {}),
    title: normalized.title,
    genre: normalized.intent.genre[0] || base.metadata?.genre || '',
    mood: clone(normalized.intent.mood),
    memo: normalized.intent.notes || base.metadata?.memo || '',
    composition: clone(base.metadata?.composition || defaultDesign()),
    lineage: normalizeLineage(normalized.lineage, normalized.projectId, { sourceApp: 'demo-composer', createdFrom: 'song-project' }),
  };
  return {
    ...base,
    schemaVersion: legacy.schemaVersion ?? base.schemaVersion ?? 3,
    appVersion: legacy.appVersion ?? base.appVersion ?? 'v0.3-dev',
    id: normalized.projectId,
    songProjectContext: context,
    revision: legacy.revision ?? base.revision ?? 1,
    metadata,
    basic: clone(normalized.basic),
    structure: { ...(base.structure || {}), sections: clone(normalized.composition.sections) },
    chords: clone(normalized.composition.chords),
    tracks: mergeCoreTracks(base.tracks, normalized.composition),
    instruments: clone(base.instruments || []),
    progress: clone(base.progress || {}),
    exportSettings: clone(base.exportSettings || {})
  };
}

export function mergeDemoChangesIntoSongProject(songProject, demoProject, { now } = {}) {
  const normalized = normalizeSongProjectV1(songProject);
  validateSongProject(normalized);
  const fresh = demoProjectToSongProject(demoProject, { now });
  const next = clone(normalized);
  next.title = fresh.title;
  next.updatedAt = nowIso(now);
  next.basic = fresh.basic;
  next.composition = fresh.composition;
  next.lineage = normalizeLineage(next.lineage, next.projectId, { sourceApp: 'demo-composer', createdFrom: 'song-project' });
  next.compatibility = { ...next.compatibility, demoComposer: fresh.compatibility.demoComposer };
  return next;
}

export function mergeSheetChangesIntoSongProject(songProject, sheet = {}, { now } = {}) {
  const next = normalizeSongProjectV1(songProject);
  const refs = Array.isArray(sheet.references) ? sheet.references : Array.isArray(sheet.referenceSongs) ? sheet.referenceSongs : [];
  next.title = text(sheet.title, 80) || next.title;
  next.updatedAt = nowIso(now);
  next.intent = normalizeIntent({
    ...next.intent,
    scene: sheet.scene ?? next.intent.scene,
    purpose: sheet.purpose ?? next.intent.purpose,
    references: refs.length ? refs : next.intent.references,
    genre: Array.isArray(sheet.genre) ? sheet.genre : sheet.genre ? [sheet.genre] : next.intent.genre,
    mood: Array.isArray(sheet.mood) ? sheet.mood : next.intent.mood,
    constraints: sheet.constraints ?? next.intent.constraints,
    experiments: sheet.experiments ?? next.intent.experiments,
    vocal: sheet.vocal ?? next.intent.vocal,
    notes: sheet.notes ?? next.intent.notes,
  });
  const bpm = Number(sheet.bpm?.selected ?? sheet.bpm);
  if (Number.isInteger(bpm) && bpm >= 40 && bpm <= 240) next.basic.bpm = bpm;
  const parsedKey = parseKeyValue(sheet.key?.selected ?? sheet.key);
  if (parsedKey.key) next.basic.key = parsedKey.key;
  if (parsedKey.scale) next.basic.scale = parsedKey.scale;
  if (sheet.scale && ['major', 'minor'].includes(String(sheet.scale).toLowerCase())) next.basic.scale = String(sheet.scale).toLowerCase();
  return next;
}

function legacySheetProjectToSongProject(value, { now } = {}) {
  const sheet = value.sheet && typeof value.sheet === 'object' ? value.sheet : {};
  const project = createEmptySongProject({
    projectId: text(value.projectId, 200) || makeId(),
    title: text(value.title, 80) || '新しい曲',
    now: text(value.updatedAt, 80) || nowIso(now),
    sourceApp: 'composition-sheet',
    createdFrom: 'legacy-sheet-json',
  });
  const merged = mergeSheetChangesIntoSongProject(project, { ...sheet, title: value.title }, { now });
  if (value.composer && typeof value.composer === 'object') {
    merged.composition = {
      ...merged.composition,
      chords: clone(value.composer.chords || []),
      melody: clone(value.composer.melody || []),
      counterMelody: clone(value.composer.counterMelody || []),
      bass: clone(value.composer.bass || []),
      drums: clone(value.composer.drums || []),
      sections: clone(value.composer.sections || []),
    };
  }
  if (value.arrangement && typeof value.arrangement === 'object') merged.arrangement = { ...merged.arrangement, ...clone(value.arrangement) };
  if (value.midiAnalysis && typeof value.midiAnalysis === 'object') merged.analysis = { ...merged.analysis, ...clone(value.midiAnalysis) };
  merged.compatibility.legacyCompositionSheet = clone(value);
  return merged;
}

function compositionSheetHandoffToSongProject(value, { now } = {}) {
  const sheet = value.sheet && typeof value.sheet === 'object' ? value.sheet : {};
  const project = createEmptySongProject({
    title: text(value.title, 80) || '新しい曲',
    now: text(value.createdAt, 80) || nowIso(now),
    sourceApp: text(value.source, 80) || 'composition-sheet',
    createdFrom: 'composition-sheet-handoff',
  });
  const merged = mergeSheetChangesIntoSongProject(project, sheet, { now });
  merged.compatibility.compositionSheetHandoff = clone(value);
  return merged;
}

export function projectValueToSongProject(value, { now } = {}) {
  if (!value || typeof value !== 'object') throw new Error('Project JSONが不正です。');
  if (isSongProject(value)) return normalizeSongProjectV1(value, { now });
  if (value.kind === 'composition-sheet-handoff') return compositionSheetHandoffToSongProject(value, { now });
  if (value.format === 'demo-composer-project' && value.sheet) return legacySheetProjectToSongProject(value, { now });
  if (value.basic && value.structure) return demoProjectToSongProject(value, { now });
  throw new Error('対応していないProject JSONです。SongProject v1または旧互換形式を選んでください。');
}

export function parseProjectJsonToSongProject(textValue, options = {}) {
  let value;
  try { value = JSON.parse(textValue); } catch { throw new Error('Project JSONとして読めませんでした。'); }
  return projectValueToSongProject(value, options);
}

export function forkSongProject(songProject, {
  projectId = makeId(),
  title = `${songProject?.title || 'Untitled Project'} Fork`,
  sourceApp = 'arrangement-lab',
  createdFrom = 'fork',
  forkReason = '',
  now,
} = {}) {
  const normalized = normalizeSongProjectV1(songProject);
  validateSongProject(normalized);
  const stamp = nowIso(now);
  const next = clone(normalized);
  const rootProjectId = normalized.lineage?.rootProjectId || normalized.projectId;
  next.projectId = projectId;
  next.title = text(title, 80) || 'Untitled Project';
  next.createdAt = stamp;
  next.updatedAt = stamp;
  next.lineage = {
    rootProjectId,
    parentProjectId: normalized.projectId,
    sourceApp,
    createdFrom,
    forkReason: String(forkReason || '').slice(0, 400) || null,
    revision: 1,
  };
  next.history = {
    ...clone(next.history),
    changes: [
      ...(Array.isArray(next.history?.changes) ? clone(next.history.changes) : []),
      { at: stamp, type: 'fork', fromProjectId: normalized.projectId, sourceApp, reason: next.lineage.forkReason },
    ],
  };
  validateSongProject(next);
  return next;
}

export function serializeSongProject(project) {
  const normalized = normalizeSongProjectV1(project);
  validateSongProject(normalized);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

export function parseSongProjectJson(textValue) {
  let value;
  try { value = JSON.parse(textValue); } catch { throw new Error('SongProject JSONとして読めませんでした。'); }
  const normalized = normalizeSongProjectV1(value);
  validateSongProject(normalized);
  return normalized;
}
