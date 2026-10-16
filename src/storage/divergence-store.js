// 発散セッションとKeepライブラリを端末内(IndexedDB)へ保存する。
// 旧実装のsessionStorageは「IndexedDBが使えない時の退避先」と「旧セッションの移行元」としてだけ使う。
// Project本体(projects store)には書かない。補助データは meta store の別キーに保存する。
import {
  deleteMetaEntry,
  loadMetaEntry,
  saveMetaEntry
} from "./indexeddb-storage.js";
import {
  legacySessionKey,
  libraryStoreKey,
  makeLibraryRecord,
  makeSessionRecord,
  parseLibraryRecord,
  parseSessionRecord,
  sessionStoreKey
} from "../core/divergence-library.js";

function defaultLegacyStorage() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error ?? "不明なエラー");
}

export function createDivergenceStore({
  meta = { load: loadMetaEntry, save: saveMetaEntry, remove: deleteMetaEntry },
  legacy = defaultLegacyStorage(),
  now = () => Date.now()
} = {}) {
  async function loadSession(project) {
    let error = "";
    try {
      const raw = await meta.load(sessionStoreKey(project.id, project.revision));
      const session = parseSessionRecord(raw, project);
      if (session) return { session, from: "indexeddb", error };
    } catch (cause) {
      error = messageOf(cause);
    }

    // 旧版(sessionStorage)で作った探索中のセッションがあれば、IndexedDBへ移して続きから使えるようにする。
    try {
      const key = legacySessionKey(project.id, project.revision);
      const text = legacy?.getItem(key);
      if (text) {
        const session = parseSessionRecord({ version: 1, session: JSON.parse(text) }, project);
        if (session) {
          try {
            await meta.save(
              sessionStoreKey(project.id, project.revision),
              makeSessionRecord(session, { projectId: project.id, revision: project.revision, now: now() })
            );
            legacy.removeItem(key);
          } catch (cause) {
            error = messageOf(cause);
          }
          return { session, from: "legacy", error };
        }
      }
    } catch (cause) {
      error ||= messageOf(cause);
    }

    return { session: null, from: "none", error };
  }

  // 戻り値 where: "indexeddb"(端末内に保存) / "session-storage"(タブを閉じると消える退避保存) / "none"(保存できず)
  async function saveSession(project, session) {
    try {
      await meta.save(
        sessionStoreKey(project.id, project.revision),
        makeSessionRecord(session, { projectId: project.id, revision: project.revision, now: now() })
      );
      return { ok: true, where: "indexeddb", error: "" };
    } catch (cause) {
      try {
        legacy.setItem(legacySessionKey(project.id, project.revision), JSON.stringify(session));
        return { ok: true, where: "session-storage", error: messageOf(cause) };
      } catch (fallbackCause) {
        return { ok: false, where: "none", error: messageOf(fallbackCause) };
      }
    }
  }

  async function deleteSession(project) {
    try { await meta.remove(sessionStoreKey(project.id, project.revision)); } catch {}
    try { legacy?.removeItem(legacySessionKey(project.id, project.revision)); } catch {}
  }

  async function loadLibrary(projectId) {
    try {
      const raw = await meta.load(libraryStoreKey(projectId));
      return { entries: parseLibraryRecord(raw, projectId), error: "" };
    } catch (cause) {
      return { entries: [], error: messageOf(cause) };
    }
  }

  async function saveLibrary(projectId, entries) {
    try {
      await meta.save(libraryStoreKey(projectId), makeLibraryRecord(projectId, entries));
      return { ok: true, error: "" };
    } catch (cause) {
      return { ok: false, error: messageOf(cause) };
    }
  }

  return { loadSession, saveSession, deleteSession, loadLibrary, saveLibrary };
}

export const divergenceStore = createDivergenceStore();
