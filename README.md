# Demo Composer

Androidスマホ中心の作曲支援PWAです。スマホ版DAWを目指すのではなく、PC DAWを開く前の作曲・素材準備・編曲判断を進め、PCでは本制作と完成作業へ集中するためのアプリです。

## Current Version

- develop/current: `v0.15-dev`
- `VERSION`: `v0.15-dev`
- `package.json`: `0.15.0-dev`
- main/public candidate: `v0.10-dev`
- GitHub Pages: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- SongProject: v1 (`schemaVersion: 1`)
- Demo Composer Project: `schemaVersion: 3`

`develop`は開発統合、`main`はCI/build/回帰合格の公開候補かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。mainへ直接変更しません。

2026-10-15時点でmain/developは大きく分岐しているため、開発版をmainへ無差別に統合しません。Release時は復元点を保持した上で差分を明示的に整理します。

## 正式Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須） → 完成`

役割:

- 作曲シート = intent / 初期条件を決める
- Moises = 音源を分ける
- MIDI Analyzer = 素材を集める・曲を理解する
- Demo Composer = Compositionを作る
- Arrangement Lab = Arrangementを育てる
- Music Project Home = 全体を案内・接続する
- PC DAW = 本制作・Mix・Mastering・Vocal本制作

正本: `docs/WORKFLOW_PRINCIPLES.md`

## v0.15-dev

### AIモニタリング

Hubで主要機能の使用状況を端末内だけで集計し、できていること、改善ポイント、次に試す機能を表示します。既存の初心者モードと連動し、初心者表示では情報量を絞ります。外部AIへ自動送信しません。

詳細: `CHANGELOG_v0.15.md`

### SongProject v1 契約

Demo Composerは**Composition Owner**です。

Demo Composerが担当する主領域:
- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- 作曲案A/B
- 作曲判断
- Lyrics / Vocalの作曲段階メモ
- Draft.mid
- 明示操作によるBPM / Key / Scale

SongProject v1 Ownership:
- MIDI Analyzer: `analysis`, `reference`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- Composition Sheet: `intent`と明示的な初期`basic`
- Common: `basic`, `lineage`

Demo ComposerがSongProjectへ変更を戻す時、`analysis / arrangement / intent / reference / assets / export / history / lineage`は保持します。Arrangement Labは元Compositionを通常上書きしません。

契約テスト:
- `scripts/song-project-ownership-contract-test.mjs`
- `scripts/song-project-smoke-test.mjs`
- `.github/workflows/song-project-ci.yml`

詳細: `docs/SONG_PROJECT.md`

## 主要実装

- Hub / Chord / Melody / Rhythm / Arrange / Sound / Counter Melody
- Project Schema 3 / PPQ 480 / 4/4
- IndexedDB Save / Restore / AutoSave
- Project一覧 / 開く / 複製 / 削除
- Undo / Redo
- Chord Preset / Diatonic / borrowed / next chord / backing
- Melody Piano Roll / candidates / analysis / A/B
- Bass / Drum 16-step / presets / fills / candidates
- Counter Melody generation / edit / MIDI
- Section / Energy / Transition / Variation / Structure Library
- Sound Sketch Lite
- Demo Player / part mute / solo
- Draft.mid / Part MIDI / project.json
- MIDI Import
- SongProject v1 Adapter
- Music Project Home
- Composition Sheet handoff
- Project Lineage / explicit Fork
- Root PWA / offline shell / versioned cache
- 曲データ共通メモ帳 / Drive・Notion・ChatGPT共有
- AIモニタリング

## Arrangement Lab

`arranger/`配下の独立PWAです。役割は「作った曲を育てる」。

- Reharmonization
- Voicing
- Counter interaction
- Density
- Instrument participation
- Development
- A/B/C comparison
- Decision Journal
- Before / After
- Song.mid
- DAW Handoff Package

通常の出口はDAW Handoff Packageです。Arrangement結果をCompositionとして続ける時だけ新Projectへ明示Forkし、元Projectを変更しません。

## データ契約

### Demo Composer Project

- `schemaVersion: 3`
- PPQ 480
- 4/4固定
- `project.json`がDemo Composer内部正本

### SongProject v1

- `kind: "song-project"`
- `schemaVersion: 1`
- Blob本体をJSONへ無制限に埋め込まない
- 各アプリは所有領域以外を保持する

## PWA

Demo Composer root Service Workerは本体とProject Homeをオフライン用にCacheします。Arrangement Labは独自PWA Cacheを持ちます。

詳細: `docs/PWA_SERVICE_WORKER.md`

## 開発

```bash
node scripts/song-project-ownership-contract-test.mjs
node scripts/song-project-smoke-test.mjs
npm run test:syntax
npm run build
```

変更領域に対応する既存回帰テストも実行します。TypeScriptは使用していないため専用typecheckは現状未設定です。

ローカル起動例:

```bash
python -m http.server 8080
```

## 最初に読むファイル

1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/WORKFLOW_PRINCIPLES.md`
5. `docs/APP_INTEGRATION.md`
6. `docs/SONG_PROJECT.md`
7. `docs/VOCAL_LYRICS_BOUNDARY.md`
8. `docs/DATA_SCHEMA.md`
9. `arranger/docs/WORKFLOW_BOUNDARY.md`
10. `CHANGELOG_v0.15.md`
11. `CHANGELOG.md`

## Git / Release

- `develop`: 開発統合
- `main`: CI/build/回帰合格の公開候補 + GitHub Pages公開元
- mainへ直接pushしない
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- 過去Version / Branch / Tag / Backupを削除・上書きしない
- 大きな変更前にrestore pointを作る

2026-10-15安定化復元点:
- `restore/develop-before-stabilization-20261015`
- `restore/main-before-stabilization-20261015`

## 実機継続課題

- Android: Project Home → Sheet → MIDI Analyzer → Demo Composer → Arrangement Lab → DAW Handoffの通し確認
- Android: メモ帳 → Drive / Notion / ChatGPT共有先の実機確認
- Android PWA install / standalone / offline / update
- Cubasis / CubaseでMIDI / DAW Handoff取込
- SynthV / 本歌はPC DAW工程として確認

実機確認前はstable tagを作成しません。
