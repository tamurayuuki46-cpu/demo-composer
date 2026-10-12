# ROADMAP

## v0.1

Core implementation completed on `develop` and Android回帰確認を一部実施。

Implemented:

- Hub
- Chord
- Melody
- Rhythm
- IndexedDB Save / AutoSave
- Demo Player
- MIDI Export
- project.json Backup Export
- Melody 8分 / 16分入力切替
- GitHub Pages Fallback

`main` へのstable統合は未実施。v0.1の復元点は残し、v0.2開発からも戻せる状態を維持する。

## v0.2

Current focus:

- Chord支援
  - 基準音ごとのQuality拡張: Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
  - Schema v1 → v2 Migration
  - Chord QualityのDemo Player / MIDI対応
  - Chord Preset: 100種類（7カテゴリ。既存6種 Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行を含む）
  - Presetを現在Key / Scaleへ自動変換し、適用後に手動修正
  - Backing Pattern: Block / 8分刻み / Arpeggio / Syncopation
  - Backing PatternをDemo PlayerとChord.mid / Song.midへ反映
- Rhythm
  - Drum Preset: 8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH
  - Bass音程選択 / 半音ずらし / 音の長さ
  - Bass候補3案
- Melody
  - 8分 / 16分入力
  - 音の長さ指定
  - Chord Tone強調 / 度数表示
  - Melody Analyzer
  - Copy Bar / Copy 2小節
  - Melody候補3案: 安定 / キャッチー / 浮遊感（現在Barへ適用後、通常Noteとして修正）
- Undo / Redo
- project.json Import
- Demo Player パート聴き分け（Mute / Solo）
- Hub AI相談用テキストコピー / Cubaseでやることメモ
- Arrange Section（v0.3予定から基本構成だけ先行）
  - 構成Template / 小節増減 / Sectionコピー / Section再生 / MIDI Marker
- Sound Sketch Lite（v0.4予定から最小機能だけ先行）
  - Chord / Melody / Bassの仮音色Preset
  - Natural / Bright / Soft / Warm / Dark / Airy / Aggressive のToneタグ
  - Demo Playerのみ音色変更、MIDI Noteは変更しない
- Section Energyの仕様検討

Backing Patternは曲の骨子を決める最小4Presetに留める。詳細なPattern Sequencer / DAW級Arpeggiatorは追加せず、必要な細部はCubasis / Cubaseへ渡す。

Melody候補も曲全体を自動完成させず、現在Barの3候補 → 選択 → Piano Rollで修正、という学習可能な流れを維持する。

## v0.3

実装済み（2026-10-12）: 設計メモ / 5軸 / A/B比較 / 1要素候補 / Section役割 / メロディ分析タグ / コード目的 / 未決定項目 / 採用理由。Schema 3・旧Project退避Migration。詳細 DECISION_SUPPORT.md。実機の制作検証は継続。

- Arrange / Song Structureの正式整理
  - v0.2で先行したSection機能を実制作で検証・改善
- Section Energy（Low / Mid / High）の検討
- Melody候補の実制作検証と必要最小限の改善
- 骨子作り支援（計画: `docs/V0_3_SKELETON_PLAN.md`。優先度A + B は実装済み）
  - 第1段階: 骨子レシピ（感情の言葉 + Section構成 / Energy / つなぎ。感情曲線・Section Energy・Transitionを再利用。Schema変更なし）
  - 第2段階: 骨子チェックの「今は後でOK」表示、手引きの文言追加、「なぜ？」表示の統一、空白Sectionアシスト（レシピとセット）
  - 第3段階: 曲の方針（曲の芯 + 聴かせたいもの + 3語コンセプト）。保存する場合はSchema・Migration方針・復元ポイントが先
  - 新しい独立機能は増やさず、既存のHub / Chord / Melody / Rhythm / Arrange / Soundを一本の流れにつなぐ

## v0.4

- Sound Sketch 正式拡張
  - v0.2のSound Sketch Liteを基礎としてPreset分類を整理
  - 必要性が確認できた場合のみDrums等を追加
  - 本格Synth / FX / Mixerは作らない

## v0.5

- Counter Melody（v0.2-devで基本版を実装済み。候補3種 / Sectionごと）

## v0.6

- Cubasis / BandLab / Cubase連携強化
- MIDI/WAV Export改善

## v0.7

- AI相談支援

## v0.8

- Android UI最適化

## v0.9

- 実制作テスト

## v1.0

- 正式版

## Generation Policy

生成機能は「3候補 → 選択 → 修正」を基本とし、完全自動完成を目標にしない。
