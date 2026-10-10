import { createDemoPlayer } from "./audio/demo-player.js";
import {
  BACKING_PATTERNS,
  getBackingPattern,
  getBackingPatternSelection,
  upsertBackingPattern
} from "./core/backing-patterns.js";
import {
  buildChordPreset,
  CHORD_PRESETS,
  chordPresetPreview,
  getChordPreset
} from "./chord/chord-presets.js";
import { chordRole } from "./chord/chord-role.js";
import { suggestNextChords, suggestSpiceChords } from "./chord/chord-next.js";
import { chordSymbol, getChordVariants, getDiatonicChords, NOTE_NAMES, rootToPitchClass } from "./chord/chord-theory.js";
import { migrateProject } from "./core/project-migration.js";
import { SCHEMA_VERSION } from "./core/project-schema.js";
import { bindCubaseMemo, cubaseMemoHtml } from "./hub/memo-ui.js";
import { songCardHtml } from "./hub/song-card.js";
import { bindConsultPanel, consultPanelHtml } from "./hub/consult-ui.js";
import { bindPartSwitch } from "./audio/part-switch-ui.js";
import { bindEditHistory } from "./core/edit-history-ui.js";
import { createDefaultProject, createProjectStore } from "./core/project-state.js";
import { createArrangeController } from "./arrange/arrange-screen.js";
import { getSections, sectionRanges, sliceProject } from "./core/section-ops.js";
import { createMelodyController } from "./melody/melody-screen.js";
import { buildMidiExports, downloadBytes, downloadMidiBundle, downloadProjectJson } from "./midi/midi-export.js";
import { MAX_IMPORT_BYTES, parseProjectJson } from "./storage/project-import.js";
import { createRhythmController } from "./rhythm/rhythm-screen.js";
import { createSoundController } from "./sound/sound-screen.js";
import { applyTextSize, loadTextSize, saveTextSize, TEXT_SIZES } from "./core/display-settings.js";
import { createAutosave } from "./storage/autosave.js";
import { backupProjectForMigration, loadActiveProject, requestPersistentStorage, saveProject } from "./storage/indexeddb-storage.js";

let projectStore;
let melodyController;
let rhythmController;
let arrangeController;
let soundController;
let demoPlayer;
let autosave;
let playerState = { playing: false, loop: false, position: 0, duration: 0 };
let currentScreen = "hub";
let startupMessage = "AutoSaveが有効です。変更は端末へ自動保存されます。";
let chordMessage = "下の候補をタップしてコードを追加します。";
let chordRootSelection = null;
let spiceOpen = false;
let songCardOpen = false;
let textSize = loadTextSize();
applyTextSize(textSize);
let chordPresetSelection = CHORD_PRESETS[0].id;

