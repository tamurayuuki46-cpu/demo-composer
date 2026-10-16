// 収束モード: 補助状態(純関数)。localStorageには触れない(store.js参照)。
// 判断状態: 未判断(エントリなし) / adopted / hold(まだ迷う) / rejected。「空」状態は存在しない。
// 「DAWで決める」は判断状態ではなく carryOver(別Flag)。
import { FINGERPRINT_VERSION, ELEMENTS } from './fingerprint.js';

export const STORAGE_SCHEMA_VERSION = 1;
export const STATUSES = ['adopted', 'hold', 'rejected'];
export const RECOVERY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export const GLOBAL_KEY = 'global';
export const sectionKey = (sectionId) => `section:${sectionId}`;
export const elementKey = (sectionId, element) => `element:${sectionId}:${element}`;
export function parseSlotKey(key) {
  if (key === GLOBAL_KEY) return { level: 'global' };
  if (key.startsWith('section:')) return { level: 'section', sectionId: key.slice(8) };
  if (key.startsWith('element:')) {
    const rest = key.slice(8); const i = rest.lastIndexOf(':');
    return { level: 'element', sectionId: rest.slice(0, i), element: rest.slice(i + 1) };
  }
  throw new Error(`不正なslot keyです: ${key}`);
}
const clone = (v) => JSON.parse(JSON.stringify(v));

export function createEmptyState({ projectId, planId, planFingerprint }) {
  return {
    storageSchemaVersion: STORAGE_SCHEMA_VERSION, fingerprintVersion: FINGERPRINT_VERSION,
    projectId: String(projectId), planId: String(planId), planFingerprint: planFingerprint || null,
    slots: {}, invalidGlobalSections: [], carryOver: {}, recovery: {}, updatedAt: null,
  };
}

function touch(next, now) { next.updatedAt = now ?? null; return next; }
function slotOf(next, key) { return (next.slots[key] ||= { decisions: {} }); }

// fingerprint: 全体=SectionID->fpのmap、他=文字列。adoptedでは必須。
export function setDecision(state, key, candidateId, status, { fingerprint, reasons = [], now = null } = {}) {
  if (!STATUSES.includes(status)) throw new Error(`不正な判断状態: ${status}`);
  const info = parseSlotKey(key);
  if (info.level === 'element' && !ELEMENTS.includes(info.element)) throw new Error(`未対応の要素: ${info.element}`);
  if (status === 'adopted' && !fingerprint) throw new Error('採用にはfingerprintが必要です。');
  const next = clone(state); const slot = slotOf(next, key);
  if (status === 'adopted') {
    // 別案の採用は「未判断」へ戻すだけ。自動不採用にはしない。
    for (const [id, d] of Object.entries(slot.decisions)) if (id !== candidateId && d.status === 'adopted') delete slot.decisions[id];
  }
  slot.decisions[candidateId] = { status, fingerprint: fingerprint ?? slot.decisions[candidateId]?.fingerprint ?? null, reasons: [...reasons], updatedAt: now };
  if (status === 'adopted' || status === 'rejected') delete next.carryOver[key]; // 二重状態にしない
  if (key === GLOBAL_KEY && status === 'adopted') next.invalidGlobalSections = [];
  // 同じ枠で新しい判断をしたら、その枠のRecoveryは役目を終える。
  delete next.recovery[key];
  if (key === GLOBAL_KEY) for (const rk of Object.keys(next.recovery)) if (rk.startsWith('global:')) delete next.recovery[rk];
  return touch(next, now);
}

// その案を未判断へ戻す(履歴はJournal側。案自体は消さない)。
export function clearDecision(state, key, candidateId, now = null) {
  const next = clone(state); const slot = next.slots[key];
  if (slot) delete slot.decisions[candidateId];
  return touch(next, now);
}

// 上書き解除 = 採用を外して上位判断の継承へ戻る。hold/rejectedは残す。
export function releaseOverride(state, key, now = null) {
  if (key === GLOBAL_KEY) throw new Error('全体ベースは上書き解除の対象ではありません。');
  const next = clone(state); const slot = next.slots[key];
  if (slot) for (const [id, d] of Object.entries(slot.decisions)) if (d.status === 'adopted') delete slot.decisions[id];
  return touch(next, now);
}

export function setCarryOver(state, key, { note = '', now = null } = {}) {
  parseSlotKey(key);
  const next = clone(state); next.carryOver[key] = { note, at: now };
  return touch(next, now);
}
export function clearCarryOver(state, key, now = null) { const next = clone(state); delete next.carryOver[key]; return touch(next, now); }

export function getAdopted(state, key) {
  const slot = state.slots[key];
  if (!slot) return null;
  for (const [candidateId, d] of Object.entries(slot.decisions)) if (d.status === 'adopted') return { candidateId, fingerprint: d.fingerprint, reasons: d.reasons || [] };
  return null;
}
export function getStatus(state, key, candidateId) { return state.slots[key]?.decisions?.[candidateId]?.status ?? 'undecided'; }
export function hasHold(state, key) { return Object.values(state.slots[key]?.decisions || {}).some((d) => d.status === 'hold'); }

// 未決定 = (a) 同じ枠に採用がない保留、(b) どの階層でも採用案が決まっていないSection。
// 継承された未判断・採用済み・「DAWで決める」済みは数えない。
export function computeUnresolved(state, source) {
  const items = [];
  const globalAdopted = getAdopted(state, GLOBAL_KEY);
  const invalid = new Set(state.invalidGlobalSections || []);
  const consider = (key, kind, sectionId, element = null) => {
    if (state.carryOver[key]) return;
    items.push({ key, kind, sectionId, element });
  };
  if (hasHold(state, GLOBAL_KEY) && !globalAdopted) consider(GLOBAL_KEY, 'hold', null);
  for (const s of source.sections) {
    const sKey = sectionKey(s.id);
    const covered = getAdopted(state, sKey) || (globalAdopted && !invalid.has(s.id));
    if (!covered) {
      if (!state.carryOver[sKey] && !state.carryOver[GLOBAL_KEY]) items.push({ key: sKey, kind: 'no-base', sectionId: s.id, element: null });
    }
    if (hasHold(state, sKey) && !getAdopted(state, sKey)) consider(sKey, 'hold', s.id);
    for (const el of ELEMENTS) {
      const eKey = elementKey(s.id, el);
      if (hasHold(state, eKey) && !getAdopted(state, eKey)) consider(eKey, 'hold', s.id, el);
    }
  }
  return items;
}

export function carryOverList(state) {
  return Object.entries(state.carryOver || {}).map(([key, v]) => ({ key, ...parseSlotKey(key), note: v.note || '', at: v.at }));
}
