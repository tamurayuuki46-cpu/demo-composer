export const PRIVATE_SHEET_URL = '../sheet-app/';
export const LATEST_SHEET_MANIFEST_URL = '../sheet-app/latest/manifest.json';

export function resolveLatestSheetUrl(baseHref = globalThis.location?.href || 'http://localhost/project-home/') {
  return new URL(PRIVATE_SHEET_URL, baseHref).href;
}

export async function loadLatestSheetManifest({ fetcher = globalThis.fetch, baseHref = globalThis.location?.href || 'http://localhost/project-home/' } = {}) {
  if (typeof fetcher !== 'function') throw new Error('fetch is unavailable');
  const response = await fetcher(new URL(LATEST_SHEET_MANIFEST_URL, baseHref));
  if (!response.ok) throw new Error(`latest sheet manifest: ${response.status}`);
  const manifest = await response.json();
  if (manifest?.kind !== 'composition-sheet-latest' || manifest?.schemaVersion !== 1 || !manifest?.version) throw new Error('latest sheet manifest is invalid');
  return manifest;
}

export async function mountLatestSheetCard({ doc = globalThis.document, fetcher = globalThis.fetch, baseHref = globalThis.location?.href || 'http://localhost/project-home/' } = {}) {
  if (!doc) return null;
  const canonicalUrl = resolveLatestSheetUrl(baseHref);
  const quickSheetLink = doc.querySelector('#quick-flow .flow-step');
  if (quickSheetLink) quickSheetLink.href = canonicalUrl;

  const card = doc.querySelector('#composition-sheet-card');
  if (!card) return null;
  const openLink = card.querySelector('a');
  if (openLink) {
    openLink.href = canonicalUrl;
    openLink.textContent = '最新版の作曲シートを開く';
  }

  let version = card.querySelector('#latest-sheet-version');
  if (!version) {
    version = doc.createElement('p');
    version.id = 'latest-sheet-version';
    version.className = 'hint';
    version.textContent = '最新版を確認中…';
    openLink?.insertAdjacentElement('beforebegin', version);
  }

  let frame = card.querySelector('#latest-sheet-frame');
  if (!frame) {
    frame = doc.createElement('iframe');
    frame.id = 'latest-sheet-frame';
    frame.title = '最新版の作曲シート';
    frame.src = canonicalUrl;
    frame.loading = 'lazy';
    frame.style.cssText = 'display:block;width:100%;min-height:680px;margin-top:14px;border:1px solid #d6d3d1;border-radius:14px;background:#fff;';
    card.append(frame);
  } else if (frame.src !== canonicalUrl) frame.src = canonicalUrl;

  try {
    const manifest = await loadLatestSheetManifest({ fetcher, baseHref });
    version.textContent = `現在の最新版: ${manifest.version}${manifest.beginnerMode ? '・初心者モード対応' : ''}`;
    frame.dataset.sheetVersion = manifest.version;
    return manifest;
  } catch {
    version.textContent = '最新版のVersion情報を取得できませんでした。入口は常にlatestへ接続しています。';
    return null;
  }
}

if (typeof document !== 'undefined') queueMicrotask(() => { mountLatestSheetCard().catch(() => {}); });

export function queueDemoHandoff(songProject, storage = localStorage) {
  storage.setItem('music-project-songproject-handoff-v1', JSON.stringify({
    kind: 'music-project-songproject-handoff', schemaVersion: 1, sourceApp: 'project-home',
    targetApp: 'demo-composer', createdAt: new Date().toISOString(), songProject,
  }));
}
