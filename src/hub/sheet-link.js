// Hub: 作曲シート（claude.aiのドキュメントなど）へのリンク。端末のlocalStorageにだけ保存し、project.json・コード・MIDIには入れない。
// アプリは公開されているので、リンクをコードに書かない。リンクを知っても、共有設定をしていないシートは他の人には開けない。

const STORAGE_KEY = "demo-composer.sheetLink";
const ALLOWED_HOSTS = new Set(["claude.ai", "www.claude.ai"]);

// https://claude.ai/ の URL だけを受け付ける。違えば null
export function normalizeSheetLink(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function loadSheetLink(storage = globalThis.localStorage) {
  try {
    return normalizeSheetLink(storage?.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveSheetLink(value, storage = globalThis.localStorage) {
  const link = normalizeSheetLink(value);
  try {
    if (link) storage?.setItem(STORAGE_KEY, link);
    else storage?.removeItem(STORAGE_KEY);
  } catch {
    // 保存できなくても、今の画面では使える
  }
  return link;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function sheetLinkHtml(link = loadSheetLink()) {
  return `
    <section class="sheet-link">
      <h3>作曲シート</h3>
      ${link ? `<a id="sheet-link-open" class="sheet-link-open" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">作曲シートを開く</a>` : ""}
      <label class="field">
        <span>${link ? "リンクを変える" : "claude.aiのリンクを貼る"}</span>
        <input id="sheet-link-input" type="url" inputmode="url" autocomplete="off" placeholder="https://claude.ai/…" value="${link ? escapeHtml(link) : ""}" />
      </label>
      <div class="sheet-link-actions">
        <button id="sheet-link-save" type="button">保存</button>
        ${link ? `<button id="sheet-link-clear" type="button">リンクを消す</button>` : ""}
      </div>
      <p class="hint">この端末だけに保存します（曲のデータやコードには入りません）。リンクを知っても、共有設定をしていないシートは他の人には開けません。</p>
    </section>`;
}

export function bindSheetLink({ setMessage, rerender }) {
  document.querySelector("#sheet-link-save")?.addEventListener("click", () => {
    const input = document.querySelector("#sheet-link-input");
    const raw = input?.value ?? "";
    const link = saveSheetLink(raw);
    if (!raw.trim()) {
      setMessage("リンクが空です。claude.aiのリンクを貼ってください。", true);
    } else if (!link) {
      setMessage("https://claude.ai/ から始まるリンクだけ保存できます。", true);
    } else {
      setMessage("作曲シートのリンクをこの端末に保存しました。");
    }
    rerender();
  });
  document.querySelector("#sheet-link-clear")?.addEventListener("click", () => {
    saveSheetLink("");
    setMessage("作曲シートのリンクを消しました。");
    rerender();
  });
}
