const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:1000},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

    await page.goto('http://127.0.0.1:8080/sheet-app/');
    await page.locator('#beginner-card').waitFor();
    await page.locator('#composition-sheet-full-menu').waitFor({state:'attached'});
    assert.match(await page.title(),/v0\.9\.1/);
    assert.equal(await page.locator('body').getAttribute('data-sheet-mode'),'beginner');
    assert.equal(await page.locator('#sheet-panel').isVisible(),false);
    assert.equal(await page.locator('#composition-sheet-full-menu').isVisible(),true);

    await page.click('#beginner-open-details');
    assert.equal(await page.locator('body').getAttribute('data-sheet-mode'),'detail');
    await page.locator('#sheet-panel').waitFor({state:'visible'});

    await page.reload();
    await page.locator('#beginner-card').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-sheet-mode'),'beginner','reload must always return to かんたん入力');
    assert.equal(await page.locator('#sheet-panel').isVisible(),false);

    await page.goto('http://127.0.0.1:8080/sheet-app/?embed=1');
    await page.locator('#beginner-card').waitFor();
    await page.locator('#composition-sheet-full-menu').waitFor({state:'attached'});
    assert.equal(await page.locator('body').getAttribute('data-sheet-mode'),'beginner');
    assert.equal(await page.locator('#composition-sheet-full-menu').isVisible(),false,'embedded sheet must hide its inner 曲データ menu');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at 390px');
    assert.deepEqual(errors,[]);
    console.log('PASS sheet v0.9.1: beginner reset + embedded song-data menu hidden');
    await context.close();
  }finally{
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
