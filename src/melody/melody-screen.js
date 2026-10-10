import { chordSymbol } from "../chord/chord-theory.js";
import { clearBar, getMelodyNotes, getOctavePitches, pitchName, toggleMonophonicStep } from "./melody-grid.js";

const STEP_LABELS = ["1", "1&", "2", "2&", "3", "3&", "4", "4&"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createMelodyController({ projectStore, rerender }) {
  let barIndex = 0;
  let octave = 4;
  let stepPage = 0;
  let message = "セルをタップして8分音符を入力します。";

  function metrics(project) {
    const barTicks = project.basic.ppq * 4;
    return {
      barTicks,
      stepTicks: barTicks / 8,
      barCount: Math.max(project.chords.length, 4)
    };
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    barIndex = Math.min(barIndex, barCount - 1);

    const notes = getMelodyNotes(project);
    const pitches = getOctavePitches(octave);
    const firstStep = stepPage * 4;
    const visibleSteps = [firstStep, firstStep + 1, firstStep + 2, firstStep + 3];
    const barStartTick = barIndex * barTicks;
    const chord = project.chords[barIndex];
    const chordLabel = chord ? `${chordSymbol(chord.root, chord.quality)} (${chord.degree})` : "コード未設定";

    const gridRows = pitches.map((pitch) => `
      <div class="melody-row">
        <span class="pitch-label">${escapeHtml(pitchName(pitch))}</span>
        ${visibleSteps.map((step) => {
          const startTick = barStartTick + step * stepTicks;
          const active = notes.some((note) => note.startTick === startTick && note.pitch === pitch);
          return `<button class="note-cell${active ? " active" : ""}" data-melody-pitch="${pitch}" data-melody-step="${step}" aria-label="${escapeHtml(pitchName(pitch))} ${STEP_LABELS[step]}"></button>`;
        }).join("")}
      </div>
    `).join("");

    return `
      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Melody</h2>
            <p>Bar ${barIndex + 1} / ${barCount} ・ ${escapeHtml(chordLabel)}</p>
          </div>
          <button id="clear-melody-bar" class="small-action">Clear Bar</button>
        </div>

        <div class="melody-toolbar">
          <button id="melody-prev-bar"${barIndex === 0 ? " disabled" : ""}>← Bar</button>
          <span>Bar ${barIndex + 1}</span>
          <button id="melody-next-bar"${barIndex >= barCount - 1 ? " disabled" : ""}>Bar →</button>
        </div>

        <div class="melody-toolbar">
          <button id="melody-octave-down"${octave <= 2 ? " disabled" : ""}>Oct −</button>
          <span>C${octave}–B${octave}</span>
          <button id="melody-octave-up"${octave >= 6 ? " disabled" : ""}>Oct +</button>
        </div>

        <div class="step-page-switch" role="group" aria-label="小節内の表示範囲">
          <button data-step-page="0" class="${stepPage === 0 ? "active" : ""}">Beat 1–2</button>
          <button data-step-page="1" class="${stepPage === 1 ? "active" : ""}">Beat 3–4</button>
        </div>

        <div class="melody-grid">
          <div class="melody-row melody-header">
            <span class="pitch-label"></span>
            ${visibleSteps.map((step) => `<span>${STEP_LABELS[step]}</span>`).join("")}
          </div>
          ${gridRows}
        </div>

        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
        <p class="hint">同じステップでは1音だけ入力します。別の音をタップすると置き換わります。変更後はHubのSaveで保存してください。</p>
      </section>
    `;
  }

  function bind() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    const barStartTick = barIndex * barTicks;

    document.querySelectorAll("[data-melody-pitch]").forEach((button) => {
      button.addEventListener("click", () => {
        const pitch = Number(button.dataset.melodyPitch);
        const step = Number(button.dataset.melodyStep);
        const latest = projectStore.getSnapshot();
        const notes = getMelodyNotes(latest);
        const startTick = barStartTick + step * stepTicks;
        const nextNotes = toggleMonophonicStep(notes, {
          pitch,
          startTick,
          durationTick: stepTicks
        });

        projectStore.updateMelodyNotes(nextNotes);
        message = `${pitchName(pitch)} / ${STEP_LABELS[step]} を更新しました。`;
        rerender("melody");
      });
    });

    document.querySelector("#clear-melody-bar")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const nextNotes = clearBar(getMelodyNotes(latest), {
        barStartTick,
        barDurationTick: barTicks
      });
      projectStore.updateMelodyNotes(nextNotes);
      message = `Bar ${barIndex + 1} のメロディをクリアしました。`;
      rerender("melody");
    });

    document.querySelector("#melody-prev-bar")?.addEventListener("click", () => {
      barIndex = Math.max(0, barIndex - 1);
      rerender("melody");
    });

    document.querySelector("#melody-next-bar")?.addEventListener("click", () => {
      barIndex = Math.min(barCount - 1, barIndex + 1);
      rerender("melody");
    });

    document.querySelector("#melody-octave-down")?.addEventListener("click", () => {
      octave = Math.max(2, octave - 1);
      rerender("melody");
    });

    document.querySelector("#melody-octave-up")?.addEventListener("click", () => {
      octave = Math.min(6, octave + 1);
      rerender("melody");
    });

    document.querySelectorAll("[data-step-page]").forEach((button) => {
      button.addEventListener("click", () => {
        stepPage = Number(button.dataset.stepPage) === 1 ? 1 : 0;
        rerender("melody");
      });
    });
  }

  return { render, bind };
}