const KEY_OPTIONS = [...NOTE_NAMES];

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
        <button id="toggle-consult" class="primary-action" aria-expanded="false">AI相談</button>
      </div>

      <button id="toggle-song-card" class="song-card-toggle" aria-expanded="${songCardOpen}">曲の特徴カード${songCardOpen ? " ▲" : " ▼"}</button>
      ${songCardOpen ? songCardHtml(project) : ""}

      ${cubaseMemoHtml(project)}

      ${consultPanelHtml()}

      <section class="display-settings">
        <h3>文字の大きさ</h3>
        <div class="text-size-switch" role="group" aria-label="文字の大きさ">
          ${TEXT_SIZES.map((size) => `<button data-text-size-option="${size.id}" class="${size.id === textSize ? "active" : ""}" aria-pressed="${size.id === textSize}">${size.label}</button>`).join("")}
        </div>
        <p class="hint">この端末だけの設定です（曲のデータには入りません）。上のバー・再生ボタン・下のナビの大きさは変わりません。</p>
      </section>

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
        <h3 class="import-heading">読み込み</h3>
        <button id="import-project-json" class="import-button">project.jsonを読み込む</button>
        <input id="import-project-file" type="file" accept=".json,application/json" hidden />
        <p class="hint">書き出したproject.jsonから曲を戻します。いまの曲は置き換わります（画面上部の ↶ で元に戻せます）。</p>
        <p class="hint">All MIDIはSong.midとパート別MIDIをまとめてダウンロードします。Androidで複数ダウンロードが止められた場合は個別ボタンを使ってください。</p>
      </section>
    </section>
  `;
}

function chordScreen() {
  const project = projectStore.getSnapshot();
  const candidates = getDiatonicChords(project.basic.key, project.basic.scale);
  const selectedRoot = Number.isInteger(chordRootSelection)
    ? chordRootSelection
    : rootToPitchClass(project.basic.key);
  const variants = getChordVariants(selectedRoot, project.basic.key);
  const selectedPreset = getChordPreset(chordPresetSelection);
  const presetPreview = chordPresetPreview(chordPresetSelection, {
    key: project.basic.key,
    scale: project.basic.scale
  }).join(" → ");
  const backingPatternId = getBackingPatternSelection(project.instruments);
  const backingPattern = getBackingPattern(backingPatternId);
  const nextChords = suggestNextChords(project.chords, { key: project.basic.key, scale: project.basic.scale });
  const spiceChords = suggestSpiceChords({ key: project.basic.key, scale: project.basic.scale });
  const progression = project.chords.length
    ? project.chords.map((chord, index) => `
        <div class="chord-card progression-card">
          <button class="remove-chord" data-remove-chord="${index}" aria-label="${escapeAttribute(chordSymbol(chord.root, chord.quality))}を削除">×</button>
          <strong>${escapeHtml(chordSymbol(chord.root, chord.quality))}</strong>
          <span>${escapeHtml(chord.degree)}</span>
          <em class="chord-role">${escapeHtml(chordRole(chord, { key: project.basic.key, scale: project.basic.scale }).label)}</em>
          <small>${index + 1}小節目</small>
        </div>
      `).join("")
    : `<div class="empty-state">まだコードがありません。</div>`;

  return `
    <section class="card">
      <div class="section-heading">
        <div>
          <h2>Chord</h2>
          <p>${escapeHtml(project.basic.key)} ${project.basic.scale === "major" ? "Major" : "Minor"} のコード選択</p>
        </div>
        <button id="clear-chords" class="small-action"${project.chords.length ? "" : " disabled"}>Clear</button>
      </div>

      <div class="chord-preset-panel">
        <label for="chord-preset-select">Chord Preset</label>
        <div class="chord-preset-controls">
          <select id="chord-preset-select" aria-label="Chord Preset">
            ${CHORD_PRESETS.map((preset) => `<option value="${preset.id}"${preset.id === chordPresetSelection ? " selected" : ""}>${escapeHtml(preset.label)}</option>`).join("")}
          </select>
          <button id="apply-chord-preset">適用</button>
        </div>
        <small>${escapeHtml(selectedPreset.description)}</small>
        <p class="chord-preset-preview">${escapeHtml(presetPreview)}</p>
      </div>

      <div class="backing-pattern-panel">
        <label class="field" for="backing-pattern-select">
          <span>Backing Pattern</span>
          <select id="backing-pattern-select" aria-label="Chord Backing Pattern">
            ${BACKING_PATTERNS.map((pattern) => `<option value="${pattern.id}"${pattern.id === backingPatternId ? " selected" : ""}>${escapeHtml(pattern.label)}</option>`).join("")}
          </select>
        </label>
        <small>${escapeHtml(backingPattern.description)}</small>
        <p class="backing-pattern-hint">コード進行は変えず、鳴らし方だけを変更します。Demo PlayerとChord.mid / Song.midに反映されます。</p>
      </div>

      <h3>進行</h3>
      <div class="progression">${progression}</div>

      <p id="chord-message" class="status-message" aria-live="polite">${escapeHtml(chordMessage)}</p>

      <h3>${project.chords.length ? "次のコード候補（3つ）" : "最初のコード候補（3つ）"}</h3>
      <div class="chord-next">
        ${nextChords.map((candidate, index) => `
          <button class="candidate-chord chord-next-item" data-next-chord="${index}">
            <strong>${escapeHtml(candidate.symbol)}</strong>
            <span>${escapeHtml(candidate.degree)}</span>
            <small>${escapeHtml(candidate.reason)}</small>
          </button>
        `).join("")}
      </div>
      <p class="hint">直前のコードから、次に来やすい3つです。選んだあとも、削除や別のコードへの変更ができます。</p>

      <button id="toggle-spice" class="spice-toggle" aria-expanded="${spiceOpen}">✨ ひとスパイス（借用和音）${spiceOpen ? " ▲" : " ▼"}</button>
      ${spiceOpen ? `
        <div class="chord-next">
          ${spiceChords.map((candidate, index) => `
            <button class="candidate-chord chord-next-item spice-item" data-spice-chord="${index}">
              <strong>${escapeHtml(candidate.symbol)}</strong>
              <span>${escapeHtml(candidate.degree)}</span>
              <small>${escapeHtml(candidate.reason)}</small>
            </button>
          `).join("")}
        </div>
        <p class="hint">同じ主音の${project.basic.scale === "major" ? "Minor" : "Major"}から和音を1つ借りる候補です。入れすぎず、1つだけ混ぜると雰囲気が変わります。</p>
      ` : ""}

      <h3>ダイアトニック候補</h3>
      <div class="chord-candidates">
        ${candidates.map((candidate, index) => `
          <button class="candidate-chord" data-add-chord="${index}">
            <strong>${escapeHtml(candidate.symbol)}</strong>
            <span>${escapeHtml(candidate.degree)}</span>
          </button>
        `).join("")}
      </div>

      <h3>基準音からコード種類を選ぶ</h3>
      <div class="form-stack">
        <label class="field">
          <span>基準音</span>
          <select id="chord-root-select">
            ${NOTE_NAMES.map((name, root) => `<option value="${root}"${root === selectedRoot ? " selected" : ""}>${name}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="chord-candidates">
        ${variants.map((candidate, index) => `
          <button class="candidate-chord" data-add-variant="${index}">
            <strong>${escapeHtml(candidate.symbol)}</strong>
            <span>${escapeHtml(candidate.label)} · ${escapeHtml(candidate.degree)}</span>
          </button>
        `).join("")}
      </div>

      <p class="hint">Presetは現在のKey / Scaleに合わせて通常のChordデータへ展開します。適用後は個別に追加・削除できます。Bassがある場合は先にRhythmでClear Bassしてください。</p>
    </section>
  `;
}

const screens = {
  hub: hubScreen,
  chord: chordScreen,
  melody: () => melodyController.render(),
  rhythm: () => rhythmController.render(),
  arrange: () => arrangeController.render(),
  sound: () => soundController.render()
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
  bindConsultPanel({ projectStore, setMessage: setHubMessage });
  bindCubaseMemo({ projectStore, setMessage: setHubMessage, rerender: () => render("hub") });

  document.querySelector("#toggle-song-card")?.addEventListener("click", () => {
    songCardOpen = !songCardOpen;
    render("hub");
  });

  document.querySelectorAll("[data-text-size-option]").forEach((button) => {
    button.addEventListener("click", () => {
      textSize = button.dataset.textSizeOption;
      applyTextSize(textSize);
      saveTextSize(textSize);
      render("hub");
    });
  });

  title?.addEventListener("change", (event) => {
    commitHubChange({ metadata: { title: event.target.value.trim() } });
  });

  bpm?.addEventListener("change", (event) => {
    commitHubChange({ basic: { bpm: Number(event.target.value) } });
  });

  key?.addEventListener("change", (event) => {
    chordRootSelection = null;
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

  const importFile = document.querySelector("#import-project-file");
  document.querySelector("#import-project-json")?.addEventListener("click", () => importFile?.click());
  importFile?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await importProjectFile(file);
  });

  document.querySelector("#export-project-json")?.addEventListener("click", () => {
    downloadProjectJson(projectStore.getSnapshot());
    setHubMessage("project.jsonを書き出しました。バックアップとして保管できます。");
  });
}

async function importProjectFile(file) {
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("ファイルが大きすぎます。");
    const imported = parseProjectJson(await file.text());
    const title = imported.metadata.title || "Untitled Project";
    if (!globalThis.confirm(`「${title}」を読み込みます。いまの曲は置き換わります（↶ で戻せます）。よろしいですか？`)) return;
    demoPlayer.stop();
    chordRootSelection = null;
    projectStore.replaceProject(imported);
    render(currentScreen);
    setHubMessage(`「${title}」を読み込みました。`);
  } catch (error) {
    setHubMessage(error instanceof Error ? error.message : "読み込みに失敗しました。", true);
  }
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
  const selectedRoot = Number.isInteger(chordRootSelection)
    ? chordRootSelection
    : rootToPitchClass(project.basic.key);
  const variants = getChordVariants(selectedRoot, project.basic.key);
  const barTicks = project.basic.ppq * 4;

  function appendCandidate(candidate) {
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
  }

  const nextChords = suggestNextChords(project.chords, { key: project.basic.key, scale: project.basic.scale });
  document.querySelectorAll("[data-next-chord]").forEach((button) => {
    button.addEventListener("click", () => {
      appendCandidate(nextChords[Number(button.dataset.nextChord)]);
    });
  });

  const spiceChords = suggestSpiceChords({ key: project.basic.key, scale: project.basic.scale });
  document.querySelector("#toggle-spice")?.addEventListener("click", () => {
    spiceOpen = !spiceOpen;
    render("chord");
  });
  document.querySelectorAll("[data-spice-chord]").forEach((button) => {
    button.addEventListener("click", () => {
      appendCandidate(spiceChords[Number(button.dataset.spiceChord)]);
    });
  });

  document.querySelector("#chord-preset-select")?.addEventListener("change", (event) => {
    chordPresetSelection = event.target.value;
    render("chord");
  });

  document.querySelector("#apply-chord-preset")?.addEventListener("click", () => {
    const latest = projectStore.getSnapshot();
    const preset = getChordPreset(chordPresetSelection);

    if (
      latest.chords.length > 0
      && !globalThis.confirm(`現在のコード進行を「${preset.label}」で置き換えますか？`)
    ) {
      return;
    }

    const next = buildChordPreset(chordPresetSelection, {
      key: latest.basic.key,
      scale: latest.basic.scale,
      barTicks
    });

    commitChordUpdate(next, `「${preset.label}」を適用しました。個別に修正できます。`);
  });

  document.querySelector("#backing-pattern-select")?.addEventListener("change", (event) => {
    try {
      const patternId = event.target.value;
      const latest = projectStore.getSnapshot();
      const pattern = getBackingPattern(patternId);
      projectStore.updateInstruments(upsertBackingPattern(latest.instruments, patternId));
      chordMessage = `Backing Patternを「${pattern.label}」に変更しました。Demo Playerで確認できます。`;
    } catch (error) {
      chordMessage = error instanceof Error ? error.message : "Backing Patternの変更に失敗しました。";
    }
    render("chord");
  });

  document.querySelectorAll("[data-add-chord]").forEach((button) => {
    button.addEventListener("click", () => {
      appendCandidate(candidates[Number(button.dataset.addChord)]);
    });
  });

  document.querySelector("#chord-root-select")?.addEventListener("change", (event) => {
    chordRootSelection = Number(event.target.value);
    render("chord");
  });

  document.querySelectorAll("[data-add-variant]").forEach((button) => {
    button.addEventListener("click", () => {
      appendCandidate(variants[Number(button.dataset.addVariant)]);
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

// index=null は曲全体。Sectionは範囲だけを切り出して再生し、Loopも同じ範囲を繰り返す。
async function playSection(index) {
  try {
    const project = projectStore.getSnapshot();
    if (index === null) {
      await demoPlayer.play(project);
      return;
    }
    const range = sectionRanges(getSections(project))[index];
    const barTicks = project.basic.ppq * 4;
    await demoPlayer.play(
      sliceProject(project, range.startBar * barTicks, range.endBar * barTicks),
      { lengthTick: range.section.bars * barTicks }
    );
  } catch (error) {
    demoPlayer.stop();
    if (playerTime) playerTime.textContent = error instanceof Error ? error.message : "再生できません。";
  }
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
  if (name === "arrange") arrangeController.bind();
  if (name === "sound") soundController.bind();
}

async function boot() {
  let initialProject;

  try {
    initialProject = await loadActiveProject();

    if (initialProject) {
      const previousSchemaVersion = initialProject.schemaVersion;

      if (previousSchemaVersion !== SCHEMA_VERSION) {
        await backupProjectForMigration(initialProject);
        initialProject = migrateProject(initialProject);
        await saveProject(initialProject);
        startupMessage = `保存済みProjectをSchema v${previousSchemaVersion}からv${SCHEMA_VERSION}へ移行しました。移行前データも端末内に退避しています。`;
      } else {
        initialProject = migrateProject(initialProject);
        startupMessage = "保存済みProjectを端末から読み込みました。AutoSaveは有効です。";
      }
    } else {
      startupMessage = "新しいProjectです。変更はAutoSaveされます。";
    }
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
  soundController = createSoundController({ projectStore, rerender: render });
  demoPlayer = createDemoPlayer({ onStateChange: updatePlayerUi });
  arrangeController = createArrangeController({
    projectStore,
    rerender: render,
    onPlaySection: (index) => playSection(index)
  });
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
  bindPartSwitch({ demoPlayer });
  updatePlayerUi(playerState);
  bindEditHistory({
    projectStore,
    rerender: render,
    getCurrentScreen: () => currentScreen,
    onMessage: (message) => {
      startupMessage = message;
    }
  });

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
