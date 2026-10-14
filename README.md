# Demo Composer

Androidスマホ中心の作曲支援PWAです。

## Current Version

`v0.14-dev`

公開中Version: `v0.9-dev`

GitHub Pages: `https://tamurayuuki46-cpu.github.io/demo-composer/`

`develop`は開発統合、`main`はCI合格版かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。

## コンセプト

Demo Composerはスマホ版DAWを目指しません。

目的は、PC DAWを開く前に作曲・素材準備・編曲判断をできるだけAndroidスマホで済ませ、PCでは本制作と完成作業へ集中できる状態を作ることです。

PC DAWは最終工程として必須です。

## 正式Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須） → 完成`

役割:

- 作曲シート = 決める
- Moises = 分ける
- MIDI Analyzer = 集める・理解する
- Demo Composer = 作る
- Arrangement Lab = 育てる
- Music Project Home = 案内する・つなぐ
- PC DAW = 完成させる

正本: `docs/WORKFLOW_PRINCIPLES.md`

## v0.14-dev

### 曲データ共通メモ帳

右上の `📦 曲データ` に `📓 メモ帳` を追加しました。v0.13-devの4大操作はそのまま維持し、メモ帳は補助操作として配置しています。

- Project IDごとの端末保存 / 自動保存
- Android共有画面から Google Drive / Notion へTXT共有
- Android共有画面から ChatGPT へメモ共有
- Web Share API非対応時はTXT保存、コピー、ChatGPT起動へフォールバック
- 作曲シート / Music Project Home / Demo Composer / Arrangement Labで共通利用
- SongProject v1 / Project Schema 3 / IndexedDB Schemaは変更なし

詳細: `docs/SONG_MEMO.md`

## Demo Composerの責務

Demo Composerは**Composition Owner**です。

担当:

- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- BPM / Key / Scale
- 作曲案A/B
- 作曲判断
- Lyrics / Vocalの作曲段階メモ
- Draft.mid

深い参考曲分析やPersonal TrendはMIDI Analyzerへ、高度なReharm / Voicing / Density / DevelopmentはArrangement Labへ、本格音源・Vocal本制作・Mix / MasteringはPC DAWへ任せます。

## v0.9-dev

### 作曲シート → Demo Composer

Claude Artifactの作曲シートはClaude側が所有します。

GitHubでは引き渡し契約だけを管理します。

- `docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`
- kind: `composition-sheet-handoff`
- schemaVersion: 1

Music Project HomeでJSONを読み込み、Demo Composerで内容を確認してからTitle / BPM / Key / ScaleおよびVocal/Lyrics初期設計を明示反映できます。

Chord / Melody等をClaude JSONから自動生成しません。

### Lyrics / Vocal

「作曲の判断」で次を保存できます。

- 歌詞テーマ / 言葉の芯
- Vocal音域 / 歌いやすさ
- Phrase歌詞 / 音節メモ
- 歌詞 / Vocal方針

旧Schema 3 Projectにこれらが無くても読み込めます。Project Schemaは3のままです。

本歌、SynthV本制作、Phoneme、詳細Vocal編集、Vocal FX、MixはPC DAW工程です。

詳細: `docs/VOCAL_LYRICS_BOUNDARY.md`

### Music Project Home

`project-home/`を全体Workflow Hubとして使用します。

- SongProject v1を開く
- Analysis / Composition / Arrangement状態
- 現在のWorkflow工程
- 次の一手
- 作曲シート入口 / handoff JSON受け入れ
- MIDI Analyzer / Demo Composer / Arrangement Labへの導線
- Project Lineage表示
- SongProject Backup

Project HomeにEditor機能を重複させません。

### SongProject Lineage

SongProject v1はoptionalなlineageを持てます。

- rootProjectId
- parentProjectId
- sourceApp
- createdFrom
- forkReason
- revision

旧SongProject v1でlineageが無くても読み込めます。

### Arrangement Lab Fork

Arrangement LabからDemo Composerへ通常の「戻し」は行いません。

編曲結果をCompositionとして続けたい場合だけ**新しい作曲ProjectとしてFork**します。

Forkは新Project IDを作り、元Projectを変更せず、root / parent / sourceApp / forkReasonを記録します。

通常のArrangement Lab出口はDAW Handoff Packageです。

詳細: `arranger/docs/WORKFLOW_BOUNDARY.md`

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
- Claude composition-sheet handoff
- Project Lineage / explicit Fork
- Root PWA / offline shell / versioned cache
- 曲データ共通メモ帳 / Drive・Notion・ChatGPT共有

## Arrangement Lab

`arranger/`配下の独立PWAです。

役割は「作った曲を育てる」。

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

Compositionを通常上書きしません。

## データ契約

### Demo Composer Project

- `schemaVersion: 3`
- PPQ 480
- 4/4固定
- `project.json`がDemo Composer内部正本

### SongProject v1

Ownership:

- MIDI Analyzer: `analysis`, `reference`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- Common: `basic`, `lineage`

詳細: `docs/SONG_PROJECT.md`

## PWA

Demo Composer root Service Workerは本体とProject Homeをオフライン用にCacheします。
Arrangement Labは独自PWA Cacheを持ちます。

詳細: `docs/PWA_SERVICE_WORKER.md`

## 開発

```bash
npm run build
```

ローカル起動例:

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

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
10. `CHANGELOG.md`
11. `docs/SONG_MEMO.md`

## Git / Release

- `develop`: 開発統合
- `main`: CI合格版 + GitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- mainへの統合 / 公開は明示承認後
- 過去Version / Branch / Tagを削除・上書きしない

## 実機継続課題

- Android: Project Home → Sheet → MIDI Analyzer → Demo Composer → Arrangement Lab → DAW Handoffの通し確認
- Android: メモ帳 → Drive / Notion / ChatGPT共有先の実機確認
- Android PWA install / standalone / offline / update
- Cubasis / CubaseでMIDI / DAW ZIP取込
- SynthV / 本歌はPC DAW工程として確認

実機確認前はstable tagを作成しません。
