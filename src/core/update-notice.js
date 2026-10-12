import { BUILD_ID, BUILD_TIME } from "./build-info.js";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let latestSeen = null;

function jst(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function buildLabel(id = BUILD_ID, time = BUILD_TIME) {
  if (id === "dev") return "開発版";
  return `${id}${time ? `・${jst(time)}` : ""}`;
}

export function isNewerBuild(currentId, remoteId) {
  return currentId !== "dev" && Boolean(remoteId) && remoteId !== currentId;
}

async function fetchRemoteBuild() {
  const response = await fetch(`./build.json?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`build.json ${response.status}`);
  return response.json();
}

function showBanner(remote) {
  let banner = document.querySelector("#update-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "update-banner";
    banner.setAttribute("role", "status");
    document.body.prepend(banner);
  }
  banner.innerHTML = `
    <span>🔄 新しい版があります（${remote.id}）</span>
    <button type="button" id="update-apply">更新する</button>
    <button type="button" id="update-later" aria-label="あとで">×</button>`;
  banner.querySelector("#update-apply").addEventListener("click", async () => {
    try {
      if (window.caches) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    } catch { /* 無くても再読み込みはできる */ }
    location.reload();
  });
  banner.querySelector("#update-later").addEventListener("click", () => banner.remove());
}

function toast(text) {
  const el = document.createElement("div");
  el.className = "update-toast";
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

export async function checkForUpdate({ manual = false } = {}) {
  try {
    const remote = await fetchRemoteBuild();
    latestSeen = remote;
    if (isNewerBuild(BUILD_ID, remote.id)) showBanner(remote);
    else if (manual) toast(BUILD_ID === "dev" ? "開発版です" : "最新の版です");
  } catch {
    if (manual) toast("更新を確認できませんでした（通信を確認）");
  }
}

export function initUpdateNotice() {
  const version = document.querySelector(".topbar .version");
  if (version) {
    version.innerHTML = `${version.textContent.trim()}<small class="build-id">${buildLabel()}</small>`;
    version.setAttribute("role", "button");
    version.setAttribute("tabindex", "0");
    version.title = "タップで更新を確認";
    version.addEventListener("click", () => checkForUpdate({ manual: true }));
  }
  checkForUpdate();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
  setInterval(checkForUpdate, CHECK_INTERVAL_MS);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUpdateNotice, { once: true });
  else initUpdateNotice();
}

export function _latestSeenForTest() { return latestSeen; }
