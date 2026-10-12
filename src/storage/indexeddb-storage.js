import { duplicateProjectRecord, sortProjectRecords } from "./project-records.js";

const DB_NAME = "demo-composer";
const DB_VERSION = 1;
const PROJECT_STORE = "projects";
const META_STORE = "meta";
const ACTIVE_PROJECT_KEY = "activeProjectId";

function assertIndexedDb() {
  if (!("indexedDB" in globalThis)) {
    throw new Error("このブラウザではIndexedDBを利用できません。");
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
  });
}

function openDatabase() {
  assertIndexedDb();

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDBを開けませんでした。"));
  });
}

export async function saveProject(project) {
  const database = await openDatabase();

  try {
    const transaction = database.transaction([PROJECT_STORE, META_STORE], "readwrite");
    transaction.objectStore(PROJECT_STORE).put(project);
    transaction.objectStore(META_STORE).put({ key: ACTIVE_PROJECT_KEY, value: project.id });
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

export async function backupProjectForMigration(project) {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(META_STORE, "readwrite");
    const backupKey = `migrationBackup:${project.id}:schema${project.schemaVersion}`;
    transaction.objectStore(META_STORE).put({
      key: backupKey,
      value: project
    });
    await transactionToPromise(transaction);
    return backupKey;
  } finally {
    database.close();
  }
}

export async function getActiveProjectId() {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(META_STORE, "readonly");
    const entry = await requestToPromise(transaction.objectStore(META_STORE).get(ACTIVE_PROJECT_KEY));
    return typeof entry?.value === "string" ? entry.value : "";
  } finally {
    database.close();
  }
}

export async function loadProjectById(projectId) {
  if (typeof projectId !== "string" || !projectId) return null;
  const database = await openDatabase();

  try {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const project = await requestToPromise(transaction.objectStore(PROJECT_STORE).get(projectId));
    return project ?? null;
  } finally {
    database.close();
  }
}

export async function listProjects() {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const projects = await requestToPromise(transaction.objectStore(PROJECT_STORE).getAll());
    const activeProjectId = await getActiveProjectId();
    return sortProjectRecords(projects ?? [], activeProjectId);
  } finally {
    database.close();
  }
}

export async function setActiveProjectId(projectId) {
  const project = await loadProjectById(projectId);
  if (!project) throw new Error("開こうとしたProjectが端末内に見つかりません。");

  const database = await openDatabase();
  try {
    const transaction = database.transaction(META_STORE, "readwrite");
    transaction.objectStore(META_STORE).put({ key: ACTIVE_PROJECT_KEY, value: projectId });
    await transactionToPromise(transaction);
    return project;
  } finally {
    database.close();
  }
}

export async function duplicateStoredProject(projectId) {
  const source = await loadProjectById(projectId);
  if (!source) throw new Error("複製するProjectが端末内に見つかりません。");
  const duplicated = duplicateProjectRecord(source);

  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    transaction.objectStore(PROJECT_STORE).add(duplicated);
    await transactionToPromise(transaction);
    return duplicated;
  } finally {
    database.close();
  }
}

export async function deleteStoredProject(projectId) {
  const activeProjectId = await getActiveProjectId();
  if (projectId === activeProjectId) {
    throw new Error("現在開いているProjectは削除できません。別のProjectを開いてから削除してください。");
  }

  const project = await loadProjectById(projectId);
  if (!project) return false;

  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    transaction.objectStore(PROJECT_STORE).delete(projectId);
    await transactionToPromise(transaction);
    return true;
  } finally {
    database.close();
  }
}

export async function loadActiveProject() {
  const activeProjectId = await getActiveProjectId();
  return activeProjectId ? loadProjectById(activeProjectId) : null;
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
