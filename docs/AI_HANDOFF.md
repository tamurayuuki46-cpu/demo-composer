# AI_HANDOFF

最終更新: 2026-10-15

## 現在地点

- Demo Composer current/develop: `v0.15-dev`
- `VERSION`: `v0.15-dev`
- `package.json`: `0.15.0-dev`
- main/public candidate: `v0.10-dev`
- SongProject: `kind: "song-project"`, `schemaVersion: 1`
- Demo Composer Project: `schemaVersion: 3`
- stable tag: 未作成。Android実機 + 必要なCubasis/Cubase実機確認後のみ作成する。

`develop` = 開発統合、`main` = CI/build/回帰合格の公開候補。mainへ直接変更しない。公開・本番Deploy・stable tag作成は明示的なRelease工程まで行わない。

## 2026-10-15 安定化作業

作業Branch: `chatgpt/stabilization-songproject-contracts-20261015`

復元点:
- `restore/develop-before-stabilization-20261015`
- `restore/main-before-stabilization-20261015`

注意: 2026-10-15時点で`main`と`develop`は大きく分岐している。開発版をmainへ無差別に統合しない。main側の公開履歴もdevelopへ機械的に全面mergeせず、Release時に必要差分を明示的に整理する。

今回の安定化では、Version文書の整合とSongProject v1の所有権/データ保持契約をCIで固定する。Schema、保存形式、PPQ 480、4/4固定は変更しない。

## 正式Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須） → 完成`

- 作曲シート = intent / 初期basicを決める
- MIDI Analyzer = analysis / referenceを所有
- Demo Composer = compositionを所有
- Arrangement Lab = arrangementを所有
- `basic` / `lineage` = 共通契約。各アプリは明示された操作でのみ変更する
- PC DAW = 本制作・Mix・Mastering・Vocal本制作

正本:
- `docs/WORKFLOW_PRINCIPLES.md`
- `docs/APP_INTEGRATION.md`
- `docs/SONG_PROJECT.md`
- `src/shared/song-project.js`
- `arranger/docs/WORKFLOW_BOUNDARY.md`

## SongProject v1 所有権契約

Demo ComposerがSongProjectへ戻す時に変更してよい主領域:
- `composition`
- 明示的な作曲操作による`basic`
- Demo互換情報 `compatibility.demoComposer`

保持する領域:
- `analysis`
- `arrangement`
- `intent`
- `reference`
- `assets`
- `export`
- `history`
- `lineage`

Composition Sheetは`intent`と明示的な初期`basic`を更新し、composition / analysis / arrangement / assets等を保持する。Arrangement Labは`arrangement`を更新し、元compositionを破壊しない。MIDI Analyzer都合でcompositionを書き換えない。

契約テスト:
- `scripts/song-project-ownership-contract-test.mjs`
- `scripts/song-project-smoke-test.mjs`
- `.github/workflows/song-project-ci.yml`

## Git / Release

- `develop`: 開発統合
- `main`: CI/build/回帰合格の公開候補 + GitHub Pages公開元
- mainへ直接pushしない
- 過去Branch / Tag / Version / Backupを削除・上書きしない
- 大きな変更前にrestore branchを作る
- stable tagはAndroid実機 + 必要なCubasis/Cubase実機確認後のみ

## 開発時の必須確認

```bash
node scripts/song-project-ownership-contract-test.mjs
node scripts/song-project-smoke-test.mjs
npm run test:syntax
npm run build
```

加えて変更領域に対応する既存回帰テストを実行する。TypeScriptは使用していないため専用typecheckは現状未設定。JavaScriptの構文検査は`test:syntax`とCIで行う。

## 触らない部分

- Project Schema 3をMigrationなしに上げない
- SongProject v1を互換検討なしに上げない
- PPQ 480 / 4/4固定を無断変更しない
- Arrangement Labから元Compositionを破壊的更新しない
- Analyzer都合でCompositionを変更しない
- Root PWAがArrangement Cacheを削除しない
- 実機確認前にstable tagを作らない

## 残る実機確認

- Android: Project Home → Sheet → MIDI Analyzer → Demo Composer → Arrangement Lab → DAW Handoff
- Android PWA install / standalone / offline / update
- Androidの共有・メモ導線
- Cubasis / CubaseでMIDI / DAW Handoff取込
