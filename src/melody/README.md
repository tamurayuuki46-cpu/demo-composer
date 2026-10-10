# Melody Module

Melody ModuleはMain MelodyのNote Dataと将来のMelody Analyzerを担当する。

## v0.1-dev implemented

- スマホ向け簡易Piano Roll
- 1小節 = 8分音符8 step
- 画面には4 stepずつ表示し、Beat 1–2 / Beat 3–4を切替
- 1オクターブずつ表示し、Oct − / Oct +で移動
- Bar単位で前後移動
- ChordがあるBarでは現在Chord名 + Degreeを表示
- セルTapでNote ON/OFF
- 同じstepはMonophonic。別PitchをTapすると置換
- Clear Bar
- MIDI Note形式で`tracks[role=melody].notes[]`へ保存

## v0.1 Note Grid

PPQ 480 / 4/4固定。

- 1 Bar = 1920 tick
- 1 Step = 240 tick
- Note duration = 240 tick
- Default velocity = 96

## Mobile UX

16個の細いstepを横並びにせず、4 stepずつ表示する。

目的はPC Piano Rollの縮小ではなく、Androidスマホでタップしやすい入力UIにすること。

## Later

- 16分音符
- Note Length編集
- Velocity編集
- コードトーン強調
- Scale表示
- Melody Analyzer
- Melody候補3案
- 音符試聴
