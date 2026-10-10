// Hub: 骨子完成チェックの表示。Projectを読むだけ。評価ではなく「あと何を決めればPCに移れるか」を見る。

import { SKELETON_MARKS, skeletonCheck } from "../core/skeleton-check.js";

const SCREEN_LABELS = { chord: "Chordへ", melody: "Melodyへ", rhythm: "Rhythmへ", arrange: "Arrangeへ", sound: "Soundへ" };

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function skeletonCheckSummary(project) {
  const check = skeletonCheck(project);
  return check.complete
    ? "骨子チェック ✓ そろいました"
    : `骨子チェック ${check.doneCount}/${check.total}`;
}

function row(item) {
  return `
    <li class="skeleton-row mark-${item.mark}">
      <span class="skeleton-mark" aria-label="${item.mark === "done" ? "OK" : item.mark === "part" ? "一部" : "未"}">${SKELETON_MARKS[item.mark]}</span>
      <div class="skeleton-body">
        <strong>${escapeHtml(item.label)}</strong>
        <small class="skeleton-detail">${escapeHtml(item.detail)}</small>
        ${item.mark === "done" ? "" : `<small>${escapeHtml(item.hint)}</small>`}
      </div>
      ${item.mark === "done" ? "" : `<button class="skeleton-go" data-skeleton-go="${escapeHtml(item.screen)}">${escapeHtml(SCREEN_LABELS[item.screen] ?? "開く")}</button>`}
    </li>`;
}

export function skeletonCheckHtml(project) {
  const check = skeletonCheck(project);
  return `
    <div class="skeleton-check">
      <p class="skeleton-lead">${check.complete
        ? "骨子はそろいました。Song.mid などを書き出して、Cubasis / Cubase に渡せます。"
        : `次に決めるのは「${escapeHtml(check.next.label)}」です。${escapeHtml(check.next.hint)}`}</p>
      <ul class="skeleton-list">${check.items.map(row).join("")}</ul>
      <h4>あとで足すもの（任意）</h4>
      <ul class="skeleton-list">${check.optional.map(row).join("")}</ul>
      <small>✓ そろっている　△ 一部だけ　－ まだ。曲の良し悪しを採点するものではありません。</small>
    </div>`;
}
