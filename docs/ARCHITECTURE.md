# ARCHITECTURE

## Principle

依存方向は `core ← module` を基本とする。

Module同士は直接呼び合わない。

## Modules

- Hub
- Chord
- Melody
- Rhythm
- Arrange
- Sound

v0.1では Hub / Chord / Melody / Rhythm を優先。

## Core Responsibilities

`src/core/`

- project state
- event bus
- validation
- shared utilities

### Project State

`src/core/project-state.js` が、Demo Composer内の共通Project Dataをメモリ上で管理する。

v0.1-dev時点では以下を実装済み。

- DATA_SCHEMA.mdのschemaVersion 1に沿ったDefault Project生成
- Project全体のValidation
- Snapshot取得
- State変更通知（subscribe）
- 責任Module別の更新API
- 更新ごとのrevision増加

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

## Storage

`src/storage/indexeddb-storage.js` がブラウザ保存を担当する。

Project Stateと保存方式は分離し、coreはIndexedDBへ直接依存しない。

v0.1-devのStorage実装:

- IndexedDB database: `demo-composer`
- `projects` storeへProject Snapshotを保存
- `meta` storeへactiveProjectIdを保存
- 起動時にActive Projectを読み込む
- HubのSaveから手動保存
- Save時に `navigator.storage.persist()` が利用可能なら永続ストレージ保護を要求

現時点ではAutosave / Snapshot履歴 / Migration / project.json Backupは未実装。

保存済みProjectが読み込めない、または現在のSchema Validationに通らない場合は、新規Default Projectへフォールバックする。

## Module Ownership

- Hub: metadata / basic
- Chord: chords
- Melody: melody notes
- Rhythm: bass / drums
- Arrange: structure / counterMelody
- Sound: instruments

同じデータを複数Moduleが直接書き換えない。

## Playback

Demo Playerは共通UIとして画面下部、Module Navigationの上に常設する。

実装:

- `src/audio/demo-player.js`
- Web Audio API
- Play / Stop / Loop / Position
- Play時点のProject Snapshotを読み取り専用で再生
- Project Stateを書き換えない

Chord / Melody / Bass / Drumsを軽量な仮音で再生する。

Playbackは作曲判断の確認用途だけを担当し、高度なSynth / Mixing / Mastering機能は持たない。

## Export

MIDI出力は `src/midi/` に集約。

将来的に:

- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- CounterMelody.mid
