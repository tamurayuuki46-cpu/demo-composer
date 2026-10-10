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
  - Chord Preset: Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行
  - Presetを現在Key / Scaleへ自動変換し、適用後に手動修正
- Rhythm Drum Preset
  - 8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH
  - Preset適用後に16 stepを手動修正
- Sound Sketch Lite（v0.4から最小機能のみ先行）
  - Chord / Melody / Bassの仮音色Preset
  - Natural / Bright / Soft / Warm / Dark / Airy / Aggressive のToneタグ
  - Demo Playerのみ音色変更、MIDI Noteは変更しない
- Chord Tone表示
- Melody Analyzer
- Bass候補生成の設計 / 試作

Chord Tone表示は、Chord Quality拡張・Chord Preset・Rhythm Preset・Sound Sketch LiteのAndroid実機確認後に仕様案を1枚作り、Melody Gridのどの音をどう強調するかを確認してから実装する。

## v0.3

- Arrange
- Song Structure
- Melody候補生成の設計 / 試作

Arrange / Song StructureはProject Dataへ曲構成を追加するため、Schema変更前に復元点とMigration方針を作る。

## v0.4

- Sound Sketch 正式拡張
  - v0.2のSound Sketch Liteを基礎としてPreset分類を整理
  - 必要性が確認できた場合のみDrums等を追加
  - 本格Synth / FX / Mixerは作らない

## v0.5

- Counter Melody

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
