const CLEARABLE_PARTS = new Set(["chord", "melody", "counter", "bass", "drums"]);

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function musicPartHasData(project, part) {
  if (!CLEARABLE_PARTS.has(part)) return false;
  if (part === "chord") return (project?.chords ?? []).length > 0;
  return (project?.tracks ?? []).find((track) => track.role === part)?.notes?.length > 0;
}

export function clearMusicPart(project, part) {
  if (!project || typeof project !== "object") {
    throw new Error("Project data is invalid.");
  }
  if (!CLEARABLE_PARTS.has(part)) {
    throw new Error(`消去できないパートです: ${part}`);
  }

  const next = clone(project);
  if (part === "chord") {
    next.chords = [];
    return next;
  }

  const track = next.tracks.find((item) => item.role === part);
  if (track) track.notes = [];
  return next;
}
