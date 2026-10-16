// 発散モードのKeepライブラリを実ブラウザで確認する回帰テスト(IndexedDB保存・開き直し・Freeze後も残る・呼び出し・削除)。
// 使い方: npm run build && python3 -m http.server 8080 -d dist & node scripts/divergence-library-browser.test.cjs
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.DEMO_URL || 'http://127.0.0.1:8080/';
const divergenceUrl = new URL('divergence.html', base).href;

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    const watch = (page) => {
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    };
    const openDivergence = async () => {
      const page = await context.newPage();
      watch(page);
      await page.goto(divergenceUrl);
      await page.locator('#generate-branches').waitFor();
      return page;
    };
    const libraryCount = (page) => page.locator('[data-library-card]').count();
    const noOverflow = (page, label) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
      .then((ok) => assert.ok(ok, `${label}: 横スクロールが出ています`));

    // 1. Projectを作って保存
    let page = await context.newPage();
    watch(page);
    await page.goto(base);
    await page.getByLabel('Project名', { exact: true }).fill('Divergence library regression');
    await page.getByLabel('Project名', { exact: true }).press('Tab');
    await page.getByRole('heading', { name: 'Divergence library regression', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Chord', exact: true }).click();
    await page.getByRole('button', { name: '適用', exact: true }).click();
    await page.getByRole('navigation').getByRole('button', { name: 'Hub', exact: true }).click();
    await page.getByRole('button', { name: 'Save Now', exact: true }).click();
    await page.getByText('手動保存しました。project.json Backupも定期的に利用してください。', { exact: true }).waitFor();
    await page.close();

    // 2. 発散モードで5案を作り、2案をKeep
    page = await openDivergence();
    assert.equal(await libraryCount(page), 0, '最初はライブラリが空');
    await page.locator('#generate-branches').click();
    await page.locator('[data-keep]').first().waitFor();
    await page.locator('[data-keep]:not([disabled])').first().click();
    await page.getByText('1 / 40案', { exact: true }).waitFor();
    await page.locator('[data-select-node="root"]').first().click();
    await page.locator('[data-keep]:not([disabled])').first().click();
    await page.getByText('2 / 40案', { exact: true }).waitFor();
    assert.equal(await libraryCount(page), 2);
    await noOverflow(page, 'Keep後');

    // 3. タブを閉じて開き直しても、Keepと探索の続きが残る(sessionStorageなら消える)
    await page.close();
    page = await openDivergence();
    assert.equal(await libraryCount(page), 2, '開き直してもKeep案が残る');
    const keptInTree = await page.locator('.tree-node', { hasText: '◆' }).count();
    assert.ok(keptInTree >= 3, `開き直してもBranch TreeのKeepが残る(Original+2案以上): ${keptInTree}`);
    await noOverflow(page, '開き直し後');

    // 4. Freezeして通常編集へ。Freeze後も他のKeep案が残る
    await page.locator('#freeze-active').click();
    await page.waitForURL(/index\.html|\/$/);
    await page.close();
    page = await openDivergence();
    assert.equal(await page.locator('.tree-node').count(), 1, 'Freeze後は新しい探索から始まる');
    assert.equal(await libraryCount(page), 2, 'Freezeしても2案とも残る');
    assert.ok(await page.getByText('前の元案から', { exact: true }).count() >= 1, '元案が更新されたことが分かる表示');

    // 5. ライブラリの案をツリーへ呼び出す(冪等)
    await page.locator('[data-library-import]').first().click();
    await page.locator('.tree-node', { hasText: 'Keep:' }).first().waitFor();
    await page.locator('[data-library-import]').first().click();
    assert.equal(await page.locator('.tree-node', { hasText: 'Keep:' }).count(), 1, '同じ案は1回だけ追加される');

    // 6. 古い元案から作られた案のFreezeは、確認してから(キャンセルすれば何も変わらない)
    let dialogMessage = '';
    page.once('dialog', async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
    await page.locator('#freeze-active').click();
    await page.waitForTimeout(400);
    assert.ok(dialogMessage.includes('置き換わります'), `確認ダイアログが出る: ${dialogMessage}`);
    assert.ok(page.url().includes('divergence.html'), 'キャンセルすると発散画面に留まる');

    // 7. ライブラリから削除(確認あり)
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('[data-library-remove]').first().click();
    await page.waitForFunction(() => document.querySelectorAll('[data-library-card]').length === 1);
    await page.close();
    page = await openDivergence();
    assert.equal(await libraryCount(page), 1, '削除も端末に保存される');
    await noOverflow(page, '最終');

    assert.deepEqual(errors, [], `console/page error: ${errors.join(' | ')}`);
    console.log('divergence-library-browser-test: ok');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
