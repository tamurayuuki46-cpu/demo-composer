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

## v0.2 Early Sound Sketch Lite

本来v0.4で予定しているSound Sketchのうち、スマホで「音色の方向性」を決める最小機能だけをv0.2-devへ先行導入する。

対象:

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass
- Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive

目的は最終音色を作ることではなく、「この曲は柔らかいPad系」「MelodyはBrightなLead系」などの方向をDemo段階で決めること。

Sound選択はDemo Playerの軽量Web Audio仮音へ反映し、MIDI Note / Chord Data / Rhythm Dataは変更しない。最終音色はCubasis / Cubase / 各種Plugin側で作り込む。

## v0.2 Chord Backing Pattern

コード進行を決めた後に「どう鳴らすか」までスマホで判断できるよう、Chord画面内へBacking Patternを置く。

初期Pattern:

- Block
- 8分刻み
- Arpeggio
- Syncopation

Backing Patternはコード進行そのものを作り直す機能ではない。既存Chordを使い、伴奏のリズム / 構成音の鳴らし方だけを切り替える。

選択はProjectへ保存し、AutoSave / Undo / Redo対象とする。Demo Playerだけでなく `Chord.mid / Song.mid` のChord Track Note配置へ反映し、Cubasis / Cubaseへ伴奏判断を持ち出せるようにする。

Patternは初期4種類に絞り、本格的な伴奏生成・ギター奏法Editor・細かいボイシングEditorへ拡張しすぎない。

## Non-goals

Demo Composerでは以下を本格実装しない。

- Mixing
- Mastering
- 高度なAudio Editing
- Vocal Editing
- Plugin Hosting
- 本格Synth設計
- PC DAWの完全再現
- Sound Sketch内の詳細Synth Parameter / FX Rack / Track Mixer
- 本格的な伴奏生成DAW / Strumming Editor

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
