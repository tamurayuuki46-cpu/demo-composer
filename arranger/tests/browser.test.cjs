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
   let deliberateOffline=false;
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{
    if(m.type()!=='error')return;
    const text=m.text();
    if(deliberateOffline&&text.includes('ERR_INTERNET_DISCONNECTED'))return;
    errors.push(text);
   });
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
   await page.locator('.section-workshop').first().locator('summary').first().click();
   await page.locator('[data-section-field=donor]').first().selectOption('0');
   await page.locator('[data-action=section-adopt]').first().click();
   await page.locator('[data-action=density]').first().selectOption('full');
   await page.locator('[data-action=toggle][data-role=bass]').first().uncheck();
   await page.locator('[data-action=reharm-show]').first().click();assert.equal(await page.locator('.reharm-option').count(),3);
   await page.locator('[data-action=reharm-apply][data-reharm=natural]').click();
   await page.locator('[data-action=reharm-clear]').click();
   await page.locator('[data-action=reharm-apply][data-reharm=bold]').click();
   assert.equal(await page.locator('.curve-row').count(),2);
   await page.click('#adopt-btn');
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')));
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
   // Seven features share the same current Section and persistence/export path.
   await page.locator('.section-workshop').first().locator('summary').first().click();
   await page.locator('[data-action=theory-show]').first().click();
   assert.equal(await page.locator('.theory-card').count(),6);
   await page.locator('.theory-explanation').first().locator('summary').first().click();
   assert.ok(await page.locator('.note-diff').count());
   for(const mode of ['original','candidate','guide','bass']) {
    await page.locator(`[data-action=theory-preview][data-mode=${mode}]`).first().click();
    await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');
    await page.locator('#stop-btn').click();await page.waitForFunction(()=>window.testContexts.every(c=>c.state==='closed'));
   }
   await page.locator('[data-action=theory-apply]').first().click();
   await page.locator('[data-action=counter-show]').first().click();assert.equal(await page.locator('.counter-card').count(),5);
   await page.locator('[data-action=counter-apply]').nth(2).click();
   await page.locator('[data-action=lead-apply][data-mode=counter]').first().click();
   await page.locator('[data-action=decision-note]').first().fill('裏メロは隙間で受け渡す');
   await page.locator('[data-action=decision-note]').first().press('Tab');
   await page.locator('[data-action=subtract-show]').first().click();
   assert.equal(await page.locator('[data-action=subtract-apply]').count(),3);
   await page.locator('[data-action=subtract-apply]').nth(2).click();
   await page.locator('.section-workshop').nth(1).locator('summary').first().click();
   await page.locator('[data-action=chorus-show]').click();assert.equal(await page.locator('[data-action=chorus-apply]').count(),5);
   await page.locator('[data-action=chorus-preview]').nth(4).click();
   await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');await page.locator('#stop-btn').click();
   await page.locator('[data-action=chorus-apply]').nth(4).click();
   await page.locator('#adopt-btn').click();
   const all=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')));
   assert.equal(all.arrangerSchemaVersion,4);
   assert.equal(all.arrangement.sections[0].counterArrangement.id,'color');
   assert.equal(all.arrangement.sections[0].restPolicy,'melody-gaps');
   assert.equal(all.arrangement.sections[0].decisionNote,'裏メロは隙間で受け渡す');
   assert.equal(all.arrangement.sections[1].harmonyPattern,'offbeat');
   assert.deepEqual(all.sourceSnapshot,fixture);
   await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===2);
   const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')));
   assert.deepEqual(reloaded.arrangement,all.arrangement);
   const {fixture:labFixture}=await import('./music-lab-fixture.mjs');
   await page.locator('#project-file').setInputFiles({name:'labs.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(labFixture()))});
   await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===6);
   await page.locator('.candidate-tab').nth(2).click();
   await page.locator('.section-workshop').nth(1).locator('summary').first().click();
   const setCategory=async category=>page.locator('[data-action=music-category]').nth(1).selectOption(category);
   const setMethod=async method=>page.locator('[data-action=music-method]').nth(1).selectOption(method);
   const generate=async()=>{await page.locator('[data-action=music-generate]').nth(1).click();assert.ok(await page.locator('.music-choice').count())};
   const expectedCounts={harmony:14,counter:16,development:15,linked:5};
   for(const [category,count] of Object.entries(expectedCounts)) {
    await setCategory(category);
    const ids=await page.locator('[data-action=music-method]').nth(1).locator('option').evaluateAll(options=>options.map(o=>o.value));
    assert.equal(ids.length,count);
    for(const id of (width===360?ids:[ids[0]])){await setMethod(id);await generate();assert.ok(await page.locator('[data-action=music-apply]').count(),id+' should have applicable result');}
   }
   await setCategory('harmony');await setMethod('h-bridge');await generate();
   await page.locator('[data-action=music-preview]').first().click();await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');await page.locator('#stop-btn').click();
   await page.locator('[data-action=music-apply]').first().click();
   await setCategory('counter');await setMethod('c-voices');await generate();await page.locator('[data-action=music-apply]').first().click();
   await page.locator('[data-music-part]').first().selectOption('counter-a');
   downloadP=page.waitForEvent('download');await page.locator('[data-action=music-midi]').first().click();download=await downloadP;
   assert.equal((await fs.readFile(await download.path())).subarray(0,4).toString(),'MThd');
   await setCategory('development');await setMethod('d-transition');await generate();await page.locator('[data-action=music-apply]').first().click();
   await setCategory('linked');await setMethod('x-float');await generate();await page.locator('[data-action=music-apply]').first().click();
   await page.locator('#adopt-btn').click();
   const labPlan=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')));
   assert.equal(labPlan.arrangerSchemaVersion,4);assert.equal(labPlan.arrangement.sections[1].musicLab.methodId,'x-float');
   assert.ok(labPlan.arrangement.sections[1].partOverrides.counter.length);assert.ok(labPlan.arrangement.sections[1].partOverrides.drums.length);
   await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===6);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')).arrangement),labPlan.arrangement);
   await page.locator('.section-workshop').nth(1).locator('summary').first().click();
   await setCategory('harmony');await setMethod('h-voicing');await generate();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
   await page.screenshot({path:`test-results/arranger-${width}.png`,fullPage:true});
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert.ok((await page.evaluate(()=>caches.keys())).includes('demo-composer-sentinel'));
   deliberateOffline=true;
   await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===6);
   await page.selectOption('#preview-section','7680');await page.click('#preview-btn');
   await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');
   await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='closed',{},{timeout:20000});
   assert.deepEqual(errors,[],`console errors ${width}`);
   await context.close();console.log(`PASS ${width}px: 50 music methods + seven legacy features, audio/MIDI/JSON/offline`);
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});