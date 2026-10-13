import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const appPath = 'sheet-app/versions/v0.1/composition_sheet_v0.1.html';
const latestPath = 'sheet-app/latest/composition_sheet_latest.html';
const entryPath = 'sheet-app/index.html';

const [app, latest, entry] = await Promise.all([
  readFile(appPath, 'utf8'),
  readFile(latestPath, 'utf8'),
  readFile(entryPath, 'utf8'),
]);

assert.match(app, /まずは、2項目だけ。/, '必須2項目の案内がありません');
assert.match(app, /id="scene"/, '場面入力欄がありません');
assert.match(app, /id="reference1"/, '参考曲1の入力欄がありません');
assert.match(app, /id="exportButton"[^>]*disabled/, '必須入力前にJSON保存が有効になっています');
assert.match(app, /base\.format\s*=\s*base\.format\s*\|\|\s*'demo-composer-project'/, '共通JSON format がありません');
assert.match(app, /base\.sheet\.referenceSongs/, '参考曲のJSON保存処理がありません');
assert.match(app, /base\.composer\s*=\s*base\.composer/, 'composer データ保持処理がありません');
assert.match(app, /base\.arrangement\s*=\s*base\.arrangement/, 'arrangement データ保持処理がありません');
assert.match(app, /base\.midiAnalysis\s*=\s*base\.midiAnalysis/, 'midiAnalysis データ保持処理がありません');
assert.match(app, /@media \(min-width:620px\)/, 'スマホ優先の1カラム設計を確認できません');
assert.match(app, /viewport-fit=cover/, 'モバイルviewport設定がありません');
assert.match(latest, /composition_sheet_v0\.1\.html/, 'latest が v0.1 を参照していません');
assert.match(entry, /latest\/composition_sheet_latest\.html/, 'sheet-app 入口が latest を参照していません');

console.log('Composition Sheet app smoke test: OK');
