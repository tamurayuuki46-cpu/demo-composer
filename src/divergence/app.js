import { createDemoPlayer } from "../audio/demo-player.js";
import {
  DIVERGENCE_AXES,
  branchDivergence,
  branchTree,
  createDivergenceSession,
  freezeDivergenceBranch,
  getDivergenceNode,
  keepDivergenceBranch,
  restoreDivergenceSnapshot,
  selectDivergenceNode,
  setDivergenceDistance,
  setDivergenceLocks,
  snapshotDivergence
} from "../core/divergence.js";
import { composerDivergenceTransform } from "../core/divergence-demo.js";
import { APP_VERSION } from "../core/project-schema.js";
import { getSections } from "../core/section-ops.js";
import { loadActiveProject, saveProject } from "../storage/indexeddb-storage.js";

const SESSION_KEY_PREFIX = "demo-composer:divergence:v1:";

let sourceProject = null;
let session = null;
let sectionIndex = 0;
let statusMessage = "";
let playerState = { playing: false };
const player = createDemoPlayer({
  onStateChange(state) {
    playerState = state;
    document.querySelectorAll("[data-audition]").forEach((button) => {
      if (button.dataset.audition === session?.activeNodeId) {
        button.textContent = state.playing ? "■ 停止" : "▶ 試聴";
      }
    });
  }
});

const screen = document.querySelector("#divergence-app");

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sessionKey(project = sourceProject) {
  return `${SESSION_KEY_PREFIX}${project?.id ?? "none"}:${project?.revision ?? 0}`;
}

