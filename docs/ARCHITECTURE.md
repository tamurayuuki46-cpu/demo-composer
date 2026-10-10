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
