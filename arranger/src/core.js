import { CHORD_QUALITY_DEFINITIONS as QUALITIES } from './chord-qualities.js';
export const ARRANGER_VERSION = 'v0.4-dev';
export const ARRANGER_SCHEMA_VERSION = 4;

export const STYLE_PROFILES = {
  'jpop-band': {
    id: 'jpop-band',
    name: 'J-POP Band',
    description: 'ピアノ/ギター/ベース/ドラムを軸に、サビで厚くする王道型',
    harmony: ['Piano', 'Guitar'],
    color: ['Strings'],
  },
  'synth-pop': {
    id: 'synth-pop',
    name: 'Modern Synth Pop',
    description: 'Pad/Pluck/Synth Bassを軸に、密度差とDropで展開を作る',
    harmony: ['Pad', 'Pluck'],
    color: ['Synth Layer'],
  },
  'piano-ballad': {
    id: 'piano-ballad',
    name: 'Piano Ballad',
    description: 'ピアノ中心。前半を薄く保ち、後半だけStringsとDrumsを足す',
    harmony: ['Piano'],
    color: ['Strings'],
  },
};

const DEFAULT_SECTION_ENERGY = {
  intro: 'low', verse: 'low', prechorus: 'mid', chorus: 'high',
  interlude: 'mid', bridge: 'mid', outro: 'low',
};
const ENERGY_SCORE = { low: 1, mid: 2, high: 3 };
const DENSITY_SCORE = { thin: 1, standard: 2, full: 3 };
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function normalizeSourceProject(input) {
  if (!input || typeof input !== 'object') throw new Error('Project JSONが正しくありません。');
  if (!input.basic || !Array.isArray(input.structure?.sections)) {
    throw new Error('Demo Composerのproject.jsonとして必要なbasic / structure.sectionsが見つかりません。');
  }
  if (input.basic.timeSignature && input.basic.timeSignature !== '4/4') throw new Error('対応拍子は4/4です。');
  const ppq = clampInt(input.basic.ppq, 24, 9600, 480);
  const ticksPerBar = ppq * 4;
  let cursorTick = 0;
  const sections = input.structure.sections.map((section, index) => {
    const bars = clampInt(section.bars, 1, 32, 8);
    const normalized = {
      id: section.id || `section-${index + 1}`,
      kind: section.kind || 'verse',
      name: section.name || `Section ${index + 1}`,
      bars,
      energy: ['low', 'mid', 'high'].includes(section.energy)
        ? section.energy : (DEFAULT_SECTION_ENERGY[section.kind] || 'mid'),
      transition: ['keep', 'fill', 'stop', 'build', 'drop'].includes(section.transition)
        ? section.transition : 'keep',
      startTick: cursorTick,
      endTick: cursorTick + bars * ticksPerBar,
    };
    cursorTick = normalized.endTick;
    return normalized;
  });
  if (sections.length === 0) throw new Error('Sectionが1つもありません。Demo ComposerのArrangeでSectionを作ってください。');

  return {
    sourceSchemaVersion: input.schemaVersion ?? null,
    sourceAppVersion: input.appVersion ?? null,
    sourceProjectId: input.id ?? null,
    sourceRevision: input.revision ?? null,
    title: input.metadata?.title || 'Untitled',
    genre: input.metadata?.genre || '',
    mood: Array.isArray(input.metadata?.mood) ? [...input.metadata.mood] : [],
    basic: {
      bpm: clampInt(input.basic.bpm, 40, 240, 120),
      key: input.basic.key || 'C', scale: input.basic.scale || 'major',
      timeSignature: input.basic.timeSignature || '4/4', ppq,
    },
    sections,
    chords: Array.isArray(input.chords) ? input.chords.map(normalizeChord).filter(Boolean) : [],
    tracks: Array.isArray(input.tracks) ? input.tracks.map(normalizeTrack).filter(Boolean) : [],
    sourceSnapshot: structuredCloneSafe(input),
  };
}

