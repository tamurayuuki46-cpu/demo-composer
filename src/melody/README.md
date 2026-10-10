# Melody Module

Melody ModuleはMain MelodyのNote DataとMelody Analyzerを担当する。

## v0.1-dev implemented

- スマホ向け簡易Piano Roll
- 左端に白鍵 / 黒鍵を区別した縦ピアノKeyboard
- 1小節 = 8分音符8 step
- `1 & 2 & 3 & 4 &` の8 stepを1画面に同時表示
- `8分音符` / `16分音符` の入力単位を切替（16分は `1 e & a 2 e & a` / `3 e & a 4 e & a` を前半 / 後半で切替表示）
- 1オクターブずつ表示し、Oct − / Oct +で移動
- Bar単位で前後移動
- ChordがあるBarでは現在Chord名 + Degreeを表示
- セルTapでNote ON/OFF
- 同じstepはMonophonic。別PitchをTapすると置換
- Clear Bar
- MIDI Note形式で`tracks[role=melody].notes[]`へ保存

## v0.2-dev implemented

- Note Length編集
- Chord Tone強調
- 度数表示
- Copy Bar / Copy 2小節
- Melody候補3案（安定 / キャッチー / 浮遊感）と4つのVariation Set
- 山の位置ガイド
- Melody Analyzer
  - 音域
  - Keyからの度数
  - Chordからの度数
  - Scale内率
  - 跳躍
  - コードトーン率
  - リズム密度
  - 同音連打
  - モチーフ反復
  - Sectionごとの比べ
  - 旋律の3つの見方: 歌心・浮遊型（草野マサムネ参考） / 輪郭・違和感型（米津玄師参考） / 推進・高密度型（Ayase / YOASOBI参考）

「旋律の3つの見方」は特定曲のコピーや本人らしさの採点ではなく、既存の分析値を作曲時にどう見るかを整理する参考表示。Project Dataには保存せず、候補生成へ自動反映もしない。

## v0.1 Note Grid

PPQ 480 / 4/4固定。

- 1 Bar = 1920 tick
- 1 Step = 240 tick
- 8 Step = `1 & 2 & 3 & 4 &`
- Note duration = 240 tick（8分入力時）
- 16分入力時は 1 Step = 120 tick / Note duration = 120 tick
- 入力単位はUI状態のみで `project.json` には保存しない。Noteは `startTick` / `durationTick` で保持するためSchema変更なし
- 8分と16分を混在させてもMonophonicを保つ。直前のNoteが新Noteの開始位置にかかる場合は直前のNoteを短くし、新Noteは次のNoteの開始位置を超えない長さにする
- Default velocity = 96

## Mobile UX

Beat 1–2 / Beat 3–4のページ切替は使わず、1小節8 stepを同時表示する。

Android狭幅では、縦ピアノの幅・カード余白・Grid Gapを縮めて横スクロールを避ける。Beat頭は視覚的に区切り、1小節全体のメロディ形状を一目で確認できることを優先する。

縦ピアノ自体はv0.1では表示専用で、Note入力はGrid cell Tapで行う。

目的はPC Piano Rollの縮小ではなく、Androidスマホで曲の流れを把握しながら入力できるUIにすること。

## Later

- Velocity編集
- Scale表示
- 音符試聴
