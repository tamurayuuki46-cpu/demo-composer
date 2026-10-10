import { getSections, MAX_TOTAL_BARS, sectionLabel, totalSectionBars } from "../core/section-ops.js";
import { chordSymbol } from "../chord/chord-theory.js";
import { LENGTH_STEPS, noteValueLabel } from "../core/note-placement.js";
import { clearBar, copyMelodyBars, getMelodyNotes, getOctavePitches, hasMelodyInBars, pitchName, toggleMonophonicStep } from "./melody-grid.js";

const EIGHTH_LABELS = ["1", "&", "2", "&", "3", "&", "4", "&"];
const SIXTEENTH_LABELS = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pianoKeyClass(pitch) {
  return BLACK_PITCH_CLASSES.has(pitch % 12) ? "black" : "white";
}

export function createMelodyController({ projectStore, rerender }) {
  let barIndex = 0;
  let octave = 4;
  // 入力単位はUI状態のみ。project.jsonには保存しない（Noteはtickで保持するためSchema変更なし）
  let resolution = 8;
  let half = 0;
  // 次に置く音の長さ（マス数）。UI状態のみで、project.jsonには保存しない
  let lengthSteps = 1;
  let message = "セルをタップして8分音符を入力します。";

  function stepTickSize(barTicks) {
    return barTicks / resolution;
  }

  // 画面に出す8マス分の「小節内step番号」。8分=全8、16分=半小節ずつ（タップ幅を確保するため）
  function visibleStepNumbers() {
    return resolution === 8
      ? Array.from({ length: 8 }, (_, step) => step)
      : Array.from({ length: 8 }, (_, step) => half * 8 + step);
  }

  function stepLabel(step) {
    return resolution === 8 ? EIGHTH_LABELS[step] : SIXTEENTH_LABELS[step];
  }

  function isBeatStart(step) {
    return step % (resolution === 8 ? 2 : 4) === 0;
  }

  function metrics(project) {
    const barTicks = project.basic.ppq * 4;
    const highestNoteBar = getMelodyNotes(project).reduce(
      (highest, note) => Math.max(highest, Math.floor(note.startTick / barTicks)),
      -1
    );

    return {
      barTicks,
      stepTicks: stepTickSize(barTicks),
      barCount: Math.max(project.chords.length, highestNoteBar + 1, totalSectionBars(getSections(project)), 4)
    };
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    barIndex = Math.min(barIndex, barCount - 1);

    const notes = getMelodyNotes(project);
    const pitches = getOctavePitches(octave);
    const visibleSteps = visibleStepNumbers();
    const barStartTick = barIndex * barTicks;
    const chord = project.chords[barIndex];
    const chordLabel = chord ? `${chordSymbol(chord.root, chord.quality)} (${chord.degree})` : "コード未設定";

    // コピーできるか: コピー元にメロディがあり、コピー先が最大小節数(128)に収まる
    const canCopy = (bars) => hasMelodyInBars(notes, { barIndex, bars, barTicks })
      && barIndex + bars * 2 <= MAX_TOTAL_BARS;

    const gridRows = pitches.map((pitch) => {
      const name = pitchName(pitch);
      const keyClass = pianoKeyClass(pitch);

      return `
        <div class="melody-row">
          <span class="piano-key ${keyClass}" aria-hidden="true">${escapeHtml(name)}</span>
          ${visibleSteps.map((step) => {
            const startTick = barStartTick + step * stepTicks;
            const active = notes.some((note) => note.startTick === startTick && note.pitch === pitch);
            // 8分表示のとき、このマスの後半(16分位置)にも同じ高さの音があれば印を付ける
            // 長い音の途中のマス（前のマスから伸びている部分）
            const held = !active && notes.some((note) => note.pitch === pitch && note.startTick < startTick && note.startTick + note.durationTick > startTick);
            const hasSub = resolution === 8 && notes.some((note) => note.startTick === startTick + stepTicks / 2 && note.pitch === pitch);
            const beatStartClass = isBeatStart(step) ? " beat-start" : "";
            return `<button class="note-cell${beatStartClass}${active ? " active" : ""}${held ? " held" : ""}${hasSub ? " has-sub" : ""}" data-melody-pitch="${pitch}" data-melody-step="${step}" aria-label="${escapeHtml(name)} ${stepLabel(step)}"></button>`;
          }).join("")}
        </div>
      `;
    }).join("");

    return `
      <section class="card melody-card">
        <div class="section-heading">
          <div>
            <h2>Melody</h2>
            <p>Bar ${barIndex + 1} / ${barCount} ・ ${escapeHtml(chordLabel)}${sectionLabel(project, barIndex) ? ` ・ ${escapeHtml(sectionLabel(project, barIndex))}` : ""}</p>
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

        <div class="melody-mode-switch" role="group" aria-label="入力する音符の細かさ">
          <button data-melody-resolution="8" class="${resolution === 8 ? "active" : ""}">8分音符</button>
          <button data-melody-resolution="16" class="${resolution === 16 ? "active" : ""}">16分音符</button>
        </div>

        <div class="note-length" role="group" aria-label="入れる音の長さ">
          <span>音の長さ</span>
          <div class="note-length-buttons">
            ${LENGTH_STEPS.map((steps) => `<button data-melody-length="${steps}" class="${steps === lengthSteps ? "active" : ""}">${noteValueLabel(steps * stepTicks, project.basic.ppq)}</button>`).join("")}
          </div>
        </div>

        ${resolution === 16 ? `
        <div class="melody-mode-switch" role="group" aria-label="小節の前半 / 後半">
          <button data-melody-half="0" class="${half === 0 ? "active" : ""}">前半 1–2拍</button>
          <button data-melody-half="1" class="${half === 1 ? "active" : ""}">後半 3–4拍</button>
        </div>` : ""}

        <div class="melody-grid" aria-label="縦ピアノ付き${resolution === 8 ? "8" : "16"}分音符メロディグリッド">
          <div class="melody-row melody-header">
            <span class="piano-key-spacer" aria-hidden="true"></span>
            ${visibleSteps.map((step) => `<span class="${isBeatStart(step) ? "beat-start" : ""}">${stepLabel(step)}</span>`).join("")}
          </div>
          ${gridRows}
        </div>

        <div class="melody-secondary-actions">
          <button id="copy-melody-bar"${canCopy(1) ? "" : " disabled"}>Copy Bar → Bar ${barIndex + 2}</button>
          <button id="copy-melody-2bars"${canCopy(2) ? "" : " disabled"}>Copy 2小節 → Bar ${barIndex + 3}–${barIndex + 4}</button>
        </div>

        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
        <p class="hint">${resolution === 8
          ? "1小節を 1 &amp; 2 &amp; 3 &amp; 4 &amp; の8マスで表示します。"
          : "16分音符は半小節ずつ（1 e &amp; a 2 e &amp; a）表示します。前半 / 後半ボタンで切り替えます。"}左の縦ピアノを音程の目印にして入力し、同じ位置では1音だけ入力します。長い音は「音の長さ」を選んでからタップします（小節の終わりと次の音の手前までに収まります）。長さを変えるときは、別の長さを選んで同じマスをタップします。同じ長さでタップすると削除です。8分表示で下に太線があるマスは、その後半に16分音符があります。</p>
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
          durationTick: lengthSteps * stepTicks,
          limitTick: barStartTick + barTicks,
          resize: lengthSteps > 1
        });

        projectStore.updateMelodyNotes(nextNotes);
        message = `${pitchName(pitch)} / ${stepLabel(step)} を更新しました。（長さ: ${noteValueLabel(lengthSteps * stepTicks, latest.basic.ppq)}）`;
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-length]").forEach((button) => {
      button.addEventListener("click", () => {
        lengthSteps = Number(button.dataset.melodyLength);
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-resolution]").forEach((button) => {
      button.addEventListener("click", () => {
        resolution = Number(button.dataset.melodyResolution) === 16 ? 16 : 8;
        half = 0;
        message = resolution === 8
          ? "セルをタップして8分音符を入力します。"
          : "セルをタップして16分音符を入力します。";
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-half]").forEach((button) => {
      button.addEventListener("click", () => {
        half = Number(button.dataset.melodyHalf) === 1 ? 1 : 0;
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

    // 現在の小節（bars=2なら現在と次の小節）を、すぐ後ろへコピーする。モチーフの繰り返し用
    const copyForward = (bars) => {
      const latest = projectStore.getSnapshot();
      const notes = getMelodyNotes(latest);
      const targetBarIndex = barIndex + bars;

      if (
        hasMelodyInBars(notes, { barIndex: targetBarIndex, bars, barTicks })
        && !globalThis.confirm(`Bar ${targetBarIndex + 1}${bars > 1 ? `–${targetBarIndex + bars}` : ""} のメロディを上書きしますか？（↶ で戻せます）`)
      ) {
        return;
      }

      projectStore.updateMelodyNotes(copyMelodyBars(notes, {
        sourceBarIndex: barIndex,
        targetBarIndex,
        bars,
        barTicks
      }));
      message = `Bar ${barIndex + 1}${bars > 1 ? `–${barIndex + bars}` : ""} を Bar ${targetBarIndex + 1}${bars > 1 ? `–${targetBarIndex + bars}` : ""} へコピーしました。`;
      barIndex = targetBarIndex;
      rerender("melody");
    };

    document.querySelector("#copy-melody-bar")?.addEventListener("click", () => copyForward(1));
    document.querySelector("#copy-melody-2bars")?.addEventListener("click", () => copyForward(2));

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
  }

  return { render, bind };
}