function normalizeChord(chord) {
  if (!chord || !Number.isFinite(Number(chord.startTick))) return null;
  return {
    voicing: Array.isArray(chord.voicing) ? [...new Set(chord.voicing.filter(v=>Number.isFinite(Number(v))).map(v=>clampInt(v,0,127,60)))].slice(0,8) : null,
    root: mod12(chord.root), quality: Object.hasOwn(QUALITIES, chord.quality) ? chord.quality : 'major', degree: chord.degree || '',
    startTick: clampInt(chord.startTick, 0, 0x0fffffff, 0),
    durationTick: clampInt(chord.durationTick, 1, 0x0fffffff, 1),
  };
}
function normalizeTrack(track) {
  if (!track?.role) return null;
  return {
    role: track.role, name: track.name || track.role, midiChannel: clampInt(track.midiChannel, 1, 16, track.role === 'drums' ? 10 : 1),
    notes: Array.isArray(track.notes) ? track.notes.filter(Boolean).map((note) => ({
      id: note.id || makeId(), ...(typeof note.voice === 'string' ? {voice:note.voice.slice(0,24)} : {}), pitch: clampInt(note.pitch, 0, 127, 60),
      startTick: clampInt(note.startTick, 0, 0x0fffffff, 0), durationTick: clampInt(note.durationTick, 1, 0x0fffffff, 1),
      velocity: clampInt(note.velocity, 1, 127, 96),
    })) : [],
  };
}
function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
function mod12(value) { return ((clampInt(value, -100000, 100000, 0) % 12) + 12) % 12; }
function sectionSeed(section, index) {
  return [...`${section.kind}:${section.name}:${section.bars}:${index}`]
    .reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}
function densityFor(section, variantOffset) {
  const base = ENERGY_SCORE[section.energy] || 2;
  const kindBias = section.kind === 'chorus' ? 1 : section.kind === 'intro' || section.kind === 'outro' ? -1 : 0;
  const value = Math.min(3, Math.max(1, base + kindBias + variantOffset));
  return ['thin', 'standard', 'full'][value - 1];
}
function drumsRole(section, density, styleId) {
  if (section.kind === 'intro' && density === 'thin') return '休み / 後半から入る';
  if (section.kind === 'outro' && density !== 'full') return '簡略化して終止へ';
  if (styleId === 'piano-ballad') return density === 'thin' ? 'なし / Percussionのみ' : density === 'standard' ? '軽いKick + Rim' : 'Full Kit（控えめ）';
  if (styleId === 'synth-pop') return density === 'thin' ? 'Kickを間引く + Closed HH' : density === 'standard' ? '4つ打ち / Pop Beat' : 'Full Beat + Open HH';
  return density === 'thin' ? 'Kick少なめ + Rim' : density === 'standard' ? '8 Beat' : 'Full Kit + Crash';
}
function bassRole(section, density, styleId) {
  if (density === 'thin') return styleId === 'synth-pop' ? 'Long Synth Bass / Root中心' : 'Root中心・長め';
  if (density === 'standard') return 'Kick連動 + 経過音少量';
  return section.kind === 'chorus' ? '動き多め + Octave' : 'Kick連動 + Approach';
}
function harmonyRole(section, density, profile) {
  const instruments = density === 'thin' ? profile.harmony.slice(0, 1) : profile.harmony;
  const voicing = density === 'full' ? 'Wide / Open' : density === 'thin' ? 'Sparse / 中域中心' : 'Mid / 分散';
  return `${instruments.join(' + ')}・${voicing}`;
}
function counterRole(section, density) {
  if (section.kind === 'chorus' && density === 'full') return 'Hook型：主旋律の隙間に短い応答';
  if (section.kind === 'prechorus') return '上昇型：サビ前だけ短く';
  if (section.kind === 'verse' && density === 'thin') return 'なし / 2周目のみ';
  return density === 'full' ? 'Active型：語尾にAnswer' : 'Sparse型：隙間のみ';
}
function colorRole(section, density, profile) {
  if (density === 'thin') return '基本なし';
  if (section.kind === 'chorus') return `${profile.color[0]}を上で重ねる`;
  if (section.kind === 'prechorus') return `${profile.color[0]}を後半から追加`;
  return `${profile.color[0]}を要所だけ`;
}
function transitionRole(section) {
  return ({ keep: 'そのまま接続', fill: '最後1拍にFill', stop: '直前で一度止める', build: '後半で音数を増やす', drop: '次Section頭で一度引く' })[section.transition] || 'そのまま接続';
}
function enabledDefaults(section, density) {
  return {
    drums: !(section.kind === 'intro' && density === 'thin'), bass: true, harmony: true,
    counter: !(section.kind === 'verse' && density === 'thin'), color: density !== 'thin',
  };
}

