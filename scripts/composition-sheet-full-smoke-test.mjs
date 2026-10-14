import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SHEETS } from '../sheet-app/versions/v0.4/sheet_content_v0.4.js';
import { normalizeWorkbook, renderMarkdown, filteredSheets } from '../sheet-app/versions/v0.4/sheet_model_v0.4.js';
import { createEmptySongProject, serializeSongProject, parseProjectJsonToSongProject, mergeSheetChangesIntoSongProject } from '../src/shared/song-project.js';
assert.equal(SHEETS.length,31);assert.equal(new Set(SHEETS.map(p=>p.id)).size,31);
const workbook=normalizeWorkbook();let checks=0,cells=0;
for(const page of SHEETS){
  const source=await readFile(`docs/sheet/${page.id}.md`,'utf8');
  if(page.id==='04_アイデア帳/03_ベース'){
    for(const line of page.markdown.split('\n').filter(line=>line.trim())) assert.ok(source.includes(line),`v0.7 bass overlay lost v0.4 source line: ${line}`);
    assert.match(source,/The Cardigans \/ The Weeknd/,'v0.7 bass overlay is missing');
  }else assert.equal(page.markdown,source);
  const html=renderMarkdown(page,workbook.sheets[page.id]);assert.match(html,/<h1>/);checks+=(html.match(/data-check=/g)||[]).length;cells+=(html.match(/data-cell=/g)||[]).length;
}
assert.ok(checks>100);assert.ok(cells>100);assert.ok(filteredSheets('裏メロ').length>2);assert.equal(filteredSheets('見つからない検索語123').length,0);
const page=SHEETS.find(p=>p.id.startsWith('01_'));const cellKey=renderMarkdown(page,workbook.sheets[page.id]).match(/data-cell="([^"]+)"/)[1];
workbook.sheets[page.id].cells[cellKey]='<img src=x onerror=alert(1)>';workbook.sheets[page.id].note='原文を保った自分の曲のメモ';
const rendered=renderMarkdown(page,workbook.sheets[page.id]);assert.ok(!rendered.includes('<img'));assert.ok(rendered.includes('&lt;img'));
const project=createEmptySongProject();project.composition.melody.push({pitch:72,startTick:0,durationTick:480,velocity:96});project.arrangement.decisions.push({note:'keep'});project.compatibility.otherApp={keep:true};
const next=mergeSheetChangesIntoSongProject(project,{scene:'夜道',references:['曲 / アーティスト']});next.compatibility.compositionSheet={fullWorkbook:workbook};const round=parseProjectJsonToSongProject(serializeSongProject(next));
assert.deepEqual(round.composition,project.composition);assert.deepEqual(round.arrangement,project.arrangement);assert.deepEqual(round.compatibility.otherApp,{keep:true});assert.equal(round.compatibility.compositionSheet.fullWorkbook.sheets[page.id].note,workbook.sheets[page.id].note);
assert.equal(normalizeWorkbook(round.compatibility.compositionSheet.fullWorkbook).sheets[page.id].cells[cellKey],workbook.sheets[page.id].cells[cellKey]);
const malicious={id:'test',markdown:'# Test\n<script>alert(1)</script>\n[x](javascript:alert(1))\n- [ ] <img onerror=x>'};const safe=renderMarkdown(malicious,{cells:{},checks:{}});assert.ok(!safe.includes('<script>'));assert.ok(!safe.includes('href="javascript:'));
console.log(`PASS full workbook: 31 sources (v0.7 bass overlay preserved), ${checks} checkboxes, ${cells} editable cells, search, escaping, SongProject compatibility and lossless round-trip`);
