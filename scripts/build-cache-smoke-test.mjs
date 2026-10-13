import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const {id}=JSON.parse(await readFile('dist/build.json','utf8'));
const html=await readFile('dist/index.html','utf8');
const assets=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(m=>m[1]);
assert.ok(assets.length>10);
for(const path of assets)assert.ok(path.includes(`build=${id}`),`entry/stylesheet must be stamped: ${path}`);
let modules=0,dependencies=0;
async function check(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const path=`${directory}/${entry.name}`;
 if(entry.isDirectory())await check(path);
 else if(entry.name.endsWith('.js')){
  modules++;const source=await readFile(path,'utf8');
  const matches=[...source.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)["'](\.{1,2}\/[^"']+\.js(?:\?[^"']*)?)["']/g)];
  for(const [,dependency] of matches){assert.ok(dependency.includes(`build=${id}`),`${path}: ${dependency}`);dependencies++;}
 }
}}
await check('dist/src');assert.ok(modules>30&&dependencies>50);console.log(`Build cache test passed: ${modules} modules, ${dependencies} stamped dependencies`);
