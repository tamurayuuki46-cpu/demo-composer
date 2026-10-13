import { chordSymbol } from "./chord-theory.js";
import {
  SCALE_PANEL_LEVELS,
  getScaleFamily,
  isScaleFamilyAvailable,
  scaleFamilyGroups,
  scaleLevelRows,
  scaleSetChords
} from "./chord-scale-sets.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// 選択中のスケール（曲のScaleに無い系統が残っていたら、先頭＝ダイアトニックへ戻す）
export function resolveScaleFamilyId(scale, familyId) {
  return isScaleFamilyAvailable(scale, familyId) ? familyId : scaleFamilyGroups(scale)[0].families[0].id;
}

// 3和音 / 7th の固定表があるのは、ダイアトニックとハーモニック / メロディックマイナーだけ。それ以外は「度ごとの一覧」
function usesGrid(family, levelId) {
  return !family.generic && (levelId === "triad" || levelId === "seventh");
}

function scaleOptionLabel(key, family) {
  return `${key} ${family.mode}`;
}

// Chord画面の「スケール系のコード」パネル。開閉・スケール・段階は画面の状態（保存しない）。
export function chordScaleSetsHtml({ project, open, familyId, level }) {
  const { key, scale } = project.basic;
  const header = `<button id="toggle-scale-sets" class="spice-toggle" aria-expanded="${open}">🎼 スケール系のコード（7th・テンション・特殊和音）${open ? " ▲" : " ▼"}</button>`;
  if (!open) return header;

  const activeId = resolveScaleFamilyId(scale, familyId);
  const family = getScaleFamily(activeId);
  const activeLevel = SCALE_PANEL_LEVELS.find((item) => item.id === level) ?? SCALE_PANEL_LEVELS[1];
  const grid = usesGrid(family, activeLevel.id);

  const body = grid
    ? `<div class="chord-candidates">
        ${scaleSetChords({ key, familyId: activeId, level: activeLevel.id }).map((chord, index) => `
          <button class="candidate-chord" data-scale-chord="${index}">
            <strong>${escapeHtml(chord.symbol)}</strong>
            <span>${escapeHtml(chord.degree)}</span>
          </button>
        `).join("")}
      </div>`
    : `<div class="scale-tension-rows">
        ${scaleLevelRows({ key, familyId: activeId, level: activeLevel.id }).map((row) => `
          <div class="scale-tension-row">
            <h4>${escapeHtml(row.base)}　<small>${escapeHtml(chordSymbol(row.root, "major"))}</small></h4>
            <div class="chord-candidates">
              ${row.chords.length === 0 ? `<span class="hint">このスケールの音だけで作れるコードはありません</span>` : row.chords.map((chord) => `
                <button class="candidate-chord" data-scale-row="${row.index}:${chord.quality}">
                  <strong>${escapeHtml(chord.symbol)}</strong>
                  <span>${escapeHtml(chord.degree)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>`;

  return `
    ${header}
    <section class="chord-scale-sets" aria-label="スケール系のコード">
      <label class="scale-set-select">スケール
        <select id="scale-family-select">
          ${scaleFamilyGroups(scale).map((group) => `
            <optgroup label="${escapeHtml(group.label)}">
              ${group.families.map((item) => `<option value="${item.id}" ${item.id === activeId ? "selected" : ""}>${escapeHtml(scaleOptionLabel(key, item))}</option>`).join("")}
            </optgroup>
          `).join("")}
        </select>
      </label>
      <div class="scale-set-tabs scale-set-levels" role="group" aria-label="コードの段階">
        ${SCALE_PANEL_LEVELS.map((item) => `<button type="button" data-scale-level="${item.id}" class="${item.id === activeLevel.id ? "active" : ""}" aria-pressed="${item.id === activeLevel.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <p class="hint">${escapeHtml(scaleOptionLabel(key, family))}（${family.intervals.length}音）。${grid ? "7つのコード。" : "このスケールの音だけで作れるコードを、度ごとにすべて表示します。"}${escapeHtml(activeLevel.note)}</p>
      ${body}
    </section>
  `;
}
