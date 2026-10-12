import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const outputDir = 'dist';

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyFile('index.html', `${outputDir}/index.html`);
await cp('src', `${outputDir}/src`, { recursive: true });
await cp('public', `${outputDir}/public`, { recursive: true });
await cp('arranger', `${outputDir}/arranger`, { recursive: true });

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
const htmlPath = `${outputDir}/index.html`;
const html = await readFile(htmlPath, 'utf8');
await writeFile(htmlPath, html.replace(/(src|href)=(['"])(\.\/[^'"]+\.(?:js|css))\2/g,
  (_match, attribute, quote, path) => `${attribute}=${quote}${stamp(path)}${quote}`));
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
console.log('Built Demo Composer static site into dist/');
