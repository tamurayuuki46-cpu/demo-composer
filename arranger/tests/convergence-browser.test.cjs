const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/?mode=explore';
const fixture = (id='convergence-browser', revision=1) => ({ id, revision, schemaVersion:3, metadata:{title:'収束テスト'}, basic:{bpm:120,ppq:480,key:'C',scale:'major',timeSignature:'4/4'}, structure:{sections:[{id:'s1',kind:'verse',name:'Aメロ',bars:1},{id:'s2',kind:'chorus',name:'サビ',bars:1}]}, chords:[{root:0,quality:'major',startTick:0,durationTick:3840}], tracks:['melody','drums','counter'].map((role,i)=>({role,midiChannel:role==='drums'?10:i+2,notes:[0,1920].map(startTick=>({pitch:role==='drums'?36:64+i,startTick,durationTick:480,velocity:100}))})) });
const moduleCall = (page, fn) => page.evaluate(async fnText => { const app=await import(document.querySelector('script[src*="src/app.js"]').src); return await (new Function('app',`return (${fnText})(app)`))(app); }, fn.toString());
async function load(page,raw) { await page.locator('#project-file').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))}); await page.waitForFunction(expected=>{const text=document.querySelector('#source-summary')?.textContent||'';return document.querySelectorAll('.candidate-tab').length>0 && text.includes(expected);}, raw.metadata?.title || raw.source?.title); await page.waitForTimeout(150); }
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for (const width of [360,390,430]) {
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,acceptDownloads:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message)); await page.goto(url); await page.waitForSelector('#convergence-panel',{state:'attached'}); await load(page,fixture());
   assert.match(await page.locator('#convergence-current-label').textContent(),/仮:B（未決定）/);
   await page.locator('[data-convergence-status=adopted]').click();
   assert.equal(await moduleCall(page,app=>app.arrangerSession.current({save:false}).unresolved.length),0);
   // Normal decisions use no modal and support Undo.
   await page.locator('[data-convergence-status=hold]').click(); assert.equal(await page.locator('dialog[open]').count(),0);
   await page.locator('#convergence-undo button').click();
   assert.equal(await moduleCall(page,app=>app.arrangerSession.current({save:false}).unresolved.length),0);
   await page.locator('.candidate-tab').nth(2).click(); await page.selectOption('#convergence-scope','section:s2'); await page.locator('[data-convergence-status=adopted]').click();
   assert.match(await page.locator('#convergence-provenance').textContent(),/Section: C/);
   await page.locator('[data-action=toggle][data-section=s2][data-role=drums]').uncheck();
   assert.ok(await moduleCall(page,app=>Object.keys(app.arrangerSession.tracker.dirty).includes('section:s2')));
   // Use session's resolved candidate to compute expected MIDI from the same build graph.
   const midiExpected=await page.evaluate(async()=>{const script=document.querySelector('script[src*="src/app.js"]').src, app=await import(script), tools=await import(new URL('v05-tools.js'+new URL(script).search,script).href), current=app.arrangerSession.current(); window.currentPlanId=current.candidate.id; return Array.from(tools.createSongMidi(current.source,current.candidate));});
   const downloaded=page.waitForEvent('download'); await page.locator('#song-midi-btn').click(); const download=await downloaded;
   assert.deepEqual([...await fs.readFile(await download.path())],midiExpected); assert.equal(await page.locator('#convergence-export-dialog').count(),0);
   const savedCurrentId=await moduleCall(page,app=>app.arrangerSession.current({save:false}).candidate.id);
   await page.reload(); await page.waitForFunction(()=>document.querySelectorAll('.candidate-tab').length===3);
   assert.equal(await moduleCall(page,app=>app.arrangerSession.current({save:false}).candidate.id),savedCurrentId);
   assert.match(await page.locator('#convergence-provenance').textContent(),/Section: C/);
   const oldId=await moduleCall(page,app=>app.arrangerSession.model.arrangerProject.id); await load(page,fixture('convergence-browser',2));
   assert.equal(await moduleCall(page,app=>app.arrangerSession.model.arrangerProject.id),oldId); assert.equal(await moduleCall(page,app=>app.arrangerSession.model.source.sourceRevision),2);
   // Override release falls back to whole judgment.
   await page.selectOption('#convergence-scope','section:s2'); await page.locator('#convergence-release').click(); assert.doesNotMatch(await page.locator('#convergence-provenance').textContent(),/Section: C/);
   // Direct mutation is external; implicit save offers Recovery.
   await moduleCall(page,app=>{const s=app.arrangerSession,c=s.model.candidates[1];c.sections[0].enabled.drums=false;s.current();app.refreshArranger();});
   assert.equal(await page.locator('[data-recovery="global:s1"]').count(),1); await page.locator('[data-recovery="global:s1"]').click();
   const plan=await moduleCall(page,app=>app.arrangerSession.current().plan);
   // Data deletion + Plan import warns and cannot export silently.
   await page.evaluate(()=>localStorage.clear()); await page.reload(); await load(page,plan);
   assert.equal(await page.locator('#convergence-warning').textContent(),'収束判断が見つかりません');
   let downloads=0; page.on('download',()=>downloads++); await page.locator('#daw-pack-btn').click(); await page.waitForSelector('#convergence-export-dialog[open]'); assert.equal(downloads,0);
   await page.locator('[data-ack]').click();
   while (await page.locator('[data-daw]').count()) await page.locator('[data-daw]').first().click();
   const zipP=page.waitForEvent('download'); await page.locator('[data-continue]').click(); const zip=await fs.readFile(await (await zipP).path()); assert.ok(zip.toString('utf8').includes('## DAWで決める'));
   // Every storage write failing still permits the actual MIDI download.
   await page.evaluate(()=>{window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota')};});
   const failP=page.waitForEvent('download');await page.locator('#song-midi-btn').click(); assert.ok((await fs.readFile(await (await failP).path())).length); await page.evaluate(()=>Storage.prototype.setItem=window.oldSet);
   await load(page,fixture('second-song',1)); assert.equal(await moduleCall(page,app=>Object.keys(app.arrangerSession.state.slots).length),0);
   assert.equal(await moduleCall(page,app=>app.arrangerSession.model.arrangerProject.decisionJournal.entries.length),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await fs.mkdir('test-results',{recursive:true}); await page.locator('#convergence-panel').scrollIntoViewIfNeeded(); await page.screenshot({path:`test-results/convergence-${width}.png`});
   assert.deepEqual(errors,[]); console.log(`PASS convergence mobile ${width}: judgment/Undo/dirty/Current MIDI/reload/rebase/release/recovery/warning/ZIP/quota/isolation/console`); await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
