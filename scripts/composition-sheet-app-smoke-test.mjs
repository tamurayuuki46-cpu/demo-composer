import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const legacyAppPath = 'sheet-app/versions/v0.2/composition_sheet_v0.2.html';
const appPath = 'sheet-app/versions/v0.7/composition_sheet_v0.7.html';
const scriptPath = 'sheet-app/versions/v0.7/composition_sheet_v0.7.js';
const stylePath = 'sheet-app/versions/v0.7/composition_sheet_v0.7.css';
const sourcePath = 'sheet-app/versions/v0.7/sheet_content_v0.7.js';
const modelPath = 'sheet-app/versions/v0.7/sheet_model_v0.7.js';
const latestPath = 'sheet-app/latest/composition_sheet_latest.html';
const entryPath = 'sheet-app/index.html';

const [legacyApp, app, script, style, source, model, latest, entry] = await Promise.all([
  readFile(legacyAppPath, 'utf8'),
  readFile(appPath, 'utf8'),
  readFile(scriptPath, 'utf8'),
  readFile(stylePath, 'utf8'),
  readFile(sourcePath, 'utf8'),
  readFile(modelPath, 'utf8'),
  readFile(latestPath, 'utf8'),
  readFile(entryPath, 'utf8'),
]);

// v0.2 remains available as a historical recovery point.
assert.match(legacyApp, /まずは、2項目だけ。/, 'v0.2 historical page is missing');

// v0.7 public workbook basics.
assert.match(app, /31シートの引き出し/, '31シート版の案内がありません');
assert.match(app, /id="scene"/, '場面入力欄がありません');
assert.match(app, /id="reference1"/, '参考曲1の入力欄がありません');
assert.match(app, /composition_sheet_v0\.7\.css/, 'v0.7 CSSが読み込まれていません');
assert.match(app, /composition_sheet_v0\.7\.js/, 'v0.7 scriptが読み込まれていません');
assert.match(app, /viewport-fit=cover/, 'モバイルviewport設定がありません');
assert.match(style, /@media\(max-width:820px\)/, 'スマホ向けレイアウトがありません');
assert.match(style, /sheet-groups/, '2階層タブUIのスタイルがありません');

// v0.7 must be self-contained and keep SongProject interoperability.
assert.match(script, /\.\/sheet_content_v0\.7\.js/, 'v0.7シートデータを参照していません');
assert.match(script, /\.\/sheet_model_v0\.7\.js/, 'v0.7描画モデルを参照していません');
assert.doesNotMatch(script, /\.\.\/v0\.4\//, 'v0.7が過去開発版へ実行時依存しています');
assert.doesNotMatch(script, /\.\.\/v0\.6\//, 'v0.7が過去開発版へ実行時依存しています');
assert.match(script, /createEmptySongProject/, 'SongProject生成処理がありません');
assert.match(script, /mergeSheetChangesIntoSongProject/, '作曲シートのSongProject更新処理がありません');
assert.match(script, /parseProjectJsonToSongProject/, '共通Import処理がありません');
assert.match(script, /serializeSongProject/, 'SongProject保存処理がありません');
assert.match(script, /The Cardigans/, 'Cardigansのベースアイデアがありません');
assert.match(script, /The Weeknd/, 'The Weekndのベースアイデアがありません');
assert.match(script, /裏メロ兼グルーヴ・フック/, 'ベースアイデアの要点がありません');
assert.match(source, /04_アイデア帳\/03_ベース/, 'ベースのアイデア帳シートがありません');
assert.match(model, /renderMarkdown/, 'シート描画処理がありません');

assert.match(latest, /composition_sheet_v0\.7\.html/, 'latest が v0.7 を参照していません');
assert.match(entry, /latest\/composition_sheet_latest\.html/, 'sheet-app 入口が latest を参照していません');

console.log('Composition Sheet v0.7 public workbook smoke test: OK');
