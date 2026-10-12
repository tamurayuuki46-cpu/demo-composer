function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function createProjectId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function copyTitle(title) {
  const base = String(title || "Untitled Project").trim() || "Untitled Project";
  const suffix = " コピー";
  return `${base.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`;
}

export function duplicateProjectRecord(project, { createId = createProjectId } = {}) {
  if (!project || typeof project !== "object" || typeof project.id !== "string" || !project.id) {
    throw new Error("複製するProjectが不正です。");
  }

  const next = clone(project);
  next.id = createId();
  next.revision = 1;
  next.metadata = {
    ...(next.metadata ?? {}),
    title: copyTitle(next.metadata?.title)
  };
  return next;
}

export function sortProjectRecords(projects, activeProjectId = "") {
  return [...(projects ?? [])].sort((a, b) => {
    const aActive = a?.id === activeProjectId;
    const bActive = b?.id === activeProjectId;
    if (aActive !== bActive) return aActive ? -1 : 1;

    const aTitle = String(a?.metadata?.title ?? "Untitled Project");
    const bTitle = String(b?.metadata?.title ?? "Untitled Project");
    const titleCompare = aTitle.localeCompare(bTitle, "ja");
    if (titleCompare !== 0) return titleCompare;
    return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
  });
}
