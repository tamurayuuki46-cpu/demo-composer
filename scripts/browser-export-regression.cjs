const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  await fs.mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:8080/');
      await page.getByLabel('Project名', { exact: true }).fill('Mobile export regression');
      await page.getByLabel('Project名', { exact: true }).press('Tab');
      await page.getByRole('heading', { name: 'Mobile export regression', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Chord', exact: true }).click();
      await page.getByRole('button', { name: '適用', exact: true }).click();
      await page.getByRole('button', { name: 'Melody', exact: true }).click();
      await page.getByRole('button', { name: 'キャッチーをBar 1へ適用', exact: true }).click();
      for (const screen of ['裏メロ', 'Rhythm', 'Arrange', 'Sound', 'Hub']) {
        await page.getByRole('navigation').getByRole('button', { name: screen, exact: true }).click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${screen} overflows at ${width}px`);
      }
      await page.getByRole('button', { name: 'Save Now', exact: true }).click();
      await page.getByText('手動保存しました。project.json Backupも定期的に利用してください。', { exact: true }).waitFor();
      await page.reload();
      await page.getByRole('heading', { name: 'Mobile export regression', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Export ▼', exact: true }).click();
      const pending = page.waitForEvent('download');
      await page.locator('[data-midi-file="Draft.mid"]').click();
      const download = await pending;
      assert.equal(download.suggestedFilename(), 'Draft.mid');
      const midi = await fs.readFile(await download.path());
      assert.equal(midi.subarray(0, 4).toString(), 'MThd');
      assert.ok(midi.length > 100, 'Saved composition must export playable data');
      assert.equal(await page.locator('[data-drive-file="Draft.mid"]').count(), 1);
      assert.equal(await page.locator('[data-midi-file="Song.mid"], [data-drive-file="Song.mid"]').count(), 0);
      await page.screenshot({ path: `test-results/demo-export-${width}.png` });
      assert.deepEqual(errors, [], 'No application console errors');
      await context.close();
    }
    console.log('Demo mobile export / navigation / save / reload regression passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
