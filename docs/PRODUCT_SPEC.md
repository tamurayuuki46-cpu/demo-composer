# PRODUCT_SPEC

## Product Name

Demo Composer

## Purpose

PCを起動する前に、Androidスマホで作曲上の主要な判断を済ませるための作曲支援PWA。

## Target User

- 作曲初心者〜初中級者
- J-POP / ボカロ等の制作を学びながら進めたい人
- Androidスマホで外出先やベッド・ソファでも曲の骨格を作りたい人

## Core Flow

Demo Composer
→ Cubasis
→ Cubase
→ 各種プラグイン
→ 本制作

## v0.1 Scope

- Hub
- Chord
- Melody
- Rhythm
- Project Save
- Demo Player
- MIDI Export

初期UIシェルではHub / Chord / Melody / Rhythmのみ可視化。

## Non-goals

Demo Composerでは以下を本格実装しない。

- Mixing
- Mastering
- 高度なAudio Editing
- Vocal Editing
- Plugin Hosting
- 本格Synth設計
- PC DAWの完全再現

## AI Philosophy

AIは完全自動作曲家ではなく、候補提示・学習支援・分析・相談役とする。

基本形:

候補を3つ提示
→ ユーザーが選択
→ ユーザーが修正

## Future Assisted Generation

将来機能として、以下の候補生成を検討する。

- Chord候補
- Bass候補
- Melody候補
- Drum候補
- Counter Melody候補

基本思想は完全自動作曲ではなく、

1. 候補を3つ提示
2. ユーザーが選択
3. 手動修正 / 再生成 / 候補の組み合わせ

とする。

初期実装はAPI不要のルールベース生成を優先し、Key / Scale / Chord / BPM / Kick位置など、既存Project Dataから説明可能な候補を生成する。

例:

- Melody: 安定 / キャッチー / 意外性
- Bass: Root中心 / Kick連動 / 動き多め

生成結果は必ず通常のNoteデータとして編集可能にする。