export function buildArrangementCandidate(source, { styleId = 'jpop-band', variant = 0 } = {}) {
  const profile = STYLE_PROFILES[styleId] || STYLE_PROFILES['jpop-band'];
  const variantOffset = [-1, 0, 1][Math.max(0, Math.min(2, variant))] ?? 0;
  const labels = ['A: 余白重視', 'B: 標準', 'C: 展開強め'];
  const sections = source.sections.map((section, index) => {
    const deterministicNudge = (sectionSeed(section, index) + variant) % 5 === 0 ? 1 : 0;
    const chorusBoost = section.kind === 'chorus' && variant === 2 ? 1 : 0;
    const localOffset = Math.min(1, variantOffset + deterministicNudge + chorusBoost);
    const density = densityFor(section, localOffset);
    return {
      sectionId: section.id, sectionName: section.name, kind: section.kind, bars: section.bars,
      energy: section.energy, density, enabled: enabledDefaults(section, density),
      roles: {
        drums: drumsRole(section, density, profile.id), bass: bassRole(section, density, profile.id),
        harmony: harmonyRole(section, density, profile), counter: counterRole(section, density), color: colorRole(section, density, profile),
      },
      transition: transitionRole(section), reharmonization: null,
    };
  });
  return {
    id: `${profile.id}-v${variant + 1}`, label: labels[variant] || `案${variant + 1}`,
    styleId: profile.id, styleName: profile.name, description: profile.description,
    sourceCandidateIds: [], sections,
  };
}
export function buildThreeCandidates(source, styleId = 'jpop-band') {
  return [0, 1, 2].map((variant) => buildArrangementCandidate(source, { styleId, variant }));
}

export function updateCandidateSection(candidate, sectionId, patch = {}) {
  const next = structuredCloneSafe(candidate);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return next;
  if (patch.density && DENSITY_SCORE[patch.density]) section.density = patch.density;
  if (patch.enabled) section.enabled = { ...section.enabled, ...patch.enabled };
  for (const key of ['harmonyPattern','chorusDirection','counterArrangement','restPolicy','leadRole','reason','decisionNote','partOverrides','musicLab','tonalTarget','voiceRoles']) {
    if (key in patch) section[key] = structuredCloneSafe(patch[key]);
  }
  if (section.partOverrides && !('partOverrides' in patch)) {
    if ('reharmonization' in patch || 'harmonyPattern' in patch || 'density' in patch) delete section.partOverrides.harmony;
    if ('counterArrangement' in patch) delete section.partOverrides.counter;
  }
  if ('reharmonization' in patch) section.reharmonization = patch.reharmonization ? structuredCloneSafe(patch.reharmonization) : null;
  const profile = STYLE_PROFILES[next.styleId] || STYLE_PROFILES['jpop-band'];
  section.roles = { drums: drumsRole(section, section.density, profile.id), bass: bassRole(section, section.density, profile.id), harmony: harmonyRole(section, section.density, profile), counter: counterRole(section, section.density), color: colorRole(section, section.density, profile) };
  return next;
}

export function mixCandidates(candidateA, candidateB) {
  if (!candidateA || !candidateB || candidateA.sections.length !== candidateB.sections.length) throw new Error('Mixできる候補が揃っていません。');
  const sections = candidateA.sections.map((sectionA, index) => {
    const sectionB = candidateB.sections[index];
    const useB = sectionA.energy === 'high' || (sectionA.energy === 'mid' && index % 2 === 1);
    const base = structuredCloneSafe(useB ? sectionB : sectionA);
    const other = useB ? sectionA : sectionB;
    base.enabled = Object.fromEntries(Object.keys(base.enabled).map((key) => [key, base.enabled[key] || other.enabled?.[key] || false]));
    return base;
  });
  return {
    id: `mix-${candidateA.id}-${candidateB.id}-${Date.now()}`,
    label: `Mix: ${shortLabel(candidateA.label)} + ${shortLabel(candidateB.label)}`,
    styleId: candidateB.styleId, styleName: 'Mixed Arrangement',
    description: '低密度Sectionは前者、高密度Sectionは後者を軸にして、役割ON/OFFを合成したMix案。',
    sourceCandidateIds: [candidateA.id, candidateB.id], sections,
  };
}
function shortLabel(label) { return String(label).replace(/^[ABC]:\s*/, ''); }

