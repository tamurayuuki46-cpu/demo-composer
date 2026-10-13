import { saveProject } from "./indexeddb-storage.js";

export function createAutosave({ projectStore, delay = 1500, onError } = {}) {
  let timer = null;
  let unsubscribe = null;
  let started = false;
  let saving = false;
  let queuedProject = null;

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  async function drainQueue() {
    if (saving) return;
    saving = true;

    try {
      while (queuedProject) {
        const project = queuedProject;
        queuedProject = null;
        try {
          await saveProject(project);
        } catch (error) {
          onError?.(error);
        }
      }
    } finally {
      saving = false;
    }
  }

  function queueSave(project = projectStore.getSnapshot()) {
    queuedProject = project;
    void drainQueue();
  }

  function schedule(project) {
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      queueSave(project);
    }, delay);
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "hidden") return;
    clearTimer();
    queueSave(projectStore.getSnapshot());
  }

  return {
    start() {
      if (started) return;
      started = true;
      unsubscribe = projectStore.subscribe((project) => schedule(project));
      document.addEventListener("visibilitychange", handleVisibilityChange);
    },

    flush() {
      clearTimer();
      queueSave(projectStore.getSnapshot());
    },

    stop() {
      clearTimer();
      unsubscribe?.();
      unsubscribe = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      started = false;
    }
  };
}
