# AI_HANDOFF

現在Version:
`v0.8-dev`

公開中Version:
`v0.6-dev`

最新安定版:
未認定。`main`はCI合格版かつGitHub Pages公開元。stable tagはAndroid実機 + 必要なCubasis/Cubase実機確認後のみ作成する。

最終更新: 2026-10-13

## 最重要Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須） → 完成`

一言定義:
- 作曲シート = 決める
- Moises = 分ける
- MIDI Analyzer = 集める・理解する
- Demo Composer = 作る
- Arrangement Lab = 育てる
- Music Project Home = 案内する・つなぐ
- PC DAW = 完成させる

正本:
- `docs/WORKFLOW_PRINCIPLES.md`
- `docs/APP_INTEGRATION.md`
- `docs/SONG_PROJECT.md`
- `docs/VOCAL_LYRICS_BOUNDARY.md`

機能数よりWorkflowの直感性、次の一手の分かりやすさ、再入力の少なさを優先する。

## v0.8-dev 追加・整理

### Music Project Home = Workflow Hub

既存`project-home/`を新しい管理アプリへ分裂させず、そのまま全体Workflow Hubへ拡張。

実装済み:
- SongProject v1読込
- Analysis / Composition / Arrangement状態
- Workflow工程表示
- 次の一手
- MIDI Analyzerを任意レーンとして表示
- Claude Artifact作曲シートへの入口
- Claude handoff JSON取込
- Demo Composer / Arrangement Labへの入口
- SongProject Backup
- Project Lineage表示

Project HomeにEditor機能を重複させない。

### Claude Artifact作曲シート

作曲シート本体はClaude Artifact所有。GitHubへArtifact本体を複製しない。

GitHub正本Prompt:
`docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`

Handoff:
- kind: `composition-sheet-handoff`
- schemaVersion: 1
- scene / purpose / references
- genre / mood
- BPM / Key / Scale候補
- constraints / experiments
- optional Vocal / Lyrics初期情報
- notes

Project HomeでJSONを読み込み、同一Origin localStorageへ保存。
Demo Composer Hubで内容を確認し、Title / BPM / Key / Scaleだけ明示適用可能。
Vocal初期情報は`歌詞 / Vocal設計` Panelの初期候補として利用する。
Chord / Melody / Bass / Drum / CounterをClaude JSONから自動生成しない。

旧Schema 1 handoffで`vocal`欠落を許容する。

### Lyrics / Vocal責務

正本: `docs/VOCAL_LYRICS_BOUNDARY.md`

作曲シート:
- 歌詞テーマ
- 情景 / 言葉のイメージ
- Vocal方向
- 想定音域候補

Demo Composer実装済み:
- 歌もの / Instrumental / 未決定
- 歌詞テーマ / 言葉のイメージ
- Vocal方向
- Vocal Range
- 歌詞Draft
- Phrase単位の歌詞 / Melodyとの当たり
- 音節メモ
- 仮歌 / SynthV前段メモ

保存正本は`project.metadata.vocal`。Project Schemaは3のまま、optional metadataとして旧Project互換を維持する。
保存時はProject ID照合付きreload Bridgeを使い、別Projectへ誤適用しない。

Arrangement Lab:
- Vocalの居場所、密度、Counterとの対話
- 歌詞本文は所有しない

PC DAW:
- 本歌 / SynthV本制作 / Recording / 詳細Vocal編集 / Mix

歌詞専用の新アプリは現時点で作らない。

### SongProject v1 Lineage

SongProject Schemaは`1`のまま。
`lineage`はoptional追加なので旧v1互換を維持する。

新規Projectで保持:
- rootProjectId
- parentProjectId
- sourceApp
- createdFrom
- forkReason
- revision

`src/shared/song-project.js`:
- createEmptySongProject
- demoProjectToSongProject
- songProjectToDemoProject
- mergeDemoChangesIntoSongProject
- forkSongProject
- serializeSongProject
- parseSongProjectJson

旧v1のlineage欠落を受理する。

### Arrangement Lab → Demo Composer

通常の「戻し」ではなく、必要な場合だけ**新しい作曲ProjectとしてFork**する。

- 元Projectを上書きしない
- 新Project ID
- root lineage維持
- parent記録
- revision=1
- fork reason記録
- Arrangementで採用したCompositionを新Forkへ反映

SongProject v1からArrangement Labへ入った場合、既存ForkボタンはLineage付きSongProject Forkを書き出す。
legacy Demo Composer project.json入力時は従来のproject.json Forkを維持する。

通常の出口は**DAW Handoff Package**。

## Arrangement Labの正式出口

DAW Handoff PackageをPC DAW必須Workflowの正式出口とする。

既存実装:
- Before_Source_Song.mid
- After_Arrangement_Song.mid
- Part別MIDI
- Arrangement Plan
- Demo Composer Project snapshot
- TRACK_INSTRUCTIONS.md
- SECTION_INSTRUCTIONS.md
- DAW_CHECKLIST.md
- DECISIONS.json
- COMPARE_MANIFEST.json

