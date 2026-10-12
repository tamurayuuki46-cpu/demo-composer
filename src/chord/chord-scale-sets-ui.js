import { chordSymbol } from "./chord-theory.js";
import { getScaleFamily, SCALE_SET_LEVELS, scaleFamiliesForProject, scaleSetChords, scaleTensionChords } from "./chord-scale-sets.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// 選択中のスケール系（曲のScaleに無い系統が残っていたら、先頭＝ダイアトニックへ戻す）
export function resolveScaleFamilyId(scale, familyId) {
  const families = scaleFamiliesForProject(scale);
  return families.some((family) => family.id === familyId) ? familyId : families[0].id;
}

// Chord画面の「スケール系のコード」パネル。開閉・系統・段階は画面の状態（保存しない）。
export function chordScaleSetsHtml({ project, open, familyId, level }) {
  const { key, scale } = project.basic;
  const header = `<button id="toggle-scale-sets" class="spice-toggle" aria-expanded="${open}">🎼 スケール系のコード（7th・テンション）${open ? " ▲" : " ▼"}</button>`;
  if (!open) return header;

  const families = scaleFamiliesForProject(scale);
  const activeId = resolveScaleFamilyId(scale, familyId);
  const family = getScaleFamily(activeId);
  const activeLevel = SCALE_SET_LEVELS.find((item) => item.id === level) ?? SCALE_SET_LEVELS[1];
  const isTension = activeLevel.id === "tension";
  const chords = isTension ? [] : scaleSetChords({ key, familyId: activeId, level: activeLevel.id });
  const tensionRows = isTension ? scaleTensionChords({ key, familyId: activeId }) : [];

  return `
    ${header}
    <section class="chord-scale-sets" aria-label="スケール系のコード">
      <div class="scale-set-tabs" role="group" aria-label="スケール系">
        ${families.map((item) => `<button type="button" data-scale-family="${item.id}" class="${item.id === activeId ? "active" : ""}" aria-pressed="${item.id === activeId}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <div class="scale-set-tabs scale-set-levels" role="group" aria-label="コードの段階">
        ${SCALE_SET_LEVELS.map((item) => `<button type="button" data-scale-level="${item.id}" class="${item.id === activeLevel.id ? "active" : ""}" aria-pressed="${item.id === activeLevel.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <p class="hint">${escapeHtml(key)} ${escapeHtml(family.mode)} の${isTension ? "音だけで作れるテンションコードを、度ごとにすべて表示します。" : "7つのコード。"}${escapeHtml(activeLevel.note)}</p>
      ${isTension ? `
        <div class="scale-tension-rows">
          ${tensionRows.map((row) => `
            <div class="scale-tension-row">
              <h4>${escapeHtml(row.base)}　<small>${escapeHtml(chordSymbol(row.root, "major"))}</small></h4>
              <div class="chord-candidates">
                ${row.chords.length === 0 ? `<span class="hint">このスケールの音だけで作れるテンションはありません</span>` : row.chords.map((chord) => `
                  <button class="candidate-chord" data-scale-tension="${row.index}:${chord.quality}">
                    <strong>${escapeHtml(chord.symbol)}</strong>
                    <span>${escapeHtml(chord.degree)}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      ` : `
      <div class="chord-candidates">
        ${chords.map((chord, index) => `
          <button class="candidate-chord" data-scale-chord="${index}">
            <strong>${escapeHtml(chord.symbol)}</strong>
            <span>${escapeHtml(chord.degree)}</span>
          </button>
        `).join("")}
      </div>`}
    </section>
  `;
}
