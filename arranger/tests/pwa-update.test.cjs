const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let phase='legacy';
const legacyHtml='<!doctype html><html><head><link rel="icon" href="data:,"></head><body><span id="version">v0.3-dev</span><script>navigator.serviceWorker.register("./sw.js")</script></body></html>';
const legacyWorker=`const CACHE='arrangement-lab-legacy-test';self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./src/core.js'])).then(()=>self.skipWaiting()))});self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request))));`;
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.webmanifest':'application/manifest+json'};
const distRoot=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=url.pathname;
  if(p==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(phase==='legacy'&&(p==='/arranger/'||p==='/arranger/index.html')){res.setHeader('Content-Type','text/html');return res.end(legacyHtml)}
  if(phase==='legacy'&&p==='/arranger/sw.js'){res.setHeader('Content-Type','text/javascript');return res.end(legacyWorker)}
  if(phase==='legacy'&&p==='/arranger/src/core.js'){res.setHeader('Content-Type','text/javascript');return res.end("export const ARRANGER_VERSION='v0.3-dev';")}
  const relative=p.replace(/^\/+/, '')+(p.endsWith('/')?'index.html':'');
  const file=path.resolve(distRoot,relative);
  if(file!==distRoot&&!file.startsWith(`${distRoot}${path.sep}`)){res.writeHead(404);return res.end()}
  res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');
  res.setHeader('Cache-Control','no-store');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/arranger/`,browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert.equal(await page.locator('#version').textContent(),'v0.3-dev');
  await page.evaluate(async()=>{localStorage.setItem('demo-composer-arranger-v0.3','old-data-kept');await caches.open('another-pwa-sentinel')});
  phase='current';
  // The old cache owns `/arranger/`; use an uncached index entry to discover the new worker, then verify normal URL recovery below.
  await page.goto(base+'index.html?v=0.13');await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.13-dev');
  const buildWorkerUrl=await page.evaluate(async()=>{
   const deadline=Date.now()+30000;
   while(Date.now()<deadline){
    const r=await navigator.serviceWorker.getRegistration();
    if(r?.active?.state==='activated'&&r.active.scriptURL.includes('?build='))return r.active.scriptURL;
    await new Promise(resolve=>setTimeout(resolve,50));
   }
   const r=await navigator.serviceWorker.getRegistration();
   throw new Error(`build worker did not activate: active=${r?.active?.scriptURL||'none'} waiting=${r?.waiting?.scriptURL||'none'} installing=${r?.installing?.scriptURL||'none'}`);
  });
  assert.ok(buildWorkerUrl.includes('?build='));
  await page.reload({waitUntil:'load'});await page.waitForFunction(expected=>navigator.serviceWorker.controller?.scriptURL===expected,buildWorkerUrl);await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.13-dev');
  assert.equal(await page.evaluate(()=>localStorage.getItem('demo-composer-arranger-v0.3')),'old-data-kept');
  assert.ok((await page.evaluate(()=>caches.keys())).includes('another-pwa-sentinel'));
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.13-dev');
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.13-dev');
  const offlineProfile = await page.evaluate(async () => {
   const build = new URL(navigator.serviceWorker.controller.scriptURL).searchParams.get('build');
   const {resolveSoundProfile} = await import(`../src/core/sound-presets.js?build=${encodeURIComponent(build)}`);
   return resolveSoundProfile([{part:'chord',preset:'organ',tone:'warm'}], 'chord');
  });
  assert.equal(offlineProfile.filter,2460,'shared Sound Profile resolves offline');
  assert.equal(await page.locator('#beginner-guide').count(),1);
  assert.equal(await page.locator('.song-data-trigger').textContent(),'📦 曲データ');
  assert.deepEqual(errors,[]);console.log('PASS legacy v0.3 PWA -> build-stamped v0.13 sound-preserving preview -> normal URL -> offline; shared Sound/SongProject/menu modules, saved data and other caches preserved');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});