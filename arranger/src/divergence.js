import {
  STYLE_PROFILES,
  buildArrangementCandidate,
  buildReharmSuggestions,
  updateCandidateSection,
} from './core.js';

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
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

function donorFor(source, context) {
  const styleIds = Object.keys(STYLE_PROFILES);
  const styleId = styleIds[Math.floor(context.random() * styleIds.length)] ?? styleIds[0];
  const variant = context.distance <= 2 ? 1 : Math.min(2, Math.floor(context.random() * 3));
  return buildArrangementCandidate(source, { styleId, variant });
}

function selectedSectionIds(candidate, context) {
  const sections = candidate.sections ?? [];
  if (!sections.length) return [];
  const count = Math.min(sections.length, Math.max(1, Math.ceil(sections.length * context.distanceRatio)));
  return shuffled(sections, context.random).slice(0, count).map((section) => section.sectionId);
}

function applyHarmony(candidate, source, sectionIds, context) {
  let next = candidate;
  let changed = 0;
  const labels = [];
  for (const sectionId of sectionIds) {
    const choices = buildReharmSuggestions(source, sectionId);
    if (!choices.length) continue;
    const maxIndex = context.distance <= 2 ? 0 : context.distance <= 4 ? 1 : 2;
    const choice = choices[Math.min(maxIndex, Math.floor(context.random() * (maxIndex + 1)))];
    if (!choice) continue;
    next = updateCandidateSection(next, sectionId, { reharmonization: choice });
    labels.push(choice.label);
    changed += 1;
  }
  return { candidate: next, changed, label: labels.join(' / ') };
}

function applyCounter(candidate, donor, sectionIds, context) {
  let next = clone(candidate);
  let changed = 0;
  for (const sectionId of sectionIds) {
    const section = next.sections.find((item) => item.sectionId === sectionId);
    const donorSection = donor.sections.find((item) => item.sectionId === sectionId);
    if (!section || !donorSection) continue;
    const enabled = context.distance >= 4 && context.random() < 0.25 ? !section.enabled.counter : donorSection.enabled.counter;
    const patch = {
      enabled: { counter: enabled },
      restPolicy: context.distance <= 3 ? 'melody-gaps' : null,
      leadRole: context.distance >= 5 && context.random() < 0.35 ? 'counter' : section.leadRole,
    };
    next = updateCandidateSection(next, sectionId, patch);
    const updated = next.sections.find((item) => item.sectionId === sectionId);
    if (updated && donorSection.roles?.counter) updated.roles.counter = donorSection.roles.counter;
    changed += 1;
  }
  return { candidate: next, changed };
}

function applyRhythm(candidate, donor, sectionIds, context) {
  let next = candidate;
  let changed = 0;
  for (const sectionId of sectionIds) {
    const donorSection = donor.sections.find((item) => item.sectionId === sectionId);
    if (!donorSection) continue;
    const patch = {
      density: donorSection.density,
      enabled: { drums: donorSection.enabled.drums },
    };
    next = updateCandidateSection(next, sectionId, patch);
    changed += 1;
  }
  return { candidate: next, changed };
}

function applyInstrumentation(candidate, donor, sectionIds, context) {
  const next = clone(candidate);
  let changed = 0;
  for (const sectionId of sectionIds) {
    const section = next.sections.find((item) => item.sectionId === sectionId);
    const donorSection = donor.sections.find((item) => item.sectionId === sectionId);
    if (!section || !donorSection) continue;
    section.roles = {
      ...section.roles,
      harmony: donorSection.roles.harmony,
      color: donorSection.roles.color,
    };
    section.enabled = {
      ...section.enabled,
      harmony: donorSection.enabled.harmony,
      color: context.distance >= 4 && context.random() < 0.3 ? !section.enabled.color : donorSection.enabled.color,
    };
    changed += 1;
  }
  next.styleId = donor.styleId;
  next.styleName = donor.styleName;
  return { candidate: next, changed };
}

export function createArrangementDivergenceSeed(source, { styleId = 'jpop-band' } = {}) {
  return buildArrangementCandidate(source, { styleId, variant: 1 });
}

export function arrangementDivergenceTransform(seedCandidate, context, { source } = {}) {
  if (!source) throw new Error('Arrangement Labの元曲が必要です。');
  let candidate = clone(seedCandidate);
  const donor = donorFor(source, context);
  const sectionIds = selectedSectionIds(candidate, context);
  const changedAxes = [];
  const details = [];

  // Arrangement Labでは主旋律そのものは生成・変形しない。主旋律は常にSourceを参照する。
  if (!context.locks.harmony) {
    const result = applyHarmony(candidate, source, sectionIds, context);
    candidate = result.candidate;
    if (result.changed) {
      changedAxes.push('harmony');
      details.push(`Reharm ${result.changed} Section${result.label ? `（${result.label}）` : ''}`);
    }
  }

  if (!context.locks.counterMelody) {
    const result = applyCounter(candidate, donor, sectionIds, context);
    candidate = result.candidate;
    if (result.changed) {
      changedAxes.push('counterMelody');
      details.push(`裏メロ役割 ${result.changed} Section`);
    }
  }

  if (!context.locks.rhythm) {
    const result = applyRhythm(candidate, donor, sectionIds, context);
    candidate = result.candidate;
    if (result.changed) {
      changedAxes.push('rhythm');
      details.push(`Density / Drums ${result.changed} Section`);
    }
  }

  if (!context.locks.sound) {
    const result = applyInstrumentation(candidate, donor, sectionIds, context);
    candidate = result.candidate;
    if (result.changed) {
      changedAxes.push('sound');
      details.push(`Instrumentation ${donor.styleName}`);
    }
  }

  candidate.id = `div-${context.seedValue}`;
  candidate.label = `Divergence ${context.branchRound}-${context.slot + 1}`;
  candidate.description = details.length
    ? `Seedから${context.distance}/5の距離で変形。${details.join(' / ')}`
    : 'Lock条件により変更できる編曲要素がありませんでした。';
  candidate.sourceCandidateIds = [seedCandidate.id].filter(Boolean);

  return {
    payload: candidate,
    changedAxes,
    meta: {
      summary: candidate.description,
      sectionIds,
      donorStyle: donor.styleName,
    },
  };
}
