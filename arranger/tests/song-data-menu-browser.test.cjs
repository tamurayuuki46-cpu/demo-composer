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
  for (const label of ['🧭 全アプリ遷移', '🎹 MIDI保存', '💾 JSON保存', '📝 作曲シート成果物']) {
    await panel.getByText(label, { exact: true }).waitFor();
  }
  await panel.getByText('📓 メモ帳', { exact: true }).waitFor();
  await panel.getByText('保存JSONを開く', { exact: true }).waitFor();
  if (nextText) await panel.getByText(nextText, { exact: true }).waitFor();
  assert.equal(await panel.locator('.song-data-primary-action').count(), 4, 'must keep exactly four primary actions');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `menu overflow at ${width}px`);

  await panel.locator('[data-song-data-action="apps"]').click();
  const appsDialog = page.locator('[id$="-apps-dialog"]');
  await appsDialog.waitFor({ state: 'visible' });
  for (const app of ['Music Project Home', '作曲シート', 'MIDI Analyzer', 'Demo Composer', 'Arrangement Lab']) {
    await appsDialog.getByText(app, { exact: true }).waitFor();
  }
  await appsDialog.locator('.song-data-dialog-close').click();

  await trigger.click();
  await panel.locator('[data-song-data-action="sheet"]').click();
  await page.locator('#composition-sheet-summary-dialog').waitFor({ state: 'visible' });
  await page.locator('#composition-sheet-summary-dialog .song-data-dialog-close').click();
  return { trigger, panel };
}

async function assertMemoRoundTrip(page, menu, width) {
  await menu.trigger.click();
  await menu.panel.locator('[data-song-data-action="memo"]').click();
  const dialog = page.locator('#song-memo-dialog');
  await dialog.waitFor({ state: 'visible' });
  const textarea = dialog.locator('.song-memo-textarea');
  const memo = `mobile memo ${width}`;
  await textarea.fill(memo);
  await page.waitForTimeout(350);
  await dialog.locator('.song-memo-close').click();

  await menu.trigger.click();
  await menu.panel.locator('[data-song-data-action="memo"]').click();
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await textarea.inputValue(), memo, 'memo must persist for the current song');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `memo overflow at ${width}px`);
  await dialog.locator('.song-memo-close').click();
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
      await assertMemoRoundTrip(page, sheetMenu, width);
      await sheetMenu.trigger.click();
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="save"]').isEnabled(), true, 'Workbook must allow saving partially filled sheets');
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="midi"]').isEnabled(), true, 'Workbook MIDI action should be available');
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="next"]').isDisabled(), true, 'Composition Sheet next must be disabled before required fields');
      await page.locator('.song-data-close').click();
      if(await page.locator('#handoff-form').count()) await page.locator('#handoff-form').evaluate(node=>{node.open=true;});
      await page.locator('#scene').fill('夜の帰り道');
      await page.locator('#reference1').fill('Reference Song');
      await sheetMenu.trigger.click();
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="save"]').isEnabled(), true);
      assert.equal(await sheetMenu.panel.locator('[data-song-data-action="next"]').isEnabled(), true);
      await page.locator('.song-data-close').click();

      await page.goto(rootBase);
      const demoMenu = await assertCommonMenu(page, width, 'Arrangement Labへ進む');
      await demoMenu.trigger.click();
      assert.equal(await demoMenu.panel.locator('[data-song-data-action="midi"]').isEnabled(), true, 'Demo Composer MIDI action should be available');
      await page.locator('.song-data-close').click();

      await page.goto(homeBase);
      const homeMenu = await assertCommonMenu(page, width, '次の工程へ進む');
      await homeMenu.trigger.click();
      assert.equal(await homeMenu.panel.locator('[data-song-data-action="save"]').isDisabled(), true, 'Project Home save must be disabled before a SongProject is loaded');
      assert.equal(await homeMenu.panel.locator('[data-song-data-action="midi"]').isDisabled(), true, 'Project Home MIDI must be disabled before a SongProject is loaded');
      await page.locator('.song-data-close').click();

      await page.goto(arrangerBase);
      const arrangerMenu = await assertCommonMenu(page, width, 'DAW書き出しへ進む');
      await arrangerMenu.trigger.click();
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="save"]').isDisabled(), true, 'Arrangement save must be disabled before a project is loaded');
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="midi"]').isDisabled(), true, 'Arrangement MIDI must be disabled before a project is loaded');
      await page.locator('.song-data-close').click();

      await page.locator('#project-file').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
      await page.waitForFunction(() => document.querySelector('#export-song-project-btn') && !document.querySelector('#export-song-project-btn').disabled);
      await arrangerMenu.trigger.click();
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="save"]').isEnabled(), true);
      assert.equal(await arrangerMenu.panel.locator('[data-song-data-action="midi"]').isEnabled(), true);
      assert.match(await arrangerMenu.panel.locator('[data-song-data-current]').textContent(), /Song data menu test|読み込み済み/);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Four-action song data menu + song memo passed on Sheet / Demo / Home / Arrangement at 360/390/430px');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
