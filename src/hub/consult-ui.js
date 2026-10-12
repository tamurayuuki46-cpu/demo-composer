import { CONSULT_TEMPLATES, buildConsultText } from "./consult-text.js";
import { copyText } from "./clipboard.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 相談したい内容は画面の状態のみ（Hubを描き直しても残す）。project.jsonには保存しない
let question = "";

export function consultPanelHtml() {
  return `
    <section id="consult-panel" class="export-panel consult-panel" hidden>
      <h3>AI相談</h3>
      <label for="consult-question" class="hint">相談したいこと（書かなくてもコピーできます）</label>
      <div class="consult-templates" role="group" aria-label="悩みのテンプレート">
        ${CONSULT_TEMPLATES.map((template) => `<button type="button" class="consult-template" data-consult-template="${template.id}">${escapeHtml(template.label)}</button>`).join("")}
      </div>
      <textarea id="consult-question" rows="3" placeholder="例: サビのメロディをもっと盛り上げたい">${escapeHtml(question)}</textarea>
      <button id="consult-copy" class="export-primary consult-copy">相談用テキストをコピー</button>
      <details class="consult-details">
        <summary>コピーされる内容を見る</summary>
        <textarea id="consult-preview" rows="10" readonly aria-label="コピーされる内容"></textarea>
      </details>
      <p class="hint">コピーしたら、ChatGPTやClaudeに貼り付けて相談できます。曲の情報・構成・コード・メロディ・ベース・ドラムがまとまっています。送信はされません。</p>
    </section>
  `;
}

export function bindConsultPanel({ projectStore, setMessage }) {
  const toggle = document.querySelector("#toggle-consult");
  const panel = document.querySelector("#consult-panel");
  const questionField = document.querySelector("#consult-question");
  const preview = document.querySelector("#consult-preview");
  if (!toggle || !panel) return;

  const currentText = () => buildConsultText(projectStore.getSnapshot(), question);
  const refreshPreview = () => {
    if (preview) preview.value = currentText();
  };

  toggle.addEventListener("click", () => {
    const open = panel.hasAttribute("hidden");
    if (open) {
      panel.removeAttribute("hidden");
      panel.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
      refreshPreview();
    } else {
      panel.setAttribute("hidden", "");
    }
    toggle.setAttribute("aria-expanded", String(open));
  });

  questionField?.addEventListener("input", (event) => {
    question = event.target.value;
    refreshPreview();
  });

  document.querySelectorAll("[data-consult-template]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = CONSULT_TEMPLATES.find((item) => item.id === button.dataset.consultTemplate);
      if (!template || !questionField) return;
      // 既に書いてあるときは消さず、改行して続けて足す
      question = question.trim() ? `${question.trim()}\n${template.text}` : template.text;
      questionField.value = question;
      refreshPreview();
      questionField.focus();
    });
  });

  document.querySelector("#consult-copy")?.addEventListener("click", async () => {
    const ok = await copyText(currentText());
    setMessage(
      ok
        ? "相談用テキストをコピーしました。ChatGPTやClaudeに貼り付けてください。"
        : "コピーできませんでした。「コピーされる内容を見る」を開いて、全体を選択してコピーしてください。",
      !ok
    );
  });
}
