# Project Management

## 目的

`＋ 新規Project` で旧Projectを端末内へ残すだけでなく、Hubから保存済みProjectを一覧し、過去曲へ戻れるようにする。

## Hub UI

Hubの `📂 Project一覧` を開くと、このブラウザのIndexedDB `projects` storeに保存されているProjectを表示する。

各Projectには以下を表示する。

- Project名
- Key / Scale
- BPM
- Revision
- 現在開いているProjectかどうか

操作:

- `開く`: 現在Projectを先にSave Nowし、選んだProjectをActiveにして再読み込みする
- `複製`: 内容をそのまま別IDへ複製し、名前の末尾へ `コピー` を付ける。現在Projectは切り替えない
- `削除`: 端末内の保存Projectを削除する。現在開いているProjectは削除不可

## 安全なProject切替

通常の `saveProject()` はProject保存と同時に `activeProjectId` も更新する。

Project切替直前にreloadすると、旧ページの `visibilitychange` AutoSaveが最後に走って `activeProjectId` を旧Projectへ戻す可能性がある。

そのため `src/hub/project-list.js` は、選択したProject IDをsessionStorageへ一時保存し、`src/hub/app-entry.js` が `main.js` のboot前に次の順でActive Projectを確定する。

1. reload直後に旧ページの保存完了を短時間待つ
2. 選んだProject IDをActiveにする
3. 短い待機後、同じIDをもう一度Activeにする
4. sessionStorageの要求を消す
5. `main.js` が通常どおりActive Projectを読み込む

これは既存の `＋ 新規Project` と同じ、reload境界での競合回避方針である。

## IndexedDB API

`src/storage/indexeddb-storage.js`:

- `listProjects()`
- `getActiveProjectId()`
- `loadProjectById(projectId)`
- `setActiveProjectId(projectId)`
- `duplicateStoredProject(projectId)`
- `deleteStoredProject(projectId)`

複製時の純粋なデータ操作は `src/storage/project-records.js` に分離する。

## 削除ルール

現在開いているProjectは削除できない。

誤削除やActive ID不整合を避けるため、削除したいProjectが現在Projectの場合は、先に別のProjectを `開く`。その後、Project一覧から削除する。

削除はUndo対象外なので、実行前に確認する。

## Data / Version

- IndexedDBのDB Versionは1のまま
- `projects` / `meta` store構造は変更しない
- `project.json` のschemaVersionは2のまま
- Project複製は新しい `id` を発行し、`revision` を1から開始する
- MIDI形式変更なし
- Versionは `v0.2-dev` のまま

## Backup

IndexedDBは端末・ブラウザ内の保存領域であり、ブラウザデータ削除などで失われる可能性がある。

大事なProjectは従来どおり `project.json` Exportも利用する。