function saveSession() {
  if (!sourceProject || !session) return;
  try {
    sessionStorage.setItem(sessionKey(), JSON.stringify(session));
  } catch {
    // 発散履歴は補助データ。保存容量不足でもProject本体は壊さない。
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(sessionKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const root = parsed?.nodes?.root?.payload;
    if (
      parsed?.version !== 1
      || root?.id !== sourceProject.id
      || Number(root?.revision ?? 0) !== Number(sourceProject.revision ?? 0)
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

function constraintsText(project) {
  const genre = project.metadata?.genre?.trim();
  const mood = Array.isArray(project.metadata?.mood) ? project.metadata.mood.filter(Boolean).join(" / ") : "";
  return [
    `${project.basic.key} ${project.basic.scale}`,
    `${project.basic.bpm} BPM`,
    genre,
    mood
  ].filter(Boolean).join(" ・ ");
}

function nodeBadge(node) {
  if (node.frozen) return "Freeze";
  if (node.kept) return "Keep";
  return "Branch";
}

function branchCard(node) {
  const active = node.id === session.activeNodeId;
  const axes = node.changedAxes.length
    ? DIVERGENCE_AXES.filter((axis) => node.changedAxes.includes(axis.id)).map((axis) => axis.label).join(" / ")
    : "元案";
  return `
    <article class="divergence-branch ${active ? "is-active" : ""}" data-node-card="${escapeHtml(node.id)}">
      <div class="divergence-branch-head">
        <div>
          <span class="branch-state">${nodeBadge(node)}</span>
          <h3>${escapeHtml(node.label)}</h3>
        </div>
        <button data-select-node="${escapeHtml(node.id)}" class="compact">${active ? "選択中" : "選ぶ"}</button>
      </div>
      <p>${escapeHtml(node.meta?.summary ?? axes)}</p>
      <dl class="branch-meta">
        <div><dt>Distance</dt><dd>${node.distance || "Seed"}</dd></div>
        <div><dt>変更軸</dt><dd>${escapeHtml(axes)}</dd></div>
        <div><dt>Seed</dt><dd><code>${escapeHtml(node.seedValue)}</code></dd></div>
      </dl>
      <div class="branch-actions">
        <button data-audition="${escapeHtml(node.id)}">▶ 試聴</button>
        <button data-keep="${escapeHtml(node.id)}"${node.kept ? " disabled" : ""}>Keep（保存）</button>
        <button data-branch-from="${escapeHtml(node.id)}">この案からBranch</button>
      </div>
    </article>
  `;
}

function treeHtml() {
  return branchTree(session).map((item) => `
    <button class="tree-node ${item.id === session.activeNodeId ? "is-active" : ""}" data-select-node="${escapeHtml(item.id)}" style="--depth:${item.depth}">
      <span>${item.frozen ? "❄" : item.kept ? "◆" : "◇"}</span>
      <strong>${escapeHtml(item.label)}</strong>
      <small>D${item.distance || 0}</small>
    </button>
  `).join("");
}

function snapshotHtml() {
  const snapshots = Object.values(session.snapshots ?? {});
  if (!snapshots.length) return `<p class="hint">Snapshotはまだありません。</p>`;
  return snapshots.map((snapshot) => `
    <div class="snapshot-row">
      <span><strong>${escapeHtml(snapshot.label)}</strong><small>${escapeHtml(snapshot.seedValue)}</small></span>
      <button data-restore-snapshot="${escapeHtml(snapshot.id)}">Restore（復元）</button>
    </div>
  `).join("");
}

function render() {
  if (!sourceProject || !session) return;
  const active = getDivergenceNode(session);
  const sections = getSections(sourceProject);
  const childIds = active.childIds ?? [];
  const visible = childIds.length
    ? childIds.map((id) => session.nodes[id])
    : active.id === "root"
      ? []
      : [active];
  const anyChildren = Object.keys(session.nodes).length > 1;

  screen.innerHTML = `
    <header class="divergence-title">
      <div>
        <p class="eyebrow">Demo Composer / 発散モード</p>
        <h1>Seed → Lock → Branch → Keep → Freeze</h1>
        <p>元案を壊さず、固定する要素と離れ具合を決めて案を育てます。</p>
      </div>
      <a href="./index.html" class="back-link">通常編集へ戻る</a>
    </header>

    <section class="divergence-card seed-card">
      <div class="section-heading">
        <div><span class="step">1</span><h2>Seed（元案）</h2></div>
        <span class="project-name">${escapeHtml(sourceProject.metadata?.title ?? "Untitled Project")}</span>
      </div>
      <p class="constraint-line">制約: ${escapeHtml(constraintsText(sourceProject))}</p>
      <div class="seed-grid">
        <label>
          <span>Seed値（同じ値なら同じ探索を再現）</span>
          <input id="seed-value" value="${escapeHtml(session.seedValue)}" ${anyChildren ? "readonly" : ""} />
        </label>
        ${sections.length ? `
          <label>
            <span>対象Section</span>
            <select id="section-index">
              ${sections.map((section, index) => `<option value="${index}" ${index === sectionIndex ? "selected" : ""}>${escapeHtml(section.name || `Section ${index + 1}`)}</option>`).join("")}
            </select>
          </label>
        ` : `<div class="hint-box">Section未作成のため、コード・裏メロ・音色は曲全体、Section系変形はスキップします。</div>`}
      </div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">2</span><h2>Lock（固定）</h2></div><span class="hint">ON = 変えない</span></div>
      <div class="lock-grid">
        ${DIVERGENCE_AXES.map((axis) => `
          <label class="lock-item">
            <input type="checkbox" data-lock-axis="${axis.id}" ${session.locks[axis.id] ? "checked" : ""} />
            <span><strong>${escapeHtml(axis.label)}</strong><small>${escapeHtml(axis.description)}</small></span>
          </label>
        `).join("")}
      </div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">3</span><h2>Divergence Distance（発散距離）</h2></div><strong>${session.distance} / 5</strong></div>
      <div class="distance-row">
        <span>近い</span>
        <input id="distance" type="range" min="1" max="5" step="1" value="${session.distance}" />
        <span>遠い</span>
      </div>
      <p class="hint">1 = 元案にかなり近い / 3 = 中程度 / 5 = 大胆。ただしKey・MIDI範囲・既存Schemaは維持します。</p>
      <div class="primary-actions">
        <button id="generate-branches" class="primary">Generate Branches（5案）</button>
        <button id="snapshot-now">Snapshot（復元点）</button>
        <button id="freeze-active" class="freeze">Freeze（確定して通常編集へ）</button>
      </div>
      <p class="status" aria-live="polite">${escapeHtml(statusMessage)}</p>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">4</span><h2>Branches（派生案）</h2></div><span class="hint">点数付けはせず、まず耳で探索</span></div>
      <div class="branch-grid">
        ${visible.length ? visible.map(branchCard).join("") : `<p class="empty-state">Generate Branchesで、現在のSeedから5案を作ります。</p>`}
      </div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">5</span><h2>Branch Tree（派生履歴）</h2></div><span class="hint">◆ Keep / ❄ Freeze</span></div>
      <div class="branch-tree">${treeHtml()}</div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">6</span><h2>Snapshot / Restore</h2></div></div>
      <div class="snapshot-list">${snapshotHtml()}</div>
    </section>
  `;

  bindEvents();
}

function syncControls() {
  const locks = {};
  document.querySelectorAll("[data-lock-axis]").forEach((input) => {
    locks[input.dataset.lockAxis] = input.checked;
  });
  session = setDivergenceLocks(session, locks);
  session = setDivergenceDistance(session, Number(document.querySelector("#distance")?.value ?? session.distance));
  const seedInput = document.querySelector("#seed-value");
  if (seedInput && Object.keys(session.nodes).length === 1 && seedInput.value.trim() !== session.seedValue) {
    session = createDivergenceSession(sourceProject, {
      seedValue: seedInput.value.trim(),
      locks: session.locks,
      distance: session.distance,
      mode: "composer",
      constraints: {
        genre: sourceProject.metadata?.genre ?? "",
        mood: sourceProject.metadata?.mood ?? [],
        key: sourceProject.basic.key,
        bpm: sourceProject.basic.bpm
      }
    });
  }
}

function generateFrom(nodeId) {
  syncControls();
  const result = branchDivergence(session, {
    parentId: nodeId,
    count: 5,
    distance: session.distance,
    locks: session.locks,
    operation: nodeId === "root" ? "generate" : "mutate",
    labelPrefix: nodeId === "root" ? "Branch" : "Mutate",
    transform(project, context) {
      return composerDivergenceTransform(project, context, { sectionIndex });
    }
  });
  session = result.session;
  statusMessage = `${getDivergenceNode(session, nodeId).label}から${result.branches.length}案を生成しました。元案は変更していません。`;
  saveSession();
  render();
}

function bindEvents() {
  document.querySelector("#section-index")?.addEventListener("change", (event) => {
    sectionIndex = Number(event.target.value);
  });

  document.querySelectorAll("[data-lock-axis]").forEach((input) => {
    input.addEventListener("change", () => {
      syncControls();
      saveSession();
    });
  });

  document.querySelector("#distance")?.addEventListener("input", (event) => {
    session = setDivergenceDistance(session, Number(event.target.value));
    saveSession();
    render();
  });

  document.querySelector("#seed-value")?.addEventListener("change", () => {
    syncControls();
    saveSession();
    render();
  });

  document.querySelector("#generate-branches")?.addEventListener("click", () => {
    try {
      generateFrom(session.activeNodeId);
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : "Branch生成に失敗しました。";
      render();
    }
  });

  document.querySelectorAll("[data-select-node]").forEach((button) => {
    button.addEventListener("click", () => {
      player.stop();
      session = selectDivergenceNode(session, button.dataset.selectNode);
      statusMessage = `${getDivergenceNode(session).label}を選択しました。`;
      saveSession();
      render();
    });
  });

  document.querySelectorAll("[data-audition]").forEach((button) => {
    button.addEventListener("click", async () => {
      const node = getDivergenceNode(session, button.dataset.audition);
      try {
        if (playerState.playing && session.activeNodeId === node.id) {
          player.stop();
          return;
        }
        session = selectDivergenceNode(session, node.id);
        await player.play(node.payload);
        statusMessage = `${node.label}を試聴中です。まだProject本体には反映していません。`;
        saveSession();
        render();
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "試聴できませんでした。";
        render();
      }
    });
  });

  document.querySelectorAll("[data-keep]").forEach((button) => {
    button.addEventListener("click", () => {
      session = keepDivergenceBranch(session, button.dataset.keep);
      statusMessage = `${getDivergenceNode(session).label}をKeepしました。この案からさらにBranchできます。`;
      saveSession();
      render();
    });
  });

  document.querySelectorAll("[data-branch-from]").forEach((button) => {
    button.addEventListener("click", () => {
      try {
        session = keepDivergenceBranch(session, button.dataset.branchFrom);
        generateFrom(button.dataset.branchFrom);
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "派生案を作れませんでした。";
        render();
      }
    });
  });

  document.querySelector("#snapshot-now")?.addEventListener("click", () => {
    const result = snapshotDivergence(session, `${getDivergenceNode(session).label} / Round ${session.branchRound}`);
    session = result.session;
    statusMessage = `${result.snapshot.label}を保存しました。`;
    saveSession();
    render();
  });

  document.querySelectorAll("[data-restore-snapshot]").forEach((button) => {
    button.addEventListener("click", () => {
      player.stop();
      session = restoreDivergenceSnapshot(session, button.dataset.restoreSnapshot);
      statusMessage = "Snapshotを復元しました。Project本体は変更していません。";
      saveSession();
      render();
    });
  });

  document.querySelector("#freeze-active")?.addEventListener("click", async () => {
    try {
      player.stop();
      const previousSessionKey = sessionKey();
      const frozen = freezeDivergenceBranch(session);
      session = frozen.session;
      const nextProject = clone(frozen.project);
      nextProject.revision = Math.max(sourceProject.revision ?? 0, nextProject.revision ?? 0) + 1;
      nextProject.appVersion = APP_VERSION;
      await saveProject(nextProject);
      try { sessionStorage.removeItem(previousSessionKey); } catch {}
      window.location.href = "./index.html";
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : "Freezeに失敗しました。";
      render();
    }
  });
}

async function start() {
  screen.innerHTML = `<p class="loading">発散モードを準備しています…</p>`;
  try {
    sourceProject = await loadActiveProject();
    if (!sourceProject) {
      screen.innerHTML = `
        <div class="divergence-card">
          <h1>SeedにするProjectがありません</h1>
          <p>Demo ComposerでProjectを作成または開いてから発散モードへ進んでください。</p>
          <a href="./index.html" class="back-link">Demo Composerへ戻る</a>
        </div>`;
      return;
    }
    session = loadSession() ?? createDivergenceSession(sourceProject, {
      mode: "composer",
      constraints: {
        genre: sourceProject.metadata?.genre ?? "",
        mood: sourceProject.metadata?.mood ?? [],
        key: sourceProject.basic.key,
        bpm: sourceProject.basic.bpm
      }
    });
    const sections = getSections(sourceProject);
    sectionIndex = Math.min(sectionIndex, Math.max(0, sections.length - 1));
    render();
  } catch (error) {
    screen.innerHTML = `<div class="divergence-card"><h1>発散モードを開けませんでした</h1><p>${escapeHtml(error instanceof Error ? error.message : "不明なエラー")}</p><a href="./index.html" class="back-link">Demo Composerへ戻る</a></div>`;
  }
}

start();
