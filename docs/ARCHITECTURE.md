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
- Hub責務のmetadata / basic更新
- 更新ごとのrevision増加

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

現時点では永続化しない。IndexedDB Saveは次工程で `src/storage/` に追加し、Project Stateと保存方式を分離する。

## Module Ownership

- Hub: metadata / basic
- Chord: chords
- Melody: melody notes
- Rhythm: bass / drums
- Arrange: structure / counterMelody
- Sound: instruments

同じデータを複数Moduleが直接書き換えない。

## Playback

Demo Playerは共通UIとして画面下部に常設予定。

## Export

MIDI出力は `src/midi/` に集約。

将来的に:

- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- CounterMelody.mid
