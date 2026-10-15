import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const outputDir = 'dist';

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyFile('index.html', `${outputDir}/index.html`);
await copyFile('divergence.html', `${outputDir}/divergence.html`);
await cp('src', `${outputDir}/src`, { recursive: true });
await cp('public', `${outputDir}/public`, { recursive: true });
await cp('arranger', `${outputDir}/arranger`, { recursive: true });
await cp('project-home', `${outputDir}/project-home`, { recursive: true });
await cp('sheet-app', `${outputDir}/sheet-app`, { recursive: true });

// 更新の検出用。BUILD_ID はコミットの短縮ID。アプリは build.json を読んで自分のBUILD_IDと比べる
let commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
if (!commit) {
  try { commit = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim(); } catch { commit = 'local'; }
}
const version = (await readFile('VERSION', 'utf8')).trim();
const builtAt = new Date().toISOString();
await writeFile(`${outputDir}/build.json`, JSON.stringify({ id: commit, version, builtAt }) + '\n');
await writeFile(`${outputDir}/src/core/build-info.js`, `export const BUILD_ID = ${JSON.stringify(commit)};\nexport const BUILD_TIME = ${JSON.stringify(builtAt)};\n`);

// HTMLだけが新しく、古いModuleが残る混在を避ける。全依存を同じBuild IDで固定。
const stamp = (path) => `${path}${path.includes('?') ? '&' : '?'}build=${encodeURIComponent(commit)}`;
async function stampHtml(htmlPath) {
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(htmlPath, html.replace(/(src|href)=(['"])(\.\/[^'"]+\.(?:js|css))\2/g,
    (_match, attribute, quote, path) => `${attribute}=${quote}${stamp(path)}${quote}`));
}

await stampHtml(`${outputDir}/index.html`);
await stampHtml(`${outputDir}/divergence.html`);

async function stampModules(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await stampModules(path);
    else if (entry.name.endsWith('.js')) {
      const source = await readFile(path, 'utf8');
      const stamped = source.replace(/(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]+\.js)\2/g,
        (_match, prefix, quote, dependency) => `${prefix}${quote}${stamp(dependency)}${quote}`);
      await writeFile(path, stamped);
    }
  }
}

await stampModules(`${outputDir}/src`);

const arrangerHtmlPath = `${outputDir}/arranger/index.html`;
await stampHtml(arrangerHtmlPath);
await stampModules(`${outputDir}/arranger/src`);

const projectHomeHtmlPath = `${outputDir}/project-home/index.html`;
await stampHtml(projectHomeHtmlPath);
await stampModules(`${outputDir}/project-home`);
await stampModules(`${outputDir}/sheet-app`);

async function collectPrecacheUrls(directory, urlPrefix) {
  const urls = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = `${directory}/${entry.name}`;
    const url = `${urlPrefix}/${entry.name}`;
    if (entry.isDirectory()) urls.push(...await collectPrecacheUrls(filePath, url));
    else if (entry.name !== 'service-worker.js' && entry.name !== 'build.json') {
      urls.push(/\.(?:js|css)$/.test(url) ? stamp(url) : url);
    }
  }
  return urls;
}

// Demo Composer本体・発散モード・Project Home・作曲シートをオフライン用に事前Cacheする。
// Arrangement Labは独自Service Workerを持つため、root workerでは二重管理しない。
const precacheUrls = Array.from(new Set([
  './',
  './index.html',
  './divergence.html',
  ...await collectPrecacheUrls(`${outputDir}/src`, './src'),
  ...await collectPrecacheUrls(`${outputDir}/public`, './public'),
  ...await collectPrecacheUrls(`${outputDir}/project-home`, './project-home'),
  ...await collectPrecacheUrls(`${outputDir}/sheet-app`, './sheet-app'),
]));

const serviceWorkerSource = await readFile('service-worker.js', 'utf8');
const serviceWorker = serviceWorkerSource
  .replace('const CACHE_VERSION = "dev";', `const CACHE_VERSION = ${JSON.stringify(commit)};`)
  .replace(/const PRECACHE_URLS = \[[\s\S]*?\];/, `const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};`);
await writeFile(`${outputDir}/service-worker.js`, serviceWorker);

console.log(`Built Demo Composer static site into dist/ with ${precacheUrls.length} PWA precache entries`);