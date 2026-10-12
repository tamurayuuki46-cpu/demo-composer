// 「なぜ？」: 候補・Preset・つなぎの説明文を、折りたたみで統一して表示する（v0.3 骨子作り支援）。
// 説明文そのものは各Moduleが持っている。ここは見せ方だけ（Projectを読み書きしない）。初心者が「なぜこの形か」を学べるようにする。

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function whyHtml(text, { label = "なぜ？" } = {}) {
  const body = String(text ?? "").trim();
  if (!body) return "";
  return `<details class="why"><summary>${escapeHtml(label)}</summary><p>${escapeHtml(body)}</p></details>`;
}
