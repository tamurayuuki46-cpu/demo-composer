import { createDemoPlayer } from "./audio/demo-player.js";
import { chordSymbol, getDiatonicChords } from "./chord/chord-theory.js";
import { createDefaultProject, createProjectStore } from "./core/project-state.js";
import { createMelodyController } from "./melody/melody-screen.js";
import { buildMidiExports, downloadBytes, downloadMidiBundle, downloadProjectJson } from "./midi/midi-export.js";
import { createRhythmController } from "./rhythm/rhythm-screen.js";
import { createAutosave } from "./storage/autosave.js";
import { loadActiveProject, requestPersistentStorage, saveProject } from "./storage/indexeddb-storage.js";

let projectStore;
let melodyController;
let rhythmController;
let demoPlayer;
let autosave;
let playerState = { playing: false, loop: false, position: 0, duration: 0 };
let currentScreen = "hub";
let startupMessage = "AutoSaveが有効です。変更は端末へ自動保存されます。";
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
        <span>AutoSave ON</span>
      </div>

      <p id="hub-message" class="status-message" aria-live="polite">${escapeHtml(startupMessage)}</p>

      <div class="actions">
        <button id="save-project" class="primary-action">Save Now</button>
        <button id="toggle-export" class="primary-action" aria-expanded="false">Export</button>
        <button disabled>AI相談</button>
      </div>

      <section id="export-panel" class="export-panel" hidden>
        <h3>Export</h3>
        <div class="export-grid">
          <button id="export-all-midi" class="export-primary">All MIDI</button>
          <button data-midi-file="Song.mid">Song.mid</button>
          <button data-midi-file="Chord.mid">Chord.mid</button>
          <button data-midi-file="Melody.mid">Melody.mid</button>
          <button data-midi-file="Bass.mid">Bass.mid</button>
          <button data-midi-file="Drums.mid">Drums.mid</button>
          <button id="export-project-json">project.json</button>
        </div>
        <p class="hint">All MIDIはSong.midとパート別MIDIをまとめてダウンロードします。Androidで複数ダウンロードが止められた場合は個別ボタンを使ってください。</p>
      </section>
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

      <p class="hint">1回タップすると1小節分追加します。変更はAutoSaveされます。</p>
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
const playerPlay = document.querySelector("#player-play");
const playerStop = document.querySelector("#player-stop");
const playerLoop = document.querySelector("#player-loop");
const playerProgress = document.querySelector("#player-progress");
const playerTime = document.querySelector("#player-time");

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

function formatTime(seconds) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updatePlayerUi(nextState) {
  playerState = nextState;
  playerPlay?.classList.toggle("active", nextState.playing);
  playerLoop?.classList.toggle("active", nextState.loop);
  playerLoop?.setAttribute("aria-pressed", String(nextState.loop));

  if (playerProgress) {
    playerProgress.max = nextState.duration || 1;
    playerProgress.value = Math.min(nextState.position, nextState.duration || 1);
  }

  if (playerTime) {
    playerTime.textContent = `${formatTime(nextState.position)} / ${formatTime(nextState.duration)}`;
  }
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
    setHubMessage("変更しました。AutoSaveで端末へ保存されます。");
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
        ? "手動保存しました。ストレージ保護も有効です。"
        : "手動保存しました。project.json Backupも定期的に利用してください。"
    );
  } catch (error) {
    setHubMessage(error instanceof Error ? error.message : "保存に失敗しました。", true);
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

function exportMidiFile(filename) {
  const project = projectStore.getSnapshot();
  const files = buildMidiExports(project);
  const bytes = files[filename];
  if (!bytes) {
    setHubMessage(`${filename}を生成できませんでした。`, true);
    return;
  }

  downloadBytes(bytes, filename);
  setHubMessage(`${filename}を書き出しました。`);
}

function bindHubControls() {
  const title = document.querySelector("#project-title");
  const bpm = document.querySelector("#project-bpm");
  const key = document.querySelector("#project-key");
  const scale = document.querySelector("#project-scale");
  const saveButton = document.querySelector("#save-project");
  const exportToggle = document.querySelector("#toggle-export");
  const exportPanel = document.querySelector("#export-panel");

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

  exportToggle?.addEventListener("click", () => {
    const open = exportPanel?.hasAttribute("hidden") ?? true;
    if (open) {
      exportPanel?.removeAttribute("hidden");
    } else {
      exportPanel?.setAttribute("hidden", "");
    }
    exportToggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelector("#export-all-midi")?.addEventListener("click", () => {
    downloadMidiBundle(projectStore.getSnapshot());
    setHubMessage("Song.midとパート別MIDIの書き出しを開始しました。");
  });

  document.querySelectorAll("[data-midi-file]").forEach((button) => {
    button.addEventListener("click", () => exportMidiFile(button.dataset.midiFile));
  });

  document.querySelector("#export-project-json")?.addEventListener("click", () => {
    downloadProjectJson(projectStore.getSnapshot());
    setHubMessage("project.jsonを書き出しました。バックアップとして保管できます。");
  });
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

function bindPlayerControls() {
  playerPlay?.addEventListener("click", async () => {
    try {
      await demoPlayer.play(projectStore.getSnapshot());
    } catch (error) {
      demoPlayer.stop();
      if (playerTime) {
        playerTime.textContent = error instanceof Error ? error.message : "再生できません。";
      }
    }
  });

  playerStop?.addEventListener("click", () => {
    demoPlayer.stop();
  });

  playerLoop?.addEventListener("click", () => {
    demoPlayer.setLoop(!playerState.loop);
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
      ? "保存済みProjectを端末から読み込みました。AutoSaveは有効です。"
      : "新しいProjectです。変更はAutoSaveされます。";
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
  demoPlayer = createDemoPlayer({ onStateChange: updatePlayerUi });
  autosave = createAutosave({
    projectStore,
    delay: 1500,
    onError(error) {
      setHubMessage(
        error instanceof Error ? `AutoSaveに失敗しました: ${error.message}` : "AutoSaveに失敗しました。",
        true
      );
    }
  });
  autosave.start();

  buttons.forEach((button) => {
    button.addEventListener("click", () => render(button.dataset.screen));
  });
  bindPlayerControls();
  updatePlayerUi(playerState);

  projectStore.subscribe((project) => {
    projectTitle.textContent = project.metadata.title;

    if (currentScreen === "hub") {
      const revision = document.querySelector(".project-meta span:nth-child(3)");
      if (revision) revision.textContent = `Revision ${project.revision}`;
    }
  });

  projectTitle.textContent = projectStore.getSnapshot().metadata.title;
  render("hub");
}

boot();
