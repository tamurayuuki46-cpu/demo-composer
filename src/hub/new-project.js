import { createDefaultProject } from "../core/project-state.js";
import { saveProject } from "../storage/indexeddb-storage.js";

export async function beginNewProject({
  projectStore,
  autosave,
  stopPlayback = () => {},
  confirmFn = globalThis.confirm,
  reload = () => globalThis.location?.reload(),
  createProject = createDefaultProject,
  save = saveProject
} = {}) {
  if (!projectStore || !autosave) {
    throw new Error("新規Projectを開始する準備ができていません。");
  }

  const current = projectStore.getSnapshot();
  const title = current.metadata?.title || "現在のProject";
  const confirmed = confirmFn?.(`「${title}」を端末に保存して、新しいProjectを作ります。よろしいですか？`);
  if (!confirmed) {
    return { created: false, reason: "cancelled" };
  }

  stopPlayback();

  const savedCurrent = await autosave.flush();
  if (!savedCurrent) {
    throw new Error("現在のProjectを保存できなかったため、新規Projectの作成を中止しました。");
  }

  const nextProject = createProject();
  await save(nextProject);
  reload?.();

  return { created: true, project: nextProject };
}
