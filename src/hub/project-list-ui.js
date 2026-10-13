import {
  deleteStoredProject,
  duplicateStoredProject,
  getActiveProjectId,
  listProjects
} from "../storage/indexeddb-storage.js";
import { queueProjectSwitch, takeProjectSwitchError } from "./project-list.js";
import { saveCurrentProjectThroughHub } from "./new-project-ui.js";

let open = false;
let listMessage = "";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHubMessage(message, isError = false) {
  const target = document.querySelector("#hub-message");
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function controlsHtml() {
  return `
    <button id="toggle-project-list" class="song-card-toggle" aria-expanded="${open}">📂 Project一覧${open ? " ▲" : " ▼"}</button>
    <section id="project-list-panel" class="export-panel"${open ? "" : " hidden"}>
      <p id="project-list-status" class="status-message" aria-live="polite">端末内のProjectを読み込んでいます…</p>
      <div id="project-list-items"></div>
      <p class="hint">ProjectはこのブラウザのIndexedDBに保存されています。大事な曲はproject.jsonでもBackupしてください。</p>
      <p class="hint">現在開いているProjectは削除できません。削除したい場合は、別のProjectを開いてから削除してください。</p>
    </section>
  `;
}

function projectCard(project, activeProjectId) {
  const isActive = project.id === activeProjectId;
  const title = project.metadata?.title || "Untitled Project";
  const key = project.basic?.key || "-";
  const scale = project.basic?.scale === "minor" ? "Minor" : "Major";
  const bpm = project.basic?.bpm ?? "-";
  const revision = project.revision ?? "-";

  return `
    <article class="export-panel" data-project-card="${escapeHtml(project.id)}">
      <h3>${escapeHtml(title)}${isActive ? "　<small>● 現在</small>" : ""}</h3>
      <div class="project-meta">
        <span>${escapeHtml(key)} ${scale}</span>
        <span>BPM ${escapeHtml(bpm)}</span>
        <span>Revision ${escapeHtml(revision)}</span>
      </div>
      <div class="actions">
        <button class="primary-action" data-project-open="${escapeHtml(project.id)}"${isActive ? " disabled" : ""}>開く</button>
        <button data-project-duplicate="${escapeHtml(project.id)}">複製</button>
        <button class="danger" data-project-delete="${escapeHtml(project.id)}"${isActive ? " disabled" : ""}>削除</button>
      </div>
    </article>
  `;
}

async function renderProjectList(wrapper) {
  if (!wrapper?.isConnected) return;
  const toggle = wrapper.querySelector("#toggle-project-list");
  const status = wrapper.querySelector("#project-list-status");
  const items = wrapper.querySelector("#project-list-items");

  try {
    const [projects, activeProjectId] = await Promise.all([listProjects(), getActiveProjectId()]);
    if (!wrapper.isConnected) return;

    if (toggle) {
      toggle.textContent = `📂 Project一覧（${projects.length}曲）${open ? " ▲" : " ▼"}`;
      toggle.setAttribute("aria-expanded", String(open));
    }
    if (!open) return;

    if (status) {
      status.textContent = listMessage || `${projects.length}曲を端末内に保存しています。`;
      status.classList.remove("error");
    }
    if (items) {
      items.innerHTML = projects.length
        ? projects.map((project) => projectCard(project, activeProjectId)).join("")
        : `<div class="empty-state">保存済みProjectがありません。</div>`;
    }

    wrapper.querySelectorAll("[data-project-open]").forEach((button) => {
      button.addEventListener("click", async () => {
        const projectId = button.dataset.projectOpen;
        const target = projects.find((project) => project.id === projectId);
        if (!target) return;
        const title = target.metadata?.title || "Untitled Project";
        if (!globalThis.confirm(`現在のProjectを保存して「${title}」を開きます。よろしいですか？`)) return;

        button.disabled = true;
        document.querySelector("#player-stop")?.click();
        try {
          await saveCurrentProjectThroughHub();
          queueProjectSwitch(projectId);
          globalThis.location.reload();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Projectを開けませんでした。";
          setHubMessage(message, true);
          if (status) {
            status.textContent = message;
            status.classList.add("error");
          }
          button.disabled = false;
        }
      });
    });

    wrapper.querySelectorAll("[data-project-duplicate]").forEach((button) => {
      button.addEventListener("click", async () => {
        const projectId = button.dataset.projectDuplicate;
        button.disabled = true;
        try {
          if (projectId === activeProjectId) await saveCurrentProjectThroughHub();
          const duplicated = await duplicateStoredProject(projectId);
          listMessage = `「${duplicated.metadata?.title || "コピー"}」を複製しました。`;
          setHubMessage(listMessage);
          await renderProjectList(wrapper);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Projectを複製できませんでした。";
          setHubMessage(message, true);
          if (status) {
            status.textContent = message;
            status.classList.add("error");
          }
          button.disabled = false;
        }
      });
    });

    wrapper.querySelectorAll("[data-project-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const projectId = button.dataset.projectDelete;
        const target = projects.find((project) => project.id === projectId);
        if (!target) return;
        const title = target.metadata?.title || "Untitled Project";
        if (!globalThis.confirm(`「${title}」を端末から削除します。この操作は元に戻せません。よろしいですか？`)) return;

        button.disabled = true;
        try {
          await deleteStoredProject(projectId);
          listMessage = `「${title}」を端末から削除しました。`;
          setHubMessage(listMessage);
          await renderProjectList(wrapper);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Projectを削除できませんでした。";
          setHubMessage(message, true);
          if (status) {
            status.textContent = message;
            status.classList.add("error");
          }
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project一覧を読み込めませんでした。";
    if (status) {
      status.textContent = message;
      status.classList.add("error");
    }
  }
}

export function installProjectListUi() {
  const screen = document.querySelector("#screen");
  if (!screen) return () => {};

  function attach() {
    const hubMessage = document.querySelector("#hub-message");
    if (!hubMessage || document.querySelector("#toggle-project-list")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "project-list-controls";
    wrapper.innerHTML = controlsHtml();

    const newProjectControls = document.querySelector(".new-project-controls");
    if (newProjectControls) newProjectControls.insertAdjacentElement("afterend", wrapper);
    else hubMessage.insertAdjacentElement("afterend", wrapper);

    wrapper.querySelector("#toggle-project-list")?.addEventListener("click", () => {
      open = !open;
      const panel = wrapper.querySelector("#project-list-panel");
      if (open) panel?.removeAttribute("hidden");
      else panel?.setAttribute("hidden", "");
      void renderProjectList(wrapper);
    });

    const switchError = takeProjectSwitchError();
    if (switchError) {
      listMessage = switchError;
      setHubMessage(switchError, true);
    }

    void renderProjectList(wrapper);
  }

  const observer = new MutationObserver(attach);
  observer.observe(screen, { childList: true, subtree: true });
  attach();
  return () => observer.disconnect();
}
