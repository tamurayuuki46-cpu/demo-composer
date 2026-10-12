import { getScaleFamily, SCALE_SET_LEVELS, scaleFamiliesForProject, scaleSetChords } from "./chord-scale-sets.js";

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
  const chords = scaleSetChords({ key, familyId: activeId, level: activeLevel.id });

  return `
    ${header}
    <section class="chord-scale-sets" aria-label="スケール系のコード">
      <div class="scale-set-tabs" role="group" aria-label="スケール系">
        ${families.map((item) => `<button type="button" data-scale-family="${item.id}" class="${item.id === activeId ? "active" : ""}" aria-pressed="${item.id === activeId}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <div class="scale-set-tabs scale-set-levels" role="group" aria-label="コードの段階">
        ${SCALE_SET_LEVELS.map((item) => `<button type="button" data-scale-level="${item.id}" class="${item.id === activeLevel.id ? "active" : ""}" aria-pressed="${item.id === activeLevel.id}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <p class="hint">${escapeHtml(key)} ${escapeHtml(family.mode)} の7つのコード。${escapeHtml(activeLevel.note)}</p>
      <div class="chord-candidates">
        ${chords.map((chord, index) => `
          <button class="candidate-chord" data-scale-chord="${index}">
            <strong>${escapeHtml(chord.symbol)}</strong>
            <span>${escapeHtml(chord.degree)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}
