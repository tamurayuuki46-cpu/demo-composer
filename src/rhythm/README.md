# Rhythm Module

Rhythm Moduleは `bass` / `drums` Trackを担当する。

## v0.2-dev implemented

- Bass / Kick / Snare / Closed Hi-Hatを同じ画面に表示
- 1 Bar = 16 step（16分音符）
- Bassは現在BarのChord Rootを使用
- Chord未設定時はKey Rootを使用
- Bass / Kickを同時に確認可能
- Bass候補5タイプ: ルート型 / リフ型 / ファンク型 / シンセウェーブ型 / 裏メロ型
- Kick / Snare / HHはGM準拠Noteを使用
- Tapでstep ON/OFF
- Drumは同一stepに複数パートを置ける
- Clear Bar
- Clear Bass（全Bass消去）
- Rhythm Beat Copy / Bar Copy
- Drum Preset 6種類

## v0.2 Bass Candidates

Bass候補は完成したベースラインを自動作曲する機能ではなく、作曲判断の方向性を5タイプで聴き比べるための叩き台とする。

- ルート型: 音数を減らし、コードの土台を明確にする
- リフ型: 短い反復と空白で、Bass自体をフックとして使う
- ファンク型: Kick位置を基準にしつつ短い返しを入れ、シンコペーションを作る。Kickが無い場合は既定のリズム叩き台を使う
- シンセウェーブ型: 8分音符の一定駆動とオクターブで前進感を作る
- 裏メロ型: コードトーンを使ってBassにも小さな旋律を持たせる

候補は現在Barだけを置き換える。適用結果は通常のBass Noteなので、16 stepで1音ずつ修正でき、Undo / AutoSave / Demo Player / MIDI Exportは既存処理をそのまま使う。候補名や候補IDはProject Dataへ保存しないためSchema変更は不要。

「リフ型」はThe WeekndなどのダークPop / R&Bで見られる、短い低音フレーズを反復してフック化する考え方を参考にする。ただし特定曲のベースラインを再現・コピーする機能にはしない。

## v0.2 Drum Preset

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
- Preset選択状態はProject Dataへ保存せず、結果だけ通常のDrum Note Dataとして保存する

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
- midiChannel: 3

Drums:

- role: `drums`
- midiChannel: 10
- kick: 36
- snare: 38
- closedHH: 42

## Harmony Safety

Bass入力後にChordだけ変更するとRootが食い違うため、Bass Noteがある間はChord変更を拒否する。

Chordを変更するときはRhythm画面の `Clear Bass` を使う。

## Later

- Bass候補のVariation Set / Refresh（必要性を実制作テストで確認してから）
- Open HH / Percussion / Tom
- Velocity編集
