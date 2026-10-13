import { defaultDesign } from "./decision-design.js";
import { APP_VERSION, SCHEMA_VERSION } from "./project-schema.js";

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function migrateProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project data is invalid.");
  }

  const next = clone(project);

  if (next.schemaVersion === 1 || next.schemaVersion === 2) {
    if (!next.metadata || typeof next.metadata !== "object") throw new Error("Project metadata is invalid.");
    next.metadata.composition = next.metadata.composition ?? defaultDesign();
    next.schemaVersion = SCHEMA_VERSION;
    next.appVersion = APP_VERSION;
    return next;
  }

  if (next.schemaVersion === SCHEMA_VERSION) {
    next.appVersion = APP_VERSION;
    return next;
  }

  throw new Error(`Unsupported schemaVersion: ${next.schemaVersion}`);
}
