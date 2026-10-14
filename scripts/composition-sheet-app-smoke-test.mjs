import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const legacyAppPath = 'sheet-app/versions/v0.2/composition_sheet_v0.2.html';
const previousAppPath = 'sheet-app/versions/v0.7/composition_sheet_v0.7.html';
const appPath = 'sheet-app/versions/v0.8/composition_sheet_v0.8.html';
const scriptPath = 'sheet-app/versions/v0.8/composition_sheet_v0.8.js';
const stylePath = 'sheet-app/versions/v0.8/composition_sheet_v0.8.css';
const sourcePath = 'sheet-app/versions/v0.4/sheet_content_v0.4.js';
const modelPath = 'sheet-app/versions/v0.4/sheet_model_v0.4.js';
const baseStylePath = 'sheet-app/versions/v0.6/composition_sheet_v0.6.css';
const manualIdeasPath = 'sheet-app/versions/v0.8/manual_ideas_v0.8.js';
const latestPath = 'sheet-app/latest/composition_sheet_latest.html';
const entryPath = 'sheet-app/index.html';

const [legacyApp, previousApp, app, script, style, source, model, baseStyle, manualIdeas, latest, entry] = await Promise.all([
  readFile(legacyAppPath, 'utf8'),
  readFile(previousAppPath, 'utf8'),
  readFile(appPath, 'utf8'),
  readFile(scriptPath, 'utf8'),
  readFile(stylePath, 'utf8'),
  readFile(sourcePath, 'utf8'),
  readFile(modelPath, 'utf8'),
  readFile(baseStylePath, 'utf8'),
  readFile(manualIdeasPath, 'utf8'),
  readFile(latestPath, 'utf8'),
  readFile(entryPath, 'utf8'),
]);

// Historical public recovery points remain available.
assert.match(legacyApp, /まずは、2項目だけ。/, 'v0.2 historical page is missing');
assert.match(previousApp, /作曲シート全集 · v0\.7/, 'v0.7 public recovery point is missing');

// v0.8 public workbook basics.
assert.match(app, /31シートの引き出し/, '31シート版の案内がありません');
assert.match(app, /id="scene"/, '場面入力欄がありません');
assert.match(app, /id="reference1"/, '参考曲1の入力欄がありません');
assert.match(app, /\.\.\/v0\.6\/composition_sheet_v0\.6\.css/, 'v0.8 base CSSが読み込まれていません');
assert.match(app, /composition_sheet_v0\.8\.css/, 'v0.8 CSSが読み込まれていません');
assert.match(app, /composition_sheet_v0\.8\.js/, 'v0.8 scriptが読み込まれていません');
assert.match(app, /id="manual-idea-form"/, '手動アイデア入力フォームがありません');
assert.match(app, /全シートのアイデア/, '手動アイデア横断表示がありません');
assert.match(app, /viewport-fit=cover/, 'モバイルviewport設定がありません');
assert.match(baseStyle, /@media\(max-width:820px\)/, 'スマホ向け基礎レイアウトがありません');
assert.match(style, /manual-ideas/, '手動アイデアUIのスタイルがありません');

// v0.8 runtime dependencies and SongProject interoperability must all exist in main.
assert.match(script, /\.\.\/v0\.4\/sheet_content_v0\.4\.js/, 'v0.8シートデータ参照がありません');
assert.match(script, /\.\.\/v0\.4\/sheet_model_v0\.4\.js/, 'v0.8描画モデル参照がありません');
assert.match(script, /\.\/manual_ideas_v0\.8\.js/, '手動アイデアモデル参照がありません');
assert.match(script, /createEmptySongProject/, 'SongProject生成処理がありません');
assert.match(script, /mergeSheetChangesIntoSongProject/, '作曲シートのSongProject更新処理がありません');
assert.match(script, /parseProjectJsonToSongProject/, '共通Import処理がありません');
assert.match(script, /serializeSongProject/, 'SongProject保存処理がありません');
assert.match(script, /customIdeas/, '手動アイデアがSongProjectへ保存されません');
assert.match(script, /The Cardigans/, 'Cardigansのベースアイデアがありません');
assert.match(script, /The Weeknd/, 'The Weekndのベースアイデアがありません');
assert.match(source, /04_アイデア帳\/03_ベース/, 'ベースのアイデア帳シートがありません');
assert.match(model, /renderMarkdown/, 'シート描画処理がありません');
assert.match(manualIdeas, /createManualIdea/, '手動アイデア作成処理がありません');
assert.match(manualIdeas, /updateManualIdea/, '手動アイデア編集処理がありません');
assert.match(manualIdeas, /removeManualIdea/, '手動アイデア削除処理がありません');

assert.match(latest, /composition_sheet_v0\.8\.html/, 'latest が v0.8 を参照していません');
assert.match(entry, /latest\/composition_sheet_latest\.html/, 'sheet-app 入口が latest を参照していません');

console.log('Composition Sheet v0.8 public workbook smoke test: OK');
