# Song Project v1

更新日: 2026-10-13

## 目的

`SongProject v1` は MIDI Analyzer / Demo Composer / Arrangement Lab の共通交換形式です。既存3アプリの内部Schemaを直ちに置き換えず、Adapterを介して安全にデータを往復させます。

最初の目的は MIDI・分析・作曲・編曲データの共通化です。Audio Blob / Stem本体はv1 JSONへ埋め込みません。

## Schema

```text
SongProject
├─ kind: "song-project"
├─ schemaVersion: 1
├─ projectId
├─ title
├─ createdAt
├─ updatedAt
├─ basic
│  ├─ bpm
│  ├─ timeSignature
│  ├─ key
│  ├─ scale
│  └─ ppq
├─ analysis
│  ├─ keyCandidates
│  ├─ chordCandidates
│  ├─ degreeAnalysis
│  ├─ melodyAnalysis
│  ├─ bassAnalysis
│  └─ rhythmAnalysis
├─ composition
│  ├─ chords
│  ├─ melody
│  ├─ counterMelody
│  ├─ bass
│  ├─ drums
│  └─ sections
├─ arrangement
│  ├─ reharmonization
│  ├─ voicing
│  ├─ density
│  ├─ instruments
│  ├─ selectedAlternatives
│  └─ decisions
├─ history
├─ reference
├─ export
└─ compatibility
```

## Ownership

アプリ間Mergeでは担当領域だけを更新します。

| App | 主担当 | 書き戻しルール |
| --- | --- | --- |
| MIDI Analyzer | `analysis`, `reference` | Composition / Arrangementを消さない |
| Demo Composer | `composition` | Arrangement / Analysisを保持する |
| Arrangement Lab | `arrangement` | Compositionを上書きしない |
| 共通 | `basic` | Adapterで明示的に反映する |

## Demo Composer Adapter

実装: `src/shared/song-project.js`

- `demoProjectToSongProject()`
- `songProjectToDemoProject()`
- `mergeDemoChangesIntoSongProject()`
- `serializeSongProject()`
- `parseSongProjectJson()`

Demo Composer内部Schema v3は維持します。SongProject導入のために既存IndexedDB Schemaを変更しません。

### Legacy互換

`compatibility.demoComposer.legacyProject` に既存Demo Projectの互換Snapshotを保持します。これはAudio BlobではなくProject/MIDI系JSONのみです。

SongProjectからDemoへ戻すときはSnapshotをベースに、SongProjectが所有する共通項目だけを更新します。これにより以下を保持します。

- 既存metadata
- Track固有設定（name / channel / mute / solo / volume / pan / drumMap等）
- 将来/過去Schemaの未知フィールド
- extra track
- instruments
- progress
- exportSettings
- structureの追加フィールド

## Arrangement Lab Adapter

実装:

- `arranger/src/song-project-sync.js`
- `arranger/src/song-project-ui.js`

Arrangement LabはSongProjectをDemo Composer互換入力へ変換して、既存の`normalizeSourceProject()`と編曲処理をそのまま再利用します。

編曲採用後は以下だけをSongProjectへ書き戻します。

- reharmonization
- voicing / harmony pattern
- density
- instrument ON/OFF
- selected alternative
- decision note / reason / music-lab metadata

`composition`は変更しません。Adapter内でも書き戻し前後のCompositionが同一か検査します。

## Import / Export

初期の異Origin交換方式はJSONファイルです。

推奨ファイル名:

```text
<song>_song_project_v1.json
```

Arrangement Labでは従来のDemo Composer `project.json` とSongProject v1の両方を読み込めます。SongProjectから読み込んだ場合は「Song Project v1を書き出す」で編曲結果を含む共通Projectを再Exportできます。

別OriginのIndexedDBを直接共有する設計にはしません。

## Migration

`schemaVersion` は必須です。

- v1 Readerは`schemaVersion: 1`のみ受理
- 将来v2を導入するときはv1→v2 Migrationを追加する
- 既存Demo Composer Project Schema 1/2/3のMigration責務は既存Demo側に残す
- SongProject変換のために既存保存データを自動上書きしない

## Audio / Stem

v1 JSONへAudio BlobやStem本体を直接格納しません。将来は`reference`へmetadataを持ち、実体はIndexedDB Blob / File Handle等をAndroid Chrome互換性を確認して選択します。

## Regression requirements

最低限、以下を自動確認します。

1. 空SongProject作成
2. Demo→SongProject変換
3. JSON Export
4. JSON Import
5. Arrangement source化
6. Arrangement更新
7. 再Export
8. Demoへ再変換
9. Composition無変更
10. Arrangement保持
11. Legacy未知フィールド保持
12. Demo再編集時もArrangement保持

実装テスト: `scripts/song-project-smoke-test.mjs`
