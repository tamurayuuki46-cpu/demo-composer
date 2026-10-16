const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const KEY = 'music-project-songproject-handoff-v1';
const demoUrl = process.env.DEMO_URL || 'http://127.0.0.1:8080/demo-composer/';
async function downloadedJson(page, button) {
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  assert.match(download.suggestedFilename(), /_song_project_v1\.json$/);
  assert.equal(await download.failure(), null);
  return JSON.parse(await fs.readFile(await download.path(), 'utf8'));
}
(async () => {
  const { createEmptySongProject } = await import('../src/shared/song-project.js');
  const browser = await chromium.launch({ headless: true });
  await fs.mkdir('test-results', { recursive: true });
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      let source;
      if (process.env.ANALYZER_URL) {
        await page.goto(process.env.ANALYZER_URL);
        // SMF Type 0, PPQ 480, three quarter notes.
        const track = [0,0x90,60,96,0x83,0x60,0x80,60,0,0,0x90,64,96,0x83,0x60,0x80,64,0,0,0x90,67,96,0x83,0x60,0x80,67,0,0,0xff,0x2f,0];
        const midi = Buffer.from([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,0,0,0,track.length,...track]);
        await page.locator('#midi-file').setInputFiles({ name: 'handoff-regression.mid', mimeType: 'audio/midi', buffer: midi });
        await page.getByRole('button', { name: 'MIDIを読み込む', exact: true }).click();
        await page.getByRole('button', { name: '詳細モード', exact: true }).click();
        await page.getByRole('tab', { name: 'Export', exact: true }).click();
        source = await downloadedJson(page, page.getByRole('button', { name: '1. 曲データを保存', exact: true }));
        const pending = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
        assert.equal(pending.targetApp, 'demo-composer');
        assert.deepEqual(pending.songProject, source);
        await page.getByRole('button', { name: '2. Demo Composerを開く', exact: true }).click();
      } else {
        source = createEmptySongProject({ projectId: `handoff-${width}`, title: `Handoff ${width}` });
        source.analysis.keyCandidates = [{ key: 'C', confidence: 0.8 }];
        source.intent.scene = 'Retain the source intent';
        source.arrangement.selectedAlternatives = { id: 'B' };
        source.composition.sections = [{ id: 'verse', kind: 'verse', name: 'A', bars: 4 }];
        source.composition.chords = [{ root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: 1920 }];
        await page.goto(demoUrl);
        await page.evaluate(({ key, songProject }) => localStorage.setItem(key, JSON.stringify({ kind: 'music-project-songproject-handoff', schemaVersion: 1, sourceApp: 'midi-analyzer', targetApp: 'demo-composer', songProject })), { key: KEY, songProject: source });
        await page.goto(`${demoUrl}?handoff=midi-analyzer`);
      }
      const apply = page.getByRole('button', { name: '受け取った曲を反映', exact: true });
      await apply.waitFor();
      assert.notEqual(await page.getByLabel('Project名', { exact: true }).inputValue(), source.title, 'must not auto-apply');
      page.once('dialog', dialog => dialog.dismiss());
      await apply.click();
      assert.ok(await page.evaluate(key => localStorage.getItem(key), KEY), 'cancel retains candidate');
      await page.evaluate(() => {
        const original = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function (...args) {
          if (this.name === 'demo-composer' && args[1] === 'readwrite') {
            IDBDatabase.prototype.transaction = original;
            throw new Error('保存失敗テスト');
          }
          return original.apply(this, args);
        };
      });
      page.once('dialog', dialog => dialog.accept());
      await apply.click();
      await page.locator('#handoff-guide-status').filter({ hasText: '保存失敗テスト' }).waitFor();
      assert.ok(await page.evaluate(key => localStorage.getItem(key), KEY), 'save failure retains candidate');
      page.once('dialog', dialog => dialog.accept());
      await apply.click();
      await page.getByRole('heading', { name: source.title, exact: true }).waitFor();
      await page.waitForFunction(key => !localStorage.getItem(key), KEY);
      await page.reload();
      await page.getByRole('heading', { name: source.title, exact: true }).waitFor();
      const savedProjects = await page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open('demo-composer');
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('projects').objectStore('projects').getAll();
          get.onsuccess = () => { database.close(); resolve(get.result.map(project => project.id)); };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      }));
      assert.ok(savedProjects.includes(source.projectId));
      assert.ok(savedProjects.length >= 2, 'previous composition remains saved separately');
      // Losing the convenience cache must not lose analysis / intent / arrangement.
      await page.evaluate(() => localStorage.removeItem('demo-composer-song-project-source-v1'));
      // Analyzer owns analysis: composing a section is an explicit Demo action.
      if (!source.composition.sections.length) {
        await page.getByRole('navigation').getByRole('button', { name: 'Arrange', exact: true }).click();
        await page.locator('[data-arrange-template]').first().click();
        await page.getByRole('navigation').getByRole('button', { name: 'Hub', exact: true }).click();
      }
      const editedTitle = `Edited ${width}`;
      await page.getByLabel('Project名', { exact: true }).fill(editedTitle);
      await page.getByLabel('Project名', { exact: true }).press('Tab');
      await page.locator('#toggle-export').click();
      const output = await downloadedJson(page, page.getByRole('button', { name: 'Arrangement Labへ渡す', exact: true }));
      assert.equal(output.projectId, source.projectId);
      assert.equal(output.title, editedTitle);
      for (const field of ['analysis', 'arrangement', 'intent', 'reference']) assert.deepEqual(output[field], source[field], `${field} preserved`);
      assert.equal(output.schemaVersion, 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Demo overflows ${width}`);
      await page.getByRole('button', { name: 'Arrangement Labを開く', exact: true }).click();
      await page.getByRole('heading', { name: 'Demo Composerから続ける', exact: true }).waitFor();
      await page.getByRole('button', { name: '受け取った曲を反映', exact: true }).click();
      await page.locator('[data-handoff-guide-text]').filter({ hasText: `「${editedTitle}」を反映しました。` }).waitFor();
      await page.locator('#source-summary').getByText(editedTitle, { exact: true }).waitFor({ state: 'attached' });
      assert.ok(await page.locator('#candidate-tabs button').count() >= 3, 'received composition produces arrangement candidates');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Arrangement overflows ${width}`);
      await page.screenshot({ path: `test-results/handoff-${width}.png` });
      assert.deepEqual(errors, [], 'No application console errors');
      await context.close();
      if (width === 390) {
        const fallbackContext = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
        await fallbackContext.addInitScript(() => {
          const set = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === 'music-project-songproject-handoff-v1' || key === 'demo-composer-song-project-source-v1') throw new DOMException('Test storage full', 'QuotaExceededError');
            return set.call(this, key, value);
          };
        });
        const fallback = await fallbackContext.newPage();
        const fallbackErrors = [];
        fallback.on('pageerror', error => fallbackErrors.push(error.message));
        fallback.on('console', message => { if (message.type() === 'error') fallbackErrors.push(message.text()); });
        await fallback.goto(`${demoUrl}?handoff=midi-analyzer`);
        fallback.once('dialog', dialog => dialog.accept());
        await fallback.locator('#import-song-project-file').setInputFiles({ name: 'saved_song_project_v1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(output)) });
        await fallback.getByRole('heading', { name: output.title, exact: true }).waitFor();
        await fallback.reload();
        await fallback.getByRole('heading', { name: output.title, exact: true }).waitFor();
        await fallback.locator('.song-data-trigger').click();
        const recovered = await downloadedJson(fallback, fallback.locator('.song-data-panel [data-song-data-action="save"]'));
        for (const field of ['analysis', 'arrangement', 'intent', 'reference']) assert.deepEqual(recovered[field], output[field], `file fallback preserves ${field}`);
        assert.equal(recovered.projectId, output.projectId);
        assert.deepEqual(fallbackErrors, [], 'File fallback and song menu have no console errors');
        await fallbackContext.close();
      }
    }
    console.log('360/390/430px explicit handoff, cancel, download, reload and ownership passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
