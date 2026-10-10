# Melody Module

Melody ModuleはMain MelodyのNote Dataと将来のMelody Analyzerを担当する。

## v0.1-dev implemented

- スマホ向け簡易Piano Roll
- 左端に白鍵 / 黒鍵を区別した縦ピアノKeyboard
- 1小節 = 8分音符8 step
- `1 & 2 & 3 & 4 &` の8 stepを1画面に同時表示
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
- 8 Step = `1 & 2 & 3 & 4 &`
- Note duration = 240 tick
- Default velocity = 96

## Mobile UX

Beat 1–2 / Beat 3–4のページ切替は使わず、1小節8 stepを同時表示する。

Android狭幅では、縦ピアノの幅・カード余白・Grid Gapを縮めて横スクロールを避ける。Beat頭は視覚的に区切り、1小節全体のメロディ形状を一目で確認できることを優先する。

縦ピアノ自体はv0.1では表示専用で、Note入力はGrid cell Tapで行う。

目的はPC Piano Rollの縮小ではなく、Androidスマホで曲の流れを把握しながら入力できるUIにすること。

## Later

- 16分音符
- Note Length編集
- Velocity編集
- コードトーン強調
- Scale表示
- Melody Analyzer
- Melody候補3案
- 音符試聴
