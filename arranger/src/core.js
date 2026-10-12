export const ARRANGER_VERSION = 'v0.1-dev';
export const ARRANGER_SCHEMA_VERSION = 1;

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
  intro: 'low',
  verse: 'low',
  prechorus: 'mid',
  chorus: 'high',
  interlude: 'mid',
  bridge: 'mid',
  outro: 'low',
};

const ENERGY_SCORE = { low: 1, mid: 2, high: 3 };

export function normalizeSourceProject(input) {
  if (!input || typeof input !== 'object') throw new Error('Project JSONが正しくありません。');
  if (!input.basic || !Array.isArray(input.structure?.sections)) {
    throw new Error('Demo Composerのproject.jsonとして必要なbasic / structure.sectionsが見つかりません。');
  }

  const sections = input.structure.sections.map((section, index) => ({
    id: section.id || `section-${index + 1}`,
    kind: section.kind || 'verse',
    name: section.name || `Section ${index + 1}`,
    bars: clampInt(section.bars, 1, 32, 8),
    energy: ['low', 'mid', 'high'].includes(section.energy)
      ? section.energy
      : (DEFAULT_SECTION_ENERGY[section.kind] || 'mid'),
    transition: ['keep', 'fill', 'stop', 'build', 'drop'].includes(section.transition)
      ? section.transition
      : 'keep',
  }));

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
      key: input.basic.key || 'C',
      scale: input.basic.scale || 'major',
      timeSignature: input.basic.timeSignature || '4/4',
      ppq: input.basic.ppq || 480,
    },
    sections,
    sourceSnapshot: structuredCloneSafe(input),
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
  if (styleId === 'piano-ballad') {
    if (density === 'thin') return 'なし / Percussionのみ';
    if (density === 'standard') return '軽いKick + Rim';
    return 'Full Kit（控えめ）';
  }
  if (styleId === 'synth-pop') {
    if (density === 'thin') return 'Kickを間引く + Closed HH';
    if (density === 'standard') return '4つ打ち / Pop Beat';
    return 'Full Beat + Open HH';
  }
  if (density === 'thin') return 'Kick少なめ + Rim';
  if (density === 'standard') return '8 Beat';
  return 'Full Kit + Crash';
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
  const map = {
    keep: 'そのまま接続',
    fill: '最後1拍にFill',
    stop: '直前で一度止める',
    build: '後半で音数を増やす',
    drop: '次Section頭で一度引く',
  };
  return map[section.transition] || map.keep;
}

export function buildArrangementCandidate(source, { styleId = 'jpop-band', variant = 0 } = {}) {
  const profile = STYLE_PROFILES[styleId] || STYLE_PROFILES['jpop-band'];
  const offsets = [-1, 0, 1];
  const variantOffset = offsets[Math.max(0, Math.min(2, variant))] ?? 0;
  const labels = ['A: 余白重視', 'B: 標準', 'C: 展開強め'];

  const sections = source.sections.map((section, index) => {
    const deterministicNudge = (sectionSeed(section, index) + variant) % 5 === 0 ? 1 : 0;
    const chorusBoost = section.kind === 'chorus' && variant === 2 ? 1 : 0;
    const localOffset = Math.min(1, variantOffset + deterministicNudge + chorusBoost);
    const density = densityFor(section, localOffset);
    return {
      sectionId: section.id,
      sectionName: section.name,
      kind: section.kind,
      bars: section.bars,
      energy: section.energy,
      density,
      roles: {
        drums: drumsRole(section, density, profile.id),
        bass: bassRole(section, density, profile.id),
        harmony: harmonyRole(section, density, profile),
        counter: counterRole(section, density),
        color: colorRole(section, density, profile),
      },
      transition: transitionRole(section),
    };
  });

  return {
    id: `${profile.id}-v${variant + 1}`,
    label: labels[variant] || `案${variant + 1}`,
    styleId: profile.id,
    styleName: profile.name,
    description: profile.description,
    sections,
  };
}

export function buildThreeCandidates(source, styleId = 'jpop-band') {
  return [0, 1, 2].map((variant) => buildArrangementCandidate(source, { styleId, variant }));
}

export function createArrangerProject(source, candidate, existing = null) {
  const now = new Date().toISOString();
  return {
    arrangerSchemaVersion: ARRANGER_SCHEMA_VERSION,
    arrangerVersion: ARRANGER_VERSION,
    id: existing?.id || makeId(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: {
      projectId: source.sourceProjectId,
      revision: source.sourceRevision,
      schemaVersion: source.sourceSchemaVersion,
      appVersion: source.sourceAppVersion,
      title: source.title,
      basic: source.basic,
      sections: source.sections,
    },
    selectedCandidateId: candidate.id,
    arrangement: structuredCloneSafe(candidate),
  };
}

export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `arr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function summarizeCandidate(candidate) {
  const counts = candidate.sections.reduce((acc, section) => {
    acc[section.density] = (acc[section.density] || 0) + 1;
    return acc;
  }, {});
  return `薄:${counts.thin || 0} / 標準:${counts.standard || 0} / 厚:${counts.full || 0}`;
}
