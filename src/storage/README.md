# Storage Module

StorageはProject Dataの永続化・Backup・Migrationを担当する。

## Implemented in v0.1-dev

`indexeddb-storage.js`

- IndexedDB database: `demo-composer`
- `projects` storeへProject Snapshotを保存
- `meta` storeへactiveProjectIdを保存
- Active Projectの読込
- Save時に利用可能なら `navigator.storage.persist()` を要求

手動Backup:

- Hub Exportから`project.json`をダウンロード可能
- IndexedDBの端末内Saveとは別の復元用ファイルとして扱う

## Boundary

`src/core/project-state.js` は保存方式を知らない。

Storage ModuleはProject StoreからSnapshotを受け取り保存し、起動時は保存済みProjectを返す。

`project.json` DownloadはExport UIから現在のProject Snapshotをシリアライズする。

## Not Yet Implemented

- Autosave
- Snapshot履歴
- project.json Import
- Migration
- Backup reminder
