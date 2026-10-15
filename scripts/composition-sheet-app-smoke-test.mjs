import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const appPath = 'sheet-app/versions/v0.3/composition_sheet_v0.3.html';
const scriptPath = 'sheet-app/versions/v0.3/composition_sheet_v0.3.js';
const previousPath = 'sheet-app/versions/v0.2/composition_sheet_v0.2.html';
const latestPath = 'sheet-app/latest/composition_sheet_latest.html';
const manifestPath = 'sheet-app/latest/manifest.json';
const entryPath = 'sheet-app/index.html';
const currentPath = 'sheet-app/versions/v0.9.1/composition_sheet_v0.9.1.html';
const currentCssPath = 'sheet-app/versions/v0.9.1/composition_sheet_v0.9.1.css';

const [app, script, previous, latest, manifestText, entry, current, currentCss] = await Promise.all([
  readFile(appPath, 'utf8'),
  readFile(scriptPath, 'utf8'),
  readFile(previousPath, 'utf8'),
  readFile(latestPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
  readFile(entryPath, 'utf8'),
  readFile(currentPath, 'utf8'),
  readFile(currentCssPath, 'utf8'),
]);
const manifest = JSON.parse(manifestText);

assert.match(app, /まずは、2項目だけ。/, '必須2項目の案内がありません');
assert.match(app, /id="scene"/, '場面入力欄がありません');
assert.match(app, /id="reference1"/, '参考曲1の入力欄がありません');
assert.match(app, /id="exportButton"[^>]*disabled/, '必須入力前にJSON保存が有効になっています');
assert.match(app, /SongProject v1/, '共通SongProject v1の案内がありません');
assert.match(app, /composition_sheet_v0\.3\.js/, 'v0.3 scriptが読み込まれていません');
assert.match(script, /createEmptySongProject/, 'SongProject生成処理がありません');
assert.match(script, /mergeSheetChangesIntoSongProject/, '作曲シートのSongProject更新処理がありません');
assert.match(script, /parseProjectJsonToSongProject/, '旧形式を含む共通Import処理がありません');
assert.match(script, /serializeSongProject/, 'SongProject保存処理がありません');
assert.match(script, /mountSongDataMenu/, '右上の曲データメニューが接続されていません');
assert.match(script, /Demo Composerへ進む/, '次工程の案内がありません');
assert.match(script, /music-project-songproject-handoff-v1/, 'SongProject一時受け渡しがありません');
assert.doesNotMatch(script, /demo-composer-project/, 'v0.3が旧交換形式を新規Exportしようとしています');
assert.match(app, /@media\(min-width:620px\)/, 'スマホ優先の1カラム設計を確認できません');
assert.match(app, /viewport-fit=cover/, 'モバイルviewport設定がありません');
assert.equal(manifest.kind, 'composition-sheet-latest', 'latest manifest kindが不正です');
assert.equal(manifest.schemaVersion, 1, 'latest manifest schemaが不正です');
assert.equal(manifest.version, 'v0.9.1-dev', 'latest manifestがv0.9.1-devではありません');
assert.equal(manifest.alwaysOpenBeginner, true, '最新版は常にかんたん入力で開く必要があります');
assert.equal(manifest.embeddedSongDataMenu, false, 'Home埋め込みでは内側の曲データメニューを出さない契約です');
assert.match(latest, /composition_sheet_v0\.9\.1\.html/, 'latest redirectがmanifestの最新版v0.9.1を参照していません');
assert.match(latest, /target\.search = location\.search/, 'latest redirectがembed queryを保持していません');
assert.match(entry, /latest\/composition_sheet_latest\.html/, 'sheet-app 入口が latest を参照していません');
assert.match(entry, /target\.search = location\.search/, 'canonical入口がembed queryを保持していません');
assert.match(current, /data-sheet-mode="beginner"/, 'v0.9.1の初期表示がかんたん入力ではありません');
assert.match(current, /localStorage\.setItem\('composition-sheet-ui-mode-v0\.9','beginner'\)/, 'v0.9.1で起動時beginner固定がありません');
assert.match(currentCss, /#composition-sheet-full-menu/, 'Home埋め込み時の重複メニュー非表示CSSがありません');
assert.match(previous, /作曲シート v0\.2/, '過去v0.2が保持されていません');

console.log('Composition Sheet legacy preservation + canonical latest v0.9.1 beginner/embed contract: OK');
