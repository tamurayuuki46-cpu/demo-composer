import { buildConsultText } from "./consult-text.js";

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

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 権限がない環境向けの代替（textareaを選択してコピー）
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
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
