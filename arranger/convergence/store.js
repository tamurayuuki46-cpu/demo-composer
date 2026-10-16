// 収束モード: localStorage入出力。storage は Web Storage互換(getItem/setItem/removeItem/key/length)を注入する。
// 壊れたJSONは別キーへ退避し、上書きしない。既定案を黙って採用済みにもしない。
import { STORAGE_SCHEMA_VERSION, RECOVERY_RETENTION_MS } from './state.js';

export const KEY_PREFIX = 'demo-composer-arranger-convergence-v1';
export const JOURNAL_PREFIX = '【収束】';
export const stateKey = ({ projectId, planId }) => `${KEY_PREFIX}:${projectId}:${planId}`;
const backupPrefix = (ids) => `${stateKey(ids)}:structure-backup:`;

function freeKey(storage, base) {
  let key = base, i = 1;
  while (storage.getItem(key) !== null) key = `${base}-${i++}`;
  return key;
}

// -> { status: 'ok'|'missing'|'corrupt'|'unsupported', state?, quarantineKey? }
export function loadState(storage, ids, now = Date.now()) {
  const key = stateKey(ids);
  let raw;
  try { raw = storage.getItem(key); } catch (e) { return { status: 'unavailable', error: String(e) }; }
  if (raw === null || raw === undefined) return { status: 'missing' };
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  const valid = parsed && typeof parsed === 'object' && parsed.slots && typeof parsed.slots === 'object'
    && parsed.recovery && parsed.carryOver && Array.isArray(parsed.invalidGlobalSections)
    && String(parsed.projectId) === String(ids.projectId) && String(parsed.planId) === String(ids.planId);
  if (parsed && typeof parsed === 'object' && parsed.storageSchemaVersion > STORAGE_SCHEMA_VERSION) return { status: 'unsupported' }; // 触らない
  if (!valid || parsed.storageSchemaVersion !== STORAGE_SCHEMA_VERSION) {
    const qKey = freeKey(storage, `${key}:corrupt:${now}`);
    try { storage.setItem(qKey, raw); storage.removeItem(key); } catch (e) { return { status: 'corrupt', error: String(e) }; }
    return { status: 'corrupt', quarantineKey: qKey };
  }
  return { status: 'ok', state: parsed };
}

// 失敗時は {ok:false}。呼び出し側はdirtyを保持し、補助状態をロールバックする。
export function saveState(storage, state) {
  const key = stateKey(state);
  const text = JSON.stringify(state);
  try {
    storage.setItem(key, text);
    if (storage.getItem(key) !== text) return { ok: false, error: 'readback-mismatch' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export function writeStructureBackup(storage, ids, backup) {
  const key = freeKey(storage, `${backupPrefix(ids)}${backup.createdAt}`);
  try { storage.setItem(key, JSON.stringify(backup)); return { ok: true, key }; } catch (e) { return { ok: false, error: String(e) }; }
}
function backupKeys(storage, ids) {
  const out = []; const prefix = backupPrefix(ids);
  for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && k.startsWith(prefix)) out.push(k); }
  return out;
}
export function purgeExpiredBackups(storage, ids, now) {
  for (const k of backupKeys(storage, ids)) {
    try { const b = JSON.parse(storage.getItem(k)); if (!b || b.expiresAt <= now) storage.removeItem(k); } catch { storage.removeItem(k); }
  }
}
// 構造が元に戻ったときに、旧状態をRecovery通知で提案するための検索。最新のものを返す。
export function findStructureBackup(storage, ids, planFingerprint, now) {
  let best = null;
  for (const k of backupKeys(storage, ids)) {
    try {
      const b = JSON.parse(storage.getItem(k));
      if (b && b.expiresAt > now && b.payload?.planFingerprint === planFingerprint && (!best || b.createdAt > best.backup.createdAt)) best = { key: k, backup: b };
    } catch { /* 壊れたbackupは無視 */ }
  }
  return best;
}

export function journalHasConvergenceEntry(journal) {
  const visit = (v, depth) => {
    if (depth > 3 || v == null) return false;
    if (typeof v === 'string') return v.startsWith(JOURNAL_PREFIX);
    if (Array.isArray(v)) return v.some((x) => visit(x, depth + 1));
    if (typeof v === 'object') return Object.values(v).some((x) => visit(x, depth + 1));
    return false;
  };
  return visit(journal, 0);
}

// 'ok' | 'fresh'(収束未開始) | 'warn-missing'(「収束判断が見つかりません」) | 'warn-corrupt' | 'unsupported' | 'unavailable'
export function diagnoseLoad(load, journal) {
  if (load.status === 'ok') return 'ok';
  if (load.status === 'unsupported' || load.status === 'unavailable') return load.status;
  const hadConvergence = journalHasConvergenceEntry(journal);
  if (load.status === 'corrupt') return 'warn-corrupt';
  return hadConvergence ? 'warn-missing' : 'fresh';
}
export { RECOVERY_RETENTION_MS };
