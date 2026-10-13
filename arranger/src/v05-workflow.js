import { arrangedNotes, createPartMidi } from './core.js';
import { createSongMidi, createDemoComposerProject, ARRANGER_V05_VERSION } from './v05-tools.js';

const PARTS = ['melody', 'harmony', 'bass', 'drums', 'counter'];
const STATUS_LABELS = {
  adopted: '採用', rejected: '不採用', hold: '保留', concern: '気になる', diary: '制作日記', restored: '復元',
};
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const nowIso = (now) => typeof now === 'string' ? now : now instanceof Date ? now.toISOString() : new Date().toISOString();
const sectionPlan = (candidate, sectionId) => candidate?.sections?.find((item) => item.sectionId === sectionId) || null;
const noteKey = (note) => `${note.pitch}:${note.startTick}:${note.durationTick}:${note.velocity || 0}:${note.voice || ''}`;

function notesInRange(source, candidate, part, startTick, endTick) {
  return arrangedNotes(source, candidate, part)
    .filter((note) => note.startTick < endTick && note.startTick + note.durationTick > startTick)
    .map((note) => ({ ...note, startTick: Math.max(startTick, note.startTick), durationTick: Math.min(endTick, note.startTick + note.durationTick) - Math.max(startTick, note.startTick) }))
    .filter((note) => note.durationTick > 0)
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch || a.durationTick - b.durationTick);
}

export function createBaselineCandidate(source, current = null) {
  return {
    id: 'source-baseline', label: '変更前', styleId: current?.styleId || 'jpop-band', styleName: 'Source baseline',
    description: '元project.jsonのNote/Chordを基準にした比較用の変更前。', sourceCandidateIds: [],
    sections: source.sections.map((section) => ({
      sectionId: section.id, sectionName: section.name, kind: section.kind, bars: section.bars, energy: section.energy,
      density: 'standard', enabled: { melody: true, harmony: true, bass: true, drums: true, counter: true, color: false },
      reharmonization: null, roles: {}, transition: section.transition,
    })),
  };
}

export function changedPartsForRange(source, candidate, startTick = 0, endTick = null) {
  if (!source || !candidate) return [];
  const rangeEnd = endTick ?? source.sections.at(-1)?.endTick ?? 0;
  const baseline = createBaselineCandidate(source, candidate);
  return PARTS.filter((part) => {
    const before = notesInRange(source, baseline, part, startTick, rangeEnd).map(noteKey);
    const after = notesInRange(source, candidate, part, startTick, rangeEnd).map(noteKey);
    return before.length !== after.length || before.some((key, index) => key !== after[index]);
  });
}

export function buildChangedPartsManifest(source, candidate) {
  return source.sections.map((section) => ({ sectionId: section.id, sectionName: section.name,
    changedParts: changedPartsForRange(source, candidate, section.startTick, section.endTick) }));
}

export function findPrechorusToChorusRange(source) {
  const sections = source?.sections || [];
  const chorusIndex = sections.findIndex((section, index) => section.kind === 'chorus' && index > 0);
  if (chorusIndex < 0) return null;
  let startIndex = chorusIndex - 1;
  for (let i = chorusIndex - 1; i >= 0; i -= 1) {
    if (sections[i].kind === 'prechorus') { startIndex = i; break; }
    if (sections[i].kind === 'chorus') break;
  }
  return { startTick: sections[startIndex].startTick, endTick: sections[chorusIndex].endTick,
    startSectionId: sections[startIndex].id, chorusSectionId: sections[chorusIndex].id,
    label: `${sections[startIndex].name} → ${sections[chorusIndex].name}` };
}

export function ensureDecisionJournal(plan, candidate) {
  const next = clone(plan?.decisionJournal) || { version: 1, createdAt: new Date().toISOString(), originals: {}, entries: [] };
  next.version = 1; next.originals ||= {}; next.entries = Array.isArray(next.entries) ? next.entries : [];
  for (const section of candidate?.sections || []) if (!next.originals[section.sectionId]) next.originals[section.sectionId] = clone(section);
  return next;
}

