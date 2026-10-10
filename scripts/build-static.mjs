import { copyFile, cp, mkdir, rm } from 'node:fs/promises';

const outputDir = 'dist';

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyFile('index.html', `${outputDir}/index.html`);
await cp('src', `${outputDir}/src`, { recursive: true });
await cp('public', `${outputDir}/public`, { recursive: true });

console.log('Built Demo Composer static site into dist/');
