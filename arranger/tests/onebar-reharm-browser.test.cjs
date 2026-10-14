const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const arrangerUrl = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/?mode=beginner';

(async () => {
  const { createEmptySongProject } = await import('../../src/shared/song-project.js');
  const sketch = createEmptySongProject({
    projectId: 'onebar-reharm-browser',
    title: '1小節リハモテスト',
    now: '2026-10-14T00:00:00.000Z',
  });
  sketch.composition.melody.push(
    { id: 'm1', pitch: 64, startTick: 0, durationTick: 480, velocity: 96 },
    { id: 'm2', pitch: 67, startTick: 480, durationTick: 480, velocity: 92 },
    { id: 'm3', pitch: 69, startTick: 960, durationTick: 480, velocity: 94 },
    { id: 'm4', pitch: 67, startTick: 1440, durationTick: 480, velocity: 90 },
  );

  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

      await page.goto(arrangerUrl);
      await page.locator('#project-file').setInputFiles({
        name: 'onebar_song_project_v1.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(sketch)),
      });

      await page.getByText('1小節スケッチ（仮コード付き）', { exact: true }).waitFor();
      await page.waitForFunction(() => {
        const preview = document.querySelector('#preview-btn');
        return Boolean(preview && !preview.disabled && document.querySelectorAll('.candidate-tab').length >= 3);
      });

      const section = page.locator('.section-card').first();
      const reharmButton = section.locator('button[data-action="reharm-show"]');
      await reharmButton.click();
      await section.locator('.reharm-option').first().waitFor();
      assert.equal(await section.locator('.reharm-option').count(), 3, `reharm choices at ${width}px`);

      const labels = await section.locator('.reharm-option strong').allTextContents();
      assert.deepEqual(labels, ['自然', '色付け', '大胆']);

      await section.locator('.reharm-option').first().click();
      await page.getByText('採用: 自然', { exact: true }).waitFor();
      assert.equal(await page.locator('#preview-btn').isEnabled(), true, `preview enabled at ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow at ${width}px`);
      assert.deepEqual(errors, [], `console errors at ${width}px: ${errors.join(' | ')}`);
      await context.close();
    }
    console.log('Arrangement Lab one-bar no-chord SongProject reharm flow passed at 360/390/430px');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
