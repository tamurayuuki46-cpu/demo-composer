import { createProjectStore } from "./core/project-state.js";

const projectStore = createProjectStore();
let currentScreen = "hub";

const KEY_OPTIONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function hubScreen() {
  const project = projectStore.getSnapshot();

  return `
    <section class="card">
      <h2>Hub</h2>
      <p>曲全体の基本情報と進捗を管理します。</p>

      <div class="form-stack">
        <label class="field">
          <span>Project名</span>
          <input id="project-title" type="text" maxlength="80" value="${escapeAttribute(project.metadata.title)}" />
        </label>

        <div class="settings-grid">
          <label class="field">
            <span>BPM</span>
            <input id="project-bpm" type="number" min="40" max="240" step="1" value="${project.basic.bpm}" />
          </label>

          <label class="field">
            <span>Key</span>
            <select id="project-key">
              ${KEY_OPTIONS.map((key) => `<option value="${key}"${key === project.basic.key ? " selected" : ""}>${key}</option>`).join("")}
            </select>
          </label>

          <label class="field">
            <span>Scale</span>
            <select id="project-scale">
              <option value="major"${project.basic.scale === "major" ? " selected" : ""}>Major</option>
              <option value="minor"${project.basic.scale === "minor" ? " selected" : ""}>Minor</option>
            </select>
          </label>
        </div>
      </div>

      <div class="project-meta">
        <span>4/4</span>
        <span>PPQ ${project.basic.ppq}</span>
        <span>Revision ${project.revision}</span>
      </div>

      <p id="hub-message" class="status-message" aria-live="polite">変更は現在このセッション内だけで保持されます。</p>

      <div class="actions">
        <button disabled>Save</button>
        <button disabled>Export</button>
        <button disabled>AI相談</button>
      </div>
    </section>
  `;
}

const screens = {
  hub: hubScreen,
  chord: () => `
    <section class="card">
      <h2>Chord</h2>
      <p>コード名 + Degree を見ながら進行を作る画面です。</p>
      <div class="progression">
        <div class="chord-card"><strong>C</strong><span>I</span></div>
        <div class="chord-card"><strong>G</strong><span>V</span></div>
        <div class="chord-card"><strong>Am</strong><span>vi</span></div>
        <div class="chord-card"><strong>F</strong><span>IV</span></div>
      </div>
      <p class="hint">※ 現在はUIサンプルです。</p>
    </section>
  `,
  melody: () => `
    <section class="card">
      <h2>Melody</h2>
      <p>スマホ向け簡易Piano Rollをここに実装します。</p>
      <div class="placeholder">Piano Roll v0.1</div>
      <p class="hint">コードトーン表示とAnalyzerは後続実装です。</p>
    </section>
  `,
  rhythm: () => `
    <section class="card">
      <h2>Rhythm</h2>
      <p>BassとKickを同時に確認できる構成を優先します。</p>
      <div class="placeholder">16 Step Sequencer v0.1</div>
      <p class="hint">Kick / Snare / Hi-Hat / Bass を実装予定。</p>
    </section>
  `
};

const screen = document.querySelector("#screen");
const buttons = [...document.querySelectorAll(".nav-btn")];
const projectTitle = document.querySelector(".topbar h1");

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function setHubMessage(message, isError = false) {
  const target = document.querySelector("#hub-message");
  if (!target) return;

  target.textContent = message;
  target.classList.toggle("error", isError);
}

function commitHubChange(change) {
  try {
    projectStore.updateHub(change);
    setHubMessage("Project Stateを更新しました。");
  } catch (error) {
    render("hub");
    setHubMessage(error instanceof Error ? error.message : "更新に失敗しました。", true);
  }
}

function bindHubControls() {
  const title = document.querySelector("#project-title");
  const bpm = document.querySelector("#project-bpm");
  const key = document.querySelector("#project-key");
  const scale = document.querySelector("#project-scale");

  title?.addEventListener("change", (event) => {
    commitHubChange({ metadata: { title: event.target.value.trim() } });
  });

  bpm?.addEventListener("change", (event) => {
    commitHubChange({ basic: { bpm: Number(event.target.value) } });
  });

  key?.addEventListener("change", (event) => {
    commitHubChange({ basic: { key: event.target.value } });
  });

  scale?.addEventListener("change", (event) => {
    commitHubChange({ basic: { scale: event.target.value } });
  });
}

function render(name) {
  currentScreen = name;
  screen.innerHTML = screens[name]();

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });

  if (name === "hub") {
    bindHubControls();
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => render(button.dataset.screen));
});

projectStore.subscribe((project) => {
  projectTitle.textContent = project.metadata.title;

  if (currentScreen === "hub") {
    const revision = document.querySelector(".project-meta span:last-child");
    if (revision) revision.textContent = `Revision ${project.revision}`;
  }
});

projectTitle.textContent = projectStore.getSnapshot().metadata.title;
render("hub");
