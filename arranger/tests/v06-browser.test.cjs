const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ARRANGER_URL||'http://127.0.0.1:8080/arranger/';
const PPQ=480,BAR=1920;
const fixture={
 id:'v06-browser',revision:6,schemaVersion:3,metadata:{title:'v06 beginner'},basic:{bpm:120,ppq:PPQ,key:'C',scale:'major',timeSignature:'4/4'},
 structure:{sections:[
  {id:'s1',kind:'verse',name:'Aメロ',bars:1,energy:'low'},
  {id:'s2',kind:'prechorus',name:'Bメロ',bars:1,energy:'mid'},
  {id:'s3',kind:'chorus',name:'サビ',bars:1,energy:'high'},
 ]},
 chords:[
  {root:0,quality:'major',startTick:0,durationTick:BAR},{root:5,quality:'major',startTick:BAR,durationTick:BAR},{root:7,quality:'dominant7',startTick:BAR*2,durationTick:BAR},
 ],
 tracks:['melody','counter','bass','drums'].map((role,index)=>({role,midiChannel:role==='drums'?10:index+2,notes:[0,1,2].flatMap(section=>[0,1,2,3].map(beat=>({id:`${role}-${section}-${beat}`,pitch:role==='drums'?(beat%2?38:36):role==='bass'?36+section:60+index+section,startTick:section*BAR+beat*PPQ,durationTick:role==='drums'?120:360,velocity:88})))})),
};

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base);
  await page.waitForFunction(()=>document.querySelector('#version')?.textContent==='v0.10-dev');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.arrangerUiVersion),'v0.10-dev');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.arrangerMode),'beginner');
  assert.equal(await page.locator('#beginner-guide').count(),1);
  assert.equal(await page.locator('#beginner-bottom-nav').count(),1);
  assert.match(await page.locator('#beginner-next-action').textContent(),/1小節のコード \/ メロディ/);
  assert.equal(await page.locator('[data-section-empty]').isVisible(),true);
  assert.match(await page.locator('[data-section-empty]').textContent(),/①.*②/);

  // No completion gate: the user can move forward and back before importing anything.
  await page.click('#beginner-next');
  await page.waitForFunction(()=>document.querySelector('#beginner-step-label')?.textContent?.includes('②'));
  assert.match(await page.locator('#beginner-next-action').textContent(),/A \/ B \/ C/);
  await page.click('#beginner-prev');
  await page.waitForFunction(()=>document.querySelector('#beginner-step-label')?.textContent?.includes('①'));

  // Empty-state shortcut returns to import after smooth scroll settles.
  await page.locator('[data-section-empty] [data-go-step]').click();
  await page.waitForFunction(()=>document.querySelector('#beginner-step-label')?.textContent?.includes('①'));
  assert.match(await page.locator('#beginner-step-label').textContent(),/①/);

  await page.locator('#project-file').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await page.waitForFunction(()=>document.querySelectorAll('.candidate-tab').length===3&&document.querySelectorAll('.section-card').length===3);
  assert.equal(await page.locator('[data-section-empty]').count(),0);
  assert.equal(await page.locator('[data-beginner-section-hint]').isVisible(),true);

  // Beginner mode keeps the four basic Section controls visible and hides advanced paths.
  assert.equal(await page.locator('.section-card').first().locator('[data-action=density]').isVisible(),true);
  assert.equal(await page.locator('.section-card').first().locator('[data-role=counter]').isVisible(),true);
  assert.equal(await page.locator('.section-card').first().locator('.reharm-block').first().isVisible(),true);
  assert.equal(await page.locator('.section-card').first().locator('.section-workshop').isHidden(),true);
  assert.equal(await page.locator('.section-card').first().locator('.v05-note-generator').isHidden(),true);
  assert.equal(await page.locator('.mix-row').isHidden(),true);
  assert.equal(await page.locator('#v05-comparison-room').isHidden(),true);
  assert.equal(await page.locator('#midi-buttons').isHidden(),true);
  assert.equal(await page.locator('.danger-zone').isHidden(),true);

  // More mode restores all existing v0.5+ functionality without deleting it.
  await page.click('#section-more-toggle');
  await page.waitForFunction(()=>document.documentElement.dataset.arrangerMode==='explore');
  assert.equal(await page.evaluate(()=>localStorage.getItem('arrangement-lab-ui-mode-v0.6')),'explore');
  assert.equal(await page.locator('.section-card').first().locator('.section-workshop').isVisible(),true);
  assert.equal(await page.locator('.section-card').first().locator('.v05-note-generator').isVisible(),true);
  assert.equal(await page.locator('.mix-row').isVisible(),true);
  assert.equal(await page.locator('#v05-comparison-room').isVisible(),true);
  assert.equal(await page.locator('#midi-buttons').isVisible(),true);

  await page.locator('[data-arranger-mode=beginner]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.arrangerMode==='beginner');
  assert.equal(await page.locator('.section-card').first().locator('.section-workshop').isHidden(),true);
  assert.equal(await page.locator('#v05-decision-panel .panel-title h2').textContent(),'判断の記録と復元');
  assert.equal(await page.locator('#version').textContent(),'v0.10-dev');

  const navPosition=await page.locator('#beginner-bottom-nav').evaluate(el=>getComputedStyle(el).position);
  assert.equal(navPosition,'fixed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('PASS v0.10 browser: current version guard, beginner default, one-bar chord/melody hint, ungated nav, Section controls, explore toggle, mobile fixed nav');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
