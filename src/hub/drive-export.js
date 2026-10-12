import { buildMidiExports } from "../midi/midi-export.js";
import { loadActiveProject } from "../storage/indexeddb-storage.js";

const MIDI_MIME = "audio/midi";
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

// 結果は、押したボタンのすぐ下（画面の見える位置）にも出す。Hub上部のメッセージだけだと、下へスクロール中は見えず「反応しない」ように見える
function setHubMessage(message, isError = false) {
  const target = document.querySelector("#hub-message");
  if (target) {
    target.textContent = message;
    target.classList.toggle("error", isError);
  }
  const inline = document.querySelector("[data-drive-export-status]");
  if (inline) {
    inline.textContent = message;
    inline.classList.toggle("error", isError);
  }
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function safeTitle(project) {
  const title = project?.metadata?.title?.trim();
  return title || "Demo Composer Project";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Android Chromeの共有は、拡張子が許可された種類（.txt / 画像 / .wav / .pdf など）だけ。.json / .mid は NotAllowedError になる。
// そのため project.json は中身そのまま「project.json.txt」（text/plain）として共有する。読み込みは .txt のままでもできる
export const PROJECT_SHARE_NAME = "project.json.txt";
export function projectJsonShareFile(project, FileCtor = globalThis.File) {
  if (typeof FileCtor !== "function") return null;
  return new FileCtor(
    [JSON.stringify(project, null, 2)],
    PROJECT_SHARE_NAME,
    { type: "text/plain" }
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
      title
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

  // disabledにするとAndroidで「押しても何も起きない」ように見えるため、
  // 常に押せる状態にして、押した時に理由をHubメッセージへ表示する。
  buttons.forEach((button) => {
    button.disabled = false;
    button.dataset.driveReady = String(ready && shareSupported);
  });

  if (!shareSupported) {
    hint.textContent = "このブラウザはファイル共有に対応していません。押すと案内を表示します。Chromeで開くか、下の通常Exportを使ってください。";
    return;
  }

  hint.textContent = ready
    ? "「Driveへバックアップ」は共有画面からGoogle Driveを選びます（project.json.txt として保存）。MIDIは端末に保存されるので、Driveアプリの「＋ → アップロード」で入れてください。"
    : "AutoSaveの完了を確認中です。ボタンは押せます。まだ保存前なら理由を表示します。";
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

// 画面のRevision表示に頼らず、保存済み（AutoSave）の最新をその場で読む。押した直後なので共有のユーザー操作の有効時間内に収まる
async function readyProject() {
  try {
    const saved = await loadActiveProject();
    if (saved) cachedProject = saved;
  } catch {
    // 読めなければ、前回読めたものを使う
  }
  return cachedProject;
}

async function handleShareResult(result, successMessage, files = []) {
  if (result.status === "shared") {
    setHubMessage(successMessage);
  } else if (result.status === "cancelled") {
    setHubMessage("Driveへの保存をキャンセルしました。");
  } else {
    if (Array.isArray(files) && files.length > 0) {
      files.forEach(downloadFile);
      setHubMessage("共有画面を開けなかったため、端末にダウンロードしました。ダウンロードしたファイルをDriveアプリから保存してください。", true);
    } else {
      setHubMessage("このブラウザではファイル共有できません。通常Exportを使ってください。", true);
    }
  }
}

function fallbackDownload(files, error) {
  files.forEach(downloadFile);
  setHubMessage(`共有を開始できませんでした（${error?.name ?? "error"}）。端末にダウンロードしたので、Driveアプリから保存してください。`, true);
}

// .mid はAndroid Chromeの共有で送れないため、端末に保存してDriveアプリからアップロードしてもらう
function saveMidiForDrive(files, label) {
  if (files.length === 0) return;
  files.forEach(downloadFile);
  setHubMessage(`${label}を端末の「ダウンロード」に保存しました。Driveアプリ →「＋」→「アップロード」→「ダウンロード」から選ぶとDriveに入ります（Androidの共有はMIDIファイルに対応していないため）。`);
}

function bindDriveSection(section) {
  if (section.dataset.driveBound === "true") return;
  section.dataset.driveBound = "true";

  section.querySelector("[data-drive-export=project]")?.addEventListener("click", async () => {
    // 共有はユーザー操作の直後でないと NotAllowedError になるため、IndexedDBを待たず、直近に読めた保存済みProjectを同期的に使う
    const project = cachedProject ?? await readyProject();
    void readyProject();
    if (!project) {
      setHubMessage("保存済みのProjectが見つかりません。「Save Now」を押してから、もう一度押してください。", true);
      return;
    }

    const file = projectJsonShareFile(project);
    if (!file) {
      setHubMessage("このブラウザではproject.jsonを共有できません。Chromeで開くか、通常Exportを使ってください。", true);
      return;
    }

    try {
      const result = await shareFiles([file], { title: `${safeTitle(project)} - project.json` });
      await handleShareResult(result, "project.json.txt を共有しました。Google Driveを選んだ場合はDriveへ保存されています（読み込むときは .txt のままで大丈夫です）。", [file]);
    } catch (error) {
      fallbackDownload([file], error);
    }
  });

  section.querySelector("[data-drive-export=midi]")?.addEventListener("click", async () => {
    // 共有はユーザー操作の直後でないと NotAllowedError になるため、IndexedDBを待たず、直近に読めた保存済みProjectを同期的に使う
    const project = cachedProject ?? await readyProject();
    void readyProject();
    if (!project) {
      setHubMessage("保存済みのProjectが見つかりません。「Save Now」を押してから、もう一度押してください。", true);
      return;
    }

    saveMidiForDrive(midiShareFiles(project), "MIDI一式");
  });

  section.querySelectorAll("[data-drive-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      const name = button.dataset.driveFile;
      const project = cachedProject ?? await readyProject();
      void readyProject();
      if (!project) {
        setHubMessage("保存済みのProjectが見つかりません。「Save Now」を押してから、もう一度押してください。", true);
        return;
      }
      const files = midiShareFiles(project).filter((file) => file.name === name);
      if (files.length === 0) {
        setHubMessage(name === "CounterMelody.mid" ? "裏メロがまだないため、CounterMelody.midはありません。" : `${name}を作れませんでした。`, true);
        return;
      }
      saveMidiForDrive(files, name);
    });
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
        <button type="button" data-drive-export="midi">MIDI一式を保存（Drive用）</button>
      </div>
      <p class="hint drive-single-label">1ファイルずつ保存（Drive用）</p>
      <div class="drive-export-grid drive-single-grid">
        ${["Song.mid", "Chord.mid", "Melody.mid", "Bass.mid", "Drums.mid", "CounterMelody.mid"].map((name) => `<button type="button" data-drive-file="${name}">${name}</button>`).join("")}
      </div>
      <p class="hint" data-drive-export-hint>AutoSaveの状態を確認しています…</p>
      <p class="status-message" data-drive-export-status aria-live="polite"></p>
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
