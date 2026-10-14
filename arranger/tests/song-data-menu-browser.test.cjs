const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const arrangerBase = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/';
const rootBase = new URL('../', arrangerBase).href;
const homeBase = new URL('project-home/', rootBase).href;
const sheetBase = new URL('sheet-app/', rootBase).href;
const fixture = {
  id: 'song-data-menu-test',
  revision: 1,
  schemaVersion: 3,
  metadata: { title: 'Song data menu test' },
  basic: { bpm: 120, ppq: 480, timeSignature: '4/4' },
  structure: { sections: [{ id: 'bar-1', kind: 'verse', name: '1小節スケッチ', bars: 1 }] },
  chords: [{ root: 0, quality: 'major', startTick: 0, durationTick: 1920 }],
  tracks: [{ role: 'melody', midiChannel: 1, notes: [{ pitch: 60, startTick: 0, durationTick: 480, velocity: 90 }] }],
};

async function assertCommonMenu(page, width, nextText) {
  const trigger = page.locator('.song-data-trigger');
  await trigger.waitFor();
  assert.equal(await trigger.textContent(), '📦 曲データ');
  await trigger.click();
  const panel = page.locator('.song-data-panel');
  await panel.getByText('保存した曲を開く', { exact: true }).waitFor();
  await panel.getByText('今の曲を保存', { exact: true }).waitFor();
  await panel.getByText(nextText, { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `menu overflow at ${width}px`);
  await page.locator('.song-data-close').click();
  return { trigger, panel };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

      await page.goto(sheetBase);
      const sheetMenu = await assertCommonMenu(page, width, 'Demo Composerへ進む');
      await sheetMenu.trigger.click();
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="save"]').isDisabled(), true, 'Composition Sheet save must be disabled before required fields');
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="next"]').isDisabled(), true, 'Composition Sheet next must be disabled before required fields');
      await page.locator('.song-data-close').click();
      await page.locator('#scene').fill('夜の帰り道');
      await page.locator('#reference1').fill('Reference Song');
      await sheetMenu.trigger.click();
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="save"]').isEnabled(), true);
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="next"]').isEnabled(), true);
      await page.locator('.song-data-close').click();

      await page.goto(rootBase);
      await assertCommonMenu(page, width, 'Arrangement Labへ進む');

      await page.goto(homeBase);
      const homeMenu = await assertCommonMenu(page, width, '次の工程へ進む');
      await homeMenu.trigger.click();
      assert.equal(await homeMenu.panel.locator('[data-song-data-action="save"]').isDisabled(), true, 'Project Home save must be disabled before a SongProject is loaded');
      await page.locator('.song-data-close').click();

      await page.goto(arrangerBase);
      const arrangerMenu = await assertCommonMenu(page, width, 'DAW書き出しへ進む');
      await arrangerMenu.trigger.click();
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="save"]').isDisabled(), true, 'Arrangement save must be disabled before a project is loaded');
      await page.locator('.song-data-close').click();

      await page.locator('#project-file').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
      await page.waitForFunction(() => document.querySelector('#export-song-project-btn') && !document.querySelector('#export-song-project-btn').disabled);
      await arrangerMenu.trigger.click();
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="save"]').isEnabled(), true);
      assert.match(await arrangerMenu.panel.locator('[data-song-data-current]').textContent(), /Song data menu test|読み込み済み/);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Composition Sheet / Demo Composer / Project Home / Arrangement Lab 360/390/430px song data menu passed');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
