# Rhythm Module

Rhythm Moduleは `bass` / `drums` Trackを担当する。

## implemented

- Bass / Kick / Snare / Closed Hi-Hatを同じ画面に表示
- 1 Bar = 16 step（16分音符）
- 1 Barの16 stepを `1 e & a / 2 e & a / 3 e & a / 4 e & a` として同時表示
- Beat 1〜4ボタンでCopy Beatのコピー元Beatを選択（セルTapでもそのBeatを選択）
- Bar前後移動
- Bassは現在ChordのRootを自動採用
- Chord未設定BarではKey Rootを使用
- Kick 36 / Snare 38 / Closed HH 42（GM準拠）
- Tapでstep ON/OFF
- Bassは同一stepに1音のMonophonic方式
- Drumは同一stepに複数パートを置ける
- Clear Bar
- Clear Bass（全Bass消去）
- Rhythm Beat Copy / Bar Copy

## v0.2 Drum Preset candidate

スマホでリズムの叩き台をすぐ作り、その後16 stepを手動修正できるようにする。

初期Preset:

- 8ビート 基本
- 4つ打ち
- Pop
- Rock
- Half Time
- 16分HH

動作:

- `Drum Preset` のselectでパターンを選ぶ
- `適用` で現在BarのKick / Snare / Closed HHだけを置き換える
- Bassは変更しない
- 他BarのDrum Noteは変更しない
- 将来追加されるOpen HH / Percussion等のPitchも勝手に消さない
- 現在BarにKick / Snare / HHがある場合は上書き確認を出す
- 適用後は通常の16 stepセルをTapして自由に修正できる

Presetは完成形を自動生成する機能ではなく、作曲判断の出発点として使う。

## Timing

PPQ 480 / 4/4固定。

- 1 Bar = 1920 tick
- 1 Beat = 480 tick
- 1 Step = 120 tick
- Bass default velocity = 96
- Drum manual input default velocity = 100
- PresetはKick 105 / Snare 100 / HH 88を基本値とする

## Track

Bass:
- role: `bass`
- MIDI Channel: 3

Drums:
- role: `drums`
- MIDI Channel: 10
- drumMap: kick 36 / snare 38 / closedHH 42

## Harmony Safety

Bass入力後にChordだけ変更するとRootが食い違うため、Bass Noteがある間はChord変更を拒否する。

Chordを変更するときはRhythm画面の `Clear Bass` を使う。

## Later

- Bass Pitch手動編集
- Root / 5th / ApproachなどBass候補
- Kick連動Bass候補
- Open HH / Percussion / Tom
- Velocity編集
- Rhythm候補3案
