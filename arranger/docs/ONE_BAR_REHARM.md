# 1小節スケッチのリハーモナイズ

Version: v0.9-dev
更新日: 2026-10-14

## 目的

Demo Composerなどから、コードをまだ付けていない主旋律1小節だけのSongProject v1をArrangement Labへ渡した場合でも、すぐに和声を付けてリハーモナイズを試せるようにする。

## 動作

- 対象は **コード0件・主旋律あり・長さ1小節以内** のSongProject v1だけ。
- SongProject→Arrangement Lab入力変換時に、Keyと主旋律の構成音から2つの仮コードを生成する。
- 仮コードは前半2拍 / 後半2拍を基本とする。
- 生成した仮コードを元に、既存のリハモ3案「自然 / 色付け / 大胆」をそのまま利用する。
- 試聴、採用、Harmony MIDI、Arrangement Planへの記録は既存経路を使う。

## 安全性と互換性

- 元のSongProject v1 `composition.chords` は変更しない。
- 仮コードはArrangement Labへ渡す一時入力だけに追加する。
- 既にコードがある1小節は上書きしない。
- 2小節以上では自動コード生成を行わない。
- SongProject v1、Demo Project Schema 3、Arrangement Plan Schema 4は変更しない。

## 初心者フロー

1. 1小節の主旋律を作る。
2. Arrangement Labへ渡す。
3. 「1小節スケッチ（仮コード付き）」として読み込まれる。
4. A/B/Cの編曲案を試す。
5. Section調整の「リハモ → 3案を提案」を押す。
6. 「自然 / 色付け / 大胆」を比較して採用する。

## 回帰テスト

- Unit: `arranger/tests/song-project-quick-sketch.test.mjs`
- Mobile Chromium: `arranger/tests/onebar-reharm-browser.test.cjs`
- 360 / 390 / 430pxで、コード0件SongProject読込からリハモ採用まで確認する。
