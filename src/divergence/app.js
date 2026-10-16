import { createDemoPlayer } from "../audio/demo-player.js";
import {
  DIVERGENCE_AXES,
  branchDivergence,
  branchTree,
  createDivergenceSession,
  freezeDivergenceBranch,
  getDivergenceNode,
  importDivergenceBranch,
  keepDivergenceBranch,
  restoreDivergenceSnapshot,
  selectDivergenceNode,
  setDivergenceDistance,
  setDivergenceLocks,
  snapshotDivergence,
  unkeepDivergenceBranch
} from "../core/divergence.js";
import { composerDivergenceTransform } from "../core/divergence-demo.js";
import {
  DIVERGENCE_LIBRARY_LIMIT,
  entriesFromSession,
  entryFromNode,
  isStaleEntry,
  libraryEntryId,
  mergeLibrary,
  removeFromLibrary,
  sortLibraryEntries
} from "../core/divergence-library.js";
import { APP_VERSION } from "../core/project-schema.js";
import { getSections } from "../core/section-ops.js";
import { loadActiveProject, saveProject } from "../storage/indexeddb-storage.js";
import { divergenceStore } from "../storage/divergence-store.js";

let sourceProject = null;
let session = null;
let library = [];
let sectionIndex = 0;
let statusMessage = "";
let persistNotice = "";
let playerState = { playing: false };
let playingKey = "";
let saveChain = Promise.resolve();
const player = createDemoPlayer({
  onStateChange(state) {
    playerState = state;
    document.querySelectorAll("[data-audition], [data-library-audition]").forEach((button) => {
      const key = button.dataset.audition ?? `library:${button.dataset.libraryAudition}`;
      if (key === playingKey) {
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

// 発散セッションは端末内(IndexedDB)へ保存し、アプリを閉じても続きから使えるようにする。
// 保存は1件ずつ順番に行い、古い内容が新しい内容を上書きしないようにする。Project本体は触らない。
function updatePersistNotice() {
  const notice = document.querySelector("#persist-notice");
  if (!notice) return;
  notice.textContent = persistNotice;
  notice.hidden = !persistNotice;
}

function saveSession() {
  if (!sourceProject || !session) return;
  const project = sourceProject;
  const snapshot = session;
  saveChain = saveChain
    .then(() => divergenceStore.saveSession(project, snapshot))
    .then((result) => {
      const note = !result.ok
        ? "この端末に保存できませんでした。このページを閉じると探索内容が消えます。"
        : result.where === "session-storage"
          ? "端末内の保存領域を使えないため、一時保存のみです。タブを閉じると探索内容が消えます。"
          : "";
      if (note !== persistNotice) {
        persistNotice = note;
        updatePersistNotice();
      }
    })
    .catch(() => {});
}

function entryContext() {
  return { projectId: sourceProject.id, sourceRevision: sourceProject.revision ?? 0 };
}

// Keepライブラリ(Freezeしても残る)へ1案を追加して保存する。保存できた時だけKeep状態にする。
async function keepNode(nodeId) {
  const node = getDivergenceNode(session, nodeId);
  const entry = entryFromNode(node, entryContext());
  if (!entry) return { ok: false, message: "この案はKeepライブラリに入れられません。" };
  const merged = mergeLibrary(library, [entry]);
  if (merged.rejected.length) {
    return { ok: false, message: `Keepライブラリが上限（${DIVERGENCE_LIBRARY_LIMIT}案）です。不要なKeepを外してからKeepしてください。` };
  }
  if (merged.added.length) {
    const saved = await divergenceStore.saveLibrary(sourceProject.id, merged.entries);
    if (!saved.ok) return { ok: false, message: "Keepをこの端末に保存できませんでした。端末の空き容量を確認してください。" };
    library = merged.entries;
  }
  session = keepDivergenceBranch(session, nodeId);
  saveSession();
  return { ok: true, message: "" };
}

async function unkeepNode(nodeId) {
  const node = getDivergenceNode(session, nodeId);
  const entryId = libraryEntryId(node, sourceProject.revision ?? 0);
  const nextLibrary = removeFromLibrary(library, entryId);
  if (nextLibrary.length !== library.length) {
    const saved = await divergenceStore.saveLibrary(sourceProject.id, nextLibrary);
    if (!saved.ok) return { ok: false, message: "Keepを外した内容をこの端末に保存できませんでした。" };
    library = nextLibrary;
  }
  session = unkeepDivergenceBranch(session, nodeId);
  saveSession();
  return { ok: true, message: "" };
}

async function removeLibraryEntry(entryId) {
  const nextLibrary = removeFromLibrary(library, entryId);
  const saved = await divergenceStore.saveLibrary(sourceProject.id, nextLibrary);
  if (!saved.ok) return { ok: false, message: "削除した内容をこの端末に保存できませんでした。" };
  library = nextLibrary;
  // ツリー側に同じ案がKeep状態で残っていれば、表示が食い違わないようKeepも外す。
  for (const node of Object.values(session.nodes)) {
    if (node.id !== "root" && node.kept && !node.frozen && libraryEntryId(node, sourceProject.revision ?? 0) === entryId) {
      session = unkeepDivergenceBranch(session, node.id);
    }
  }
  saveSession();
  return { ok: true, message: "" };
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
        ${node.kept && node.id !== "root" && !node.frozen ? `<button data-unkeep="${escapeHtml(node.id)}">Keepを外す</button>` : ""}
        <button data-branch-from="${escapeHtml(node.id)}">この案からBranch</button>
      </div>
    </article>
  `;
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function libraryHtml() {
  const entries = sortLibraryEntries(library);
  if (!entries.length) {
    return `<p class="hint">Keepした案はここに残ります。Freezeしても、アプリを閉じても消えません。</p>`;
  }
  const currentRevision = sourceProject.revision ?? 0;
  return entries.map((entry) => {
    const stale = isStaleEntry(entry, currentRevision);
    const axes = DIVERGENCE_AXES.filter((axis) => entry.changedAxes?.includes(axis.id)).map((axis) => axis.label).join(" / ") || "—";
    return `
      <article class="divergence-branch" data-library-card="${escapeHtml(entry.id)}">
        <div class="divergence-branch-head">
          <div>
            <span class="branch-state">${stale ? "前の元案から" : "Keep"}</span>
            <h3>${escapeHtml(entry.label)}</h3>
          </div>
        </div>
        <p>${escapeHtml(entry.summary || axes)}</p>
        <dl class="branch-meta">
          <div><dt>保存</dt><dd>${escapeHtml(formatSavedAt(entry.savedAt))}</dd></div>
          <div><dt>元案</dt><dd>r${entry.sourceRevision}${stale ? `（現在 r${currentRevision}）` : ""}</dd></div>
          <div><dt>変更軸</dt><dd>${escapeHtml(axes)}</dd></div>
        </dl>
        <div class="branch-actions">
          <button data-library-audition="${escapeHtml(entry.id)}">▶ 試聴</button>
          <button data-library-import="${escapeHtml(entry.id)}">ツリーに呼び出す</button>
          <button data-library-remove="${escapeHtml(entry.id)}">削除</button>
        </div>
      </article>
    `;
  }).join("");
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

    <p id="persist-notice" class="hint-box" role="status" ${persistNotice ? "" : "hidden"}>${escapeHtml(persistNotice)}</p>

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
      <div class="section-heading"><div><span class="step">5</span><h2>Keepライブラリ（残した案）</h2></div><span class="hint">${library.length} / ${DIVERGENCE_LIBRARY_LIMIT}案</span></div>
      <div class="branch-grid">${libraryHtml()}</div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">6</span><h2>Branch Tree（派生履歴）</h2></div><span class="hint">◆ Keep / ❄ Freeze</span></div>
      <div class="branch-tree">${treeHtml()}</div>
    </section>

    <section class="divergence-card">
      <div class="section-heading"><div><span class="step">7</span><h2>Snapshot / Restore</h2></div></div>
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

function generateFrom(nodeId, extraStatus = "") {
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
  statusMessage = `${getDivergenceNode(session, nodeId).label}から${result.branches.length}案を生成しました。元案は変更していません。${extraStatus ? ` ${extraStatus}` : ""}`;
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
        if (playerState.playing && playingKey === node.id) {
          player.stop();
          return;
        }
        session = selectDivergenceNode(session, node.id);
        playingKey = node.id;
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
    button.addEventListener("click", async () => {
      try {
        const result = await keepNode(button.dataset.keep);
        statusMessage = result.ok
          ? `${getDivergenceNode(session).label}をKeepしました。Freezeしても、アプリを閉じても残ります。この案からさらにBranchできます。`
          : result.message;
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "Keepできませんでした。";
      }
      render();
    });
  });

  document.querySelectorAll("[data-unkeep]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const result = await unkeepNode(button.dataset.unkeep);
        statusMessage = result.ok ? "Keepを外し、ライブラリからも削除しました。" : result.message;
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "Keepを外せませんでした。";
      }
      render();
    });
  });

  document.querySelectorAll("[data-branch-from]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        // Keepできなくても(上限・保存失敗)、この案からのBranch自体は続ける。
        const kept = await keepNode(button.dataset.branchFrom);
        generateFrom(button.dataset.branchFrom, kept.ok ? "" : `（Keepは保存していません：${kept.message}）`);
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "派生案を作れませんでした。";
        render();
      }
    });
  });

  document.querySelectorAll("[data-library-audition]").forEach((button) => {
    button.addEventListener("click", async () => {
      const entry = library.find((item) => item.id === button.dataset.libraryAudition);
      if (!entry) return;
      const key = `library:${entry.id}`;
      try {
        if (playerState.playing && playingKey === key) {
          player.stop();
          return;
        }
        player.stop();
        playingKey = key;
        await player.play(entry.payload);
        statusMessage = `Keep案「${entry.label}」を試聴中です。まだProject本体には反映していません。`;
        render();
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "試聴できませんでした。";
        render();
      }
    });
  });

  document.querySelectorAll("[data-library-import]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = library.find((item) => item.id === button.dataset.libraryImport);
      if (!entry) return;
      try {
        player.stop();
        session = importDivergenceBranch(session, entry).session;
        statusMessage = `Keep案「${entry.label}」をツリーに呼び出しました。試聴・Branch・Freezeができます。`;
        saveSession();
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "呼び出せませんでした。";
      }
      render();
    });
  });

  document.querySelectorAll("[data-library-remove]").forEach((button) => {
    button.addEventListener("click", async () => {
      const entry = library.find((item) => item.id === button.dataset.libraryRemove);
      if (!entry) return;
      if (!window.confirm(`Keep案「${entry.label}」をライブラリから削除します。元に戻せません。`)) return;
      try {
        player.stop();
        const result = await removeLibraryEntry(entry.id);
        statusMessage = result.ok ? `Keep案「${entry.label}」を削除しました。` : result.message;
      } catch (error) {
        statusMessage = error instanceof Error ? error.message : "削除できませんでした。";
      }
      render();
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
      // ライブラリから呼び出した古い元案の案をFreezeすると、現在の編集内容が置き換わる。確認してから進める。
      const target = getDivergenceNode(session);
      const targetRevision = target.meta?.sourceRevision;
      if (targetRevision !== undefined && targetRevision !== null && isStaleEntry({ sourceRevision: targetRevision }, sourceProject.revision ?? 0)) {
        const accepted = window.confirm(
          `この案は元案r${targetRevision}から作られた案です。現在の曲はr${sourceProject.revision ?? 0}です。\nFreezeすると、現在の曲の内容がこの案に置き換わります。続けますか？`
        );
        if (!accepted) return;
      }
      const frozen = freezeDivergenceBranch(session);
      session = frozen.session;
      const nextProject = clone(frozen.project);
      nextProject.revision = Math.max(sourceProject.revision ?? 0, nextProject.revision ?? 0) + 1;
      nextProject.appVersion = APP_VERSION;
      await saveProject(nextProject);
      // 使い終わった探索セッションだけ消す。Keepライブラリは残る(他のKeep案を次の探索で使える)。
      await saveChain; // 保存待ちの書き込みが、削除の後に古いセッションを復活させないようにする
      await divergenceStore.deleteSession(sourceProject);
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
    const loaded = await divergenceStore.loadSession(sourceProject);
    session = loaded.session ?? createDivergenceSession(sourceProject, {
      mode: "composer",
      constraints: {
        genre: sourceProject.metadata?.genre ?? "",
        mood: sourceProject.metadata?.mood ?? [],
        key: sourceProject.basic.key,
        bpm: sourceProject.basic.bpm
      }
    });
    const loadedLibrary = await divergenceStore.loadLibrary(sourceProject.id);
    library = loadedLibrary.entries;
    if (loadedLibrary.error) {
      persistNotice = "Keepライブラリを読み込めませんでした。保存済みの案が表示されない場合があります。";
    }
    // 旧版のセッションからKeep済みの案があれば、ライブラリへ補う(Freeze後も残るようにする)。
    const backfill = mergeLibrary(library, entriesFromSession(session, entryContext()));
    if (backfill.added.length) {
      const saved = await divergenceStore.saveLibrary(sourceProject.id, backfill.entries);
      if (saved.ok) library = backfill.entries;
    }
    const sections = getSections(sourceProject);
    sectionIndex = Math.min(sectionIndex, Math.max(0, sections.length - 1));
    render();
  } catch (error) {
    screen.innerHTML = `<div class="divergence-card"><h1>発散モードを開けませんでした</h1><p>${escapeHtml(error instanceof Error ? error.message : "不明なエラー")}</p><a href="./index.html" class="back-link">Demo Composerへ戻る</a></div>`;
  }
}

start();
