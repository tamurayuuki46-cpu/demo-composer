import { duplicateProjectSnapshot } from "../core/project-copy.js";
import {
  deleteStoredProject,
  getActiveProjectId,
  listProjects,
  storeProjectSnapshot
} from "../storage/indexeddb-storage.js";
import { queueProjectOpen, takeProjectOpenError } from "./project-list.js";
import { saveCurrentProjectThroughHub } from "./new-project-ui.js";

let open = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function projectLabel(project) {
  const key = project?.basic?.key ?? "?";
  const scale = project?.basic?.scale === "minor" ? "Minor" : "Major";
  const bpm = project?.basic?.bpm ?? "?";
  return `${key} ${scale} ・ ${bpm} BPM ・ Rev ${project?.revision ?? "?"}`;
}

function controlsHtml() {
  return `
    <button id="toggle-project-list" class="small-action" aria-expanded="${open}">📁 Project一覧${open ? " ▲" : " ▼"}</button>
    <p class="hint">この端末のIndexedDBに保存されている曲を開く・複製・削除できます。</p>
    <section id="project-list-panel" class="export-panel project-list-panel"${open ? "" : " hidden"}>
      <h3>保存済みProject</h3>
      <p id="project-list-status" class="status-message" aria-live="polite"></p>
      <div id="project-list-items" class="project-list-items"></div>
    </section>
  `;
}

function projectCards(projects, activeProjectId) {
  if (projects.length === 0) {
    return `<p class="empty-state">保存済みProjectはまだありません。</p>`;
  }

  const sorted = [...projects].sort((a, b) => {
    if (a.id === activeProjectId) return -1;
    if (b.id === activeProjectId) return 1;
    return String(a.metadata?.title ?? "").localeCompare(String(b.metadata?.title ?? ""), "ja");
  });

  return sorted.map((project) => {
    const active = project.id === activeProjectId;
    const title = project.metadata?.title || "Untitled Project";
    return `
      <article class="project-list-item${active ? " active" : ""}">
        <div class="project-list-title">
          <strong>${escapeHtml(title)}</strong>
          ${active ? `<span>開いています</span>` : ""}
        </div>
        <small>${escapeHtml(projectLabel(project))}</small>
        <div class="project-list-actions">
          <button data-project-open="${escapeAttribute(project.id)}"${active ? " disabled" : ""}>開く</button>
          <button data-project-duplicate="${escapeAttribute(project.id)}">複製</button>
          <button class="danger" data-project-delete="${escapeAttribute(project.id)}"${active ? " disabled" : ""}>削除</button>
        </div>
      </article>
    `;
  }).join("");
}

