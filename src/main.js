import { chordSymbol, getDiatonicChords } from "./chord/chord-theory.js";
import { createDefaultProject, createProjectStore } from "./core/project-state.js";
import { createMelodyController } from "./melody/melody-screen.js";
import { createRhythmController } from "./rhythm/rhythm-screen.js";
import { loadActiveProject, requestPersistentStorage, saveProject } from "./storage/indexeddb-storage.js";

let projectStore;
let melodyController;
let rhythmController;
let currentScreen = "hub";
let startupMessage = "Projectを編集できます。変更後はSaveで端末に保存してください。";
let chordMessage = "下の候補をタップしてコードを追加します。";

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

      <p id="hub-message" class="status-message" aria-live="polite">${escapeHtml(startupMessage)}</p>

      <div class="actions">
        <button id="save-project" class="primary-action">Save</button>
        <button disabled>Export</button>
        <button disabled>AI相談</button>
      </div>
    </section>
  `;
}

function chordScreen() {
  const project = projectStore.getSnapshot();
  const candidates = getDiatonicChords(project.basic.key, project.basic.scale);
  const progression = project.chords.length
    ? project.chords.map((chord, index) => `
        <div class="chord-card progression-card">
          <button class="remove-chord" data-remove-chord="${index}" aria-label="${escapeAttribute(chordSymbol(chord.root, chord.quality))}を削除">×</button>
          <strong>${escapeHtml(chordSymbol(chord.root, chord.quality))}</strong>
          <span>${escapeHtml(chord.degree)}</span>
          <small>${index + 1}小節目</small>
        </div>
      `).join("")
    : `<div class="empty-state">まだコードがありません。</div>`;

  return `
    <section class="card">
      <div class="section-heading">
        <div>
          <h2>Chord</h2>
          <p>${escapeHtml(project.basic.key)} ${project.basic.scale === "major" ? "Major" : "Minor"} のダイアトニックコード</p>
        </div>
        <button id="clear-chords" class="small-action"${project.chords.length ? "" : " disabled"}>Clear</button>
      </div>

      <h3>進行</h3>
      <div class="progression">${progression}</div>

      <p id="chord-message" class="status-message" aria-live="polite">${escapeHtml(chordMessage)}</p>

      <h3>追加候補</h3>
      <div class="chord-candidates">
        ${candidates.map((candidate, index) => `
          <button class="candidate-chord" data-add-chord="${index}">
            <strong>${escapeHtml(candidate.symbol)}</strong>
            <span>${escapeHtml(candidate.degree)}</span>
          </button>
        `).join("")}
      </div>

      <p class="hint">1回タップすると1小節分追加します。変更後はHubのSaveで端末に保存してください。</p>
    </section>
  `;
}

const screens = {
  hub: hubScreen,
  chord: chordScreen,
  melody: () => melodyController.render(),
  rhythm: () => rhythmController.render()
};

const screen = document.querySelector("#screen");
const buttons = [...document.querySelectorAll(".nav-btn")];
const projectTitle = document.querySelector(".topbar h1");

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

function setHubMessage(message, isError = false) {
  startupMessage = message;
  const target = document.querySelector("#hub-message");
  if (!target) return;

  target.textContent = message;
  target.classList.toggle("error", isError);
}

function commitHubChange(change) {
  try {
    projectStore.updateHub(change);
    setHubMessage("変更しました。Saveすると端末に保存されます。");
  } catch (error) {
    render("hub");
    setHubMessage(error instanceof Error ? error.message : "更新に失敗しました。", true);
  }
}

async function saveCurrentProject() {
  const saveButton = document.querySelector("#save-project");
  if (saveButton) saveButton.disabled = true;

  try {
    await saveProject(projectStore.getSnapshot());
    const persistent = await requestPersistentStorage();
    setHubMessage(
      persistent
        ? "端末に保存しました。ストレージ保護も有効です。"
        : "端末に保存しました。必要に応じてproject.jsonバックアップも利用してください。"
    );
  } catch (error) {
    setHubMessage(error instanceof Error ? error.message : "保存に失敗しました。", true);
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

function bindHubControls() {
  const title = document.querySelector("#project-title");
  const bpm = document.querySelector("#project-bpm");
  const key = document.querySelector("#project-key");
  const scale = document.querySelector("#project-scale");
  const saveButton = document.querySelector("#save-project");

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

  saveButton?.addEventListener("click", saveCurrentProject);
}

function reflowChords(chords, barTicks) {
  return chords.map((chord, index) => ({
    ...chord,
    startTick: index * barTicks,
    durationTick: barTicks
  }));
}

function commitChordUpdate(chords, successMessage) {
  try {
    projectStore.updateChords(chords);
    chordMessage = successMessage;
  } catch (error) {
    chordMessage = error instanceof Error ? error.message : "Chord更新に失敗しました。";
  }

  render("chord");
}

function bindChordControls() {
  const project = projectStore.getSnapshot();
  const candidates = getDiatonicChords(project.basic.key, project.basic.scale);
  const barTicks = project.basic.ppq * 4;

  document.querySelectorAll("[data-add-chord]").forEach((button) => {
    button.addEventListener("click", () => {
      const candidate = candidates[Number(button.dataset.addChord)];
      if (!candidate) return;

      const latest = projectStore.getSnapshot();
      const next = [
        ...latest.chords,
        {
          startTick: latest.chords.length * barTicks,
          durationTick: barTicks,
          root: candidate.root,
          quality: candidate.quality,
          degree: candidate.degree
        }
      ];

      commitChordUpdate(next, `${candidate.symbol} (${candidate.degree}) を追加しました。`);
    });
  });

  document.querySelectorAll("[data-remove-chord]").forEach((button) => {
    button.addEventListener("click", () => {
      const removeIndex = Number(button.dataset.removeChord);
      const latest = projectStore.getSnapshot();
      const next = reflowChords(
        latest.chords.filter((_, index) => index !== removeIndex),
        barTicks
      );

      commitChordUpdate(next, "コードを削除しました。");
    });
  });

  document.querySelector("#clear-chords")?.addEventListener("click", () => {
    commitChordUpdate([], "コード進行をクリアしました。");
  });
}

function render(name) {
  currentScreen = name;
  screen.innerHTML = screens[name]();

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });

  if (name === "hub") bindHubControls();
  if (name === "chord") bindChordControls();
  if (name === "melody") melodyController.bind();
  if (name === "rhythm") rhythmController.bind();
}

async function boot() {
  let initialProject;

  try {
    initialProject = await loadActiveProject();
    startupMessage = initialProject
      ? "保存済みProjectを端末から読み込みました。"
      : "新しいProjectです。変更後はSaveで端末に保存してください。";
  } catch {
    initialProject = null;
    startupMessage = "保存データを読み込めなかったため、新しいProjectで開始しました。";
  }

  try {
    projectStore = createProjectStore(initialProject ?? createDefaultProject());
  } catch {
    projectStore = createProjectStore(createDefaultProject());
    startupMessage = "保存データが現在のSchemaで不正なため、新しいProjectで開始しました。";
  }

  melodyController = createMelodyController({ projectStore, rerender: render });
  rhythmController = createRhythmController({ projectStore, rerender: render });

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
}

boot();