export function candidateCurve(candidate) {
  return candidate.sections.map((section) => ({
    sectionId: section.sectionId, name: section.sectionName, energy: ENERGY_SCORE[section.energy] || 2,
    density: DENSITY_SCORE[section.density] || 2,
    instruments: Object.values(section.enabled || {}).filter(Boolean).length,
  }));
}

export function detectMelodyCounterCollisions(source) {
  const melody = source.tracks.find((track) => track.role === 'melody')?.notes || [];
  const counter = source.tracks.find((track) => track.role === 'counter')?.notes || [];
  return source.sections.map((section) => {
    const pairs = [];
    const mel = melody.filter((note) => overlapsRange(note, section.startTick, section.endTick));
    const ctr = counter.filter((note) => overlapsRange(note, section.startTick, section.endTick));
    for (const a of mel) for (const b of ctr) {
      if (Math.max(a.startTick, b.startTick, section.startTick) < Math.min(a.startTick + a.durationTick, b.startTick + b.durationTick, section.endTick) && Math.abs(a.pitch - b.pitch) >= 1 && Math.abs(a.pitch - b.pitch) <= 2) pairs.push({ melodyPitch: a.pitch, counterPitch: b.pitch, tick: Math.max(a.startTick, b.startTick) });
    }
    return { sectionId: section.id, sectionName: section.name, count: pairs.length, pairs: pairs.slice(0, 8), status: pairs.length === 0 ? 'ok' : pairs.length <= 2 ? 'watch' : 'warning' };
  });
}
function overlapsRange(note, start, end) { return note.startTick < end && note.startTick + note.durationTick > start; }
function notesOverlap(a, b) { return a.startTick < b.startTick + b.durationTick && b.startTick < a.startTick + a.durationTick; }

export function buildReharmSuggestions(source, sectionId) {
  const section = source.sections.find((item) => item.id === sectionId);
  if (!section) return [];
  const original = source.chords.filter((chord) => chord.startTick >= section.startTick && chord.startTick < section.endTick).sort((a, b) => a.startTick - b.startTick);
  if (!original.length) return [];
  const natural = original.map((chord) => ({ ...chord, quality: upgradeQuality(chord.quality) }));
  const color = original.map((chord, index) => {
    const next = original[index + 1];
    if (!next || index % 2 === 1) return { ...chord, quality: upgradeQuality(chord.quality) };
    return { ...chord, root: mod12(next.root + 7), quality: 'dominant7', degree: 'V/next' };
  });
  const bold = original.map((chord, index) => {
    const next = original[index + 1];
    if (chord.quality === 'dominant7' && next && mod12(chord.root - next.root) === 7) return { ...chord, root: mod12(chord.root + 6), quality: 'dominant7', degree: 'tritone-sub' };
    if (next && index % 2 === 1) return { ...chord, root: mod12(next.root - 1), quality: 'diminished7', degree: 'approach-dim' };
    if (chord.quality === 'major') return { ...chord, quality: 'major9' };
    if (chord.quality === 'minor') return { ...chord, quality: 'minor9' };
    return { ...chord };
  });
  return [
    reharmResult('natural', '自然', '元のRootを保ち、7th中心に色を足す。', natural),
    reharmResult('color', '色付け', '一部を次のコードへのセカンダリードミナントに置き換える。', color),
    reharmResult('bold', '大胆', 'トライトーン代理やディミニッシュ接近を混ぜる。', bold),
  ];
}
function upgradeQuality(quality) {
  if (quality === 'major') return 'major7';
  if (quality === 'minor') return 'minor7';
  return quality;
}
function reharmResult(id, label, description, chords) {
  return { id, label, description, chords, display: chords.map(chordName).join(' → ') };
}
export function chordName(chord) { return `${NOTE_NAMES[mod12(chord.root)]}${QUALITIES[chord.quality]?.suffix ?? `(${chord.quality})`}`; }

