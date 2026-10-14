const BUILD = new URL(self.location.href).searchParams.get('build') || 'local';
const CACHE = `arrangement-lab-v0.9-dev-${BUILD}`;
const ASSETS = ['./', './index.html', './styles.css', './v05.css', './v06.css', './manifest.webmanifest', './src/app.js', './src/core.js', './src/music-lab-catalog.js', './src/music-lab-utils.js', './src/harmony-lab.js', './src/counter-lab.js', './src/development-lab.js', './src/music-lab.js', './src/music-lab-ui.js', './src/reharm-theory.js', './src/arrangement-tools.js', './src/feature-ui.js', './src/preview.js', './src/chord-qualities.js', './src/v05-tools.js', './src/v05-workflow.js', './src/v05-ui.js', './src/workflow-boundary-ui.js', './src/beginner-flow.js', './src/song-project-sync.js', './src/song-project-ui.js', './src/song-data-menu-entry.js', '../src/shared/song-data-menu.js', './icons/icon-192.png', './icons/icon-512.png'];
const buildUrl = (path) => `${path}${path.includes('?') ? '&' : '?'}build=${encodeURIComponent(BUILD)}`;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map(path => new Request(buildUrl(path), { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('arrangement-lab-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    if (event.request.mode === 'navigate') {
      try { return await fetch(new Request(event.request, { cache: 'no-store' })); }
      catch { return (await cache.match(event.request, { ignoreSearch: true })) || cache.match('./index.html', { ignoreSearch: true }); }
    }
    const requestedBuild = url.searchParams.get('build');
    const sameBuild = !requestedBuild || requestedBuild === BUILD;
    const cached = sameBuild ? await cache.match(event.request, { ignoreSearch: true }) : null;
    if (cached) return cached;
    return fetch(event.request);
  }));
});
