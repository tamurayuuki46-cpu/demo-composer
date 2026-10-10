import { createDefaultProject } from "../core/project-state.js";
import { saveProject } from "../storage/indexeddb-storage.js";

export const NEW_PROJECT_REQUEST_KEY = "demo-composer:new-project-request";
export const NEW_PROJECT_ERROR_KEY = "demo-composer:new-project-error";

function defaultSessionStorage() {
  return globalThis.sessionStorage ?? null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function queueNewProject({ storage = defaultSessionStorage(), createProject = createDefaultProject } = {}) {
  if (!storage) throw new Error("このブラウザでは新規Projectの切替を準備できません。");
  const project = createProject();
  storage.setItem(NEW_PROJECT_REQUEST_KEY, JSON.stringify(project));
  return project;
}

export function clearNewProjectRequest(storage = defaultSessionStorage()) {
  storage?.removeItem(NEW_PROJECT_REQUEST_KEY);
}

export function takeNewProjectError(storage = defaultSessionStorage()) {
  if (!storage) return "";
  const message = storage.getItem(NEW_PROJECT_ERROR_KEY) ?? "";
  storage.removeItem(NEW_PROJECT_ERROR_KEY);
  return message;
}

export function rememberNewProjectError(message, storage = defaultSessionStorage()) {
  if (!storage) return;
  storage.setItem(NEW_PROJECT_ERROR_KEY, String(message || "新規Projectを作成できませんでした。"));
}

export async function completePendingNewProject({
  storage = defaultSessionStorage(),
  save = saveProject,
  wait = sleep
} = {}) {
  if (!storage) return false;
  const raw = storage.getItem(NEW_PROJECT_REQUEST_KEY);
  if (!raw) return false;

  let project;
  try {
    project = JSON.parse(raw);
  } catch {
    storage.removeItem(NEW_PROJECT_REQUEST_KEY);
    throw new Error("新規Projectの準備データが壊れていたため、切替を中止しました。");
  }

  // Reload直前のvisibilitychangeで旧ProjectのAutoSaveが走る場合がある。
  // 旧ページ側のIndexedDB書き込みが落ち着いてから新ProjectをActiveにし、
  // 念のため短い間隔を置いてもう一度同じProjectを保存してActiveを確定する。
  await wait(180);
  await save(project);
  await wait(80);
  await save(project);
  storage.removeItem(NEW_PROJECT_REQUEST_KEY);
  return true;
}
