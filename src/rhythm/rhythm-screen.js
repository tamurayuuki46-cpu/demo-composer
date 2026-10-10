import { getSections, sectionLabel, totalSectionBars } from "../core/section-ops.js";
import { chordSymbol } from "../chord/chord-theory.js";
import {
  applyDrumPreset,
  DRUM_PRESETS,
  getDrumPreset,
  hasEditableDrumsInBar
} from "./drum-presets.js";
import {
  bassPitchForBar,
  clearRhythmBar,
  copyRhythmBar,
  copyRhythmBeat,
  DRUM_PITCH,
  getTrackNotes,
  pitchName,
  toggleBassStep,
  toggleDrumStep
} from "./rhythm-grid.js";

const STEP_LABELS = [
  "1", "e", "&", "a",
  "2", "e", "&", "a",
  "3", "e", "&", "a",
  "4", "e", "&", "a"
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasNotesInRange(notes, startTick, durationTick) {
  const endTick = startTick + durationTick;
  return notes.some((note) => note.startTick >= startTick && note.startTick < endTick);
}

export function createRhythmController({ projectStore, rerender }) {
  let barIndex = 0;
  let beatIndex = 0;
  let selectedPresetId = DRUM_PRESETS[0].id;
  let message = "Bass / Kick / Snare / HHを16分音符16マスで入力します。";

  function metrics(project) {
    const barTicks = project.basic.ppq * 4;
    const highestNoteBar = project.tracks
      .flatMap((track) => track.notes ?? [])
      .reduce((highest, note) => Math.max(highest, Math.floor(note.startTick / barTicks)), -1);

    return {
      barTicks,
      stepTicks: barTicks / 16,
      beatTicks: barTicks / 4,
      barCount: Math.max(project.chords.length, highestNoteBar + 1, totalSectionBars(getSections(project)), 4)
    };
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, beatTicks, barCount } = metrics(project);
    barIndex = Math.min(barIndex, barCount - 1);

    const barStartTick = barIndex * barTicks;
    const beatStartTick = barStartTick + beatIndex * beatTicks;
    const visibleSteps = Array.from({ length: 16 }, (_, step) => step);
    const bassPitch = bassPitchForBar(project, barIndex);
    const bassNotes = getTrackNotes(project, "bass");
    const drumNotes = getTrackNotes(project, "drums");
    const hasRhythm = hasNotesInRange(bassNotes, barStartTick, barTicks)
      || hasNotesInRange(drumNotes, barStartTick, barTicks);
    const hasBeatRhythm = hasNotesInRange(bassNotes, beatStartTick, beatTicks)
      || hasNotesInRange(drumNotes, beatStartTick, beatTicks);
    const chord = project.chords[barIndex];
    const chordLabel = chord ? `${chordSymbol(chord.root, chord.quality)} (${chord.degree})` : `${project.basic.key} Root`;
    const beatCopyLabel = beatIndex < 3
      ? `Copy Beat → Beat ${beatIndex + 2}`
      : `Copy Beat → Bar ${barIndex + 2} Beat 1`;
    const selectedPreset = getDrumPreset(selectedPresetId);

    const rows = [
      { role: "bass", label: `Bass ${pitchName(bassPitch)}`, pitch: bassPitch, notes: bassNotes },
      { role: "drums", label: "Kick", pitch: DRUM_PITCH.kick, notes: drumNotes },
      { role: "drums", label: "Snare", pitch: DRUM_PITCH.snare, notes: drumNotes },
      { role: "drums", label: "HH", pitch: DRUM_PITCH.hh, notes: drumNotes }
    ];

    return `
      <section class="card rhythm-card">
        <div class="section-heading">
          <div>
            <h2>Rhythm</h2>
            <p>Bar ${barIndex + 1} / ${barCount} ・ ${escapeHtml(chordLabel)}${sectionLabel(project, barIndex) ? ` ・ ${escapeHtml(sectionLabel(project, barIndex))}` : ""}</p>
          </div>
          <button id="clear-rhythm-bar" class="small-action">Clear Bar</button>
        </div>

        <div class="melody-toolbar">
          <button id="rhythm-prev-bar"${barIndex === 0 ? " disabled" : ""}>← Bar</button>
          <span>Bar ${barIndex + 1}</span>
          <button id="rhythm-next-bar"${barIndex >= barCount - 1 ? " disabled" : ""}>Bar →</button>
        </div>

        <div class="rhythm-preset-panel">
          <label for="drum-preset-select">Drum Preset</label>
          <div class="rhythm-preset-controls">
            <select id="drum-preset-select" aria-label="Drum Preset">
              ${DRUM_PRESETS.map((preset) => `<option value="${preset.id}"${preset.id === selectedPresetId ? " selected" : ""}>${escapeHtml(preset.label)}</option>`).join("")}
            </select>
            <button id="apply-drum-preset">適用</button>
          </div>
          <small>${escapeHtml(selectedPreset.description)}</small>
        </div>

        <div class="rhythm-beat-switch" role="group" aria-label="Copy元Beat選択">
          ${[0, 1, 2, 3].map((beat) => `<button data-rhythm-beat="${beat}" class="${beatIndex === beat ? "active" : ""}">Beat ${beat + 1}</button>`).join("")}
        </div>

        <div class="rhythm-grid" aria-label="16分音符16ステップRhythm Grid">
          <div class="rhythm-row rhythm-header">
            <span class="rhythm-label"></span>
            ${visibleSteps.map((step) => `<span class="${step % 4 === 0 ? "beat-start" : ""}">${STEP_LABELS[step]}</span>`).join("")}
          </div>
          ${rows.map((row) => `
            <div class="rhythm-row">
              <span class="rhythm-label">${escapeHtml(row.label)}</span>
              ${visibleSteps.map((step) => {
                const startTick = barStartTick + step * stepTicks;
                const active = row.role === "bass"
                  ? row.notes.some((note) => note.startTick === startTick)
                  : row.notes.some((note) => note.startTick === startTick && note.pitch === row.pitch);
                const beatStartClass = step % 4 === 0 ? " beat-start" : "";
                const selectedBeatClass = Math.floor(step / 4) === beatIndex ? " selected-beat" : "";
                return `<button class="rhythm-cell${beatStartClass}${selectedBeatClass}${active ? " active" : ""}" data-rhythm-role="${row.role}" data-rhythm-pitch="${row.pitch}" data-rhythm-step="${step}" aria-label="${escapeHtml(row.label)} ${STEP_LABELS[step]}"></button>`;
              }).join("")}
            </div>
          `).join("")}
        </div>

        <div class="rhythm-secondary-actions">
          <button id="copy-rhythm-next-beat"${hasBeatRhythm ? "" : " disabled"}>${beatCopyLabel}</button>
          <button id="copy-rhythm-next-bar"${hasRhythm ? "" : " disabled"}>Copy Bar → Bar ${barIndex + 2}</button>
          <button id="clear-all-bass"${bassNotes.length ? "" : " disabled"}>Clear Bass</button>
        </div>

        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
        <p class="hint">Presetは現在BarのKick / Snare / HHだけを置き換えます。適用後は16マスをタップして自由に修正できます。Bassは変更しません。</p>
      </section>
    `;
  }

  function bind() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, beatTicks, barCount } = metrics(project);
    const barStartTick = barIndex * barTicks;
    const beatStartTick = barStartTick + beatIndex * beatTicks;

    document.querySelector("#drum-preset-select")?.addEventListener("change", (event) => {
      selectedPresetId = event.target.value;
      rerender("rhythm");
    });

    document.querySelector("#apply-drum-preset")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const bassNotes = getTrackNotes(latest, "bass");
      const drumNotes = getTrackNotes(latest, "drums");

      if (
        hasEditableDrumsInBar(drumNotes, { barStartTick, barDurationTick: barTicks })
        && !globalThis.confirm(`Bar ${barIndex + 1} のKick / Snare / HHをプリセットで置き換えますか？`)
      ) {
        return;
      }

      const nextDrums = applyDrumPreset(drumNotes, {
        presetId: selectedPresetId,
        barStartTick,
        stepTicks
      });
      const preset = getDrumPreset(selectedPresetId);

      projectStore.updateRhythmNotes({ bassNotes, drumNotes: nextDrums });
      message = `Bar ${barIndex + 1} に「${preset.label}」を適用しました。16マスで修正できます。`;
      rerender("rhythm");
    });

    document.querySelectorAll("[data-rhythm-role]").forEach((button) => {
      button.addEventListener("click", () => {
        const role = button.dataset.rhythmRole;
        const pitch = Number(button.dataset.rhythmPitch);
        const step = Number(button.dataset.rhythmStep);
        const startTick = barStartTick + step * stepTicks;
        const latest = projectStore.getSnapshot();
        const bassNotes = getTrackNotes(latest, "bass");
        const drumNotes = getTrackNotes(latest, "drums");

        const nextBass = role === "bass"
          ? toggleBassStep(bassNotes, { pitch, startTick, durationTick: stepTicks })
          : bassNotes;
        const nextDrums = role === "drums"
          ? toggleDrumStep(drumNotes, { pitch, startTick, durationTick: stepTicks })
          : drumNotes;

        projectStore.updateRhythmNotes({ bassNotes: nextBass, drumNotes: nextDrums });
        beatIndex = Math.floor(step / 4);
        message = `${role === "bass" ? pitchName(pitch) : "Drum"} step ${step + 1} を更新しました。`;
        rerender("rhythm");
      });
    });

    document.querySelector("#clear-rhythm-bar")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const nextBass = clearRhythmBar(getTrackNotes(latest, "bass"), { barStartTick, barDurationTick: barTicks });
      const nextDrums = clearRhythmBar(getTrackNotes(latest, "drums"), { barStartTick, barDurationTick: barTicks });
      projectStore.updateRhythmNotes({ bassNotes: nextBass, drumNotes: nextDrums });
      message = `Bar ${barIndex + 1} のRhythmをクリアしました。`;
      rerender("rhythm");
    });

    document.querySelector("#copy-rhythm-next-beat")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const sourceBarIndex = barIndex;
      const sourceBeatIndex = beatIndex;
      const sourceBeatStartTick = sourceBarIndex * barTicks + sourceBeatIndex * beatTicks;
      const targetBeatIndex = sourceBeatIndex < 3 ? sourceBeatIndex + 1 : 0;
      const targetBarIndex = sourceBeatIndex < 3 ? sourceBarIndex : sourceBarIndex + 1;
      const targetBeatStartTick = targetBarIndex * barTicks + targetBeatIndex * beatTicks;
      const bassNotes = getTrackNotes(latest, "bass");
      const drumNotes = getTrackNotes(latest, "drums");
      const targetHasRhythm = hasNotesInRange(bassNotes, targetBeatStartTick, beatTicks)
        || hasNotesInRange(drumNotes, targetBeatStartTick, beatTicks);
      const targetLabel = targetBarIndex === sourceBarIndex
        ? `Beat ${targetBeatIndex + 1}`
        : `Bar ${targetBarIndex + 1} Beat ${targetBeatIndex + 1}`;

      if (targetHasRhythm && !globalThis.confirm(`${targetLabel} のRhythmを上書きしますか？`)) {
        return;
      }

      const nextBass = copyRhythmBeat(bassNotes, {
        sourceBeatStartTick,
        targetBeatStartTick,
        beatDurationTick: beatTicks,
        pitch: bassPitchForBar(latest, targetBarIndex)
      });
      const nextDrums = copyRhythmBeat(drumNotes, {
        sourceBeatStartTick,
        targetBeatStartTick,
        beatDurationTick: beatTicks
      });

      projectStore.updateRhythmNotes({ bassNotes: nextBass, drumNotes: nextDrums });
      message = `Bar ${sourceBarIndex + 1} Beat ${sourceBeatIndex + 1} → ${targetLabel} にRhythmをコピーしました。`;
      barIndex = targetBarIndex;
      beatIndex = targetBeatIndex;
      rerender("rhythm");
    });

    document.querySelector("#copy-rhythm-next-bar")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const sourceBarIndex = barIndex;
      const targetBarIndex = sourceBarIndex + 1;
      const targetBarStartTick = targetBarIndex * barTicks;
      const bassNotes = getTrackNotes(latest, "bass");
      const drumNotes = getTrackNotes(latest, "drums");
      const targetHasRhythm = hasNotesInRange(bassNotes, targetBarStartTick, barTicks)
        || hasNotesInRange(drumNotes, targetBarStartTick, barTicks);

      if (targetHasRhythm && !globalThis.confirm(`Bar ${targetBarIndex + 1} のRhythmを上書きしますか？`)) {
        return;
      }

      const nextBass = copyRhythmBar(bassNotes, {
        sourceBarStartTick: barStartTick,
        targetBarStartTick,
        barDurationTick: barTicks,
        pitch: bassPitchForBar(latest, targetBarIndex)
      });
      const nextDrums = copyRhythmBar(drumNotes, {
        sourceBarStartTick: barStartTick,
        targetBarStartTick,
        barDurationTick: barTicks
      });

      projectStore.updateRhythmNotes({ bassNotes: nextBass, drumNotes: nextDrums });
      message = `Bar ${sourceBarIndex + 1} → Bar ${targetBarIndex + 1} にRhythmをコピーしました。`;
      barIndex = targetBarIndex;
      rerender("rhythm");
    });

    document.querySelector("#clear-all-bass")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      projectStore.updateRhythmNotes({
        bassNotes: [],
        drumNotes: getTrackNotes(latest, "drums")
      });
      message = "Bassを全てクリアしました。Chordを変更できます。";
      rerender("rhythm");
    });

    document.querySelector("#rhythm-prev-bar")?.addEventListener("click", () => {
      barIndex = Math.max(0, barIndex - 1);
      rerender("rhythm");
    });

    document.querySelector("#rhythm-next-bar")?.addEventListener("click", () => {
      barIndex = Math.min(barCount - 1, barIndex + 1);
      rerender("rhythm");
    });

    document.querySelectorAll("[data-rhythm-beat]").forEach((button) => {
      button.addEventListener("click", () => {
        beatIndex = Math.min(3, Math.max(0, Number(button.dataset.rhythmBeat)));
        rerender("rhythm");
      });
    });
  }

  return { render, bind };
}
