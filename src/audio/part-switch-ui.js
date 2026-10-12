// 再生の聴き分け（パートのミュート / ソロ）。聴き比べのための切り替えだけで、音量調整は持たない。
// 状態は画面だけのもので、project.json / MIDI Exportには影響しない。

export const PART_LABELS = Object.freeze({
  chord: "Chord",
  melody: "Melody",
  bass: "Bass",
  drums: "Drums",
  counter: "裏メロ"
});

// state: { muted: Set<role>, solo: role | null }
export function isPartAudible(state, role) {
  if (state.solo) return state.solo === role;
  return !state.muted.has(role);
}

// ミュート操作: 押したパートの鳴る / 鳴らないを切り替える（ソロ中はソロを解除して全体へ戻す）
export function toggleMute(state, role) {
  const muted = new Set(state.muted);
  if (muted.has(role)) muted.delete(role);
  else muted.add(role);
  return { muted, solo: null };
}

// ソロ操作: 押したパートだけ鳴らす。同じパートをもう一度押すと解除
export function toggleSolo(state, role) {
  return { muted: new Set(state.muted), solo: state.solo === role ? null : role };
}

// まとめて切り替え: 全部鳴らす（on=true）/ 全部OFF（on=false。そこから鳴らしたいパートだけ選ぶ）
export function setAllParts(roles, on) {
  return { muted: on ? new Set() : new Set(roles), solo: null };
}

export function bindPartSwitch({ demoPlayer, roles = Object.keys(PART_LABELS) }) {
  const toggle = document.querySelector("#player-parts");
  const panel = document.querySelector("#part-panel");
  const soloButton = document.querySelector("#part-solo");
  if (!toggle || !panel) return;

  let state = { muted: new Set(), solo: null };
  let soloMode = false;

  function apply() {
    roles.forEach((role) => demoPlayer.setPartMuted(role, !isPartAudible(state, role)));

    panel.querySelectorAll("[data-part]").forEach((button) => {
      const audible = isPartAudible(state, button.dataset.part);
      // 色だけに頼らず、鳴る / 鳴らないを文字でも示す
      button.textContent = `${audible ? "✓ " : ""}${PART_LABELS[button.dataset.part] ?? button.dataset.part}`;
      button.classList.toggle("off", !audible);
      button.setAttribute("aria-pressed", String(audible));
    });

    soloButton?.classList.toggle("active", soloMode);
    soloButton?.setAttribute("aria-pressed", String(soloMode));
    toggle.classList.toggle("active", state.solo !== null || state.muted.size > 0);
    const hint = panel.querySelector("#part-hint");
    if (hint) {
      hint.textContent = soloMode
        ? "ソロ: 押したパートだけ鳴ります。もう一度押すと全部に戻ります。"
        : "✓ のパートが鳴ります。タップで鳴らす / 消すを切り替え。「全部OFF」から、聴きたいパートだけ選べます（保存や書き出しには影響しません）。";
    }
  }

  toggle.addEventListener("click", () => {
    const open = panel.hasAttribute("hidden");
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", String(open));
    // パネルを開いている間は、画面の下が隠れないよう余白を増やす
    document.body.classList.toggle("parts-open", open);
  });

  panel.querySelectorAll("[data-part]").forEach((button) => {
    button.addEventListener("click", () => {
      const role = button.dataset.part;
      state = soloMode ? toggleSolo(state, role) : toggleMute(state, role);
      apply();
    });
  });

  document.querySelector("#part-all")?.addEventListener("click", () => {
    soloMode = false;
    state = setAllParts(roles, true);
    apply();
  });

  document.querySelector("#part-none")?.addEventListener("click", () => {
    soloMode = false;
    state = setAllParts(roles, false);
    apply();
  });

  soloButton?.addEventListener("click", () => {
    soloMode = !soloMode;
    state = { muted: new Set(state.muted), solo: null };
    apply();
  });

  apply();
}
