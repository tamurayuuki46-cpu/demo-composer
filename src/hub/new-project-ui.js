import { queueNewProject, takeNewProjectError } from "./new-project.js";

const SAVE_WAIT_MS = 12000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveCurrentProjectThroughHub() {
  const saveButton = document.querySelector("#save-project");
  const message = document.querySelector("#hub-message");
  if (!saveButton || !message) {
    throw new Error("現在のProjectを保存する準備ができていません。");
  }

  saveButton.click();
  const startedAt = Date.now();

  while (Date.now() - startedAt < SAVE_WAIT_MS) {
    if (!saveButton.disabled) {
      const text = message.textContent ?? "";
      if (message.classList.contains("error") || text.includes("保存に失敗")) {
        throw new Error(text || "現在のProjectを保存できませんでした。");
      }
      if (text.includes("手動保存しました")) return true;
    }
    await sleep(60);
  }

  throw new Error("現在のProjectの保存確認に時間がかかったため、新規Projectの作成を中止しました。");
}

function newProjectControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "new-project-controls";
  wrapper.innerHTML = `
    <button id="new-project" class="small-action">＋ 新規Project</button>
    <p class="hint">現在のProjectを端末に保存してから、空のProjectを開始します。</p>
  `;
  return wrapper;
}

async function handleNewProject(button) {
  const title = document.querySelector("#project-title")?.value?.trim() || "現在のProject";
  if (!globalThis.confirm(`「${title}」を端末に保存して、新しいProjectを作ります。よろしいですか？`)) return;

  button.disabled = true;
  document.querySelector("#player-stop")?.click();

  try {
    await saveCurrentProjectThroughHub();
    queueNewProject();
    globalThis.location.reload();
  } catch (error) {
    const message = document.querySelector("#hub-message");
    if (message) {
      message.textContent = error instanceof Error ? error.message : "新規Projectを作成できませんでした。";
      message.classList.add("error");
    }
    button.disabled = false;
  }
}

export function installNewProjectUi() {
  const screen = document.querySelector("#screen");
  if (!screen) return () => {};

  function attach() {
    const hubMessage = document.querySelector("#hub-message");
    if (!hubMessage || document.querySelector("#new-project")) return;

    const controls = newProjectControls();
    hubMessage.insertAdjacentElement("afterend", controls);
    controls.querySelector("#new-project")?.addEventListener("click", (event) => {
      void handleNewProject(event.currentTarget);
    });

    const startupError = takeNewProjectError();
    if (startupError) {
      hubMessage.textContent = startupError;
      hubMessage.classList.add("error");
    }
  }

  const observer = new MutationObserver(attach);
  observer.observe(screen, { childList: true, subtree: true });
  attach();
  return () => observer.disconnect();
}
