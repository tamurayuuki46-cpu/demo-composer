# Rhythm Module

Rhythm Moduleは `bass` / `drums` Trackを担当する。

## v0.1-dev implemented

- Bass / Kick / Snare / Closed Hi-Hatを同じ画面に表示
- 1 Bar = 16 step（16分音符）
- スマホでは1 Beat = 4 stepずつ表示
- Beat 1〜4を切替
- Bar前後移動
- Bassは現在ChordのRootを自動採用
- Chord未設定BarではKey Rootを使用
- Kick 36 / Snare 38 / Closed HH 42（GM準拠）
- Tapでstep ON/OFF
- Bassは同一stepに1音のMonophonic方式
- Drumは同一stepに複数パートを置ける
- Clear Bar
- Clear Bass（全Bass消去）

## v0.1 Timing

PPQ 480 / 4/4固定。

- 1 Bar = 1920 tick
- 1 Beat = 480 tick
- 1 Step = 120 tick
- Bass default velocity = 96
- Drum default velocity = 100

## Track

Bass:
- role: `bass`
- MIDI Channel: 3

Drums:
- role: `drums`
- MIDI Channel: 10
- drumMap: kick 36 / snare 38 / closedHH 42

## Harmony Safety

Bass入力後にChordだけ変更するとRootが食い違うため、v0.1ではBass Noteがある間はChord変更を拒否する。

Chordを変更するときはRhythm画面の `Clear Bass` を使う。

## Later

- Bass Pitch手動編集
- Root / 5th / ApproachなどBass候補
- Kick連動Bass候補
- Open HH / Percussion / Tom
- Velocity編集
- Pattern Copy
- Rhythm候補3案
