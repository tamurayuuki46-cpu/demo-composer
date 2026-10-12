import { setActiveProjectId } from "../storage/indexeddb-storage.js";

export const PROJECT_OPEN_REQUEST_KEY = "demo-composer:project-open-request";
export const PROJECT_OPEN_ERROR_KEY = "demo-composer:project-open-error";

function defaultSessionStorage() {
  return globalThis.sessionStorage ?? null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function queueProjectOpen(projectId, storage = defaultSessionStorage()) {
  if (!storage) throw new Error("このブラウザではProject切替を準備できません。");
  if (!projectId) throw new Error("開くProjectを指定してください。");
  storage.setItem(PROJECT_OPEN_REQUEST_KEY, String(projectId));
  return projectId;
}

export function clearProjectOpenRequest(storage = defaultSessionStorage()) {
  storage?.removeItem(PROJECT_OPEN_REQUEST_KEY);
}

export function takeProjectOpenError(storage = defaultSessionStorage()) {
  if (!storage) return "";
  const message = storage.getItem(PROJECT_OPEN_ERROR_KEY) ?? "";
  storage.removeItem(PROJECT_OPEN_ERROR_KEY);
  return message;
}

export function rememberProjectOpenError(message, storage = defaultSessionStorage()) {
  if (!storage) return;
  storage.setItem(PROJECT_OPEN_ERROR_KEY, String(message || "Projectを開けませんでした。"));
}

export async function completePendingProjectOpen({
  storage = defaultSessionStorage(),
  setActive = setActiveProjectId,
  wait = sleep
} = {}) {
  if (!storage) return false;
  const projectId = storage.getItem(PROJECT_OPEN_REQUEST_KEY);
  if (!projectId) return false;

  // Reload直前のvisibilitychange AutoSaveが旧Projectを再びActiveにする可能性があるため、
  // 旧ページ側の書き込みが落ち着いてからActive IDを2回確定する。
  await wait(180);
  await setActive(projectId);
  await wait(80);
  await setActive(projectId);
  storage.removeItem(PROJECT_OPEN_REQUEST_KEY);
  return true;
}
