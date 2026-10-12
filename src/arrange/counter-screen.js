// 「裏メロ」タブ: 範囲（開始小節 + 長さ、またはSection）を選び、10タイプの候補を聴いて当てる。
// 候補の生成は src/core/counter-melody.js（Arrangeの各Sectionの裏メロと同じもの）。保存先は tracks[role=counter]。
import { COUNTER_MOTIONS, counterBarCount, counterCandidates, counterNotes } from "../core/counter-melody.js";
import { whyHtml } from "../core/why-ui.js";
import { getSections, sectionRanges } from "../core/section-ops.js";

const BAR_CHOICES = Object.freeze([2, 4, 8, 16]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// 曲の長さ（小節）: コード・メロディ・構成のうち、いちばん長いもの
function totalBars(project) {
  const barTicks = project.basic.ppq * 4;
  const melody = project.tracks.find((track) => track.role === "melody")?.notes ?? [];
  const melodyBars = melody.reduce((max, note) => Math.max(max, Math.ceil((note.startTick + note.durationTick) / barTicks)), 0);
  const sectionBars = getSections(project).reduce((sum, section) => sum + section.bars, 0);
  return Math.max(project.chords.length, melodyBars, sectionBars);
}

// scaleGroups(project) → [{ label, families: [{ id, label, mode, intervals }] }] / null のとき特性音のスケール選択は出さない
export function createCounterController({ projectStore, rerender, onPreview, scaleGroups = null }) {
  let startBar = 0;
  let characterScaleId = null;
  let motion = "contrary";
  let bars = 4;
  let message = "範囲を選んで、裏メロの候補を聴き比べます。メインメロディの隙間やコードに合わせて作ります。";

  function range(project) {
    const total = Math.max(1, totalBars(project));
    const start = Math.min(startBar, total - 1);
    return { startBar: start, endBar: Math.min(total, start + bars), total };
  }

  function findScale(project) {
    if (!scaleGroups || !characterScaleId) return null;
    for (const group of scaleGroups(project)) {
      const family = group.families.find((item) => item.id === characterScaleId);
      if (family) return family;
    }
    return null;
  }

  function candidatesFor(project) {
    const { startBar: from, endBar: to } = range(project);
    try {
      return { candidates: counterCandidates(project, { startBar: from, endBar: to, characterScale: findScale(project), motion }), error: null };
    } catch (error) {
      return { candidates: [], error: error instanceof Error ? error.message : "候補を作れませんでした。" };
    }
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { startBar: from, endBar: to, total } = range(project);
    const { candidates, error } = candidatesFor(project);
    const filled = counterBarCount(project, from, to);
    const sections = sectionRanges(getSections(project));
    const matchedSection = sections.find((item) => item.startBar === from && item.endBar === to);

    return `
      <section class="card counter-card">
        <div class="section-heading">
          <div>
            <h2>裏メロ</h2>
            <p>メインメロディのもう1本の旋律を作ります。10タイプ（スケールの特性音型・対位の動きを含む）を聴き比べて、範囲に当てます。</p>
          </div>
        </div>

        <p id="counter-message" class="status-message" aria-live="polite">${escapeHtml(message)}</p>

        ${sections.length > 0 ? `
          <label class="field">
            <span>Sectionから選ぶ</span>
            <select id="counter-section">
              <option value="">自分で範囲を選ぶ</option>
              ${sections.map((item) => `<option value="${item.index}"${matchedSection?.index === item.index ? " selected" : ""}>${escapeHtml(item.section.name)}（${item.startBar + 1}〜${item.endBar}小節）</option>`).join("")}
            </select>
          </label>
        ` : ""}

        <div class="counter-controls">
          <label class="field">
            <span>どこから</span>
            <select id="counter-start">
              ${Array.from({ length: total }, (_, index) => `<option value="${index}"${index === from ? " selected" : ""}>${index + 1}小節目から</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>長さ</span>
            <select id="counter-bars">
              ${[...new Set([...BAR_CHOICES, bars])].sort((a, b) => a - b).map((choice) => `<option value="${choice}"${choice === bars ? " selected" : ""}>${choice}小節</option>`).join("")}
            </select>
          </label>
        </div>

        <p class="hint">${from + 1}〜${to}小節。${filled > 0 ? `いまの裏メロが${filled}小節に入っています（当てるとこの範囲だけ置き換わり、↶で戻せます）。` : "この範囲にはまだ裏メロがありません。"}</p>

        ${scaleGroups ? `
          <label class="field">
            <span>Character（特性音型）のスケール</span>
            <select id="counter-character-scale">
              <option value=""${characterScaleId ? "" : " selected"}>おまかせ（${project.basic.scale === "minor" ? "Dorian" : "Lydian"}）</option>
              ${scaleGroups(project).map((group) => `
                <optgroup label="${escapeHtml(group.label)}">
                  ${group.families.map((family) => `<option value="${family.id}"${family.id === characterScaleId ? " selected" : ""}>${escapeHtml(`${project.basic.key} ${family.mode}`)}</option>`).join("")}
                </optgroup>
              `).join("")}
            </select>
          </label>
        ` : ""}

        <label class="field">
          <span>Motion（対位の動き）</span>
          <select id="counter-motion">
            ${COUNTER_MOTIONS.map((item) => `<option value="${item.id}"${item.id === motion ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>

        ${error ? `<p class="hint">${escapeHtml(error)}</p>` : `
          <div class="counter-candidates">
            ${candidates.map((candidate) => `
              <div class="counter-pick">
                <strong>${escapeHtml(candidate.label)}</strong>
                ${whyHtml(candidate.description)}
                <div class="counter-pick-actions">
                  <button type="button" data-counter-play="${candidate.id}"${candidate.notes.length > 0 ? "" : " disabled"}>▶ 聴く</button>
                  <button type="button" class="primary" data-counter-apply="${candidate.id}"${candidate.notes.length > 0 ? "" : " disabled"}>これにする</button>
                </div>
                ${candidate.notes.length === 0 ? `<small>この範囲では置ける場所がありません（メロディが詰まっています）。</small>` : ""}
              </div>
            `).join("")}
          </div>
        `}

        ${filled > 0 ? `<button type="button" class="danger" id="counter-clear">この範囲の裏メロを消す</button>` : ""}
        <p class="hint">裏メロは ${counterNotes(project).length} 音あります。Demo Playerの「パート」で裏メロだけミュートして聴き比べられます。Piano Rollでの手入力は、今後の追加候補です。</p>
      </section>
    `;
  }

  function bind() {
    const rerenderCounter = () => rerender("counter");

    document.querySelector("#counter-section")?.addEventListener("change", (event) => {
      const project = projectStore.getSnapshot();
      const item = sectionRanges(getSections(project))[Number(event.target.value)];
      if (!item) return;
      startBar = item.startBar;
      bars = item.endBar - item.startBar;
      rerenderCounter();
    });
    document.querySelector("#counter-start")?.addEventListener("change", (event) => {
      startBar = Number(event.target.value);
      rerenderCounter();
    });
    document.querySelector("#counter-character-scale")?.addEventListener("change", (event) => {
      characterScaleId = event.target.value || null;
      rerenderCounter();
    });
    document.querySelector("#counter-motion")?.addEventListener("change", (event) => {
      motion = event.target.value;
      rerenderCounter();
    });
    document.querySelector("#counter-bars")?.addEventListener("change", (event) => {
      bars = Number(event.target.value);
      rerenderCounter();
    });

    const candidateFor = (styleId) => candidatesFor(projectStore.getSnapshot()).candidates.find((item) => item.id === styleId);

    document.querySelectorAll("[data-counter-play]").forEach((button) => {
      button.addEventListener("click", () => {
        const project = projectStore.getSnapshot();
        const candidate = candidateFor(button.dataset.counterPlay);
        const { startBar: from, endBar: to } = range(project);
        if (candidate) onPreview(from, to, candidate.notes);
      });
    });

    document.querySelectorAll("[data-counter-apply]").forEach((button) => {
      button.addEventListener("click", () => {
        const project = projectStore.getSnapshot();
        const candidate = candidateFor(button.dataset.counterApply);
        const { startBar: from, endBar: to } = range(project);
        if (!candidate) return;
        try {
          projectStore.applyCounterMelody({ startBar: from, endBar: to, notes: candidate.notes });
          message = `「${candidate.label}」を${from + 1}〜${to}小節に入れました。↶で戻せます。`;
        } catch (error) {
          message = error instanceof Error ? error.message : "裏メロを入れられませんでした。";
        }
        rerenderCounter();
      });
    });

    document.querySelector("#counter-clear")?.addEventListener("click", () => {
      const project = projectStore.getSnapshot();
      const { startBar: from, endBar: to } = range(project);
      try {
        projectStore.applyCounterMelody({ startBar: from, endBar: to, notes: [] });
        message = `${from + 1}〜${to}小節の裏メロを消しました。↶で戻せます。`;
      } catch (error) {
        message = error instanceof Error ? error.message : "消せませんでした。";
      }
      rerenderCounter();
    });
  }

  return { render, bind };
}