export function recordDecision(plan, candidate, { sectionId = null, status = 'diary', reason = '', now = null } = {}) {
  if (!Object.hasOwn(STATUS_LABELS, status)) throw new Error('判断ステータスが正しくありません。');
  const next = clone(plan), journal = ensureDecisionJournal(next, candidate), section = sectionId ? sectionPlan(candidate, sectionId) : null;
  if (sectionId && !section) throw new Error('記録対象Sectionが見つかりません。');
  const at = nowIso(now);
  journal.entries.push({ id: `decision-${at}-${Math.random().toString(36).slice(2, 8)}`, at, sectionId: sectionId || null,
    sectionName: section?.sectionName || '曲全体', status, statusLabel: STATUS_LABELS[status], reason: String(reason || '').slice(0, 1000), snapshot: section ? clone(section) : null });
  journal.entries = journal.entries.slice(-300); next.decisionJournal = journal; next.arrangerVersion = ARRANGER_V05_VERSION; next.updatedAt = at;
  return next;
}

export function restoreDecisionSnapshot(plan, { sectionId, entryId = null, original = false, now = null } = {}) {
  const next = clone(plan), candidate = next.arrangement;
  if (!candidate?.sections) throw new Error('編曲案が見つかりません。');
  const journal = ensureDecisionJournal(next, candidate);
  const snapshot = original ? journal.originals?.[sectionId] : journal.entries.find((entry) => entry.id === entryId && entry.sectionId === sectionId)?.snapshot;
  if (!snapshot) throw new Error('復元できるSection snapshotがありません。');
  const index = candidate.sections.findIndex((section) => section.sectionId === sectionId);
  if (index < 0) throw new Error('復元対象Sectionが見つかりません。');
  candidate.sections[index] = clone(snapshot);
  const at = nowIso(now);
  journal.entries.push({ id: `decision-${at}-${Math.random().toString(36).slice(2, 8)}`, at, sectionId,
    sectionName: snapshot.sectionName || sectionId, status: 'restored', statusLabel: STATUS_LABELS.restored,
    reason: original ? '判断記録開始時の原案へ戻した' : '過去のSection snapshotへ戻した', snapshot: clone(snapshot) });
  journal.entries = journal.entries.slice(-300); next.decisionJournal = journal; next.arrangerVersion = ARRANGER_V05_VERSION; next.updatedAt = at;
  return next;
}

export function latestDecisionBySection(journal) {
  const result = {};
  for (const entry of journal?.entries || []) if (entry.sectionId) result[entry.sectionId] = entry;
  return result;
}

const textBytes = (text) => new TextEncoder().encode(String(text));
const le16 = (value) => [value & 0xff, (value >>> 8) & 0xff];
const le32 = (value) => [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return { time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate() };
}

export function createStoreZip(files) {
  const entries = Object.entries(files).map(([name, value]) => ({ name, nameBytes: textBytes(name), bytes: value instanceof Uint8Array ? value : textBytes(value) }));
  const local = [], central = []; let offset = 0; const stamp = dosDateTime();
  for (const entry of entries) {
    const crc = crc32(entry.bytes), size = entry.bytes.length;
    const header = [...le32(0x04034b50), ...le16(20), ...le16(0), ...le16(0), ...le16(stamp.time), ...le16(stamp.date), ...le32(crc), ...le32(size), ...le32(size), ...le16(entry.nameBytes.length), ...le16(0), ...entry.nameBytes];
    local.push(...header, ...entry.bytes);
    central.push(...le32(0x02014b50), ...le16(20), ...le16(20), ...le16(0), ...le16(0), ...le16(stamp.time), ...le16(stamp.date), ...le32(crc), ...le32(size), ...le32(size), ...le16(entry.nameBytes.length), ...le16(0), ...le16(0), ...le16(0), ...le16(0), ...le32(0), ...le32(offset), ...entry.nameBytes);
    offset += header.length + size;
  }
  const centralOffset = local.length;
  return new Uint8Array([...local, ...central, ...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(entries.length), ...le16(entries.length), ...le32(central.length), ...le32(centralOffset), ...le16(0)]);
}

