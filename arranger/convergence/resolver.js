// 収束モード: Current Plan resolver(純関数)。
// 個別 > Section > 全体 を解決し、1つのmaterialized Candidateを作る。
// このCandidateを Preview / Song.mid / DAW Handoff / export用plan clone に共通で渡す。
// 判断の参照先にはならない(IDは current-plan-<hash>)。source.sections が時間境界の正本。
import { hashOf } from './canonical.js';
import { globalFingerprint } from './fingerprint.js';
import { ELEMENTS } from './fingerprint.js';
import { GLOBAL_KEY, sectionKey, elementKey, getAdopted, computeUnresolved } from './state.js';

export const CURRENT_PLAN_LABEL = 'Current Planから合成';

// 個別上書き時に「別案から取り込む」Sectionプランのfield
const ELEMENT_FIELDS = {
  drums: { enabled: ['drums'], roles: ['drums'], partOverrides: ['drums'], top: [] },
  counter: { enabled: ['counter'], roles: ['counter'], partOverrides: ['counter'], top: ['counterArrangement', 'restPolicy', 'leadRole'] },
};
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function applyElement(target, from, element) {
  const f = ELEMENT_FIELDS[element];
  for (const group of ['enabled', 'roles', 'partOverrides']) {
    for (const k of f[group]) {
      if (from[group] && k in from[group]) { target[group] ||= {}; target[group][k] = clone(from[group][k]); }
      else if (target[group]) delete target[group][k];
    }
    if (target[group] && Object.keys(target[group]).length === 0 && group === 'partOverrides') delete target[group];
  }
  for (const k of f.top) { if (k in from) target[k] = clone(from[k]); else delete target[k]; }
}

function shortLabel(candidate) { return String(candidate.label || candidate.id).split(/[:：]/)[0].trim(); }

export function resolveCurrentPlan(source, candidates, state, { defaultCandidateId = null } = {}) {
  if (!candidates?.length) throw new Error('候補がありません。');
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const fallback = byId.get(defaultCandidateId) || byId.get(candidates[1]?.id) || candidates[0];
  const globalAdopted = getAdopted(state, GLOBAL_KEY);
  const globalCandidate = globalAdopted ? byId.get(globalAdopted.candidateId) : null;
  const invalid = new Set(state.invalidGlobalSections || []);
  const planOf = (candidate, sectionId) => {
    const sp = candidate.sections.find((x) => x.sectionId === sectionId);
    if (!sp) throw new Error(`候補 ${candidate.id} に Section ${sectionId} がありません。`);
    return sp;
  };
  let tentative = false;
  const provenance = [];
  const sections = source.sections.map((s) => {
    const secAdopted = getAdopted(state, sectionKey(s.id));
    const secCandidate = secAdopted ? byId.get(secAdopted.candidateId) : null;
    let base, origin;
    if (secCandidate) { base = secCandidate; origin = 'section'; }
    else if (globalCandidate && !invalid.has(s.id)) { base = globalCandidate; origin = 'global'; }
    else { base = fallback; origin = 'default'; tentative = true; }
    const basePlan = planOf(base, s.id);
    if (basePlan.bars !== s.bars) throw new Error(`Section ${s.id} の小節数が候補と一致しません(source:${s.bars} / 候補:${basePlan.bars})。`);
    const out = clone(basePlan);
    out.bars = s.bars;
    const elements = {};
    for (const element of ELEMENTS) {
      const adopted = getAdopted(state, elementKey(s.id, element));
      const c = adopted ? byId.get(adopted.candidateId) : null;
      if (c) {
        const p = planOf(c, s.id);
        if (p.bars !== s.bars) throw new Error(`Section ${s.id} の小節数が候補と一致しません(source:${s.bars} / 候補:${p.bars})。`);
        applyElement(out, p, element);
        elements[element] = { origin: 'element', candidateId: c.id };
      } else elements[element] = { origin, candidateId: base.id };
    }
    provenance.push({ sectionId: s.id, base: { origin, candidateId: base.id }, elements });
    return out;
  });
  const candidate = {
    id: 'pending', label: CURRENT_PLAN_LABEL, styleId: fallback.styleId, styleName: fallback.styleName,
    description: '収束判断(全体 / Section / 個別)から合成した現在案。', sourceCandidateIds: [...new Set(provenance.flatMap((p) => [p.base.candidateId, ...Object.values(p.elements).map((e) => e.candidateId)]))],
    sections,
  };
  candidate.id = `current-plan-${hashOf({ notes: globalFingerprint(source, candidate), sections })}`;
  return {
    candidate, provenance, tentative,
    tentativeLabel: tentative ? `仮:${shortLabel(fallback)}（未決定）` : null,
    unresolved: computeUnresolved(state, source),
  };
}
