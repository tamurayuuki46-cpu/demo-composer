import {
  clearNewProjectRequest,
  completePendingNewProject,
  rememberNewProjectError
} from "./new-project.js";
import { installNewProjectUi } from "./new-project-ui.js";
import { installDriveExportUi } from "./drive-export.js";

try {
  await completePendingNewProject();
} catch (error) {
  clearNewProjectRequest();
  rememberNewProjectError(
    error instanceof Error ? error.message : "新規Projectを作成できなかったため、元のProjectを開きました。"
  );
}

await import("../main.js");
installNewProjectUi();
installDriveExportUi();
