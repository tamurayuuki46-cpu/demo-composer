const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const arrangerUrl = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/?mode=beginner';
const handoffKey = 'music-project-songproject-handoff-v1';
const BAR = 1920;

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    window.__previewStarts = 0;
    window.__previewTypes = [];
    window.__previewFilters = [];
    window.__previewNoiseStarts = 0;
    class FakeParam {
      constructor(onSet = null) { this._value = 0; this.onSet = onSet; }
      get value() { return this._value; }
      set value(value) { this._value = value; this.onSet?.(value); }
      setValueAtTime(value) { this.value = value; }
      exponentialRampToValueAtTime(value) { this.value = value; }
      linearRampToValueAtTime(value) { this.value = value; }
    }
    class FakeNode {
      connect() { return this; }
      disconnect() {}
    }
    class FakeOscillator extends FakeNode {
      constructor() {
        super();
        this.type = 'sine';
        this.frequency = new FakeParam();
        this.detune = new FakeParam();
        this.onended = null;
      }
      start() {
        window.__previewStarts += 1;
        window.__previewTypes.push(this.type);
      }
      stop() {
        const done = this.onended;
        this.onended = null;
        if (done) queueMicrotask(done);
      }
    }
    class FakeBufferSource extends FakeNode {
      constructor() { super(); this.buffer = null; this.onended = null; }
      start() { window.__previewStarts += 1; window.__previewNoiseStarts += 1; }
      stop() { const done = this.onended; this.onended = null; if (done) queueMicrotask(done); }
    }
    class FakeAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
        this.sampleRate = 48000;
      }
      resume() { this.state = 'running'; return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
      createGain() { const node = new FakeNode(); node.gain = new FakeParam(); return node; }
      createBiquadFilter() {
        const node = new FakeNode();
        node.type = 'lowpass';
        node.frequency = new FakeParam((value) => window.__previewFilters.push(value));
        node.Q = new FakeParam();
        node.gain = new FakeParam();
        return node;
      }
      createDynamicsCompressor() {
        const node = new FakeNode();
        node.threshold = new FakeParam(); node.knee = new FakeParam(); node.ratio = new FakeParam();
        return node;
      }
      createOscillator() { return new FakeOscillator(); }
      createBuffer(_channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
      createBufferSource() { return new FakeBufferSource(); }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
}

async function waitForNewPreview(page, before, label) {
  await page.waitForFunction((previous) => window.__previewStarts > previous, before);
  assert.ok(await page.evaluate(() => window.__previewStarts), label);
  assert.equal(await page.locator('#stop-btn').isEnabled(), true, `${label}: stop enabled`);
}

async function assertCandidatesAndReharm(page, width, expectedHeading) {
  await page.getByRole('heading', { name: expectedHeading, exact: true }).waitFor();
  await page.waitForFunction(() => {
    const preview = document.querySelector('#preview-btn');
    return Boolean(preview && !preview.disabled && document.querySelectorAll('.candidate-tab').length >= 3);
  });

  await page.locator('#generate-btn').click();
  await page.waitForFunction(() => {
    const preview = document.querySelector('#preview-btn');
    return Boolean(preview && !preview.disabled && document.querySelectorAll('.candidate-tab').length >= 3);
  });
  assert.equal(await page.locator('.candidate-tab').count(), 3, `A/B/C candidates at ${width}px`);
  assert.equal(await page.locator('#preview-btn').isEnabled(), true, `preview enabled at ${width}px`);

  let before = await page.evaluate(() => window.__previewStarts);
  await page.locator('#preview-btn').click();
  await waitForNewPreview(page, before, `whole candidate preview at ${width}px`);
  await page.locator('#stop-btn').click();

  const errorToast = page.locator('#message.is-error');
  assert.equal(await errorToast.isVisible().catch(() => false), false, `no red error toast at ${width}px`);

  const section = page.locator('.section-card').first();
  assert.equal(await section.locator('[data-action="section-preview"]').count(), 1, `section preview control at ${width}px`);
  before = await page.evaluate(() => window.__previewStarts);
  await section.locator('[data-action="section-preview"]').click();
  await waitForNewPreview(page, before, `section-only preview at ${width}px`);
  await page.locator('#stop-btn').click();

  const reharmButton = section.locator('button[data-action="reharm-show"]');
  await reharmButton.click();
  await section.locator('.reharm-option').first().waitFor();
  assert.equal(await section.locator('.reharm-option').count(), 3, `reharm choices at ${width}px`);

  const labels = await section.locator('.reharm-option > strong').allTextContents();
  assert.deepEqual(labels, ['自然', '色付け', '大胆']);
  assert.equal(await section.locator('[data-action="reharm-preview"]').count(), 3, `reharm preview buttons at ${width}px`);
  assert.equal(await section.locator('[data-action="reharm-apply"]').count(), 3, `reharm apply buttons at ${width}px`);

  before = await page.evaluate(() => window.__previewStarts);
  await section.locator('[data-action="reharm-preview"]').first().click();
  await waitForNewPreview(page, before, `natural reharm preview at ${width}px`);
  assert.equal(await page.getByText('採用: 自然', { exact: true }).count(), 0, `preview must not auto-adopt at ${width}px`);
  await page.locator('#stop-btn').click();

  await section.locator('[data-action="reharm-apply"]').first().click();
  await page.getByText('採用: 自然', { exact: true }).waitFor();
  assert.equal(await page.locator('#preview-btn').isEnabled(), true, `preview remains enabled at ${width}px`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow at ${width}px`);
}

async function assertSoundPreserved(page, width, songProject) {
  await page.goto(arrangerUrl);
  await page.evaluate(({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)), {
    key: handoffKey,
    payload: {
      kind: 'music-project-songproject-handoff',
      schemaVersion: 1,
      targetApp: 'arrangement-lab',
      songProject,
    },
  });
  const handoffUrl = new URL(arrangerUrl);
  handoffUrl.searchParams.set('handoff', 'demo-composer');
  await page.goto(handoffUrl.href);
  await page.locator('[data-apply-handoff]').click();
  await page.getByText(/A\/B\/Cの準備も完了しています/).waitFor();
  await page.evaluate(() => { window.__previewTypes = []; window.__previewFilters = []; window.__previewStarts = 0; window.__previewNoiseStarts = 0; });
  await page.locator('#preview-btn').click();
  await page.waitForFunction(() => window.__previewStarts >= 4);
  const audio = await page.evaluate(() => ({ types: [...window.__previewTypes], filters: [...window.__previewFilters], noiseStarts: window.__previewNoiseStarts }));
  assert.ok(audio.types.includes('sine'), `Chord Pad waveform preserved at ${width}px: ${audio.types.join(',')}`);
  assert.ok(audio.types.includes('square'), `Melody Pluck waveform preserved at ${width}px: ${audio.types.join(',')}`);
  assert.ok(audio.types.includes('sawtooth'), `Bass Synth waveform preserved at ${width}px: ${audio.types.join(',')}`);
  assert.ok(audio.filters.some((value) => Math.abs(value - 912) < 1), `Chord Dark filter preserved at ${width}px: ${audio.filters.join(',')}`);
  assert.ok(audio.filters.some((value) => Math.abs(value - 3720) < 1), `Melody Bright filter preserved at ${width}px: ${audio.filters.join(',')}`);
  assert.ok(audio.filters.some((value) => Math.abs(value - 639.6) < 1), `Bass Warm filter preserved at ${width}px: ${audio.filters.join(',')}`);
  assert.ok(audio.noiseStarts > 0, `Demo Composer snare/noise synthesis preserved at ${width}px`);
  await page.locator('#stop-btn').click();
}

(async () => {
  const { createEmptySongProject, demoProjectToSongProject } = await import('../../src/shared/song-project.js');
  const melodySketch = createEmptySongProject({
    projectId: 'onebar-reharm-browser',
    title: '1小節リハモテスト',
    now: '2026-10-14T00:00:00.000Z',
  });
  melodySketch.composition.melody.push(
    { id: 'm1', pitch: 64, startTick: 0, durationTick: 480, velocity: 96 },
    { id: 'm2', pitch: 67, startTick: 480, durationTick: 480, velocity: 92 },
    { id: 'm3', pitch: 69, startTick: 960, durationTick: 480, velocity: 94 },
    { id: 'm4', pitch: 67, startTick: 1440, durationTick: 480, velocity: 90 },
  );

  const chordSketch = createEmptySongProject({
    projectId: 'onebar-chordonly-browser',
    title: '1小節コードだけテスト',
    now: '2026-10-14T00:00:00.000Z',
  });
  chordSketch.composition.sections.push({
    id: 'onebar-section', kind: 'verse', name: '1小節スケッチ', bars: 1, energy: 'mid', transition: 'keep',
  });
  chordSketch.composition.chords.push({
    id: 'c1', root: 0, quality: 'major', degree: 'I', startTick: BAR * 4, durationTick: BAR,
  });

  const soundSketch = demoProjectToSongProject({
    id: 'sound-preserve-browser', schemaVersion: 3, appVersion: 'v0.12-dev', revision: 1,
    metadata: { title: '音色保持テスト', genre: 'J-POP', mood: [] },
    basic: { bpm: 120, key: 'C', scale: 'major', timeSignature: '4/4', ppq: 480 },
    structure: { sections: [{ id: 'sound-section', kind: 'verse', name: '音色保持', bars: 1, energy: 'mid', transition: 'keep' }] },
    chords: [{ id: 'sound-c1', root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: BAR }],
    tracks: [
      { role: 'melody', name: 'Melody', midiChannel: 2, notes: [{ id: 'sm1', pitch: 67, startTick: 0, durationTick: 960, velocity: 96 }] },
      { role: 'bass', name: 'Bass', midiChannel: 3, notes: [{ id: 'sb1', pitch: 36, startTick: 0, durationTick: 960, velocity: 96 }] },
      { role: 'counter', name: 'Counter', midiChannel: 4, notes: [] },
      { role: 'drums', name: 'Drums', midiChannel: 10, notes: [{ id: 'sd1', pitch: 38, startTick: 0, durationTick: 120, velocity: 100 }] },
    ],
    instruments: [
      { part: 'chord', preset: 'pad', tone: 'dark' },
      { part: 'melody', preset: 'pluck', tone: 'bright' },
      { part: 'bass', preset: 'synth-bass', tone: 'warm' },
    ],
    progress: {}, exportSettings: {},
  }, { now: '2026-10-14T00:00:00.000Z' });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [360, 390, 430]) {
      {
        const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        await installAudioProbe(page);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

        await page.goto(arrangerUrl);
        await page.locator('#project-file').setInputFiles({
          name: 'onebar_song_project_v1.json',
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify(melodySketch)),
        });
        await assertCandidatesAndReharm(page, width, '1小節スケッチ（仮コード付き）');
        assert.deepEqual(errors, [], `melody-only console errors at ${width}px: ${errors.join(' | ')}`);
        await context.close();
      }

      {
        const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        await installAudioProbe(page);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

        await page.goto(arrangerUrl);
        await page.evaluate(({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)), {
          key: handoffKey,
          payload: {
            kind: 'music-project-songproject-handoff',
            schemaVersion: 1,
            targetApp: 'arrangement-lab',
            songProject: chordSketch,
          },
        });
        const handoffUrl = new URL(arrangerUrl);
        handoffUrl.searchParams.set('handoff', 'demo-composer');
        await page.goto(handoffUrl.href);
        await page.locator('[data-apply-handoff]').click();
        await page.getByText(/A\/B\/Cの準備も完了しています/).waitFor();
        await assertCandidatesAndReharm(page, width, '1小節スケッチ');
        assert.deepEqual(errors, [], `chord-only handoff console errors at ${width}px: ${errors.join(' | ')}`);
        await context.close();
      }

      {
        const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        await installAudioProbe(page);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        await assertSoundPreserved(page, width, soundSketch);
        assert.deepEqual(errors, [], `sound-preserve console errors at ${width}px: ${errors.join(' | ')}`);
        await context.close();
      }
    }
    console.log('Arrangement Lab section/reharm audition + Demo Composer sound preservation passed at 360/390/430px');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
