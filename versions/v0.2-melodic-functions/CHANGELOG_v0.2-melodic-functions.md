# CHANGELOG — v0.2 Melodic Function Guide

Version: v0.2-dev
更新日: 2026-10-11

## 追加
- Melody Analyzerに `メロディの働き` を追加。
- 和声での役割を `Guide / Chord / Tension / Other` で表示。Guide Toneは3rd / 7th系のChord Tone内数、Tensionは初期版では9th / 11th / 13th相当として扱う。
- 経過音 / 刺繍音 / Approach / 倚音 / 逸音 / 先取音 / 係留音候補を、前後関係が明確な場合だけ保守的なルールで派生分析。
- モチーフ / リック / リフ / シーケンスの違いを学習ガイドとして表示。リック / リフは文脈依存のため自動判定しない。
- `docs/MELODY_FUNCTIONS.md` に判定基準・制約・データ方針を記録。
- Melody Analysis Smoke Testへ代表パターンを追加。

## 変更
- `src/core/melody-analysis.js` から新しい `src/core/melodic-functions.js` を呼び出し、既存Melody Analyzerの行レンダリングへ統合。
- 分析はProject Dataを読み取って毎回派生計算し、保存しない。

## 修正
- なし。

## 未対応 / 制約
- 係留音は「保持 → 不協和 → 解決」全体を断定せず、v0.2では保持関係が明確な場合の `係留音候補` とする。
- 複雑な和声文脈・装飾音・フレーズ境界・ジャンル語彙までは自動判定しない。
- リック / リフは自動判定しない。
- Android実機での表示量・読みやすさ・代表例の確認は継続課題。

## Data / Compatibility
- schemaVersion: 2 のまま
- Migration: なし
- MIDI形式変更: なし
- Melody Note Data変更: なし
- Melody候補生成変更: なし
- AutoSave / Undo / Redo変更: なし

## Backup / Integration
- 追加前復元点: `restore/v0.2-before-melodic-functions`
- 統合PR: #97
- develop merge commit: `30edc7f2c48ca2c51a3fe5d801c73f6aa91d57ed`
- 旧PR #94はdevelopの並行更新と競合したため、最新developから作り直したPR #97で置き換えた。
