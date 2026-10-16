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

const main = await import("../main.js");
await main.ready;
installNewProjectUi();
installProjectListUi();
installDriveExportUi();
installSongProjectUi({ getCurrentProject: main.saveSongProjectSnapshot, applyProject: main.applySongProjectSnapshot });
await import("./song-data-menu-entry.js");
await import("./ai-monitoring-entry.js");
