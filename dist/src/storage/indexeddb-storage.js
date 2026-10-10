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

export async function loadActiveProject() {
  const database = await openDatabase();

  try {
    const metaTransaction = database.transaction(META_STORE, "readonly");
    const activeEntry = await requestToPromise(
      metaTransaction.objectStore(META_STORE).get(ACTIVE_PROJECT_KEY)
    );

    if (!activeEntry?.value) {
      return null;
    }

    const projectTransaction = database.transaction(PROJECT_STORE, "readonly");
    const project = await requestToPromise(
      projectTransaction.objectStore(PROJECT_STORE).get(activeEntry.value)
    );

    return project ?? null;
  } finally {
    database.close();
  }
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
