import {
  barsHaveContent,
  createSection,
  getSections,
  MAX_SECTION_BARS,
  SECTION_KINDS,
  SECTION_TEMPLATES,
  sectionRanges,
  totalSectionBars
} from "../core/section-ops.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Arrange: 曲の構成（Section）を並べる画面。データ操作はCoreのGlobal Operationを呼ぶだけ。
export function createArrangeController({ projectStore, rerender, onPlaySection }) {
  let message = "曲の構成を決めると、Melody / Rhythmで「いまサビの3小節目」が分かります。";
  let copyFromIndex = null;
  let addKind = "verse";

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
    const isCopySource = copyFromIndex === index;
    const copyTargetMode = copyFromIndex !== null && !isCopySource;

    return `
      <article class="arrange-section kind-${escapeHtml(section.kind)}${isCopySource ? " copy-source" : ""}">
        <div class="arrange-section-head">
          <div>
            <h3>${escapeHtml(section.name)}</h3>
            <p>Bar ${startBar + 1}–${endBar}${hasContent ? " ・ 入力あり" : " ・ 空"}</p>
          </div>
          <button class="small-action" data-arrange-play="${index}" aria-label="${escapeHtml(section.name)}を再生">▶ 再生</button>
        </div>

        <div class="arrange-bars" role="group" aria-label="${escapeHtml(section.name)}の小節数">
          <button data-arrange-shrink="${index}" aria-label="小節を1つ減らす"${section.bars <= 1 ? " disabled" : ""}>−</button>
          <strong>${section.bars}小節</strong>
          <button data-arrange-grow="${index}" aria-label="小節を1つ増やす"${section.bars >= MAX_SECTION_BARS ? " disabled" : ""}>＋</button>
        </div>

        <div class="arrange-actions">
          ${copyTargetMode
            ? `<button class="primary" data-arrange-paste="${index}">ここへコピー</button>`
            : `<button data-arrange-copy="${index}">${isCopySource ? "コピー中（もう一度で解除）" : "コピー元にする"}</button>`}
          <button class="danger" data-arrange-remove="${index}">削除</button>
        </div>
      </article>
    `;
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
        ${body}
        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
      </section>
    `;
  }

  function bind() {
    const query = (selector) => document.querySelectorAll(selector);
    const indexOf = (button, key) => Number(button.dataset[key]);

    query("[data-arrange-template]").forEach((button) => {
      button.addEventListener("click", () => run(
        () => projectStore.applySectionTemplate(button.dataset.arrangeTemplate),
        "構成の叩き台を作りました。小節数は自由に変えられます。"
      ));
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
