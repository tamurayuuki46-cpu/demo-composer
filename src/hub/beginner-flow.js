export const BEGINNER_MODE_DEFAULT = true;

const STORAGE_KEY = "demo-composer-beginner-mode";

export const BEGINNER_FLOW = [
  { screen: "hub", label: "準備", nextLabel: "次：コードを決める" },
  { screen: "chord", label: "コード", nextLabel: "次：メロディを作る" },
  { screen: "melody", label: "メロディ", nextLabel: "次：リズムを作る" },
  { screen: "rhythm", label: "リズム", nextLabel: "次：構成を並べる" },
  { screen: "arrange", label: "構成", nextLabel: "次：Arrangement Labで育てる" }
];

export const MORE_IDEAS = {
  hub: [
    "BPM / Keyを仮決めする",
    "作曲シートを見直す",
    "MIDIを読み込んで出発する",
    "AI相談を使う",
    "音色を先に試す"
  ],
  chord: [
    "王道進行を試す",
    "J-POP・切ないPresetを試す",
    "次のコード候補を試す",
    "メロディからコードを付ける",
    "変化球コードを1つだけ混ぜる"
  ],
  melody: [
    "安定した案を試す",
    "キャッチーな案を試す",
    "浮遊感のある案を試す",
    "4小節フレーズを試す",
    "音高は残してリズムだけ変える"
  ],
  rhythm: [
    "8ビートを試す",
    "4つ打ちを試す",
    "Popを試す",
    "Rockを試す",
    "Half Timeを試す"
  ],
  arrange: [
    "Aメロ → Bメロ → サビで並べる",
    "Introを足す",
    "サビ前に密度を落とす",
    "裏メロを試す",
    "音色を試す"
  ]
};

function readMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved == null ? BEGINNER_MODE_DEFAULT : saved !== "off";
  } catch {
    return BEGINNER_MODE_DEFAULT;
  }
}

function saveMode(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: keep the in-memory mode for this session.
  }
}

function activeScreen() {
  return document.querySelector(".nav-btn.active")?.dataset.screen || "hub";
}

function clickScreen(screen) {
  document.querySelector(`.nav-btn[data-screen="${screen}"]`)?.click();
}

function stepIndex(screen) {
  return BEGINNER_FLOW.findIndex((step) => step.screen === screen);
}

function renderSteps(current) {
  return BEGINNER_FLOW.map((step, index) => `
    <button type="button" class="beginner-step${step.screen === current ? " current" : ""}" data-beginner-screen="${step.screen}" aria-current="${step.screen === current ? "step" : "false"}">
      <span>${index + 1}</span>${step.label}
    </button>
  `).join("");
}

function renderIdeas(screen) {
  const ideas = MORE_IDEAS[screen] || MORE_IDEAS.hub;
  return ideas.map((idea, index) => `<li><span>${index + 1}</span>${idea}</li>`).join("");
}

export function installBeginnerFlow() {
  const app = document.querySelector("#app");
  const screen = document.querySelector("#screen");
  const nav = document.querySelector(".bottom-nav");
  if (!app || !screen || !nav || document.querySelector("#beginner-flow")) return;

  let enabled = readMode();
  let moreOpen = false;

  const panel = document.createElement("section");
  panel.id = "beginner-flow";
  panel.className = "beginner-flow";
  panel.setAttribute("aria-label", "初心者向け作曲ナビ");
  screen.before(panel);

  const syncBody = () => {
    document.body.classList.toggle("beginner-mode", enabled);
    document.body.classList.toggle("beginner-more-open", enabled && moreOpen);
  };

  const render = () => {
    const current = activeScreen();
    let index = stepIndex(current);
    if (index < 0) index = 0;
    const step = BEGINNER_FLOW[index];
    const isFirst = index === 0;
    const isLast = index === BEGINNER_FLOW.length - 1;

    if (!enabled) {
      panel.innerHTML = `
        <div class="beginner-off-row">
          <div><strong>初心者モード</strong><small>触る順番を1本道で案内します。</small></div>
          <button id="beginner-mode-toggle" type="button">ONにする</button>
        </div>
      `;
      panel.querySelector("#beginner-mode-toggle")?.addEventListener("click", () => {
        enabled = true;
        moreOpen = false;
        saveMode(enabled);
        syncBody();
        render();
      });
      return;
    }

    panel.innerHTML = `
      <div class="beginner-head">
        <div>
          <div class="beginner-title-row"><strong>初心者モード</strong><span>一本道ナビ</span></div>
          <p>仮決めでOK。あとからいつでも戻って直せます。</p>
        </div>
        <button id="beginner-mode-toggle" type="button">OFF</button>
      </div>

      <div class="beginner-steps" aria-label="Demo Composerの基本順序">
        ${renderSteps(current)}
      </div>

      <div class="beginner-next-card">
        <small>今ここ：${step.label}</small>
        <strong>${step.nextLabel}</strong>
        <div class="beginner-actions">
          ${isFirst
            ? '<a class="beginner-secondary" href="./sheet-app/">作曲シートへ</a>'
            : '<button class="beginner-secondary" id="beginner-prev" type="button">← 前へ</button>'}
          ${isLast
            ? '<a class="beginner-primary" href="./arranger/">Arrangement Labへ →</a>'
            : '<button class="beginner-primary" id="beginner-next" type="button">次へ →</button>'}
        </div>
      </div>

      <button id="beginner-more" class="beginner-more-toggle" type="button" aria-expanded="${moreOpen}">
        ${moreOpen ? "もっと試すを閉じる" : "もっと試す — 候補を5つ見る"}
      </button>
      ${moreOpen ? `
        <div class="beginner-more-panel">
          <p>今の工程から広げるなら、この5つ。</p>
          <ol>${renderIdeas(current)}</ol>
          <div class="beginner-extra-links">
            <button type="button" data-beginner-screen="counter">裏メロを開く</button>
            <button type="button" data-beginner-screen="sound">Soundを開く</button>
          </div>
        </div>
      ` : ""}
    `;

    panel.querySelector("#beginner-mode-toggle")?.addEventListener("click", () => {
      enabled = false;
      moreOpen = false;
      saveMode(enabled);
      syncBody();
      render();
    });

    panel.querySelector("#beginner-prev")?.addEventListener("click", () => {
      clickScreen(BEGINNER_FLOW[index - 1]?.screen || "hub");
    });

    panel.querySelector("#beginner-next")?.addEventListener("click", () => {
      clickScreen(BEGINNER_FLOW[index + 1]?.screen || "arrange");
    });

    panel.querySelector("#beginner-more")?.addEventListener("click", () => {
      moreOpen = !moreOpen;
      syncBody();
      render();
    });

    panel.querySelectorAll("[data-beginner-screen]").forEach((button) => {
      button.addEventListener("click", () => clickScreen(button.dataset.beginnerScreen));
    });
  };

  nav.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-btn")) return;
    queueMicrotask(render);
  });

  const observer = new MutationObserver(() => render());
  observer.observe(screen, { childList: true });

  syncBody();
  render();
}
