import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSheetLink } from '../src/hub/sheet-link.js';
import { buildWorkflowState, lineageLabel } from '../project-home/workflow.js';

const html = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../project-home/app.js', import.meta.url), 'utf8');
const build = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');

assert.match(html, /id="composition-sheet-card"/);
assert.match(html, /href="\.\.\/sheet-app\/"[^>]*>作曲シート v0\.1 を開く/);
assert.ok(html.indexOf('id="composition-sheet-card"') < html.indexOf('id="quick-flow-card"'), '作曲シート入口がMusic Project Homeの最上部にありません');
assert.match(html, /id="quick-flow-card"/);
assert.match(html, /id="quick-flow"/);
assert.match(html, /<strong>1 決める<\/strong><small>作曲シート<\/small>/);
assert.match(html, /<strong>2 作る<\/strong><small>Demo Composer<\/small>/);
assert.match(html, /<strong>3 育てる<\/strong><small>Arrangement Lab<\/small>/);
assert.match(html, /<strong>4 仕上げる<\/strong><small>Cubasis \/ Cubase<\/small>/);
assert.match(html, /MIDI Analyzerで分析/);
assert.ok(html.indexOf('id="quick-flow-card"') < html.indexOf('id="workflow-card"'), '簡易フローが現在地表示より後ろにあります');
assert.match(html, /id="workflow-card"/);
assert.match(html, /id="workflow-list"/);
assert.match(html, /id="next-action"/);
assert.match(html, /id="claude-link-input"/);
assert.match(html, /id="claude-link-open"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.match(html, /PC DAWは最終制作の必須工程/);
assert.match(html, /Song Project JSON・MIDI・公開コードには入れません/);
assert.match(app, /buildWorkflowState/);
assert.match(app, /loadSheetLink, saveSheetLink/);
assert.match(app, /\.\.\/src\/hub\/sheet-link\.js/);
assert.match(app, /claude-link-save/);
assert.match(build, /stampModules\(`\$\{outputDir\}\/project-home`\)/);

assert.equal(
  normalizeSheetLink('https://claude.ai/artifact/A7Fmc5gD8HwgyrqWt4RzfG#c753d41d-9227'),
  'https://claude.ai/artifact/A7Fmc5gD8HwgyrqWt4RzfG#c753d41d-9227',
);
assert.equal(normalizeSheetLink('https://example.com/not-claude'), null);

const base = {
  projectId: 'song-1',
  analysis: { keyCandidates: [] },
  reference: { items: [] },
  composition: { chords: [], melody: [], counterMelody: [], bass: [], drums: [], sections: [] },
  arrangement: { reharmonization: null, voicing: null, density: null, instruments: null, selectedAlternatives: null, decisions: [] },
  export: { lastSongMidiAt: null, lastDawHandoffAt: null },
};

let workflow = buildWorkflowState(base, { sheetLinked: false });
assert.equal(workflow.nextAction.id, 'sheet');
assert.equal(workflow.steps.find((step) => step.id === 'materials').status, 'optional');

workflow = buildWorkflowState(base, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'composition');
assert.equal(workflow.optionalAnalysisSuggested, true);

const composed = structuredClone(base);
composed.composition.melody.push({ id: 'm1' });
workflow = buildWorkflowState(composed, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'arrangement');

const arranged = structuredClone(composed);
arranged.arrangement.selectedAlternatives = { id: 'B' };
workflow = buildWorkflowState(arranged, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'dawReady');

arranged.export.lastDawHandoffAt = '2026-10-13T00:00:00.000Z';
workflow = buildWorkflowState(arranged, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'pcDaw');

assert.equal(lineageLabel({ projectId: 'song-1' }), 'このProjectが起点');
assert.equal(lineageLabel({ projectId: 'song-2', lineage: { rootProjectId: 'song-1', parentProjectId: 'song-1' } }), '親: song-1');

console.log('Project Home workflow + quick flow + Claude link smoke test passed.');
