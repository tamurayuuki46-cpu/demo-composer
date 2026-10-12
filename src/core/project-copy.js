function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function createProjectId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function uniqueCopyTitle(sourceTitle, existingProjects) {
  const base = String(sourceTitle || "Untitled Project").trim() || "Untitled Project";
  const used = new Set((existingProjects ?? []).map((project) => String(project?.metadata?.title ?? "").trim()));
  const first = `${base} のコピー`;
  if (!used.has(first)) return first;

  let index = 2;
  while (used.has(`${first} (${index})`)) index += 1;
  return `${first} (${index})`;
}

export function duplicateProjectSnapshot(sourceProject, existingProjects = [], { createId = createProjectId } = {}) {
  if (!sourceProject || typeof sourceProject !== "object" || !sourceProject.id) {
    throw new Error("複製するProjectが不正です。");
  }

  const usedIds = new Set((existingProjects ?? []).map((project) => project?.id).filter(Boolean));
  usedIds.add(sourceProject.id);

  let id = createId();
  let attempts = 0;
  while (usedIds.has(id)) {
    if (attempts++ > 20) throw new Error("複製用のProject IDを作成できませんでした。");
    id = createId();
  }

  const next = clone(sourceProject);
  next.id = id;
  next.revision = 1;
  next.metadata = {
    ...next.metadata,
    title: uniqueCopyTitle(sourceProject.metadata?.title, existingProjects)
  };
  return next;
}
