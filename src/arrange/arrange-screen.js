import { SECTION_VARIATIONS } from "../core/section-variation.js";
import { counterBarCount, counterCandidates } from "../core/counter-melody.js";
import { loopGuide, suggestedCopyKind } from "../core/loop-guide.js";
import { addEntry, loadLibrary, removeEntry, saveLibrary, sectionsFromStructure, STRUCTURE_SAMPLES, structureText } from "./structure-library.js";
import { curveFromSections, MAX_CURVE_COLUMNS, MIN_CURVE_COLUMNS, sectionsFromCurve } from "../core/energy-curve.js";
import {
  ENERGY_LEVELS,
  TRANSITIONS,
  barsHaveContent,
  energyFlowText,
  energyHints,
  sectionEnergy,
  sectionTransition,
  withSectionEnergy,
  withSectionTransition,
  createSection,
  getSections,
  MAX_SECTION_BARS,
  SECTION_KINDS,
  SECTION_TEMPLATES,
  sectionProgress,
  sectionRanges,
  totalSectionBars
} from "../core/section-ops.js";

const PROGRESS_PARTS = [
  ["chord", "コード"],
  ["melody", "メロ"],
  ["bass", "ベース"],
  ["drums", "ドラム"]
];

// 入力の進み具合の1項目（✓ 全部 / △ 一部 / － 空）。色だけに頼らず記号も出す
function progressChip(label, { filled, total }) {
  const state = filled === 0 ? "none" : (filled >= total ? "done" : "part");
  const mark = state === "done" ? "✓" : (state === "part" ? "△" : "－");
  return `<span class="progress-chip ${state}">${mark} ${label} ${filled}/${total}</span>`;
}

// グラフ用の短い名前（Aメロ→A、サビ→サビ、Aメロ2→A2）
const SHORT_NAMES = { intro: "Int", verse: "A", prechorus: "B", chorus: "サビ", interlude: "間奏", bridge: "C", outro: "Out" };

