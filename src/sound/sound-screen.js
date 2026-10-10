import {
  BACKING_PATTERNS,
  getBackingPattern,
  getBackingPatternSelection,
  upsertBackingPattern
} from "../core/backing-patterns.js";
import {
  getSoundPart,
  getSoundSelection,
  SOUND_PARTS,
  SOUND_TONES,
  upsertSoundSelection
} from "../core/sound-presets.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createSoundController({ projectStore, rerender } = {}) {
  let chordBackingObserver = null;

  function renderPart(part, project) {
    const selection = getSoundSelection(project.instruments, part.id);
    return `
      <section class="sound-part-card" data-sound-part="${part.id}">
        <div class="sound-part-heading">
          <div>
            <h3>${escapeHtml(part.label)}</h3>
            <p>${escapeHtml(part.description)}</p>
          </div>
          <span class="sound-current">${escapeHtml(part.presets.find((item) => item.id === selection.preset)?.label ?? selection.preset)}</span>
        </div>

        <label class="field sound-preset-field">
          <span>Preset</span>
          <select data-sound-preset="${part.id}" aria-label="${escapeHtml(part.label)} Preset">
            ${part.presets.map((preset) => `<option value="${preset.id}"${preset.id === selection.preset ? " selected" : ""}>${escapeHtml(preset.label)}</option>`).join("")}
          </select>
        </label>

        <div class="sound-tone-group" aria-label="${escapeHtml(part.label)} Tone">
          <span class="sound-tone-label">Tone</span>
          <div class="sound-tone-buttons">
            ${SOUND_TONES.map((tone) => `
              <button
                type="button"
                class="sound-tone${tone.id === selection.tone ? " active" : ""}"
                data-sound-tone-part="${part.id}"
                data-sound-tone="${tone.id}"
                aria-pressed="${tone.id === selection.tone}"
              >${escapeHtml(tone.label)}</button>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function render() {
    const project = projectStore.getSnapshot();
    return `
      <section class="card sound-card">
        <div class="section-heading">
          <div>
            <h2>Sound</h2>
            <p>最終音色ではなく、曲の音色方向を決めるSound Sketchです。</p>
          </div>
        </div>

        <p class="sound-help">Chord / Melody / Bass のPresetとToneを選び、下のDemo Playerで確認します。MIDI Noteは変更しません。</p>

        <div class="sound-parts">
          ${SOUND_PARTS.map((part) => renderPart(part, project)).join("")}
        </div>
      </section>
    `;
  }

  function updateSelection(partId, patch) {
    const part = getSoundPart(partId);
    if (!part) return;

    const project = projectStore.getSnapshot();
    const current = getSoundSelection(project.instruments, partId);
    const nextSelection = { ...current, ...patch };
    projectStore.updateInstruments(upsertSoundSelection(project.instruments, nextSelection));
    rerender("sound");
  }

  function backingPanelMarkup(project) {
    const selectedId = getBackingPatternSelection(project.instruments);
    const selected = getBackingPattern(selectedId);
    return `
      <section class="backing-pattern-panel" data-backing-pattern-panel>
        <label class="field" for="backing-pattern-select">
          <span>Backing Pattern</span>
          <select id="backing-pattern-select" aria-label="Chord Backing Pattern">
            ${BACKING_PATTERNS.map((pattern) => `<option value="${pattern.id}"${pattern.id === selectedId ? " selected" : ""}>${escapeHtml(pattern.label)}</option>`).join("")}
          </select>
        </label>
        <small data-backing-pattern-description>${escapeHtml(selected.description)}</small>
        <p class="backing-pattern-hint">コード進行は変えず、鳴らし方だけを変更します。Demo PlayerとChord.mid / Song.midに反映されます。</p>
      </section>
    `;
  }

  function injectChordBackingPanel() {
    const chordPresetSelect = document.querySelector("#chord-preset-select");
    if (!chordPresetSelect || document.querySelector("[data-backing-pattern-panel]")) return;

    const chordPresetPanel = chordPresetSelect.closest(".chord-preset-panel");
    if (!chordPresetPanel) return;

    const holder = document.createElement("div");
    holder.innerHTML = backingPanelMarkup(projectStore.getSnapshot()).trim();
    const panel = holder.firstElementChild;
    if (!panel) return;

    chordPresetPanel.insertAdjacentElement("afterend", panel);
    const select = panel.querySelector("#backing-pattern-select");
    const description = panel.querySelector("[data-backing-pattern-description]");

    select?.addEventListener("change", (event) => {
      const patternId = event.target.value;
      const project = projectStore.getSnapshot();
      projectStore.updateInstruments(upsertBackingPattern(project.instruments, patternId));
      const pattern = getBackingPattern(patternId);
      if (description) description.textContent = pattern.description;

      const chordMessage = document.querySelector("#chord-message");
      if (chordMessage) {
        chordMessage.textContent = `Backing Patternを「${pattern.label}」に変更しました。Demo Playerで確認できます。`;
      }
    });
  }

  function installChordBackingObserver() {
    const target = document.querySelector("#screen");
    if (!target || chordBackingObserver) return;

    chordBackingObserver = new MutationObserver(() => {
      queueMicrotask(injectChordBackingPanel);
    });
    chordBackingObserver.observe(target, { childList: true, subtree: true });
    queueMicrotask(injectChordBackingPanel);
  }

  function bind() {
    document.querySelectorAll("[data-sound-preset]").forEach((select) => {
      select.addEventListener("change", (event) => {
        updateSelection(event.target.dataset.soundPreset, { preset: event.target.value });
      });
    });

    document.querySelectorAll("[data-sound-tone-part]").forEach((button) => {
      button.addEventListener("click", () => {
        updateSelection(button.dataset.soundTonePart, { tone: button.dataset.soundTone });
      });
    });
  }

  installChordBackingObserver();

  return { render, bind };
}
