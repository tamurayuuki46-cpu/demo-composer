import assert from 'node:assert/strict';
import {sheetSummary,FIRST_SHEET_ID,SHEET_FIELDS} from '../src/shared/composition-sheet-summary.js';
import {SHEETS} from '../sheet-app/versions/v0.4/sheet_content_v0.4.js';
const page=SHEETS.find(p=>p.id===FIRST_SHEET_ID), lines=page.markdown.split('\n');
for(const f of SHEET_FIELDS){const [row,col]=f.key.split(':').map(Number);assert.ok(lines[row].startsWith('|'));const cell=lines[row].trim().replace(/^\||\|$/g,'').split('|')[col].trim();assert.ok(cell===''||cell==='低 / 中 / 高');}
const project={title:'曲A',compatibility:{compositionSheet:{fullWorkbook:{sheets:{[FIRST_SHEET_ID]:{cells:{'21:2':'孤独は悪くない','42:1':'高'},note:'<script>test</script>'}}}}}};
const before=JSON.stringify(project);const result=sheetSummary(project);assert.ok(result.rows.some(r=>r.value==='孤独は悪くない'));assert.ok(result.rows.some(r=>r.value==='<script>test</script>'));assert.equal(JSON.stringify(project),before);assert.equal(sheetSummary({title:'曲B'}).rows.length,0);console.log('PASS summary: immutable coordinates, values preserved, no mutation, no cross-project leakage');
