# Project一覧 / 過去Project管理

## 目的

Hubから、IndexedDBに残っている過去Projectへ戻れるようにする。

これまでの `＋ 新規Project` は「現在Projectを保存して新しい曲を始める」ことはできたが、端末内に残った旧Projectを選んで開くUIが弱かった。`Project一覧` はこの穴を埋めるための機能とする。

## UI

Hubの `📂 Project一覧` を開くと、このブラウザのDemo Composer用IndexedDB `projects` storeに保存されているProjectを一覧表示する。

各Projectカードに表示するもの:

- Project名
- Key / Scale
- BPM
- Revision
- 現在開いているProjectかどうか

各カードの操作:

- `開く`: 現在Projectを保存してから対象Projectへ切り替える
- `複製`: 同じ内容を新しいProject IDで保存する。元Projectは変更しない
- `削除`: 端末内の対象Projectを削除する。Undoでは戻せないため確認を出す

現在開いているProjectは、誤削除防止のため `削除` を無効にする。

## Project切替の安全策

Project切替時は、旧ページの `visibilitychange` AutoSaveが `activeProjectId` を旧Projectへ戻す競合を避ける必要がある。

そのため:

1. `Save Now` 相当で現在Projectの保存完了を確認
2. 開きたいProject IDを `sessionStorage` に一時保存
3. ページをreload
4. `src/hub/app-entry.js` が `main.js` のbootより先に切替要求を処理
5. 旧ページの書き込みが落ち着くのを待って `activeProjectId` を対象IDへ設定
6. 短い待機後、同じIDをもう一度設定してActiveを確定
7. その後に通常bootで対象Projectを読み込む

この方式は既存の `＋ 新規Project` と同じく、reload境界でのAutoSave競合を安全側へ倒すためのもの。

## 複製

複製ではProject本体をcloneし、以下だけを変更する。

- `id`: 新しいID
- `revision`: 1
- `metadata.title`: 元タイトル + ` コピー`

Chord / Melody / Counter Melody / Bass / Drums / Arrange / Sound等の内容は保持する。

複製したProjectは保存するだけで、自動では開かない。

## 削除

- 現在開いているProjectは削除不可
- 削除前に確認を出す
- 削除はIndexedDBのProject record自体を消すため、画面上部のUndo対象外
- 大事な曲は `project.json` Backupも併用する

## Storage API

`src/storage/indexeddb-storage.js` にProject一覧用の操作を追加する。

- `getActiveProjectId()`
- `loadProjectById(projectId)`
- `listProjects()`
- `setActiveProjectId(projectId)`
- `duplicateStoredProject(projectId)`
- `deleteStoredProject(projectId)`

Projectの複製と並び替えの純粋処理は `src/storage/project-records.js` に分離する。

Project切替要求は `src/hub/project-list.js`、Hub UIは `src/hub/project-list-ui.js` が担当する。

## Data / Version

- `project.json` を正本とする方針は変更しない
- `schemaVersion` は2のまま
- IndexedDBのDB Versionは1のまま
- Object Store追加なし
- MIDI形式変更なし
- Versionは `v0.2-dev` のまま

## 対象外

初期実装では以下を行わない。

- Cloud同期
- Google Drive上のProject一覧
- 自動世代管理 / Snapshot履歴
- フォルダ分け
- タグ検索
- 複数端末同期

Project一覧は、あくまで「このAndroid端末 / ブラウザ内に残っている曲へ戻る」ための最小UIとする。
