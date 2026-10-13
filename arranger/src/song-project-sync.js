import { songProjectToDemoProject, validateSongProject } from '../../src/shared/song-project.js';

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function nowIso(now) { return now || new Date().toISOString(); }

export function songProjectToArrangementSourceInput(songProject) {
  validateSongProject(songProject);
  return songProjectToDemoProject(songProject);
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
