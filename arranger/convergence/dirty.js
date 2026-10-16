// 収束モード: dirty追跡(純関数)。
// 方針: Lab内の編集は「共通入口」で 編集前後のfingerprint を比較し、変わった判断枠だけを dirty に記録する。
//       呼び出し側が「どこを変えた」と宣言する方式は使わない。
//       保存時は記録済みdirtyの枠だけfingerprintを更新し、dirtyでない不一致は外部変更として Recovery へ回す。
import { slotFingerprint, globalFingerprintMap } from './fingerprint.js';
import { GLOBAL_KEY, parseSlotKey, getAdopted } from './state.js';
import { verifyState, globalRecoveryKey } from './recovery.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

export function createDirtyTracker() { return { dirty: {} }; }
export const isDirty = (tracker, key) => Boolean(tracker.dirty[key]);
export const dirtyKeys = (tracker) => Object.keys(tracker.dirty);
// 全体判断はSection単位で追跡する(キー = `global:<sectionId>`)。
export const dirtyKeyForGlobal = (sectionId) => globalRecoveryKey(sectionId);

// 共通入口: 編集した候補の編集前後を渡す。候補IDは編集で変わらない前提(契約)。
// 判断が参照している(採用中の)枠のうち、fingerprintが変わったものを dirty に記録して新trackerを返す。
export function recordEdit(tracker, state, { source, before, after }) {
  if (!before || !after || before.id !== after.id) throw new Error('編集前後の候補IDが一致しません。');
  const next = clone(tracker);
  for (const [key, slot] of Object.entries(state.slots)) {
    const adopted = getAdopted(state, key);
    if (!adopted || adopted.candidateId !== after.id) continue;
    const info = parseSlotKey(key);
    if (info.level === 'global') {
      const b = globalFingerprintMap(source, before), a = globalFingerprintMap(source, after);
      for (const sid of Object.keys(a)) if (a[sid] !== b[sid]) next.dirty[dirtyKeyForGlobal(sid)] = true;
    } else if (!source.sections.some((s) => s.id === info.sectionId)) continue;
    else if (slotFingerprint(source, before, info.sectionId, info.element || null) !== slotFingerprint(source, after, info.sectionId, info.element || null)) next.dirty[key] = true;
  }
  return next;
}

// 保存時: dirtyの枠だけfingerprintを現在値へ更新 → 残りの不一致は外部変更(verifyState)。
// 純関数。呼び出し側は保存成功後にだけ result.state / result.tracker を採用する(失敗時は旧tracker・旧stateを保持)。
export function applySave(state, tracker, { source, candidates, now = null }) {
  const next = clone(state); const byId = new Map(candidates.map((c) => [c.id, c]));
  const refreshed = [];
  for (const key of dirtyKeys(tracker)) {
    if (key.startsWith('global:')) {
      const sid = key.slice(7); const g = getAdopted(next, GLOBAL_KEY); const c = g && byId.get(g.candidateId);
      if (!c || !source.sections.some((s) => s.id === sid)) continue;
      const entry = next.slots[GLOBAL_KEY].decisions[g.candidateId];
      entry.fingerprint = { ...(entry.fingerprint || {}), [sid]: globalFingerprintMap(source, c)[sid] };
      refreshed.push(key);
      continue;
    }
    const adopted = getAdopted(next, key); const c = adopted && byId.get(adopted.candidateId); const info = parseSlotKey(key);
    if (!c || !source.sections.some((s) => s.id === info.sectionId)) continue;
    next.slots[key].decisions[adopted.candidateId].fingerprint = slotFingerprint(source, c, info.sectionId, info.element || null);
    refreshed.push(key);
  }
  next.updatedAt = now;
  const verified = verifyState(next, { source, candidates, now });
  return { state: verified.state, tracker: createDirtyTracker(), refreshed, externalChanges: verified.notices, message: verified.message };
}