export function createArrangerProject(source, candidate, existing = null) {
  const now = new Date().toISOString();
  return {
    arrangerSchemaVersion: ARRANGER_SCHEMA_VERSION, arrangerVersion: ARRANGER_VERSION,
    id: existing?.id || makeId(), createdAt: existing?.createdAt || now, updatedAt: now,
    source: {
      projectId: source.sourceProjectId, revision: source.sourceRevision, schemaVersion: source.sourceSchemaVersion,
      appVersion: source.sourceAppVersion, title: source.title, basic: source.basic, sections: source.sections,
    },
    sourceSnapshot: structuredCloneSafe(source.sourceSnapshot),
    selectedCandidateId: candidate.id, arrangement: structuredCloneSafe(candidate),
  };
}
export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `arr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
export function summarizeCandidate(candidate) {
  const counts = candidate.sections.reduce((acc, section) => { acc[section.density] = (acc[section.density] || 0) + 1; return acc; }, {});
  return `薄:${counts.thin || 0} / 標準:${counts.standard || 0} / 厚:${counts.full || 0}`;
}

export function createPartMidi(source, candidate, part) {
  const ppq = source.basic.ppq || 480;
  const notes = arrangedNotes(source, candidate, part);
  const track = source.tracks.find((item) => item.role === part);
  const channel = part === 'drums' ? 9 : Math.max(0, Math.min(15, (track?.midiChannel || ({ melody: 2, bass: 3, counter: 4, harmony: 5, 'counter-a':6, 'counter-b':7 }[part] || 1)) - 1));
  if (!notes.length) return null;
  const events = [{ tick: 0, order: 0, bytes: [0xff, 0x58, 4, 4, 2, 24, 8] }];
  const bpm = source.basic.bpm || 120;
  const micros = Math.round(60000000 / bpm);
  events.push({ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff] });
  const nameBytes = [...new TextEncoder().encode(`Arrangement Lab ${part}`)];
  events.push({ tick: 0, order: 0, bytes: [0xff, 0x03, nameBytes.length, ...nameBytes] });
  for (const note of notes) {
    events.push({ tick: note.startTick, order: 2, bytes: [0x90 | channel, note.pitch, note.velocity || 90] });
    events.push({ tick: note.startTick + note.durationTick, order: 1, bytes: [0x80 | channel, note.pitch, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const trackData = [];
  let lastTick = 0;
  for (const event of events) {
    trackData.push(...encodeVlq(Math.max(0, event.tick - lastTick)), ...event.bytes);
    lastTick = event.tick;
  }
  trackData.push(0x00, 0xff, 0x2f, 0x00);
  return new Uint8Array([
    ...ascii('MThd'), 0, 0, 0, 6, 0, 0, 0, 1, (ppq >> 8) & 0xff, ppq & 0xff,
    ...ascii('MTrk'), ...u32(trackData.length), ...trackData,
  ]);
}
// Shared event source for MIDI and preview. OFF boundaries cut sustained notes.
export function arrangedNotes(source, candidate, part) {
  if (part === 'counter-a' || part === 'counter-b') return arrangedNotes(source,candidate,'counter').filter(n=>n.voice === (part === 'counter-a' ? 'A' : 'B'));
  if (part === 'harmony') return harmonyNotes(source, candidate);
  const base = source.tracks.filter((track) => track.role === part).flatMap((track) => track.notes);
  const melody = source.tracks.filter((track) => track.role === 'melody').flatMap((track) => track.notes);
  const fragments = [];
  for (const section of source.sections) {
    const plan = candidate.sections.find((item) => item.sectionId === section.id);
    if (plan?.enabled?.[part] === false) continue;
    const override = Array.isArray(plan?.partOverrides?.[part]) ? plan.partOverrides[part] : part === 'counter' && Array.isArray(plan?.counterArrangement?.notes) ? plan.counterArrangement.notes : null;
    const overridden = override !== null;
    const notes = overridden ? normalizeTrack({ role: part, notes: override }).notes : base;
    notes.forEach((note,index) => {
      const start = Math.max(note.startTick, section.startTick), end = Math.min(note.startTick + note.durationTick, section.endTick);
      if (end <= start) return;
      let spans = [{ start, end }];
      if (part === 'counter' && plan?.restPolicy === 'melody-gaps') {
        for (const mel of melody) spans = spans.flatMap(span => {
          const left = Math.max(span.start, mel.startTick), right = Math.min(span.end, mel.startTick + mel.durationTick);
          if (right <= left) return [span];
          return [{ start: span.start, end: left }, { start: right, end: span.end }].filter(s => s.end > s.start);
        });
      }
      const token = overridden ? `${section.id}:${index}` : `source:${index}`;
      for (const span of spans) fragments.push({ ...note, token, startTick: span.start, durationTick: span.end-span.start });
    });
  }
  fragments.sort((a,b) => a.startTick-b.startTick);
  const output=[];
  for (const note of fragments) {
    const previous=output.findLast(n=>n.token===note.token);
    if (previous && previous.startTick+previous.durationTick===note.startTick && previous.pitch===note.pitch && previous.velocity===note.velocity) previous.durationTick+=note.durationTick;
    else output.push({...note});
  }
  return output.map(({token,...note})=>note);
}
export function harmonyNotes(source, candidate) {
  const output = [];
  for (const section of source.sections) {
    const plan = candidate.sections.find((item) => item.sectionId === section.id);
    if (plan?.enabled?.harmony === false) continue;
    if (Array.isArray(plan?.partOverrides?.harmony)) {
      const notes=normalizeTrack({role:'harmony',notes:plan.partOverrides.harmony}).notes;
      for(const n of notes) { const startTick=Math.max(n.startTick,section.startTick), endTick=Math.min(n.startTick+n.durationTick,section.endTick); if(endTick>startTick)output.push({...n,startTick,durationTick:endTick-startTick}); }
      continue;
    }
    const chords = plan?.reharmonization?.chords?.length ? plan.reharmonization.chords : source.chords;
    const density = DENSITY_SCORE[plan?.density] || 2;
    for (const raw of chords) {
      const chord = normalizeChord(raw);
      if (!chord || !overlapsRange(chord, section.startTick, section.endTick)) continue;
      const intervals = QUALITIES[chord.quality].intervals;
      // Keep the defining extension even in a sparse voicing (e.g. maj7/9).
      const chosen = density === 3 ? intervals : intervals.length > 3
        ? (density === 1 ? [intervals[1], intervals.at(-1)] : [0, intervals[1], intervals.at(-1)])
        : intervals.slice(0, density === 1 ? 2 : 3);
      const pitches = chord.voicing?.length ? chord.voicing : chosen.map(interval=>48 + mod12(chord.root) + interval);
      const startTick = Math.max(chord.startTick, section.startTick);
      const durationTick = Math.min(chord.startTick + chord.durationTick, section.endTick) - startTick;
      const velocity = Math.round((64 + density * 8) * (plan?.leadRole === 'counter' ? .75 : 1));
      const pattern = plan?.harmonyPattern || 'sustain';
      if (pattern === 'sustain') {
        for (const pitch of pitches) output.push({ pitch, startTick, durationTick, velocity });
      } else {
        const step = Math.max(1,Math.round(source.basic.ppq/2));
        for (let tick=startTick,index=0; tick<startTick+durationTick; tick+=step,index++) {
          if (pattern === 'offbeat' && Math.floor((tick-section.startTick)/step)%2===0) continue;
          const voices = pattern === 'arpeggio' ? [pitches[index%pitches.length]] : pitches;
          for (const pitch of voices) output.push({ pitch, startTick:tick, durationTick:Math.min(Math.round(step*.7),startTick+durationTick-tick), velocity });
        }
      }
    }
  }
  return output;
}

export function restoreArrangerProject(saved, sourceOverride = null) {
  if (![1, 2, 3, 4].includes(saved?.arrangerSchemaVersion) || !saved.source || !Array.isArray(saved.arrangement?.sections)) throw new Error('編曲プランの形式が正しくありません。');
  const source = sourceOverride || (saved.sourceSnapshot ? normalizeSourceProject(saved.sourceSnapshot) : null);
  if (!source) return { source: null, candidate: null };
  if (saved.source.projectId !== source.sourceProjectId || saved.source.revision !== source.sourceRevision) throw new Error('元のProject ID / revisionが一致しません。');
  const base = buildArrangementCandidate(source, { styleId: saved.arrangement.styleId });
  const candidate = { ...base, ...structuredCloneSafe(saved.arrangement), sections: base.sections.map((section) => {
    const old = saved.arrangement.sections.find((item) => item.sectionId === section.sectionId);
    if (!old) return section;
    return { ...section, ...old, enabled: { ...section.enabled, ...old.enabled }, roles: { ...section.roles, ...old.roles } };
  }) };
  return { source, candidate };
}
function ascii(text) { return [...text].map((char) => char.charCodeAt(0)); }
function u32(value) { return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]; }
function encodeVlq(value) {
  let buffer = value & 0x7f;
  const out = [];
  while ((value >>= 7)) { buffer <<= 8; buffer |= ((value & 0x7f) | 0x80); }
  while (true) { out.push(buffer & 0xff); if (buffer & 0x80) buffer >>= 8; else break; }
  return out;
}
