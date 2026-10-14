import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSheetLink } from '../src/hub/sheet-link.js';
import { buildWorkflowState, lineageLabel } from '../project-home/workflow.js';

const html = await readFile(new URL('../project-home/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../project-home/app.js', import.meta.url), 'utf8');
const build = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');

assert.match(html, /<h1>Music Project Home<\/h1>/);
assert.match(html, /id="workflow-card"/);
assert.match(html, /id="current-stage"/);
assert.match(html, /id="undecided-list"/);
assert.match(html, /id="next-action" class="primary"/);
assert.match(html, /id="quick-flow-card"/);
assert.match(html, /id="workflow-list"/);
assert.match(html, /id="session-notes-card"/);
assert.match(html, /id="today-decisions"/);
assert.match(html, /id="next-session"/);
assert.match(html, /min-height:48px/);
assert.match(html, /⓪ 方向を決める/);
assert.match(html, /① 必要なら解析/);
assert.match(html, /MIDI Analyzer・任意/);
assert.match(html, /② 作曲/);
assert.match(html, /③ 編曲/);
assert.match(html, /④ DAWへ/);
assert.ok(html.includes('href="https://songwriting-full-workbook-31.yoshitamura.chatgpt.site/sheet-app/versions/v0.5/composition_sheet_v0.5.html"'));
assert.doesNotMatch(html, /href="\.\.\/sheet-app\//, '公開mainから未公開sheet-appを参照してはいけません');
assert.doesNotMatch(html, /id="sheet-json-file"/, '公開mainは未公開handoff moduleに依存しません');
assert.match(html, /id="claude-link-card"/);
assert.match(html, /Song Project JSON・MIDI・公開コードには入れません/);
assert.match(app, /buildWorkflowState/);
assert.match(app, /demo-composer\.project-home\.notes\.v1/);
assert.match(app, /queueDemoHandoff\(current\)/);
assert.doesNotMatch(app, /composition-sheet-handoff/);
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
assert.equal(workflow.currentStage.id, 'sheet');
assert.equal(workflow.undecidedItems[0].id, 'direction');
assert.equal(workflow.steps.length, 5);
assert.equal(workflow.steps.find((step) => step.id === 'analysis').status, 'optional');

workflow = buildWorkflowState(base, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'composition');
assert.equal(workflow.currentStage.id, 'composition');
assert.ok(workflow.undecidedItems.some((item) => item.id === 'chords'));
assert.ok(workflow.undecidedItems.some((item) => item.id === 'melody'));
assert.equal(workflow.optionalAnalysisSuggested, true);

const composed = structuredClone(base);
composed.composition.melody.push({ id: 'm1' });
workflow = buildWorkflowState(composed, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'arrangement');
assert.equal(workflow.undecidedItems[0].id, 'arrangement');

const arranged = structuredClone(composed);
arranged.arrangement.selectedAlternatives = { id: 'B' };
workflow = buildWorkflowState(arranged, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'daw');
assert.equal(workflow.undecidedItems[0].id, 'daw-export');

arranged.export.lastDawHandoffAt = '2026-10-15T00:00:00.000Z';
workflow = buildWorkflowState(arranged, { sheetLinked: true });
assert.equal(workflow.nextAction.id, 'complete');

assert.equal(lineageLabel({ projectId: 'song-1' }), 'このProjectが起点');
assert.equal(lineageLabel({ projectId: 'song-2', lineage: { rootProjectId: 'song-1', parentProjectId: 'song-1' } }), '親: song-1');

console.log('Project Home public decision navigator smoke test passed.');
