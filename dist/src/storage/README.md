# Storage Module

StorageはProject Dataの永続化・Backup・Migrationを担当する。

## Implemented in v0.1-dev

`indexeddb-storage.js`

- IndexedDB database: `demo-composer`
- `projects` storeへProject Snapshotを保存
- `meta` storeへactiveProjectIdを保存
- Active Projectの読込
- Save Now時に利用可能なら `navigator.storage.persist()` を要求

`autosave.js`

- Project State変更を購読
- 変更後1.5秒操作がなければIndexedDBへ保存
- 連続変更時はタイマーを更新し、最新Snapshotを保存
- 書き込み中に次の変更が来た場合は最新SnapshotをQueueして順次保存
- `visibilitychange`でアプリがhiddenになる時は即時保存
- AutoSave失敗時はUIへエラー通知可能

手動Backup:

- Hub Exportから`project.json`をダウンロード可能
- IndexedDBの端末内Saveとは別の復元用ファイルとして扱う

## Boundary

`src/core/project-state.js` は保存方式を知らない。

Storage ModuleはProject StoreからSnapshotを受け取り保存し、起動時は保存済みProjectを返す。

AutoSaveはProject Storeの`subscribe()`を利用し、Stateやrevisionを変更しない。

`project.json` DownloadはExport UIから現在のProject Snapshotをシリアライズする。

## Not Yet Implemented

- Snapshot履歴
- project.json Import
- Migration
- Backup reminder