function shortName(section) {
  const digits = section.name.match(/\d+$/)?.[0] ?? "";
  return `${SHORT_NAMES[section.kind] ?? section.name}${digits}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Arrange: 曲の構成（Section）を並べる画面。データ操作はCoreのGlobal Operationを呼ぶだけ。
export function createArrangeController({ projectStore, rerender, onPlaySection, onPreviewCounter }) {
  let message = "曲の構成を決めると、Melody / Rhythmで「いまサビの3小節目」が分かります。";
  let copyFromIndex = null;
  let addKind = "verse";
  // 「少し違う版」の候補を開いているSection（画面の状態のみ）
  let variationOpenIndex = null;
  // 裏メロの候補を開いているSection（画面の状態のみ）
  let counterOpenIndex = null;
  // ループ案内の開閉と、複製するSectionの種類（画面の状態のみ）
  let guideOpen = false;
  let guideKind = null;
  // 感情曲線の開閉と編集中の曲線（画面の状態のみ。nullなら開いたとき現在の構成から作る）
  let curveOpen = false;
  let curveLevels = null;
  // 構成ライブラリの開閉と保存名（画面の状態のみ。ライブラリ本体は端末のlocalStorage）
  let libOpen = false;
  let libName = "";

  function run(action, successMessage) {
    try {
      action();
      message = successMessage;
    } catch (error) {
      message = error instanceof Error ? error.message : "操作できませんでした。";
    }
    copyFromIndex = null;
    rerender("arrange");
  }

  function templateCards() {
    return SECTION_TEMPLATES.map((template) => `
      <button class="arrange-template" data-arrange-template="${escapeHtml(template.id)}">
        <strong>${escapeHtml(template.label)}</strong>
        <span>${escapeHtml(template.description)}</span>
      </button>
    `).join("");
  }

  function sectionCard(project, range) {
    const { section, index, startBar, endBar } = range;
    const hasContent = barsHaveContent(project, startBar, endBar);
    const progress = sectionProgress(project, startBar, endBar);
    const isCopySource = copyFromIndex === index;
    const copyTargetMode = copyFromIndex !== null && !isCopySource;
    const isLast = index === getSections(project).length - 1;

    return `
      <article class="arrange-section kind-${escapeHtml(section.kind)}${isCopySource ? " copy-source" : ""}">
        <div class="arrange-section-head">
          <div>
            <h3>${escapeHtml(section.name)}</h3>
            <p>Bar ${startBar + 1}–${endBar}${hasContent ? " ・ 入力あり" : " ・ 空"}</p>
          </div>
          <button class="small-action" data-arrange-play="${index}" aria-label="${escapeHtml(section.name)}を再生">▶ 再生</button>
        </div>

        <div class="arrange-progress" aria-label="${escapeHtml(section.name)}の入力の進み具合">
          ${PROGRESS_PARTS.map(([part, label]) => progressChip(label, progress[part])).join("")}
        </div>

        <div class="arrange-energy" role="group" aria-label="${escapeHtml(section.name)}の盛り上がり">
          <span class="arrange-energy-label">盛り上がり</span>
          ${ENERGY_LEVELS.map((level) => `<button data-arrange-energy="${index}:${level.id}" class="${sectionEnergy(section) === level.id ? "active" : ""}" aria-pressed="${sectionEnergy(section) === level.id}">${level.label}</button>`).join("")}
        </div>

        ${isLast ? "" : `
          <div class="arrange-transition" role="group" aria-label="${escapeHtml(section.name)}から次へのつなぎ">
            <span class="arrange-energy-label">次へのつなぎ</span>
            <div class="arrange-transition-chips">
              ${TRANSITIONS.map((item) => `<button data-arrange-transition="${index}:${item.id}" class="${sectionTransition(section) === item.id ? "active" : ""}" aria-pressed="${sectionTransition(section) === item.id}">${item.label}</button>`).join("")}
            </div>
            <small>${escapeHtml(TRANSITIONS.find((item) => item.id === sectionTransition(section)).description)}</small>
          </div>
        `}

        <div class="arrange-bars" role="group" aria-label="${escapeHtml(section.name)}の小節数">
          <button data-arrange-shrink="${index}" aria-label="小節を1つ減らす"${section.bars <= 1 ? " disabled" : ""}>−</button>
          <strong>${section.bars}小節</strong>
          <button data-arrange-grow="${index}" aria-label="小節を1つ増やす"${section.bars >= MAX_SECTION_BARS ? " disabled" : ""}>＋</button>
        </div>

        <button class="arrange-variation-toggle" data-arrange-variation-toggle="${index}" aria-expanded="${variationOpenIndex === index}"${hasContent ? "" : " disabled"}>少し違う版にする${variationOpenIndex === index ? " ▲" : " ▼"}</button>
        ${variationOpenIndex === index ? `
          <div class="arrange-variation">
            ${SECTION_VARIATIONS.map((item) => `
              <button data-arrange-variation="${index}:${item.id}">
                <strong>${escapeHtml(item.label)}</strong>
                <small>${escapeHtml(item.description)}</small>
              </button>
            `).join("")}
            <small>コピーした2つ目のSectionなどに使います。押したSectionだけが変わり、元のSectionは変わりません。↶ で戻せます。</small>
          </div>
        ` : ""}

        ${counterPanelHtml(project, range, hasContent)}

        <div class="arrange-actions">
          ${copyTargetMode
            ? `<button class="primary" data-arrange-paste="${index}">ここへコピー</button>`
            : `<button data-arrange-copy="${index}">${isCopySource ? "コピー中（もう一度で解除）" : "コピー元にする"}</button>`}
          <button class="danger" data-arrange-remove="${index}">削除</button>
        </div>
      </article>
    `;
  }

  // 裏メロ: メインMelodyの隙間や下側に寄り添う旋律を、3つの候補から選んで当てる（Sectionごと）
  function counterPanelHtml(project, range, hasContent) {
    const { section, index, startBar, endBar } = range;
    const filled = counterBarCount(project, startBar, endBar);
    const open = counterOpenIndex === index;
    const toggle = `<button class="arrange-variation-toggle" data-arrange-counter-toggle="${index}" aria-expanded="${open}"${hasContent ? "" : " disabled"}>🎶 裏メロ${filled > 0 ? `（${filled}小節に入っています）` : ""}${open ? " ▲" : " ▼"}</button>`;
    if (!open) return toggle;

    let candidates = [];
    let problem = "";
    try {
      candidates = counterCandidates(project, { startBar, endBar });
    } catch (error) {
      problem = error instanceof Error ? error.message : "候補を作れませんでした。";
    }

    return `
      ${toggle}
      <div class="arrange-variation arrange-counter">
        ${problem ? `<small>${escapeHtml(problem)}</small>` : candidates.map((candidate) => `
          <div class="counter-candidate">
            <strong>${escapeHtml(candidate.label)}</strong>
            <small>${escapeHtml(candidate.description)}</small>
            <small>${candidate.notes.length > 0 ? `${candidate.notes.length}音` : "このSectionには入る場所がありません"}</small>
            <div class="counter-actions">
              <button data-arrange-counter-play="${index}:${candidate.id}"${candidate.notes.length > 0 ? "" : " disabled"}>▶ 聴く</button>
              <button class="primary" data-arrange-counter-apply="${index}:${candidate.id}"${candidate.notes.length > 0 ? "" : " disabled"}>これにする</button>
            </div>
          </div>
        `).join("")}
        ${filled > 0 ? `<button class="danger" data-arrange-counter-clear="${index}">${escapeHtml(section.name)}の裏メロを消す</button>` : ""}
        <small>押したSectionの裏メロだけが入れ替わります。合わなければ別の候補にするか、消せます（↶でも戻せます）。細かい直しはCubasis / Cubaseで。</small>
      </div>`;
  }

  // 8小節ループ → Section の流れの案内。いまの段階を判定して、次にやることを1つだけ出す。
  function loopGuideHtml(project) {
    const guide = loopGuide(project);
    const current = guide.steps.findIndex((step) => step.status === "now");
    const title = guide.phase === "done"
      ? "ループから曲にする流れ ✓"
      : `ループから曲にする（いま: ${current + 1}. ${guide.steps[current].label}）`;
    const toggle = `<button id="arrange-guide-toggle" class="arrange-guide-toggle" aria-expanded="${guideOpen}">🔁 ${escapeHtml(title)}${guideOpen ? " ▲" : " ▼"}</button>`;
    if (!guideOpen) return toggle;

    const sections = getSections(project);
    const kind = guideKind ?? suggestedCopyKind(sections.length);
    let action = "";
    if (guide.phase === "start") {
      action = `
        <p>まず、曲の一部になる8小節だけを作ります。サビやAメロのアイデア出し向けです。</p>
        <button class="primary" id="arrange-guide-start">8小節ループから始める</button>`;
    } else if (guide.phase === "build") {
      action = `
        <p>${sections[0].name}（${sections[0].bars}小節）に、コードを全小節ぶん入れて、メロディかドラムも入れましょう。入ったら次へ進みます。</p>
        <div class="arrange-guide-links">
          <button data-arrange-guide-go="chord">Chordへ</button>
          <button data-arrange-guide-go="melody">Melodyへ</button>
          <button data-arrange-guide-go="rhythm">Rhythmへ</button>
        </div>`;
    } else if (guide.phase === "grow") {
      action = `
        <p>ループができました。同じ中身を新しいSectionにコピーして、曲の長さを増やします。コピーしたあとで変えていきます。</p>
        <div class="arrange-add">
          <select id="arrange-guide-kind" aria-label="複製して追加するSectionの種類">
            ${Object.entries(SECTION_KINDS).map(([id, def]) => `<option value="${escapeHtml(id)}"${id === kind ? " selected" : ""}>${escapeHtml(def.label)}</option>`).join("")}
          </select>
          <button class="primary" id="arrange-guide-copy">ループを複製して追加</button>
        </div>`;
    } else if (guide.phase === "vary") {
      const ranges = sectionRanges(sections);
      action = `
        <p>次のSectionはループと同じ中身のままです。「少し違う版にする」で、ドラム・ベース・メロを少し変えると、曲らしくなります。</p>
        <div class="arrange-guide-links">
          ${guide.identical.map((index) => `<button data-arrange-guide-vary="${index}">${escapeHtml(ranges[index].section.name)}を違う版に</button>`).join("")}
        </div>
        <div class="arrange-add">
          <select id="arrange-guide-kind" aria-label="複製して追加するSectionの種類">
            ${Object.entries(SECTION_KINDS).map(([id, def]) => `<option value="${escapeHtml(id)}"${id === kind ? " selected" : ""}>${escapeHtml(def.label)}</option>`).join("")}
          </select>
          <button id="arrange-guide-copy">ループをもう1つ複製</button>
        </div>`;
    } else {
      action = `
        <p>すべてのSectionに違いが出ています。盛り上がり設計（Energy / つなぎ方）と、Melodyの「Sectionごとの比べ」で、サビの差を確かめてみましょう。足りなければ、ループを複製して増やせます。</p>
        <div class="arrange-add">
          <select id="arrange-guide-kind" aria-label="複製して追加するSectionの種類">
            ${Object.entries(SECTION_KINDS).map(([id, def]) => `<option value="${escapeHtml(id)}"${id === kind ? " selected" : ""}>${escapeHtml(def.label)}</option>`).join("")}
          </select>
          <button id="arrange-guide-copy">ループを複製して追加</button>
        </div>`;
    }

    return `
      ${toggle}
      <div class="arrange-guide">
        <ol class="arrange-guide-steps">
          ${guide.steps.map((step) => `<li class="${step.status}">${step.status === "done" ? "✓ " : ""}${escapeHtml(step.label)}</li>`).join("")}
        </ol>
        ${action}
      </div>`;
  }

  // 感情曲線: 山と谷を高さで選ぶと、Sectionの並び・小節数・盛り上がりの叩き台を作る。
  function curvePanelHtml(project) {
    const toggle = `<button id="arrange-curve-toggle" class="arrange-guide-toggle" aria-expanded="${curveOpen}">📈 感情曲線から構成を作る${curveOpen ? " ▲" : " ▼"}</button>`;
    if (!curveOpen) return toggle;

    const levels = curveLevels ?? curveFromSections(getSections(project));
    const preview = sectionsFromCurve(levels);
    const total = preview.reduce((sum, section) => sum + section.bars, 0);
    const rows = [["high", "High"], ["mid", "Mid"], ["low", "Low"]];
    return `
      ${toggle}
      <div class="arrange-guide arrange-curve">
        <p>曲の流れを左から右へ。各列で盛り上がりの高さを選ぶと、その形に合う構成を作ります。</p>
        <div class="curve-grid" style="grid-template-columns: repeat(${levels.length}, minmax(0, 1fr))">
          ${levels.map((level, col) => `
            <div class="curve-col">
              ${rows.map(([id, label]) => `<button class="curve-cell lvl-${id}${level === id ? " active" : ""}" data-arrange-curve="${col}:${id}" aria-pressed="${level === id}" aria-label="${col + 1}列目 ${label}">${level === id ? "●" : ""}</button>`).join("")}
              <small>${escapeHtml(shortName(preview[col]))}</small>
              <small class="curve-bars">${preview[col].bars}</small>
            </div>
          `).join("")}
        </div>
        <div class="arrange-bars" role="group" aria-label="列の数">
          <button id="arrange-curve-less" aria-label="列を減らす"${levels.length <= MIN_CURVE_COLUMNS ? " disabled" : ""}>−</button>
          <strong>${levels.length}列（全${total}小節）</strong>
          <button id="arrange-curve-more" aria-label="列を増やす"${levels.length >= MAX_CURVE_COLUMNS ? " disabled" : ""}>＋</button>
        </div>
        <button class="primary" id="arrange-curve-apply">この曲線で構成を作る</button>
        <p class="hint">下の数字は小節数です。音符は消えません。作ったあとで、小節数・種類・盛り上がりを自由に直せます（↶で戻せます）。</p>
      </div>`;
  }

  // 好きな曲の構成（Sectionの種類・小節数・盛り上がり）を端末に保存して、別の曲へ借りる。曲の中身は借りない。
  function libraryPanelHtml(project) {
    const saved = loadLibrary();
    const toggle = `<button id="arrange-lib-toggle" class="arrange-guide-toggle" aria-expanded="${libOpen}">🎼 構成ライブラリ（${saved.length}件）${libOpen ? " ▲" : " ▼"}</button>`;
    if (!libOpen) return toggle;

    const entryHtml = (entry, removable) => `
      <div class="library-entry">
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${escapeHtml(structureText(entry.sections))}</span>
        <div class="library-actions">
          <button data-arrange-lib-apply="${escapeHtml(entry.id)}">当てはめる</button>
          ${removable ? `<button class="danger" data-arrange-lib-remove="${escapeHtml(entry.id)}">削除</button>` : ""}
        </div>
      </div>`;
    return `
      ${toggle}
      <div class="arrange-guide">
        <div class="library-save">
          <input id="arrange-lib-name" type="text" maxlength="40" placeholder="名前（例: 好きな曲の構成）" value="${escapeHtml(libName)}" aria-label="構成の名前" />
          <button id="arrange-lib-save"${getSections(project).length ? "" : " disabled"}>いまの構成を保存</button>
        </div>
        <p class="hint">保存するのは構成（Sectionの種類・小節数・盛り上がり）だけです。この端末だけに保存され、曲のデータには入りません。</p>
        ${saved.map((entry) => entryHtml(entry, true)).join("")}
        <h4>見本</h4>
        ${STRUCTURE_SAMPLES.map((entry) => entryHtml(entry, false)).join("")}
      </div>`;
  }

  function render() {
    const project = projectStore.getSnapshot();
    const sections = getSections(project);
    const ranges = sectionRanges(sections);
    const total = totalSectionBars(sections);

    const body = sections.length === 0
      ? `
        <p class="hint">まず曲の長さの叩き台を選びます。あとから小節数の変更・追加・削除ができます。</p>
        <div class="arrange-templates">${templateCards()}</div>
      `
      : `
        <div class="energy-design" aria-label="曲の盛り上がり設計">
          <strong>盛り上がり設計</strong>
          <div class="energy-map">
            ${ranges.map((range) => `
              <div class="energy-col kind-${escapeHtml(range.section.kind)}" style="flex: ${range.section.bars} 1 0">
                <span class="energy-bar lvl-${ENERGY_LEVELS.find((level) => level.id === sectionEnergy(range.section)).rank}"></span>
                <small>${escapeHtml(shortName(range.section))}</small>
              </div>
            `).join("")}
          </div>
          <p class="energy-flow">${escapeHtml(energyFlowText(sections))}</p>
          ${energyHints(sections).map((hint) => `<p class="energy-hint">💡 ${escapeHtml(hint)}</p>`).join("")}
        </div>

        <div class="arrange-summary" aria-label="曲全体の入力の進み具合">
          <strong>骨子の進み具合（全${total}小節）</strong>
          <div class="arrange-progress">${PROGRESS_PARTS.map(([part, label]) => progressChip(label, sectionProgress(project, 0, total)[part])).join("")}</div>
        </div>
        <p class="hint">${copyFromIndex !== null
          ? "コピー先のSectionを選んでください。コピー先の中身は上書きされます。"
          : `全${total}小節。Sectionの中身（コード・メロディ・ベース・ドラム）は小節数を変えると一緒に動きます。`}</p>
        <div class="arrange-list">${ranges.map((range) => sectionCard(project, range)).join("")}</div>

        <div class="arrange-add">
          <select id="arrange-add-kind" aria-label="追加するSectionの種類">
            ${Object.entries(SECTION_KINDS).map(([kind, def]) => (
              `<option value="${escapeHtml(kind)}"${kind === addKind ? " selected" : ""}>${escapeHtml(def.label)}</option>`
            )).join("")}
          </select>
          <button id="arrange-add" class="primary">末尾に追加</button>
        </div>
        <button id="arrange-reset" class="arrange-reset">構成をやり直す（音符は残ります）</button>
      `;

    return `
      <section class="card arrange-card">
        <div class="section-heading">
          <div>
            <h2>Arrange</h2>
            <p>${sections.length === 0 ? "曲の構成" : `${sections.length} Section ・ ${total}小節`}</p>
          </div>
          ${sections.length > 0 ? `<button id="arrange-play-all" class="small-action">▶ 全体</button>` : ""}
        </div>
        ${loopGuideHtml(project)}
        ${curvePanelHtml(project)}
        ${libraryPanelHtml(project)}
        ${body}
        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
      </section>
    `;
  }

  function bind() {
    const query = (selector) => document.querySelectorAll(selector);
    const indexOf = (button, key) => Number(button.dataset[key]);

    const currentCurve = () => curveLevels ?? curveFromSections(getSections(projectStore.getSnapshot()));
    document.querySelector("#arrange-curve-toggle")?.addEventListener("click", () => {
      curveOpen = !curveOpen;
      if (curveOpen) curveLevels = null;
      rerender("arrange");
    });
    query("[data-arrange-curve]").forEach((button) => {
      button.addEventListener("click", () => {
        const [col, level] = button.dataset.arrangeCurve.split(":");
        const next = [...currentCurve()];
        next[Number(col)] = level;
        curveLevels = next;
        rerender("arrange");
      });
    });
    document.querySelector("#arrange-curve-more")?.addEventListener("click", () => {
      const levels = currentCurve();
      curveLevels = [...levels, levels[levels.length - 1] === "low" ? "mid" : "low"];
      rerender("arrange");
    });
    document.querySelector("#arrange-curve-less")?.addEventListener("click", () => {
      curveLevels = currentCurve().slice(0, -1);
      rerender("arrange");
    });
    document.querySelector("#arrange-curve-apply")?.addEventListener("click", () => {
      const project = projectStore.getSnapshot();
      if (getSections(project).length > 0 && !globalThis.confirm("いまの構成を、この曲線から作った構成に置き換えますか？音符は消えませんが、Sectionの区切りが変わります。（↶で戻せます）")) return;
      const sections = sectionsFromCurve(currentCurve());
      curveLevels = null;
      run(() => projectStore.setSections(sections), `曲線から${sections.length}個のSectionを作りました。Sectionごとに小節数や盛り上がりを直せます。`);
    });

    document.querySelector("#arrange-lib-toggle")?.addEventListener("click", () => {
      libOpen = !libOpen;
      rerender("arrange");
    });
    document.querySelector("#arrange-lib-name")?.addEventListener("input", (event) => {
      libName = event.target.value;
    });
    document.querySelector("#arrange-lib-save")?.addEventListener("click", () => {
      try {
        const next = addEntry(loadLibrary(), { name: libName, sections: getSections(projectStore.getSnapshot()) });
        if (!saveLibrary(next)) throw new Error("この端末に保存できませんでした（ブラウザの設定を確認してください）。");
        libName = "";
        message = "構成を保存しました。別の曲でも「当てはめる」で借りられます。";
      } catch (error) {
        message = error instanceof Error ? error.message : "保存できませんでした。";
      }
      rerender("arrange");
    });
    query("[data-arrange-lib-apply]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.arrangeLibApply;
        const entry = [...loadLibrary(), ...STRUCTURE_SAMPLES].find((item) => item.id === id);
        if (!entry) return;
        if (getSections(projectStore.getSnapshot()).length > 0 && !globalThis.confirm(`いまの構成を「${entry.name}」に置き換えますか？音符は消えませんが、Sectionの区切りが変わります。（↶で戻せます）`)) return;
        run(() => projectStore.setSections(sectionsFromStructure(entry.sections)), `「${entry.name}」の構成を当てはめました。小節数や盛り上がりは自由に直せます。`);
      });
    });
    query("[data-arrange-lib-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = loadLibrary().find((item) => item.id === button.dataset.arrangeLibRemove);
        if (!entry || !globalThis.confirm(`「${entry.name}」を削除しますか？`)) return;
        saveLibrary(removeEntry(loadLibrary(), entry.id));
        message = "削除しました。";
        rerender("arrange");
      });
    });

    document.querySelector("#arrange-guide-toggle")?.addEventListener("click", () => {
      guideOpen = !guideOpen;
      rerender("arrange");
    });
    document.querySelector("#arrange-guide-start")?.addEventListener("click", () => run(
      () => projectStore.applySectionTemplate("loop-8"),
      "8小節ループを作りました。コード・メロディ・ドラムを入れていきましょう。"
    ));
    query("[data-arrange-guide-go]").forEach((button) => {
      button.addEventListener("click", () => rerender(button.dataset.arrangeGuideGo));
    });
    document.querySelector("#arrange-guide-kind")?.addEventListener("change", (event) => {
      guideKind = event.target.value;
    });
    document.querySelector("#arrange-guide-copy")?.addEventListener("click", () => {
      const kind = guideKind ?? suggestedCopyKind(getSections(projectStore.getSnapshot()).length);
      run(
        () => projectStore.appendSectionCopy(0, kind),
        `ループを${SECTION_KINDS[kind].label}として複製しました。「少し違う版にする」で変えていきましょう。`
      );
      guideKind = null;
    });
    query("[data-arrange-guide-vary]").forEach((button) => {
      button.addEventListener("click", () => {
        variationOpenIndex = Number(button.dataset.arrangeGuideVary);
        message = "「少し違う版にする」を開きました。候補を1つ選んで、聴いてみましょう。";
        rerender("arrange");
      });
    });

    query("[data-arrange-template]").forEach((button) => {
      button.addEventListener("click", () => run(
        () => projectStore.applySectionTemplate(button.dataset.arrangeTemplate),
        "構成の叩き台を作りました。小節数は自由に変えられます。"
      ));
    });

    // Energy / Transition: Sectionの項目だけを変える（音符・コードは動かさない）。Undo対象
    const setSectionField = (button, key, apply, doneText) => {
      const [indexText, value] = button.dataset[key].split(":");
      button.addEventListener("click", () => run(
        () => projectStore.setSections(apply(getSections(projectStore.getSnapshot()), Number(indexText), value)),
        doneText
      ));
    };
    query("[data-arrange-energy]").forEach((button) => setSectionField(button, "arrangeEnergy", withSectionEnergy, "盛り上がりを変えました。"));
    query("[data-arrange-transition]").forEach((button) => setSectionField(button, "arrangeTransition", withSectionTransition, "つなぎ方を変えました。"));

    query("[data-arrange-variation-toggle]").forEach((button) => {
      const index = indexOf(button, "arrangeVariationToggle");
      button.addEventListener("click", () => {
        variationOpenIndex = variationOpenIndex === index ? null : index;
        rerender("arrange");
      });
    });
    query("[data-arrange-variation]").forEach((button) => {
      const [indexText, variationId] = button.dataset.arrangeVariation.split(":");
      button.addEventListener("click", () => {
        const index = Number(indexText);
        const item = SECTION_VARIATIONS.find((candidate) => candidate.id === variationId);
        try {
          const { changed } = projectStore.applySectionVariation(index, variationId);
          const name = getSections(projectStore.getSnapshot())[index]?.name ?? "Section";
          message = changed > 0
            ? `${name}に「${item.label}」を当てました（${changed}か所）。再生して確認してください。↶ で戻せます。`
            : `${name}には変えられる場所がありませんでした（${variationId === "drums" ? "ドラム" : variationId === "bass" ? "ベース" : variationId === "melody" ? "メロディとコード" : "メロディ（各小節に2音以上）"}が入っているか確認してください）。`;
        } catch (error) {
          message = error instanceof Error ? error.message : "操作できませんでした。";
        }
        rerender("arrange");
      });
    });

    query("[data-arrange-counter-toggle]").forEach((button) => {
      const index = indexOf(button, "arrangeCounterToggle");
      button.addEventListener("click", () => {
        counterOpenIndex = counterOpenIndex === index ? null : index;
        rerender("arrange");
      });
    });
    const counterCandidateFor = (value) => {
      const [indexText, styleId] = value.split(":");
      const index = Number(indexText);
      const project = projectStore.getSnapshot();
      const range = sectionRanges(getSections(project))[index];
      const candidate = range
        ? counterCandidates(project, { startBar: range.startBar, endBar: range.endBar }).find((item) => item.id === styleId)
        : null;
      return { index, range, candidate };
    };
    query("[data-arrange-counter-play]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const { index, candidate } = counterCandidateFor(button.dataset.arrangeCounterPlay);
          if (candidate) onPreviewCounter(index, candidate.notes);
        } catch (error) {
          message = error instanceof Error ? error.message : "聴けませんでした。";
          rerender("arrange");
        }
      });
    });
    query("[data-arrange-counter-apply]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const { range, candidate } = counterCandidateFor(button.dataset.arrangeCounterApply);
          if (!range || !candidate) return;
          projectStore.applyCounterMelody({ startBar: range.startBar, endBar: range.endBar, notes: candidate.notes });
          message = `${range.section.name}に裏メロ「${candidate.label}」を入れました。再生して確認してください。↶ で戻せます。`;
        } catch (error) {
          message = error instanceof Error ? error.message : "操作できませんでした。";
        }
        rerender("arrange");
      });
    });
    query("[data-arrange-counter-clear]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const project = projectStore.getSnapshot();
          const range = sectionRanges(getSections(project))[indexOf(button, "arrangeCounterClear")];
          if (!range) return;
          projectStore.applyCounterMelody({ startBar: range.startBar, endBar: range.endBar, notes: [] });
          message = `${range.section.name}の裏メロを消しました。`;
        } catch (error) {
          message = error instanceof Error ? error.message : "操作できませんでした。";
        }
        rerender("arrange");
      });
    });

    query("[data-arrange-grow]").forEach((button) => {
      const index = indexOf(button, "arrangeGrow");
      button.addEventListener("click", () => {
        const section = getSections(projectStore.getSnapshot())[index];
        run(() => projectStore.resizeSection(index, section.bars + 1), `${section.name}を${section.bars + 1}小節にしました。`);
      });
    });

    query("[data-arrange-shrink]").forEach((button) => {
      const index = indexOf(button, "arrangeShrink");
      button.addEventListener("click", () => {
        const project = projectStore.getSnapshot();
        const range = sectionRanges(getSections(project))[index];
        const lastBar = range.endBar - 1;
        if (
          barsHaveContent(project, lastBar, range.endBar)
          && !globalThis.confirm(`${range.section.name}の最後の1小節（Bar ${lastBar + 1}）に入力があります。削除しますか？`)
        ) {
          return;
        }
        run(() => projectStore.resizeSection(index, range.section.bars - 1), `${range.section.name}を${range.section.bars - 1}小節にしました。`);
      });
    });

    query("[data-arrange-remove]").forEach((button) => {
      const index = indexOf(button, "arrangeRemove");
      button.addEventListener("click", () => {
        const project = projectStore.getSnapshot();
        const range = sectionRanges(getSections(project))[index];
        const label = `${range.section.name}（Bar ${range.startBar + 1}–${range.endBar}）`;
        const ask = barsHaveContent(project, range.startBar, range.endBar)
          ? `${label}を、入力済みの内容ごと削除しますか？（↶で戻せます）`
          : `${label}を削除しますか？`;
        if (!globalThis.confirm(ask)) return;
        run(() => projectStore.removeSection(index), `${range.section.name}を削除しました。`);
      });
    });

    query("[data-arrange-copy]").forEach((button) => {
      const index = indexOf(button, "arrangeCopy");
      button.addEventListener("click", () => {
        copyFromIndex = copyFromIndex === index ? null : index;
        message = copyFromIndex === null ? "コピーを解除しました。" : "コピー先のSectionを選んでください。";
        rerender("arrange");
      });
    });

    query("[data-arrange-paste]").forEach((button) => {
      const toIndex = indexOf(button, "arrangePaste");
      button.addEventListener("click", () => {
        const project = projectStore.getSnapshot();
        const ranges = sectionRanges(getSections(project));
        const to = ranges[toIndex];
        const from = ranges[copyFromIndex];
        if (
          barsHaveContent(project, to.startBar, to.endBar)
          && !globalThis.confirm(`${to.section.name}の中身を${from.section.name}で上書きしますか？（↶で戻せます）`)
        ) {
          return;
        }
        run(() => projectStore.copySection(copyFromIndex, toIndex), `${from.section.name}を${to.section.name}へコピーしました。`);
      });
    });

    query("[data-arrange-play]").forEach((button) => {
      const index = indexOf(button, "arrangePlay");
      button.addEventListener("click", () => onPlaySection(index));
    });

    document.querySelector("#arrange-play-all")?.addEventListener("click", () => onPlaySection(null));

    document.querySelector("#arrange-add-kind")?.addEventListener("change", (event) => {
      addKind = event.target.value;
    });

    document.querySelector("#arrange-add")?.addEventListener("click", () => {
      run(() => {
        const sections = getSections(projectStore.getSnapshot());
        projectStore.setSections([...sections, createSection(addKind, undefined, sections)]);
      }, `${SECTION_KINDS[addKind].label}を末尾に追加しました。`);
    });

    document.querySelector("#arrange-reset")?.addEventListener("click", () => {
      if (!globalThis.confirm("構成の区切りだけを消します。音符やコードは消えません。よろしいですか？")) return;
      run(() => projectStore.setSections([]), "構成をリセットしました。");
    });
  }

  return { render, bind };
}