function setStatus(wrapper, message, isError = false) {
  const target = wrapper.querySelector("#project-list-status");
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function setBusy(wrapper, busy) {
  wrapper.querySelectorAll("button").forEach((button) => {
    if (busy) {
      button.dataset.wasDisabled = button.disabled ? "1" : "0";
      button.disabled = true;
    } else if (button.dataset.wasDisabled !== undefined) {
      button.disabled = button.dataset.wasDisabled === "1";
      delete button.dataset.wasDisabled;
    }
  });
}

async function refreshProjectList(wrapper, message = "") {
  const items = wrapper.querySelector("#project-list-items");
  if (!items) return;
  items.innerHTML = `<p class="hint">Projectを読み込んでいます…</p>`;

  try {
    const [projects, activeProjectId] = await Promise.all([listProjects(), getActiveProjectId()]);
    if (!wrapper.isConnected) return;
    items.innerHTML = projectCards(projects, activeProjectId);
    setStatus(wrapper, message || `${projects.length}件のProjectを端末に保存しています。`);
    bindProjectActions(wrapper);
  } catch (error) {
    if (!wrapper.isConnected) return;
    items.innerHTML = "";
    setStatus(wrapper, error instanceof Error ? error.message : "Project一覧を読み込めませんでした。", true);
  }
}

async function openProject(wrapper, projectId) {
  const projects = await listProjects();
  const project = projects.find((item) => item.id === projectId);
  if (!project) throw new Error("開くProjectが見つかりません。");
  const title = project.metadata?.title || "Untitled Project";
  if (!globalThis.confirm(`現在のProjectを保存して「${title}」を開きます。よろしいですか？`)) return;

  setBusy(wrapper, true);
  document.querySelector("#player-stop")?.click();
  try {
    await saveCurrentProjectThroughHub();
    queueProjectOpen(projectId);
    globalThis.location.reload();
  } catch (error) {
    setBusy(wrapper, false);
    throw error;
  }
}

async function duplicateProject(wrapper, projectId) {
  const activeProjectId = await getActiveProjectId();
  if (projectId === activeProjectId) {
    await saveCurrentProjectThroughHub();
  }

  const projects = await listProjects();
  const source = projects.find((item) => item.id === projectId);
  if (!source) throw new Error("複製するProjectが見つかりません。");
  const copy = duplicateProjectSnapshot(source, projects);
  await storeProjectSnapshot(copy);
  await refreshProjectList(wrapper, `「${copy.metadata.title}」を複製しました。`);
}

async function deleteProject(wrapper, projectId) {
  const projects = await listProjects();
  const project = projects.find((item) => item.id === projectId);
  if (!project) throw new Error("削除するProjectが見つかりません。");
  const title = project.metadata?.title || "Untitled Project";
  if (!globalThis.confirm(`「${title}」をこの端末から削除します。元に戻せません。よろしいですか？`)) return;

  await deleteStoredProject(projectId);
  await refreshProjectList(wrapper, `「${title}」を端末から削除しました。`);
}

function bindProjectActions(wrapper) {
  wrapper.querySelectorAll("[data-project-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await openProject(wrapper, button.dataset.projectOpen);
      } catch (error) {
        setStatus(wrapper, error instanceof Error ? error.message : "Projectを開けませんでした。", true);
      }
    });
  });

  wrapper.querySelectorAll("[data-project-duplicate]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        setBusy(wrapper, true);
        await duplicateProject(wrapper, button.dataset.projectDuplicate);
      } catch (error) {
        setStatus(wrapper, error instanceof Error ? error.message : "Projectを複製できませんでした。", true);
      } finally {
        if (wrapper.isConnected) setBusy(wrapper, false);
      }
    });
  });

  wrapper.querySelectorAll("[data-project-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        setBusy(wrapper, true);
        await deleteProject(wrapper, button.dataset.projectDelete);
      } catch (error) {
        setStatus(wrapper, error instanceof Error ? error.message : "Projectを削除できませんでした。", true);
      } finally {
        if (wrapper.isConnected) setBusy(wrapper, false);
      }
    });
  });
}

export function installProjectListUi() {
  const screen = document.querySelector("#screen");
  if (!screen) return () => {};

  function attach() {
    const newProjectControls = document.querySelector(".new-project-controls");
    if (!newProjectControls || document.querySelector("#toggle-project-list")) return;

    const startupError = takeProjectOpenError();
    if (startupError) open = true;

    const wrapper = document.createElement("div");
    wrapper.className = "project-library-controls";
    wrapper.innerHTML = controlsHtml();
    newProjectControls.insertAdjacentElement("afterend", wrapper);

    wrapper.querySelector("#toggle-project-list")?.addEventListener("click", () => {
      open = !open;
      const button = wrapper.querySelector("#toggle-project-list");
      const panel = wrapper.querySelector("#project-list-panel");
      button?.setAttribute("aria-expanded", String(open));
      if (button) button.textContent = `📁 Project一覧${open ? " ▲" : " ▼"}`;
      if (panel) panel.hidden = !open;
      if (open) void refreshProjectList(wrapper);
    });

    if (startupError) {
      const hubMessage = document.querySelector("#hub-message");
      if (hubMessage) {
        hubMessage.textContent = startupError;
        hubMessage.classList.add("error");
      }
      setStatus(wrapper, startupError, true);
    }

    if (open) void refreshProjectList(wrapper, startupError);
  }

  const observer = new MutationObserver(attach);
  observer.observe(screen, { childList: true, subtree: true });
  attach();
  return () => observer.disconnect();
}
