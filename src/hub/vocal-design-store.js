import { loadActiveProject, saveProject } from '../storage/indexeddb-storage.js';
import { normalizeVocalDesign } from './vocal-design.js';

export const PENDING_VOCAL_DESIGN_KEY = 'demo-composer:pending-vocal-design-v1';

function defaultStorage() {
  return globalThis.localStorage ?? null;
}

export function queuePendingVocalDesign({ projectId, vocal }, storage = defaultStorage()) {
  if (!storage) throw new Error('このブラウザではVocal設計を一時保存できません。');
  if (!projectId) throw new Error('Project IDを確認できません。');
  const payload = {
    schemaVersion: 1,
    projectId: String(projectId),
    vocal: normalizeVocalDesign(vocal),
    queuedAt: new Date().toISOString(),
  };
  storage.setItem(PENDING_VOCAL_DESIGN_KEY, JSON.stringify(payload));
  return payload;
}

export function peekPendingVocalDesign(storage = defaultStorage()) {
  if (!storage) return null;
  const raw = storage.getItem(PENDING_VOCAL_DESIGN_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.projectId) return null;
    return {
      schemaVersion: 1,
      projectId: String(value.projectId),
      vocal: normalizeVocalDesign(value.vocal),
      queuedAt: String(value.queuedAt || ''),
    };
  } catch {
    return null;
  }
}

export function clearPendingVocalDesign(storage = defaultStorage()) {
  storage?.removeItem(PENDING_VOCAL_DESIGN_KEY);
}

export async function applyPendingVocalDesign({
  storage = defaultStorage(),
  load = loadActiveProject,
  save = saveProject,
} = {}) {
  const pending = peekPendingVocalDesign(storage);
  if (!pending) return false;

  const active = await load();
  if (!active || active.id !== pending.projectId) return false;

  const next = typeof structuredClone === 'function'
    ? structuredClone(active)
    : JSON.parse(JSON.stringify(active));
  next.metadata = {
    ...(next.metadata || {}),
    vocal: normalizeVocalDesign(pending.vocal),
  };
  next.revision = Number.isInteger(next.revision) ? next.revision + 1 : 1;
  await save(next);
  clearPendingVocalDesign(storage);
  return true;
}
