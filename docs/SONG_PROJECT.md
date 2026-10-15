# Song Project v1

更新日: 2026-10-13

## 目的

`SongProject v1` は MIDI Analyzer / Demo Composer / Arrangement Lab / Music Project Home の共通交換形式です。既存アプリ内部Schemaを直ちに置き換えず、Adapterを介して安全にデータを受け渡します。

Audio Blob / Stem本体はv1 JSONへ埋め込みません。

## Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

SongProjectはこのWorkflowのProject同一性と所有権を保つ共通契約です。

## Schema

```text
SongProject
├─ kind: "song-project"
├─ schemaVersion: 1
├─ projectId
├─ title
├─ createdAt
├─ updatedAt
├─ lineage (optional in v1, new projects include it)
│  ├─ rootProjectId
│  ├─ parentProjectId
│  ├─ sourceApp
│  ├─ createdFrom
│  ├─ forkReason
│  └─ revision
├─ basic
│  ├─ bpm
│  ├─ timeSignature
│  ├─ key
│  ├─ scale
│  └─ ppq
├─ analysis
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
│  ├─ lastDraftMidiAt
│  ├─ lastSongMidiAt
│  └─ lastDawHandoffAt
└─ compatibility
```

## Ownership

| App | 主担当 | 書き戻しルール |
| --- | --- | --- |
| MIDI Analyzer | `analysis`, `reference` | Composition / Arrangementを消さない |
| Demo Composer | `composition` | Arrangement / Analysisを保持する |
| Arrangement Lab | `arrangement` | Compositionを通常上書きしない |
| Music Project Home | Workflow状態 / Backup案内 | Editor内容を書き換えない |
| 共通 | `basic`, `lineage` | Adapterで明示的に反映する |

## Lineage

v1のoptional fieldとして追加する。Schema Versionは上げない。

新規SongProjectでは必ずlineageを生成する。

```text
lineage
  rootProjectId
  parentProjectId
  sourceApp
  createdFrom
  forkReason
  revision
```

### rootProjectId

同じ曲の系譜の起点。

### parentProjectId

Fork元。起点Projectは`null`。

### sourceApp

例:
- `demo-composer`
- `arrangement-lab`
- `midi-analyzer`

### createdFrom

例:
- `new`
- `demo-project`
- `song-project`
- `fork`

### forkReason

Arrangement案を新しいCompositionとして続ける等、Fork理由。

### revision

Fork時は1から開始する。

## 後方互換

2026-10-13以前のSongProject v1には`lineage`が無い。
Readerはlineage欠落を許可する。

旧v1をDemo Composerへ変換した場合は、現在の`projectId`をrootとして安全なlineageを補完できる。
既存JSONを自動上書きしない。

## Fork

Arrangement LabからDemo Composerへ「戻す」という通常往復は行わない。

編曲結果をCompositionとして続けたい場合だけ、**新しい作曲ProjectとしてFork**する。

Fork:
- 新projectId
- rootProjectIdは維持
- parentProjectIdに元Project
- revision=1
- sourceAppを記録
- forkReasonを記録
- 元Projectを上書きしない

`src/shared/song-project.js` の `forkSongProject()` を共通処理とする。

## Demo Composer Adapter

実装: `src/shared/song-project.js`

- `createEmptySongProject()`
- `demoProjectToSongProject()`
- `songProjectToDemoProject()`
- `mergeDemoChangesIntoSongProject()`
- `forkSongProject()`
- `serializeSongProject()`
- `parseSongProjectJson()`

Demo Composer内部Schema 3は維持する。
SongProject導入・lineage追加のために既存IndexedDB Schemaを変更しない。

### Legacy互換

`compatibility.demoComposer.legacyProject` に既存Demo Projectの互換Snapshotを保持する。
Audio Blobは含めない。

これにより以下を保持する。
- metadata
- Track固有設定
- unknown field
- extra track
- instruments
- progress
- exportSettings
- structure追加field

## Arrangement Lab Adapter

- `arranger/src/song-project-sync.js`
- `arranger/src/song-project-ui.js`

Arrangement LabはSongProjectを入力としてCompositionを参照するが、書き戻すのはArrangement領域のみ。

- reharmonization
- voicing / harmony pattern
- density
- instrument ON/OFF
- selected alternative
- decision note / music-lab metadata

Composition同一性をRegressionで確認する。

## DAW Ready

Arrangement Labの正式な出口はDAW Handoff Package。

`export.lastDawHandoffAt` は将来/対応UIでDAW Handoff生成済み状態をProject Homeへ示すためのoptional field。
古いv1で欠落していても問題ない。

## 作曲シート

Claude Artifact作曲シート自体はSongProjectへ埋め込まない。

`composition-sheet-handoff` JSONを同一端末localStorage経由でDemo Composerへ渡し、Title / BPM / Key / Scale等の初期値・設計メモとして利用する。

正本: `docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`

## Import / Export

異Origin交換はJSONファイルを基本とする。

推奨:
`<song>_song_project_v1.json`

別OriginのIndexedDBを直接共有しない。

## Audio / Stem

v1 JSONへAudio BlobやStem本体を直接格納しない。
Reference metadataのみを扱い、実体は各アプリの端末Storageへ保持する。

## Regression requirements

最低限:
1. 空SongProject作成
2. Demo→SongProject
3. JSON Export / Import
4. Arrangement source化
5. Arrangement更新
6. Composition不変
7. Arrangement保持
8. Legacy unknown field保持
9. Demo再編集時もArrangement保持
10. lineage保持
11. old v1 without lineage受理
12. explicit Forkでroot / parentを保持
13. Fork元Project不変

実装テスト: `scripts/song-project-smoke-test.mjs`
