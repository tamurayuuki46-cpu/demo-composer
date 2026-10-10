import { migrateProject } from "../core/project-migration.js";
import { validateProject } from "../core/project-state.js";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

// project.jsonの文字列を、現在のSchemaで使えるProjectへ変換して返す。不正なら日本語のErrorを投げる。
export function parseProjectJson(text) {
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("project.jsonとして読めませんでした。Demo Composerで書き出したファイルを選んでください。");
  }

  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.schemaVersion !== "number") {
    throw new Error("Demo Composerのproject.jsonではありません。");
  }

  let project;

  try {
    project = migrateProject(data);
    validateProject(project);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    throw new Error(`project.jsonの内容が正しくないため読み込めません。${reason ? `（${reason}）` : ""}`);
  }

  return project;
}
