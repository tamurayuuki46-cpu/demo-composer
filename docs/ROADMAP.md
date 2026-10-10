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

`main` へのstable統合は未実施。v0.1の復元点は残し、v0.2開発からも戻せる状態を維持する。

## v0.2

Current focus:

- Chord支援
  - 基準音ごとのQuality拡張: Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
  - Schema v1 → v2 Migration
  - Chord QualityのDemo Player / MIDI対応
- Chord Tone表示
- Melody Analyzer
- Bass候補生成の設計 / 試作

Chord Tone表示は、今回のChord Quality拡張が安定した後に仕様案を1枚作り、Melody Gridのどの音をどう強調するかを確認してから実装する。

## v0.3

- Arrange
- Song Structure
- Melody候補生成の設計 / 試作

Arrange / Song StructureはProject Dataへ曲構成を追加するため、Schema変更前に復元点とMigration方針を作る。

## v0.4

- Sound Sketch

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
