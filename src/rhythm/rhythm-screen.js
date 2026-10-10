import { chordSymbol } from "../chord/chord-theory.js";
import {
  bassPitchForBar,
  clearRhythmBar,
  copyRhythmBar,
  DRUM_PITCH,
  getTrackNotes,
  pitchName,
  toggleBassStep,
  toggleDrumStep
} from "./rhythm-grid.js";

const STEP_SUBDIVISION_LABELS = ["e", "&", "a"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasNotesInBar(notes, barStartTick, barDurationTick) {
  const barEndTick = barStartTick + barDurationTick;
  return notes.some((note) => note.startTick >= barStartTick && note.startTick < barEndTick);
}

export function createRhythmController({ projectStore, rerender }) {
  let barIndex = 0;
  let beatIndex = 0;
  let message = "Bass / Kick / Snare / HHを同じ画面で入力します。";

  function metrics(project) {
    const barTicks = project.basic.ppq * 4;
    const highestNoteBar = project.tracks
      .flatMap((track) => track.notes ?? [])
      .reduce((highest, note) => Math.max(highest, Math.floor(note.startTick / barTicks)), -1);

    return {
      barTicks,
      stepTicks: barTicks / 16,
      barCount: Math.max(project.chords.length, highestNoteBar + 1, 4)
    };
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    barIndex = Math.min(barIndex, barCount - 1);

    const barStartTick = barIndex * barTicks;
    const firstStep = beatIndex * 4;
    const visibleSteps = [firstStep, firstStep + 1, firstStep + 2, firstStep + 3];
    const bassPitch = bassPitchForBar(project, barIndex);
    const bassNotes = getTrackNotes(project, "bass");
    const drumNotes = getTrackNotes(project, "drums");
    const hasRhythm = hasNotesInBar(bassNotes, barStartTick, barTicks)
      || hasNotesInBar(drumNotes, barStartTick, barTicks);
    const chord = project.chords[barIndex];
    const chordLabel = chord ? `${chordSymbol(chord.root, chord.quality)} (${chord.degree})` : `${project.basic.key} Root`;
    const stepLabels = [String(beatIndex + 1), ...STEP_SUBDIVISION_LABELS];

    const rows = [
      { role: "bass", label: `Bass ${pitchName(bassPitch)}`, pitch: bassPitch, notes: bassNotes },
      { role: "drums", label: "Kick", pitch: DRUM_PITCH.kick, notes: drumNotes },
      { role: "drums", label: "Snare", pitch: DRUM_PITCH.snare, notes: drumNotes },
      { role: "drums", label: "HH", pitch: DRUM_PITCH.hh, notes: drumNotes }
    ];

    return `
      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Rhythm</h2>
            <p>Bar ${barIndex + 1} / ${barCount} ・ ${escapeHtml(chordLabel)}</p>
          </div>
          <button id="clear-rhythm-bar" class="small-action">Clear Bar</button>
        </div>

        <div class="melody-toolbar">
          <button id="rhythm-prev-bar"${barIndex === 0 ? " disabled" : ""}>← Bar</button>
          <span>Bar ${barIndex + 1}</span>
          <button id="rhythm-next-bar"${barIndex >= barCount - 1 ? " disabled" : ""}>Bar →</button>
        </div>

        <div class="rhythm-beat-switch" role="group" aria-label="Beat選択">
          ${[0, 1, 2, 3].map((beat) => `<button data-rhythm-beat="${beat}" class="${beatIndex === beat ? "active" : ""}">Beat ${beat + 1}</button>`).join("")}
        </div>

        <div class="rhythm-grid">
          <div class="rhythm-row rhythm-header">
            <span class="rhythm-label"></span>
            ${stepLabels.map((label) => `<span>${label}</span>`).join("")}
          </div>
          ${rows.map((row) => `
            <div class="rhythm-row">
              <span class="rhythm-label">${escapeHtml(row.label)}</span>
              ${visibleSteps.map((step) => {
                const startTick = barStartTick + step * stepTicks;
                const active = row.role === "bass"
                  ? row.notes.some((note) => note.startTick === startTick)
                  : row.notes.some((note) => note.startTick === startTick && note.pitch === row.pitch);
                return `<button class="rhythm-cell${active ? " active" : ""}" data-rhythm-role="${row.role}" data-rhythm-pitch="${row.pitch}" data-rhythm-step="${step}" aria-label="${escapeHtml(row.label)} step ${step + 1}"></button>`;
              }).join("")}
            </div>
          `).join("")}
        </div>

        <div class="rhythm-secondary-actions">
          <button id="copy-rhythm-next-bar"${hasRhythm ? "" : " disabled"}>Copy → Bar ${barIndex + 2}</button>
          <button id="clear-all-bass"${bassNotes.length ? "" : " disabled"}>Clear Bass</button>
        </div>

        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
        <p class="hint">Copyは現在BarのBass / Drumsを次Barへ複製します。Bassはコピー先のChord Root（Chord未設定時はKey Root）へ自動追従します。</p>
      </section>
    `;
  }

  function bind() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    const barStartTick = barIndex * barTicks;

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

    document.querySelector("#copy-rhythm-next-bar")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const sourceBarIndex = barIndex;
      const targetBarIndex = sourceBarIndex + 1;
      const targetBarStartTick = targetBarIndex * barTicks;
      const bassNotes = getTrackNotes(latest, "bass");
      const drumNotes = getTrackNotes(latest, "drums");
      const targetHasRhythm = hasNotesInBar(bassNotes, targetBarStartTick, barTicks)
        || hasNotesInBar(drumNotes, targetBarStartTick, barTicks);

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
