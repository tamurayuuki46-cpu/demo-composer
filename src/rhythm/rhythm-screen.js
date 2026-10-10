import { getSections, sectionAtBar, sectionRanges, sectionLabel, totalSectionBars } from "../core/section-ops.js";
import { chordSymbol } from "../chord/chord-theory.js";
import { LENGTH_STEPS, noteValueLabel } from "../core/note-placement.js";
import {
  applyDrumPreset,
  applyDrumPresetToBars,
  hasEditableDrumsInBars,
  DRUM_PRESETS,
  getDrumPreset,
  hasEditableDrumsInBar
} from "./drum-presets.js";
import { DRUM_FILLS, applyDrumFill, applyDrumFillToSectionEnds, getDrumFill } from "./drum-fills.js";
import { applyBassCandidate, bassCandidatesForBar, bassPatternDots } from "./bass-candidates.js";
import {
  bassChoicesForBar,
  bassRoleForPitch,
  MAX_BASS_SHIFT,
  bassPitchForBar,
  bassShortLabel,
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
  let bassChoiceId = "root";
  let bassShift = 0;
  // 次に置くBassの長さ（16分のマス数）。UI状態のみ
  let bassLength = 1;
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
    const bassChoices = bassChoicesForBar(project, barIndex);
    const bassChoice = bassChoices.find((choice) => choice.id === bassChoiceId) ?? bassChoices[0];
    const bassPitch = bassPitchForBar(project, barIndex) + bassChoice.semitones + bassShift;
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
    // この小節が属するSection（Arrangeで構成を決めているときだけ）。Drum PresetをSection全体へ適用できる
    const sections = getSections(project);
    const currentSection = sectionAtBar(sections, barIndex);

    const bassCandidates = bassCandidatesForBar(project, barIndex, { barTicks, stepTicks });

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
          ${currentSection ? `<button id="apply-drum-preset-section" class="rhythm-preset-section">${escapeHtml(currentSection.section.name)}（Bar ${currentSection.startBar + 1}–${currentSection.endBar}）全体に適用</button>` : ""}
          <small>${escapeHtml(selectedPreset.description)}</small>
        </div>

        <div class="drum-fill-panel">
          <h3>ドラムフィル</h3>
          <small>${currentSection ? `${escapeHtml(currentSection.section.name)}の最後（Bar ${currentSection.endBar}）の後半だけを変えます。` : "Sectionが無いので、この小節の後半だけを変えます。"}</small>
          <div class="drum-fill-buttons">
            ${DRUM_FILLS.map((fill) => `<button data-drum-fill="${fill.id}">${escapeHtml(fill.label)}</button>`).join("")}
          </div>
          ${sections.length >= 2 ? `<button id="apply-fill-section-ends" class="drum-fill-all">各Sectionの最後に入れる（最後のSectionを除く）</button>` : ""}
          <small>${DRUM_FILLS.map((fill) => `${escapeHtml(fill.label)}: ${escapeHtml(fill.description)}`).join("<br />")}</small>
        </div>

        <div class="bass-candidate-panel">
          <h3>Bass候補（5タイプ）</h3>
          ${bassCandidates.map((candidate, index) => `
            <button class="bass-candidate" data-bass-candidate="${index}">
              <strong>${escapeHtml(candidate.label)}</strong>
              <span class="bass-candidate-dots" aria-hidden="true">${bassPatternDots(candidate.steps)}</span>
              <small>${escapeHtml(candidate.description)}</small>
            </button>
          `).join("")}
          <small>押すとこの小節のBassが置き換わります（↶ で戻せます）。あとから16マスで1音ずつ直せます。</small>
        </div>

        <div class="rhythm-beat-switch" role="group" aria-label="Copy元Beat選択">
          ${[0, 1, 2, 3].map((beat) => `<button data-rhythm-beat="${beat}" class="${beatIndex === beat ? "active" : ""}">Beat ${beat + 1}</button>`).join("")}
        </div>

        <div class="bass-choice" role="group" aria-label="Bassの音程">
          <span>Bassの音程</span>
          <div class="bass-choice-buttons">
            ${bassChoices.map((choice) => `<button data-bass-choice="${choice.id}" class="${choice.id === bassChoice.id ? "active" : ""}">${escapeHtml(choice.label)}</button>`).join("")}
          </div>
        </div>

        <div class="note-length" role="group" aria-label="Bassの音の長さ">
          <span>Bassの長さ</span>
          <div class="note-length-buttons">
            ${LENGTH_STEPS.map((steps) => `<button data-bass-length="${steps}" class="${steps === bassLength ? "active" : ""}">${noteValueLabel(steps * stepTicks, project.basic.ppq)}</button>`).join("")}
          </div>
        </div>

        <div class="bass-shift" role="group" aria-label="Bassを半音ずらす">
          <span>半音ずらし</span>
          <button id="bass-shift-down" aria-label="半音下げる"${bassShift <= -MAX_BASS_SHIFT ? " disabled" : ""}>−</button>
          <strong>${bassShift === 0 ? "なし" : (bassShift > 0 ? `+${bassShift}` : bassShift)}</strong>
          <button id="bass-shift-up" aria-label="半音上げる"${bassShift >= MAX_BASS_SHIFT ? " disabled" : ""}>＋</button>
        </div>
        <p class="bass-legend"><span><i class="main"></i>主役（ルート・5度）</span><span><i class="ornament"></i>飾り（3度・7度・ずらした音）</span></p>

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
                const bassNote = row.role === "bass" ? row.notes.find((note) => note.startTick === startTick) : null;
                // 長いBassの途中のマス（前のマスから伸びている部分）
                const bassHeldNote = row.role === "bass" && !bassNote
                  ? row.notes.find((note) => note.startTick < startTick && note.startTick + note.durationTick > startTick)
                  : null;
                const heldMark = bassHeldNote ? ` data-bass-held data-bass-role="${bassRoleForPitch(project, barIndex, bassHeldNote.pitch)}"` : "";
                const bassMark = bassNote ? ` data-bass-mark="${escapeHtml(bassShortLabel(project, barIndex, bassNote.pitch))}" data-bass-role="${bassRoleForPitch(project, barIndex, bassNote.pitch)}"` : "";
                const beatStartClass = step % 4 === 0 ? " beat-start" : "";
                const selectedBeatClass = Math.floor(step / 4) === beatIndex ? " selected-beat" : "";
                return `<button class="rhythm-cell${beatStartClass}${selectedBeatClass}${active ? " active" : ""}" data-rhythm-role="${row.role}" data-rhythm-pitch="${row.pitch}" data-rhythm-step="${step}"${bassMark}${heldMark} aria-label="${escapeHtml(row.label)} ${STEP_LABELS[step]}"></button>`;
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

    document.querySelectorAll("[data-bass-candidate]").forEach((button) => {
      button.addEventListener("click", () => {
        const latest = projectStore.getSnapshot();
        const candidate = bassCandidatesForBar(latest, barIndex, { barTicks, stepTicks })[Number(button.dataset.bassCandidate)];
        if (!candidate) return;
        const bassNotes = getTrackNotes(latest, "bass");

        if (
          hasNotesInRange(bassNotes, barStartTick, barTicks)
          && !globalThis.confirm(`Bar ${barIndex + 1} のBassを「${candidate.label}」で置き換えますか？（↶ で戻せます）`)
        ) {
          return;
        }

        projectStore.updateRhythmNotes({
          bassNotes: applyBassCandidate(latest, bassNotes, barIndex, candidate, {
            barTicks,
            stepTicks,
            createId: () => globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`
          }),
          drumNotes: getTrackNotes(latest, "drums")
        });
        message = `Bar ${barIndex + 1} のBassを「${candidate.label}」にしました。`;
        rerender("rhythm");
      });
    });

    document.querySelectorAll("[data-drum-fill]").forEach((button) => {
      button.addEventListener("click", () => {
        const latest = projectStore.getSnapshot();
        const fill = getDrumFill(button.dataset.drumFill);
        const range = sectionAtBar(getSections(latest), barIndex);
        const targetBar = range ? range.endBar - 1 : barIndex;

        projectStore.updateRhythmNotes({
          bassNotes: getTrackNotes(latest, "bass"),
          drumNotes: applyDrumFill(getTrackNotes(latest, "drums"), {
            fillId: fill.id,
            barStartTick: targetBar * barTicks,
            stepTicks
          })
        });
        message = `Bar ${targetBar + 1} の後半に「${fill.label}」を入れました。（↶ で戻せます）`;
        rerender("rhythm");
      });
    });

    document.querySelector("#apply-fill-section-ends")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const fill = getDrumFill(DRUM_FILLS[0].id);
      const ranges = sectionRanges(getSections(latest));
      if (ranges.length < 2) return;
      if (!globalThis.confirm(`最後のSectionを除く${ranges.length - 1}か所のSection最後の小節（後半）に「${fill.label}」を入れますか？（↶ で戻せます）`)) return;

      projectStore.updateRhythmNotes({
        bassNotes: getTrackNotes(latest, "bass"),
        drumNotes: applyDrumFillToSectionEnds(getTrackNotes(latest, "drums"), { fillId: fill.id, ranges, barTicks, stepTicks })
      });
      message = `${ranges.length - 1}か所のSection最後に「${fill.label}」を入れました。`;
      rerender("rhythm");
    });

    document.querySelector("#apply-drum-preset-section")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const range = sectionAtBar(getSections(latest), barIndex);
      if (!range) return;

      const bassNotes = getTrackNotes(latest, "bass");
      const drumNotes = getTrackNotes(latest, "drums");
      const preset = getDrumPreset(selectedPresetId);

      if (
        hasEditableDrumsInBars(drumNotes, { startBar: range.startBar, endBar: range.endBar, barTicks })
        && !globalThis.confirm(`${range.section.name}（Bar ${range.startBar + 1}–${range.endBar}）のKick / Snare / HHを「${preset.label}」で置き換えますか？（↶ で戻せます）`)
      ) {
        return;
      }

      projectStore.updateRhythmNotes({
        bassNotes,
        drumNotes: applyDrumPresetToBars(drumNotes, {
          presetId: selectedPresetId,
          startBar: range.startBar,
          endBar: range.endBar,
          barTicks,
          stepTicks
        })
      });
      message = `${range.section.name}（Bar ${range.startBar + 1}–${range.endBar}）全体に「${preset.label}」を適用しました。`;
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
          ? toggleBassStep(bassNotes, {
            pitch,
            startTick,
            durationTick: bassLength * stepTicks,
            limitTick: barStartTick + barTicks,
            resize: bassLength > 1
          })
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
        pitchShift: bassPitchForBar(latest, targetBarIndex) - bassPitchForBar(latest, sourceBarIndex)
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
        pitchShift: bassPitchForBar(latest, targetBarIndex) - bassPitchForBar(latest, sourceBarIndex)
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

    document.querySelectorAll("[data-bass-length]").forEach((button) => {
      button.addEventListener("click", () => {
        bassLength = Number(button.dataset.bassLength);
        rerender("rhythm");
      });
    });

    document.querySelectorAll("[data-bass-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        bassChoiceId = button.dataset.bassChoice;
        bassShift = 0;
        rerender("rhythm");
      });
    });

    document.querySelector("#bass-shift-down")?.addEventListener("click", () => {
      bassShift = Math.max(-MAX_BASS_SHIFT, bassShift - 1);
      rerender("rhythm");
    });

    document.querySelector("#bass-shift-up")?.addEventListener("click", () => {
      bassShift = Math.min(MAX_BASS_SHIFT, bassShift + 1);
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