import { setActiveProjectId } from "../storage/indexeddb-storage.js";

export const PROJECT_SWITCH_REQUEST_KEY = "demo-composer:project-switch-request";
export const PROJECT_SWITCH_ERROR_KEY = "demo-composer:project-switch-error";

function defaultSessionStorage() {
  return globalThis.sessionStorage ?? null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function queueProjectSwitch(projectId, storage = defaultSessionStorage()) {
  if (!storage) throw new Error("このブラウザではProject切替を準備できません。");
  if (typeof projectId !== "string" || !projectId) throw new Error("開くProjectを選べませんでした。");
  storage.setItem(PROJECT_SWITCH_REQUEST_KEY, projectId);
  return projectId;
}

export function clearProjectSwitchRequest(storage = defaultSessionStorage()) {
  storage?.removeItem(PROJECT_SWITCH_REQUEST_KEY);
}

export function rememberProjectSwitchError(message, storage = defaultSessionStorage()) {
  if (!storage) return;
  storage.setItem(PROJECT_SWITCH_ERROR_KEY, String(message || "Projectを切り替えられませんでした。"));
}

export function takeProjectSwitchError(storage = defaultSessionStorage()) {
  if (!storage) return "";
  const message = storage.getItem(PROJECT_SWITCH_ERROR_KEY) ?? "";
  storage.removeItem(PROJECT_SWITCH_ERROR_KEY);
  return message;
}

export async function completePendingProjectSwitch({
  storage = defaultSessionStorage(),
  activate = setActiveProjectId,
  wait = sleep
} = {}) {
  if (!storage) return false;
  const projectId = storage.getItem(PROJECT_SWITCH_REQUEST_KEY);
  if (!projectId) return false;

  // Reload直前に旧Projectのvisibility AutoSaveが走るとactiveProjectIdが旧IDへ戻る。
  // 書き込みが落ち着いた後で対象IDを再指定し、boot前にActive Projectを確定する。
  await wait(180);
  await activate(projectId);
  await wait(80);
  await activate(projectId);
  storage.removeItem(PROJECT_SWITCH_REQUEST_KEY);
  return projectId;
}
