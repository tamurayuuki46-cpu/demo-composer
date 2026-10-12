import {
  clearNewProjectRequest,
  completePendingNewProject,
  rememberNewProjectError
} from "./new-project.js";
import {
  clearProjectOpenRequest,
  completePendingProjectOpen,
  rememberProjectOpenError
} from "./project-list.js";
import { installNewProjectUi } from "./new-project-ui.js";
import { installProjectListUi } from "./project-list-ui.js";
import { installDriveExportUi } from "./drive-export.js";

try {
  await completePendingNewProject();
} catch (error) {
  clearNewProjectRequest();
  rememberNewProjectError(
    error instanceof Error ? error.message : "新規Projectを作成できなかったため、元のProjectを開きました。"
  );
}

try {
  await completePendingProjectOpen();
} catch (error) {
  clearProjectOpenRequest();
  rememberProjectOpenError(
    error instanceof Error ? error.message : "Projectを開けなかったため、元のProjectを開きました。"
  );
}

await import("../main.js");
installNewProjectUi();
installProjectListUi();
installDriveExportUi();
