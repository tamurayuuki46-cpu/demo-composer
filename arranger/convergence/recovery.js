// 収束モード: 外部変更・候補消失の検出とRecovery(純関数)。
// 判断は黙って適用しない。fingerprintが合わない判断は「未決定」へ戻し、7日間Recoveryとして保持する。
import { createEmptyState, GLOBAL_KEY, RECOVERY_RETENTION_MS, parseSlotKey, setDecision, getAdopted } from './state.js';
import { slotFingerprint, globalFingerprintMap } from './fingerprint.js';

const clone = (v) => JSON.parse(JSON.stringify(v));
export const globalRecoveryKey = (sectionId) => `global:${sectionId}`;

function stash(next, recKey, prior, reason, now) {
  if (next.recovery[recKey]) return; // 二重無効化で元の判断を上書きしない
  next.recovery[recKey] = { prior, reason, createdAt: now, expiresAt: (now ?? 0) + RECOVERY_RETENTION_MS };
}

// reason: 'candidate-missing' | 'external-change' | 'section-missing'
export function verifyState(state, { source, candidates, now = null }) {
  const next = clone(state); const byId = new Map(candidates.map((c) => [c.id, c]));
  const sectionIds = new Set(source.sections.map((s) => s.id));
  const notices = [];
  for (const [key, slot] of Object.entries(next.slots)) {
    const entry = Object.entries(slot.decisions).find(([, d]) => d.status === 'adopted');
    if (!entry) continue;
    const [candidateId, d] = entry; const info = parseSlotKey(key); const candidate = byId.get(candidateId);
    if (info.level === 'global') {
      const current = candidate ? globalFingerprintMap(source, candidate) : null;
      const saved = d.fingerprint || {};
      for (const sid of sectionIds) {
        if (next.invalidGlobalSections.includes(sid)) continue;
        const reason = !candidate ? 'candidate-missing' : saved[sid] !== current[sid] ? 'external-change' : null;
        if (!reason) continue;
        next.invalidGlobalSections.push(sid);
        stash(next, globalRecoveryKey(sid), { candidateId, fingerprint: saved[sid] ?? null, reasons: d.reasons || [] }, reason, now);
        notices.push({ key: globalRecoveryKey(sid), reason });
      }
      continue;
    }
    let reason = null;
    if (!sectionIds.has(info.sectionId)) reason = 'section-missing';
    else if (!candidate) reason = 'candidate-missing';
    else if (slotFingerprint(source, candidate, info.sectionId, info.element || null) !== d.fingerprint) reason = 'external-change';
    if (!reason) continue;
    stash(next, key, { candidateId, fingerprint: d.fingerprint, reasons: d.reasons || [] }, reason, now);
    delete slot.decisions[candidateId];
    notices.push({ key, reason });
  }
  next.updatedAt = now;
  return { state: next, notices, changed: notices.length > 0, message: notices.length ? '一部の判断を引き継げませんでした' : null };
}

export function purgeExpiredRecovery(state, now) {
  const next = clone(state);
  for (const [k, r] of Object.entries(next.recovery)) if (r.expiresAt <= now) delete next.recovery[k];
  return next;
}

// 「元の判断のまま採用」: 現在の内容にfingerprintを張り直して採用に戻す。
export function restoreRecovery(state, recKey, { source, candidates, now = null }) {
  const rec = state.recovery[recKey];
  if (!rec) return { ok: false, state, error: 'not-found' };
  if (rec.expiresAt <= (now ?? 0) && now !== null) return { ok: false, state, error: 'expired' };
  const candidate = candidates.find((c) => c.id === rec.prior.candidateId);
  if (!candidate) return { ok: false, state, error: 'candidate-missing' };
  let next;
  if (recKey.startsWith('global:')) {
    const sid = recKey.slice(7);
    next = clone(state);
    const g = getAdopted(next, GLOBAL_KEY);
    if (!g || g.candidateId !== candidate.id) return { ok: false, state, error: 'global-changed' };
    const entry = next.slots[GLOBAL_KEY].decisions[candidate.id];
    entry.fingerprint = { ...(entry.fingerprint || {}), [sid]: globalFingerprintMap(source, candidate)[sid] };
    next.invalidGlobalSections = next.invalidGlobalSections.filter((x) => x !== sid);
    delete next.recovery[recKey];
  } else {
    const info = parseSlotKey(recKey);
    const fp = slotFingerprint(source, candidate, info.sectionId, info.element || null);
    next = setDecision(state, recKey, candidate.id, 'adopted', { fingerprint: fp, reasons: rec.prior.reasons, now });
  }
  next.updatedAt = now;
  return { ok: true, state: next, journalText: `【収束】元の判断のまま採用（${recKey} / ${candidate.id}）` };
}

// Plan構造(Section ID・順序・境界・拍子)が変わったら、旧状態を退避して空の状態で開き直す。
export function checkPlanFingerprint(state, { projectId, planId, planFingerprint, now = null }) {
  if (!state.planFingerprint) { const next = clone(state); next.planFingerprint = planFingerprint; return { state: next, structureChanged: false, backup: null }; }
  if (state.planFingerprint === planFingerprint) return { state, structureChanged: false, backup: null };
  const backup = { payload: clone(state), createdAt: now, expiresAt: (now ?? 0) + RECOVERY_RETENTION_MS };
  return { state: createEmptyState({ projectId, planId, planFingerprint }), structureChanged: true, backup };
}