function sectionInstruction(source, candidate, journal) {
  const latest = latestDecisionBySection(journal);
  return source.sections.map((section) => {
    const plan = sectionPlan(candidate, section.id) || {}, enabled = Object.entries(plan.enabled || {}).filter(([, value]) => value).map(([key]) => key).join(', ') || 'none', decision = latest[section.id];
    return [`## ${section.name}`, `- Bars: ${section.bars}`, `- Density: ${plan.density || 'standard'}`, `- Active: ${enabled}`, `- Reharm: ${plan.reharmonization?.label || '元コード'}`, `- Harmony pattern: ${plan.harmonyPattern || 'sustain'}`, `- Lead role: ${plan.leadRole || 'melody'}`, `- Decision: ${decision ? `${decision.statusLabel}${decision.reason ? ` — ${decision.reason}` : ''}` : '未記録'}`].join('\n');
  }).join('\n\n');
}
function trackInstructions(source, candidate) {
  const lines = ['# Track Instructions', '', 'Cubasis / Cubaseへ読み込んだ後の作業メモ。', ''];
  for (const part of PARTS) lines.push(`- ${part}: ${arrangedNotes(source, candidate, part).length} notes${part === 'drums' ? ' / MIDI ch10' : ''}`);
  lines.push('', '音色、Humanize、Automation、Mix/MasteringはDAW側で確定する。'); return lines.join('\n');
}
function dawChecklist() {
  return ['# DAW Handoff Checklist', '', '- [ ] Tempoと4/4が正しく読み込まれた', '- [ ] Section Markerを確認した', '- [ ] Melody / Harmony / Bass / Drums / CounterのTrackを確認した', '- [ ] DrumsがMIDI ch10として読み込まれた', '- [ ] 変更前Song.midと変更後Song.midをA/Bした', '- [ ] 「保留」「気になる」のSectionを先に確認した', '- [ ] 確定事項だけ本制作へ反映した', '- [ ] 音色・Humanize・MixはDAWで調整した'].join('\n');
}

export function createDawHandoffBundle(source, candidate, plan) {
  const baseline = createBaselineCandidate(source, candidate), before = createSongMidi(source, baseline), after = createSongMidi(source, candidate);
  if (!after) throw new Error('DAWパックに書き出せるNoteがありません。');
  const project = createDemoComposerProject(source, candidate), journal = ensureDecisionJournal(plan, candidate);
  const manifest = { version: ARRANGER_V05_VERSION, title: source.title, exportedAt: new Date().toISOString(), changedParts: buildChangedPartsManifest(source, candidate), decisionCount: journal.entries.length };
  const files = {
    '01_compare/Before_Source_Song.mid': before || new Uint8Array(), '01_compare/After_Arrangement_Song.mid': after,
    '02_plan/Arrangement_Plan.json': JSON.stringify({ ...clone(plan), decisionJournal: journal }, null, 2),
    '02_plan/Demo_Composer_Project.json': JSON.stringify(project, null, 2),
    '03_notes/TRACK_INSTRUCTIONS.md': trackInstructions(source, candidate), '03_notes/SECTION_INSTRUCTIONS.md': sectionInstruction(source, candidate, journal),
    '03_notes/DAW_CHECKLIST.md': dawChecklist(), '03_notes/DECISIONS.json': JSON.stringify(journal, null, 2), '03_notes/COMPARE_MANIFEST.json': JSON.stringify(manifest, null, 2),
  };
  for (const part of PARTS) { const midi = createPartMidi(source, candidate, part); if (midi) files[`04_parts/${part}.mid`] = midi; }
  return createStoreZip(files);
}
