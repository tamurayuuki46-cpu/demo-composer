const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const arrangerUrl = process.env.ARRANGER_URL || 'http://127.0.0.1:8080/arranger/?mode=beginner';
const handoffKey = 'music-project-songproject-handoff-v1';
const BAR = 1920;

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    window.__previewStarts = 0;
    window.__previewOscillatorTypes = [];
    window.__previewFrequencies = [];
    window.__previewFilters = [];
    window.__previewNoiseBuffers = 0;
    window.__previewClosedContexts = 0;
    class FakeParam {
      constructor() { this.value = 0; }
      setValueAtTime(value) { this.value = value; }
      exponentialRampToValueAtTime(value) { this.value = value; }
      linearRampToValueAtTime(value) { this.value = value; }
    }
    class FakeNode {
      constructor() { this.onended = null; }
      connect() { return this; }
      disconnect() {}
    }
    class FakeOscillator extends FakeNode {
      constructor() {
        super();
        this.type = 'sine';
        this.frequency = new FakeParam();
        this.detune = new FakeParam();
      }
      start() {
        window.__previewStarts += 1;
        window.__previewOscillatorTypes.push(this.type);
        window.__previewFrequencies.push(this.frequency.value);
      }
      stop() {
        const done = this.onended;
        this.onended = null;
        if (done) queueMicrotask(done);
      }
    }
    class FakeBufferSource extends FakeNode {
      constructor() { super(); this.buffer = null; }
      start() { window.__previewStarts += 1; }
      stop() {
        const done = this.onended;
        this.onended = null;
        if (done) queueMicrotask(done);
      }
    }
    class FakeFilter extends FakeNode {
      constructor() {
        super();
        this.type = 'lowpass';
        this.frequency = new FakeParam();
        this.Q = new FakeParam();
        this.gain = new FakeParam();
        window.__previewFilters.push(this);
      }
    }
    class FakeAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
        this.sampleRate = 48000;
      }
      resume() { this.state = 'running'; return Promise.resolve(); }
      close() { this.state = 'closed'; window.__previewClosedContexts += 1; return Promise.resolve(); }
      createGain() { const node = new FakeNode(); node.gain = new FakeParam(); return node; }
      createBiquadFilter() { return new FakeFilter(); }
      createBuffer(_channels, length) {
        window.__previewNoiseBuffers += 1;
        const data = new Float32Array(length);
        return { getChannelData() { return data; } };
      }
      createBufferSource() { return new FakeBufferSource(); }
      createDynamicsCompressor() {
        const node = new FakeNode();
        node.threshold = new FakeParam(); node.knee = new FakeParam(); node.ratio = new FakeParam();
        return node;
      }
      createOscillator() { return new FakeOscillator(); }
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

async function applyHandoff(page, songProject) {
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
}

async function assertTransferredTimbre(page, width, soundProject) {
  await applyHandoff(page, soundProject);
  await page.evaluate(() => {
    window.__previewOscillatorTypes = [];
    window.__previewFrequencies = [];
    window.__previewFilters.length = 0;
    window.__previewNoiseBuffers = 0;
  });
  const before = await page.evaluate(() => window.__previewStarts);
  await page.locator('#preview-btn').click();
  await waitForNewPreview(page, before, `Demo Composer timbre preview at ${width}px`);
  await page.waitForFunction(() => {
    const types = window.__previewOscillatorTypes;
    const filters = window.__previewFilters.map((item) => Math.round(item.frequency.value));
    return types.includes('sawtooth') && types.includes('square')
      && filters.includes(5580) && filters.includes(2460) && filters.includes(432);
  });
  const probe = await page.evaluate(() => ({
    types: [...window.__previewOscillatorTypes],
    filters: window.__previewFilters.map((item) => Math.round(item.frequency.value)),
    noiseBuffers: window.__previewNoiseBuffers,
    frequencies: window.__previewFrequencies,
  }));
  assert.ok(probe.types.includes('sawtooth'), `Vocal Bright waveform preserved at ${width}px`);
  assert.ok(probe.types.includes('square'), `Pluck Bass waveform preserved at ${width}px`);
  assert.ok(probe.filters.includes(5580), `Vocal Bright + Bright filter preserved at ${width}px`);
  assert.ok(probe.filters.includes(2460), `Organ + Warm filter preserved at ${width}px`);
  assert.ok(probe.filters.includes(432), `Pluck Bass + Dark filter preserved at ${width}px`);
  assert.ok(probe.frequencies.includes(55), `Kick pitch envelope preserved at ${width}px`);
  assert.ok(probe.filters.includes(900), `Snare highpass preserved at ${width}px`);
  assert.ok(probe.filters.includes(5000), `Hi-Hat highpass preserved at ${width}px`);
  assert.ok(probe.noiseBuffers >= 2, `Snare/Hi-Hat noise buffers generated at ${width}px`);
  const closedBefore = await page.evaluate(() => window.__previewClosedContexts);
  await page.locator('#stop-btn').click();
  assert.equal(await page.evaluate(() => window.__previewClosedContexts), closedBefore + 1, 'stop closes audio context');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `sound handoff overflow at ${width}px`);
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

  const soundProject = demoProjectToSongProject({
    schemaVersion: 3,
    appVersion: 'v0.12-dev',
    id: 'sound-preservation-browser',
    revision: 1,
    metadata: { title: '音色保持テスト', genre: 'J-POP', mood: [], memo: '' },
    basic: { bpm: 120, timeSignature: '4/4', key: 'C', scale: 'major', ppq: 480 },
    structure: { sections: [{ id: 'sound-section', kind: 'verse', name: '音色保持', bars: 1, energy: 'mid', transition: 'keep' }] },
    chords: [{ id: 'sound-c1', root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: BAR }],
    tracks: [
      { role: 'melody', name: 'Melody', midiChannel: 2, notes: [{ id: 'sm1', pitch: 72, startTick: 0, durationTick: 960, velocity: 100 }] },
      { role: 'counter', name: 'Counter Melody', midiChannel: 4, notes: [] },
      { role: 'bass', name: 'Bass', midiChannel: 3, notes: [{ id: 'sb1', pitch: 36, startTick: 0, durationTick: 960, velocity: 96 }] },
      { role: 'drums', name: 'Drums', midiChannel: 10, notes: [36, 38, 42].map((pitch) => ({ id: `sd-${pitch}`, pitch, startTick: 0, durationTick: 120, velocity: 100 })) },
    ],
    instruments: [
      { part: 'chord', preset: 'organ', tone: 'warm' },
      { part: 'melody', preset: 'vocal-bright', tone: 'bright' },
      { part: 'bass', preset: 'pluck-bass', tone: 'dark' },
    ],
    progress: {},
    exportSettings: {},
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

        await applyHandoff(page, chordSketch);
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
        await assertTransferredTimbre(page, width, soundProject);
        assert.deepEqual(errors, [], `sound-preservation console errors at ${width}px: ${errors.join(' | ')}`);
        await context.close();
      }
    }
    console.log('Arrangement Lab section/reharm audition and Demo Composer timbre preservation passed at 360/390/430px');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
