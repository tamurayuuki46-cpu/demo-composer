# Project Library

## 目的

Hubから、この端末のIndexedDBに保存されている過去Projectへ戻れるようにする。

`＋ 新規Project` で旧Projectを端末に残すだけでなく、ユーザーが一覧から明示的に管理できることを目的とする。

## UI

Hubの `📁 Project一覧` を開くと、保存済みProjectを縦1列で表示する。

各Projectには次を表示する。

- Project名
- Key / Scale
- BPM
- Revision
- 現在開いているProjectかどうか

操作:

- `開く`: 現在ProjectをSave Nowしてから対象Projectへ切り替える
- `複製`: 元Projectを残したまま別IDのコピーを作る。タイトルは `元タイトル のコピー`、重複時は `(2)` 以降を付ける
- `削除`: 端末のIndexedDBから削除する。確認必須でUndo不可

現在開いているProjectは誤削除防止のため削除できない。別Projectを開いてから削除する。

## 切替の安全策

Project切替は、New Projectと同じくreload境界を使う。

1. 現在ProjectをSave Now
2. 開くProject IDをsessionStorageへ一時保存
3. reload
4. `main.js` 起動前にActive Project IDを切り替える
5. 旧ページのvisibility AutoSaveとの競合を避けるため、短い待機を入れてActive IDを再確認する

これにより、切替直前の旧Project AutoSaveがActive Projectを戻してしまう事故を避ける。

## Storage

既存IndexedDB構造をそのまま使う。

- DB: `demo-composer`
- `projects`: Project SnapshotをIDで保存
- `meta.activeProjectId`: 起動時に開くProject ID

DB version、project.json、schemaVersionは変更しない。

Project一覧用に `src/storage/indexeddb-storage.js` へ以下を追加する。

- `listProjects()`
- `getActiveProjectId()`
- `setActiveProjectId()`
- `storeProjectSnapshot()`
- `deleteStoredProject()`

## Version

- App Version: `v0.2-dev` のまま
- schemaVersion: `2` のまま
- MIDI形式変更なし
- 復元点: `restore/v0.2-before-project-library`
