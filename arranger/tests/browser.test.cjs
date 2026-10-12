const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/';
const fixture = {
 id:'browser-test',revision:1,schemaVersion:3,metadata:{title:'Browser test'},basic:{bpm:120,ppq:480,timeSignature:'4/4'},
 structure:{sections:[{id:'a',kind:'verse',name:'Aメロ',bars:1},{id:'b',kind:'chorus',name:'サビ',bars:1}]},
 chords:[{root:0,quality:'major',startTick:0,durationTick:1920},{root:7,quality:'dominant7',startTick:1920,durationTick:1920}],
 tracks:['melody','bass','drums','counter'].map((role,i)=>({role,midiChannel:i+1,notes:[{pitch:role==='drums'?36:60+i,startTick:1920,durationTick:480,velocity:90}]}))
};
(async()=>{
 await fs.mkdir('test-results',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try {
  for(const width of [360,390,430]) {
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
   // Seed another PWA's cache before registration; Arrangement Lab must preserve it.
   await context.addInitScript(()=>{window.AudioContextOriginal=window.AudioContext;window.testContexts=[];window.AudioContext=class extends window.AudioContextOriginal {constructor(...args){super(...args);window.testContexts.push(this)}};});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(base); await page.evaluate(()=>caches.open('demo-composer-sentinel'));
   await page.locator('#version').waitFor();
   await page.locator('#project-file').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
   await page.waitForFunction(()=>document.querySelectorAll('.candidate-tab').length===3);
   for(const style of ['synth-pop','piano-ballad','jpop-band']) {await page.selectOption('#style-select',style);assert.equal(await page.locator('.candidate-tab').count(),3)}
   for(let i=0;i<3;i++) {
    await page.locator('.candidate-tab').nth(i).click();
    await page.selectOption('#preview-section','1920');await page.click('#preview-btn');
    await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');
    await page.click('#stop-btn');await page.waitForFunction(()=>window.testContexts.every(c=>c.state==='closed'));
   }
   await page.click('#mix-btn');assert.equal(await page.locator('.candidate-tab').count(),4);
   await page.locator('[data-action=density]').first().selectOption('full');
   await page.locator('[data-action=toggle][data-role=bass]').first().uncheck();
   await page.locator('[data-action=reharm-show]').first().click();assert.equal(await page.locator('.reharm-option').count(),3);
   await page.locator('[data-reharm=natural]').click();
   await page.locator('[data-action=reharm-clear]').click();
   await page.locator('[data-reharm=bold]').click();
   assert.equal(await page.locator('.curve-row').count(),2);
   await page.click('#adopt-btn');
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.2')));
   assert.equal(before.arrangement.sections[0].reharmonization.id,'bold');
   await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===2);
   assert.equal(await page.locator('[data-action=density]').first().inputValue(),'full');
   assert.equal(await page.locator('[data-action=toggle][data-role=bass]').first().isChecked(),false);
   // Editing then exporting must export current candidate, not stale adopted plan.
   await page.locator('[data-action=density]').first().selectOption('thin');
   let downloadP=page.waitForEvent('download');await page.click('#export-btn');let download=await downloadP;
   const plan=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(plan.arrangement.sections[0].density,'thin');
   await page.locator('#project-file').setInputFiles({name:'plan.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(plan))});
   await page.waitForFunction(()=>document.querySelector('[data-action=density]')?.value==='thin');
   for(const part of ['melody','bass','drums','counter','harmony']) {
    downloadP=page.waitForEvent('download');await page.locator(`[data-part=${part}]`).click(); download=await downloadP;
    const bytes=await fs.readFile(await download.path());assert.equal(bytes.subarray(0,4).toString(),'MThd');
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
   await page.screenshot({path:`test-results/arranger-${width}.png`,fullPage:true});
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert.ok((await page.evaluate(()=>caches.keys())).includes('demo-composer-sentinel'));
   await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===2);
   await page.selectOption('#preview-section','1920');await page.click('#preview-btn');
   await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');
   await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='closed',{},{timeout:12000});
   assert.deepEqual(errors,[],`console errors ${width}`);
   await context.close();console.log(`PASS ${width}px: ABC/styles/play-stop/end/mix/edit/reharm/MIDI/JSON/reload/offline/cache`);
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
