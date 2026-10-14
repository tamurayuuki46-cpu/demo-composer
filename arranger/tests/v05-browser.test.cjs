const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ARRANGER_URL||'http://127.0.0.1:8080/arranger/';
const PPQ=480,BAR=1920;
const fixture={
 id:'v05-browser',revision:5,schemaVersion:3,metadata:{title:'v05 browser'},basic:{bpm:120,ppq:PPQ,key:'C',scale:'major',timeSignature:'4/4'},
 structure:{sections:[
  {id:'s1',kind:'verse',name:'Aメロ',bars:1,energy:'low'},
  {id:'s2',kind:'prechorus',name:'Bメロ',bars:1,energy:'mid'},
  {id:'s3',kind:'chorus',name:'サビ',bars:1,energy:'high'},
 ]},
 chords:[
  {root:0,quality:'major',startTick:0,durationTick:BAR/2},{root:9,quality:'minor',startTick:BAR/2,durationTick:BAR/2},
  {root:5,quality:'major',startTick:BAR,durationTick:BAR/2},{root:7,quality:'dominant7',startTick:BAR+BAR/2,durationTick:BAR/2},
  {root:0,quality:'major',startTick:BAR*2,durationTick:BAR/2},{root:7,quality:'dominant7',startTick:BAR*2+BAR/2,durationTick:BAR/2},
 ],
 tracks:['melody','counter','bass','drums'].map((role,index)=>({role,midiChannel:role==='drums'?10:index+2,notes:[0,1,2].flatMap(section=>[0,1,2,3].map(beat=>({id:`${role}-${section}-${beat}`,pitch:role==='drums'?(beat%2?38:36):role==='bass'?36+section:60+index+section,startTick:section*BAR+beat*PPQ,durationTick:role==='drums'?120:360,velocity:88+beat*2})))})),
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{window.AudioContextOriginal=window.AudioContext;window.testContexts=[];window.AudioContext=class extends window.AudioContextOriginal{constructor(...args){super(...args);window.testContexts.push(this)}};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base);await page.locator('#version').waitFor();await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.9-dev');
  await page.locator('#project-file').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await page.waitForFunction(()=>document.querySelectorAll('.candidate-tab').length===3);
  assert.equal(await page.locator('#v05-comparison-room').count(),1);assert.equal(await page.locator('#v05-decision-panel').count(),1);assert.equal(await page.locator('#v05-daw-actions').count(),1);
  // v0.9 keeps v0.5 advanced functionality under the explicit "もっと試す" mode.
  await page.locator('[data-arranger-mode=explore]').click();await page.waitForFunction(()=>document.documentElement.dataset.arrangerMode==='explore');

  // ① Blind elimination comparison: candidate identity is hidden until a winner remains.
  await page.click('#blind-start');assert.ok(await page.evaluate(()=>document.body.classList.contains('blind-active')));assert.equal(await page.locator('#blind-box').isHidden(),false);
  await page.locator('[data-blind-play="0"]').click();await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');await page.click('#comparison-stop');
  await page.locator('[data-blind-choose="0"]').click();await page.locator('[data-blind-choose="0"]').click();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('blind-active')),false);assert.match(await page.locator('#comparison-result').textContent(),/勝ち残り/);

  // Use the high-development candidate so changed-only playback always has a real difference.
  await page.locator('.candidate-tab').nth(2).click();
  // Changed-only and Bメロ -> サビ preview use the normalized comparison path.
  await page.selectOption('#preview-section',String(BAR));await page.click('#changed-only');await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');await page.click('#comparison-stop');
  assert.match(await page.locator('#comparison-result').textContent(),/変更部分/);
  await page.click('#transition-preview');await page.waitForFunction(()=>window.testContexts.at(-1)?.state==='running');assert.match(await page.locator('#comparison-result').textContent(),/Bメロ.*サビ/);await page.click('#comparison-stop');

  // ⑤ Decision journal saves status/reason + snapshot and can restore the original snapshot.
  await page.selectOption('#decision-section','s2');await page.selectOption('#decision-status','hold');await page.fill('#decision-reason','サビ前の密度をもう一度比較する');await page.click('#decision-save');
  let journal=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-decisions-v0.5')));assert.equal(journal.entries.at(-1).status,'hold');assert.equal(journal.entries.at(-1).sectionId,'s2');
  const density=page.locator('[data-action=density][data-section=s2]'),originalDensity=await density.inputValue(),alternate=originalDensity==='full'?'thin':'full';await density.selectOption(alternate);assert.equal(await density.inputValue(),alternate);
  await page.click('#decision-original');await page.waitForFunction(expected=>document.querySelector('[data-action=density][data-section=s2]')?.value===expected,originalDensity);assert.equal(await density.inputValue(),originalDensity);
  journal=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-decisions-v0.5')));assert.equal(journal.entries.at(-1).status,'restored');

  // Drum Fill concrete Note generation survives re-import.
  await page.locator('[data-v05-action=drum-show][data-section=s2]').click();assert.equal(await page.locator('[data-v05-section=s2] [data-v05-action=apply]').count(),3);await page.locator('[data-v05-section=s2] [data-v05-action=apply]').first().click();
  await page.waitForFunction(()=>document.querySelectorAll('.section-card').length===3);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('demo-composer-arranger-v0.4')));assert.ok(saved.arrangement.sections.find(s=>s.sectionId==='s2').partOverrides.drums.length);

  // ⑥ One ZIP carries before/after MIDI, per-part MIDI and production notes.
  let downloadP=page.waitForEvent('download');await page.click('#daw-pack-btn');let download=await downloadP;const bytes=await fs.readFile(await download.path());assert.equal(bytes.subarray(0,4).toString('hex'),'504b0304');const latin=bytes.toString('latin1');
  for(const name of ['Before_Source_Song.mid','After_Arrangement_Song.mid','Arrangement_Plan.json','TRACK_INSTRUCTIONS.md','SECTION_INSTRUCTIONS.md','DAW_CHECKLIST.md','DECISIONS.json','COMPARE_MANIFEST.json'])assert.ok(latin.includes(name),name);
  downloadP=page.waitForEvent('download');await page.click('#before-midi-btn');download=await downloadP;assert.equal((await fs.readFile(await download.path())).subarray(0,4).toString(),'MThd');
  downloadP=page.waitForEvent('download');await page.click('#song-midi-btn');download=await downloadP;assert.equal((await fs.readFile(await download.path())).subarray(0,4).toString(),'MThd');

  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');assert.deepEqual(errors,[]);console.log('PASS v0.5 features under v0.9 explore mode: blind/change/transition comparison, decisions/restore, note generator, DAW ZIP');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
