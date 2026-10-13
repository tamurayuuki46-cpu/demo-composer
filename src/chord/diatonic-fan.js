const SLOT_BY_DEGREE = Object.freeze({
  // Major: IV / ii ← I / vi → V / iii, vii° at the bottom.
  "IV": "left-top",
  "ii": "left-bottom",
  "I": "center-top",
  "vi": "center-bottom",
  "V": "right-top",
  "iii": "right-bottom",
  "vii°": "leading",

  // Natural minor: VI / iv ← III / i → VII / v, ii° at the bottom.
  "VI": "left-top",
  "iv": "left-bottom",
  "III": "center-top",
  "i": "center-bottom",
  "VII": "right-top",
  "v": "right-bottom",
  "ii°": "leading"
});

export function fanSlotForDegree(degree) {
  return SLOT_BY_DEGREE[degree] ?? null;
}

export function enhanceDiatonicFan(root = document) {
  const buttons = [...root.querySelectorAll("[data-add-chord]")];
  if (buttons.length !== 7) return false;

  const container = buttons[0].parentElement;
  if (!container || !buttons.every((button) => button.parentElement === container)) {
    return false;
  }

  if (container.dataset.fanEnhanced === "true") return true;

  const assignments = buttons.map((button) => {
    const degree = button.querySelector("span")?.textContent?.trim() ?? "";
    return { button, slot: fanSlotForDegree(degree) };
  });

  if (assignments.some(({ slot }) => !slot)) return false;

  container.classList.add("diatonic-fan");
  container.dataset.fanEnhanced = "true";
  container.setAttribute("aria-label", "五度圏の扇形で並べたダイアトニックコード候補");

  const caption = document.createElement("div");
  caption.className = "diatonic-fan-caption";
  caption.textContent = "五度圏ビュー";
  caption.setAttribute("aria-hidden", "true");
  container.append(caption);

  assignments.forEach(({ button, slot }) => {
    button.classList.add("fan-candidate", `fan-slot-${slot}`);
  });

  return true;
}

function startDiatonicFanObserver() {
  const screen = document.querySelector("#screen");
  if (!screen) return;

  enhanceDiatonicFan(screen);

  const observer = new MutationObserver(() => {
    enhanceDiatonicFan(screen);
  });

  observer.observe(screen, { childList: true, subtree: true });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDiatonicFanObserver, { once: true });
  } else {
    startDiatonicFanObserver();
  }
}
