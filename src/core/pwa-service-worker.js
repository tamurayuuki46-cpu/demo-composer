const SERVICE_WORKER_URL = "./service-worker.js";

export function canUseServiceWorker() {
  return typeof navigator !== "undefined"
    && "serviceWorker" in navigator
    && (typeof window === "undefined" || window.isSecureContext);
}

export async function registerDemoComposerServiceWorker() {
  if (!canUseServiceWorker()) return null;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "./" });
    registration.update().catch(() => {});
    return registration;
  } catch (error) {
    console.warn("Demo Composer Service Worker registration failed", error);
    return null;
  }
}

export async function activateWaitingServiceWorker() {
  if (!canUseServiceWorker()) return false;

  const registration = await navigator.serviceWorker.getRegistration("./");
  if (!registration) return false;

  try {
    await registration.update();
  } catch {
    // Offline or transient failure: an already waiting worker can still be activated.
  }

  if (!registration.waiting) return false;
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export function initDemoComposerServiceWorker() {
  if (typeof window === "undefined") return;
  window.addEventListener("load", () => {
    registerDemoComposerServiceWorker();
  }, { once: true });
}

if (typeof window !== "undefined") initDemoComposerServiceWorker();
