import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const outputDir = 'dist';

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyFile('index.html', `${outputDir}/index.html`);
await cp('src', `${outputDir}/src`, { recursive: true });
await cp('public', `${outputDir}/public`, { recursive: true });

// 更新の検出用。BUILD_ID はコミットの短縮ID。アプリは build.json を読んで自分のBUILD_IDと比べる
let commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
if (!commit) {
  try { commit = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim(); } catch { commit = 'local'; }
}
const version = (await readFile('VERSION', 'utf8')).trim();
const builtAt = new Date().toISOString();
await writeFile(`${outputDir}/build.json`, JSON.stringify({ id: commit, version, builtAt }) + '\n');
await writeFile(`${outputDir}/src/core/build-info.js`, `export const BUILD_ID = ${JSON.stringify(commit)};\nexport const BUILD_TIME = ${JSON.stringify(builtAt)};\n`);

console.log('Built Demo Composer static site into dist/');