Arrangement LabはComposition Ownerではない。`composition`を通常上書きしない。

## Demo Composerの所有範囲

Composition Owner:
- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- BPM / Key / Scale
- Lyrics / Vocalの作曲前段メモ
- 作曲案A/B
- 作曲判断
- Draft.mid

分析は「今作っている曲を判断するための軽量・文脈内分析」に限定する。

深い参考曲分析 / Personal Trend → MIDI Analyzer。
高度Reharm / Voicing / Density / Development → Arrangement Lab。
Mix / Mastering / Plugin Hosting / Vocal本制作 → PC DAW。

## 既存主要機能

- Android-first PWA
- Hub / Chord / Melody / Rhythm / Arrange / Sound / 裏メロ
- Project Schema 3 / PPQ 480 / 4/4固定
- IndexedDB保存 / Restore / AutoSave / Persistent Storage要求
- Project一覧 / 開く / 複製 / 削除（現在Project削除不可）
- 新規Project
- Undo / Redo最大50
- Chord Preset / Mood / Diatonic / borrowed / next chord / backing
- Melody Piano Roll / candidates / analysis / section compare
- Bass / Drum 16-step / presets / fills / candidates
- Counter Melody candidates / Piano Roll edit / CounterMelody.mid
- Arrange Section / energy / transition / variation / structure library
- Sound Sketch Lite
- Demo Player / part mute / solo
- Draft.mid + part MIDI
- project.json Import / Export
- MIDI Import
- Drive共有補助
- AI相談text export
- Root Service Worker / manifest / versioned precache / offline fallback
- SongProject v1 Adapter
- Project Home
- Claude composition-sheet-handoff
- Lyrics / Vocal設計Panel

## Root PWA

正本: `docs/PWA_SERVICE_WORKER.md`

- Root cache prefix: `demo-composer-shell-`
- Build ID単位precache
- Demo Composer本体 + Project Homeを対象
- Arrangement Labは独自PWA Cacheなのでroot precacheから除外
- `build.json`はnetwork fresh
- 更新時にDemo Composer cacheだけ削除

## Data Contract

### Demo Composer Project
- schemaVersion 3
- PPQ 480
- timeSignature 4/4固定
- `project.json`をDemo Composer内部正本とする
- `metadata.vocal`はoptional Lyrics/Vocal作曲情報

### SongProject
- schemaVersion 1
- MIDI Analyzer owner: analysis / reference
- Demo Composer owner: composition
- Arrangement Lab owner: arrangement
- common: basic / lineage

### Storage
Project Libraryは既存IndexedDB `projects` + `meta.activeProjectId`。
Project Home / Sheet handoffの軽量UI stateはlocalStorageを使用。
Vocal pending情報はreloadを跨ぐ一時キューだけで、正本はProject metadata。
別OriginのIndexedDBを直接共有しない。

## v0.8-dev 自動テスト追加

- `test:sheet-handoff`
- `test:project-home`
- `test:song-project`

確認:
- Claude handoff Schema 1
- old v1 without Vocal
- Handoff Vocal → Demo Vocal model
- Vocal pending save / Project ID一致適用 / revision更新 / ID不一致保護
- Project Home Workflow
- 次の一手
- SongProject old v1 without lineage
- Lineage roundtrip
- ArrangementがCompositionを通常上書きしない
- Demo mergeがArrangementを保持
- explicit Fork root / parent / sourceApp / reason
- Arrangement Forkが採用Composition + lineageを保持
- parent Project不変
- Static build
- PWA precache

## 現在の開発状態

作業Branch:
`chatgpt/workflow-boundary-phase2`

変更前復元点:
- `restore/before-workflow-boundary-2026-10-13`
- `restore/v0.8-workflow-boundary-phase1`

## Git運用

- `develop` = 開発統合
- `main` = CI合格版 + GitHub Pages公開元
- developへのpushでは公開しない
- mainへの統合 / 公開は明示承認後
- stable tag = Android実機 + 必要なCubasis/Cubase実機確認後のみ
- 過去Version / Branch / Tagを削除・上書きしない

## 触らない部分

- Schema 3をMigrationなしに変更しない
- SongProject Schemaを互換検討なしに上げない
- PPQ 480 / 4/4固定を無断変更しない
- Arrangement Labから元Compositionを破壊的更新しない
- Analyzer都合でCompositionを変更しない
- Demo ComposerへMixing / Mastering / Plugin Hostingを追加しない
- Root PWAがArrangement Cacheを削除しない
- 保存済みProjectを自動破壊しない

## 継続課題

- Android実機でProject Home → Claude handoff JSON → Demo Composer → Arrangement Lab → DAW Handoffの通し確認
- Android実機でLyrics / Vocal Panel入力・保存・reload・Project切替確認
- Android実機PWA install / standalone / offline / update
- Cubasis / Cubase実機MIDI / DAW ZIP取込

stable tagはこれら実機確認前に作らない。
