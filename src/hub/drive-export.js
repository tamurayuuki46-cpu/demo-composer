import { buildMidiExports } from "../midi/midi-export.js";
import { loadActiveProject } from "../storage/indexeddb-storage.js";

const MIDI_MIME = "audio/midi";
const JSON_MIME = "application/json";
const SYNC_INTERVAL_MS = 250;
const SYNC_MAX_ATTEMPTS = 20;
const READY_CHECK_MS = 500;

let cachedProject = null;
let syncInFlight = false;

function hubRevision() {
  const revision = [...document.querySelectorAll(".project-meta span")]
    .map((item) => item.textContent?.trim() ?? "")
    .find((text) => text.startsWith("Revision "));
  const value = Number(revision?.replace("Revision ", ""));
  return Number.isInteger(value) ? value : null;
}

function setHubMessage(message, isError = false) {
  const target = document.querySelector("#hub-message");
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function safeTitle(project) {
  const title = project?.metadata?.title?.trim();
  return title || "Demo Composer Project";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function projectJsonShareFile(project, FileCtor = globalThis.File) {
  if (typeof FileCtor !== "function") return null;
  return new FileCtor(
    [JSON.stringify(project, null, 2)],
    "project.json",
    { type: JSON_MIME }
  );
}

export function midiShareFiles(project, FileCtor = globalThis.File) {
  if (typeof FileCtor !== "function") return [];
  return Object.entries(buildMidiExports(project)).map(([filename, bytes]) => (
    new FileCtor([bytes], filename, { type: MIDI_MIME })
  ));
}

export function canShareFiles(files, navigatorObject = globalThis.navigator) {
  if (!navigatorObject || typeof navigatorObject.share !== "function" || files.length === 0) return false;
  if (typeof navigatorObject.canShare !== "function") return true;
  try {
    return navigatorObject.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareFiles(files, {
  navigatorObject = globalThis.navigator,
  title = "Demo Composer Export"
} = {}) {
  if (!canShareFiles(files, navigatorObject)) return { status: "unsupported" };

  try {
    const sharing = navigatorObject.share({
      files,
      title,
      text: "Google Driveを選んで保存してください。"
    });
    await sharing;
    return { status: "shared" };
  } catch (error) {
    if (error?.name === "AbortError") return { status: "cancelled" };
    throw error;
  }
}

function setReadyState(section, ready) {
  const buttons = section.querySelectorAll("[data-drive-export]");
  const hint = section.querySelector("[data-drive-export-hint]");
  const shareSupported = typeof globalThis.navigator?.share === "function" && typeof globalThis.File === "function";

  buttons.forEach((button) => {
    button.disabled = !ready || !shareSupported;
  });

  if (!shareSupported) {
    hint.textContent = "このブラウザはファイル共有に対応していません。下の通常Exportで保存してください。";
    return;
  }

  hint.textContent = ready
    ? "タップするとAndroidの共有画面が開きます。Google Driveを選んで保存してください。"
    : "AutoSaveの完了を待っています。数秒待つか、上の「Save Now」を押してください。";
}

function isCurrentSavedProject() {
  const revision = hubRevision();
  return Boolean(cachedProject && revision !== null && cachedProject.revision === revision);
}

async function syncSavedProject(section) {
  if (isCurrentSavedProject()) {
    setReadyState(section, true);
    return;
  }
  if (syncInFlight) return;

  syncInFlight = true;
  setReadyState(section, false);

  try {
    for (let attempt = 0; attempt < SYNC_MAX_ATTEMPTS; attempt += 1) {
      const targetRevision = hubRevision();
      const saved = await loadActiveProject();
      if (saved) cachedProject = saved;

      if (
        cachedProject
        && targetRevision !== null
        && cachedProject.revision === targetRevision
      ) {
        setReadyState(section, true);
        return;
      }

      await sleep(SYNC_INTERVAL_MS);
    }

    setReadyState(section, false);
  } finally {
    syncInFlight = false;
  }
}

function readyProject() {
  return isCurrentSavedProject() ? cachedProject : null;
}

async function handleShareResult(result, successMessage) {
  if (result.status === "shared") {
    setHubMessage(successMessage);
  } else if (result.status === "cancelled") {
    setHubMessage("Driveへの保存をキャンセルしました。");
  } else {
    setHubMessage("この端末ではファイル共有できません。通常Exportを使ってください。", true);
  }
}

function bindDriveSection(section) {
  if (section.dataset.driveBound === "true") return;
  section.dataset.driveBound = "true";

  section.querySelector("[data-drive-export=project]")?.addEventListener("click", async () => {
    const project = readyProject();
    if (!project) {
      setHubMessage("AutoSaveの完了を待っています。少し待ってもう一度押してください。", true);
      void syncSavedProject(section);
      return;
    }

    const file = projectJsonShareFile(project);
    if (!file) {
      setHubMessage("この端末ではproject.jsonを共有できません。", true);
      return;
    }

    try {
      const result = await shareFiles([file], { title: `${safeTitle(project)} - project.json` });
      await handleShareResult(result, "project.jsonを共有しました。Google Driveを選んだ場合はDriveへ保存されています。");
    } catch (error) {
      setHubMessage(error instanceof Error ? error.message : "Drive共有に失敗しました。", true);
    }
  });

  section.querySelector("[data-drive-export=midi]")?.addEventListener("click", async () => {
    const project = readyProject();
    if (!project) {
      setHubMessage("AutoSaveの完了を待っています。少し待ってもう一度押してください。", true);
      void syncSavedProject(section);
      return;
    }

    const files = midiShareFiles(project);
    try {
      const result = await shareFiles(files, { title: `${safeTitle(project)} - MIDI` });
      await handleShareResult(result, "MIDI一式を共有しました。Google Driveを選んだ場合はDriveへ保存されています。");
    } catch (error) {
      setHubMessage(error instanceof Error ? error.message : "MIDIのDrive共有に失敗しました。", true);
    }
  });

  void syncSavedProject(section);
}

function ensureDriveExportUi() {
  const panel = document.querySelector("#export-panel");
  if (!panel) return;

  let section = panel.querySelector("[data-drive-export-section]");
  if (!section) {
    section = document.createElement("section");
    section.className = "drive-export-section";
    section.dataset.driveExportSection = "true";
    section.innerHTML = `
      <h3>Google Drive</h3>
      <div class="drive-export-grid">
        <button type="button" data-drive-export="project">Driveへバックアップ</button>
        <button type="button" data-drive-export="midi">MIDI一式をDriveへ</button>
      </div>
      <p class="hint" data-drive-export-hint>AutoSaveの状態を確認しています…</p>
    `;

    const importHeading = panel.querySelector(".import-heading");
    panel.insertBefore(section, importHeading ?? null);
  }

  bindDriveSection(section);
}

export function installDriveExportUi() {
  const screen = document.querySelector("#screen");
  if (!screen || typeof MutationObserver !== "function") return () => {};

  ensureDriveExportUi();
  const observer = new MutationObserver(() => {
    ensureDriveExportUi();
  });
  observer.observe(screen, { childList: true, subtree: true });

  const timer = setInterval(() => {
    const section = document.querySelector("[data-drive-export-section]");
    if (section) void syncSavedProject(section);
  }, READY_CHECK_MS);

  return () => {
    observer.disconnect();
    clearInterval(timer);
  };
}
