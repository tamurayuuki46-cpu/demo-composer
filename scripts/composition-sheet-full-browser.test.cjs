const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.SHEET_FULL_URL||'http://127.0.0.1:8080/sheet-app/versions/v0.4/composition_sheet_v0.4.html';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const width of [360,390,430,1440]){
 const context=await browser.newContext({viewport:{width,height:900},isMobile:width<800,hasTouch:width<800}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);await page.locator('#sheet-nav button').first().waitFor();assert.equal(await page.locator('#sheet-nav button').count(),31);
 const ids=await page.locator('#sheet-nav button').evaluateAll(nodes=>nodes.map(n=>n.dataset.page));
 for(const id of ids){await page.locator('#sheet-nav button').filter({hasText:/.*/}).evaluateAll((nodes,id)=>nodes.find(n=>n.dataset.page===id).click(),id);assert.ok(await page.locator('#sheet-body h1').textContent());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${id} at ${width}`);}
 await page.fill('#search','裏メロ');assert.ok(await page.locator('#sheet-nav button').count()>1);await page.fill('#search','見つからない語123');assert.equal(await page.locator('#sheet-nav button').count(),0);await page.fill('#search','');
 await page.locator('#sheet-nav button').evaluateAll(nodes=>nodes.find(n=>n.dataset.page.startsWith('01_')).click());
 const cell=page.locator('[data-cell]').first();await cell.fill('この曲のタイトル');const select=page.locator('select[data-cell]').first();await select.selectOption('高');
 await page.fill('#page-note','語尾に返す裏メロ');await page.fill('#song-title','完全版テスト');const checkbox=page.locator('[data-check]').first();await checkbox.check();
 await page.reload();await page.locator('[data-cell]').first().waitFor();assert.equal(await page.locator('[data-cell]').first().inputValue(),'この曲のタイトル');assert.equal(await page.locator('select[data-cell]').first().inputValue(),'高');assert.equal(await page.locator('#page-note').inputValue(),'語尾に返す裏メロ');assert.equal(await page.locator('[data-check]').first().isChecked(),true);
 const downloadPromise=page.waitForEvent('download');await page.click('#backup');const download=await downloadPromise;const json=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(json.schemaVersion,1);assert.equal(json.kind,'song-project');assert.equal(Object.keys(json.compatibility.compositionSheet.fullWorkbook.sheets).length,31);
 await page.click('#new-project');assert.equal(await page.locator('#project-picker option').count(),2);await page.locator('#file-input').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(json))});await page.getByText('JSONを読み込みました。既存の作曲・編曲データも保持します。',{exact:true}).waitFor();assert.equal(await page.locator('#song-title').inputValue(),'完全版テスト');
 await page.locator('#sheet-nav button').evaluateAll(nodes=>nodes.find(n=>n.dataset.page.startsWith('01_')).click());assert.equal(await page.locator('[data-cell]').first().inputValue(),'この曲のタイトル');assert.equal(await page.locator('#page-note').inputValue(),'語尾に返す裏メロ');
 await page.locator('#file-input').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('読み込めませんでした'));assert.equal(await page.locator('#page-note').inputValue(),'語尾に返す裏メロ');
 await page.locator('#handoff-form summary').click();await page.fill('#scene','雨上がりの帰り道');await page.fill('#reference1','YOASOBI / 参考曲');await page.fill('#bpm','128');await page.fill('#key','E minor');
 await Promise.all([page.waitForURL(u=>u.searchParams.get('handoff')==='composition-sheet'),page.click('#handoff')]);
 const payload=await page.evaluate(()=>JSON.parse(localStorage.getItem('music-project-songproject-handoff-v1')));assert.equal(payload.songProject.intent.scene,'雨上がりの帰り道');assert.equal(payload.songProject.basic.bpm,128);assert.equal(payload.songProject.basic.key,'E');assert.equal(payload.songProject.compatibility.compositionSheet.fullWorkbook.sheets[ids.find(id=>id.startsWith('01_'))].note,'語尾に返す裏メロ');
 assert.deepEqual(errors,[]);await fs.mkdir('test-results',{recursive:true});await page.goto(url);await page.screenshot({path:`test-results/composition-sheet-full-${width}.png`,fullPage:false});console.log(`PASS full sheet ${width}px: all 31 pages, search, cells/checks/notes, reload, JSON, new-project preservation, invalid import, Demo handoff, no overflow/console errors`);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
