// 候補の「▶ 聴く」。各画面は Module 同士を直接つながないので、イベントで再生を頼む。
// 画面側: requestAudition({ label, build }) …… build(いまのProject) が { project, lengthTick } を返す。
// main.js 側: そのProject（仮のコピー）を Demo Player で鳴らす。曲のデータは変更しない。

export const AUDITION_EVENT = "dc:audition";

export function requestAudition({ label, build }) {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new CustomEvent(AUDITION_EVENT, { detail: { label, build } }));
}

// 画面下に数秒だけ出す小さな案内（試聴中であることと、まだ曲には入っていないこと）
export function showAuditionToast(text) {
  if (typeof document === "undefined") return;
  document.querySelector(".audition-toast")?.remove();
  const el = document.createElement("div");
  el.className = "update-toast audition-toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
}
