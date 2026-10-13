import {
  clearNewProjectRequest,
  completePendingNewProject,
  rememberNewProjectError
} from "./new-project.js";
import {
  clearProjectSwitchRequest,
  completePendingProjectSwitch,
  rememberProjectSwitchError
} from "./project-list.js";
import { installNewProjectUi } from "./new-project-ui.js";
import { installProjectListUi } from "./project-list-ui.js";
import { installDriveExportUi } from "./drive-export.js";
import { installSongProjectUi } from "./song-project-ui.js";
import { applyPendingVocalDesign } from "./vocal-design-store.js";

try {
  await completePendingNewProject();
} catch (error) {
  clearNewProjectRequest();
  rememberNewProjectError(
    error instanceof Error ? error.message : "新規Projectを作成できなかったため、元のProjectを開きました。"
  );
}

try {
  await completePendingProjectSwitch();
} catch (error) {
  clearProjectSwitchRequest();
  rememberProjectSwitchError(
    error instanceof Error ? error.message : "Projectを切り替えられなかったため、元のProjectを開きました。"
  );
}

try {
  await applyPendingVocalDesign();
} catch (error) {
  console.warn("Pending vocal design could not be applied.", error);
}

await import("../main.js");
installNewProjectUi();
installProjectListUi();
installDriveExportUi();
installSongProjectUi();
