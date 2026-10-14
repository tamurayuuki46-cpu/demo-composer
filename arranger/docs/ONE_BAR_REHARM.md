# 1小節スケッチのリハーモナイズ

Version: v0.10-dev
更新日: 2026-10-14

## 目的

Demo Composerなどから1小節だけ作った段階でもArrangement Labを使えるようにする。**1小節のコードだけ**でも、**コード未設定の主旋律1小節だけ**でも、A/B/C比較とリハーモナイズへ進める。

## 動作

### 1小節のコードがある場合

- 既存コードをそのままArrangement Lab入力として使用する。
- A/B/Cの編曲案を生成できる。
- Section調整から既存のリハモ3案「自然 / 色付け / 大胆」を利用できる。
- Demo Composer handoffでは、A/B/C候補が3案生成され試聴可能になるまで「反映済み」にしない。

### コード0件・主旋律1小節だけの場合

- 対象は **コード0件・主旋律あり・長さ1小節以内** のSongProject v1。
- SongProject→Arrangement Lab入力変換時に、Keyと主旋律の構成音から2つの仮コードを生成する。
- 仮コードは前半2拍 / 後半2拍を基本とする。
- 生成した仮コードを元に、既存のリハモ3案「自然 / 色付け / 大胆」を利用する。

## 安全性と互換性

- 元のSongProject v1 `composition.chords` は変更しない。
- メロディだけの場合の仮コードはArrangement Labへ渡す一時入力だけに追加する。
- 既にコードがある1小節は上書きしない。
- 2小節以上では自動コード生成を行わない。
- SongProject v1、Demo Project Schema 3、Arrangement Plan Schema 4は変更しない。

## 初心者フロー

1. Demo Composerで1小節のコード、または1小節のメロディを作る。
2. Arrangement Labへ渡す。
3. 「反映中…」の間は待ち、A/B/C準備完了後に「反映済み」になる。
4. ②でA/B/Cの編曲案を聴く。必要なら「A/B/Cを作り直す」を押す。
5. ④Section調整の「リハモ → 3案を提案」を押す。
6. 「自然 / 色付け / 大胆」を比較して採用する。

## エラー表示

初心者モードのエラー / 成功トーストは、固定下部ナビより上に表示する。赤い枠だけが見えて本文が隠れる状態を避ける。

## 回帰テスト

- Unit: `arranger/tests/song-project-quick-sketch.test.mjs`
- Mobile Chromium: `arranger/tests/onebar-reharm-browser.test.cjs`
- 360 / 390 / 430pxで以下を確認する。
  - コード0件・主旋律1小節 → 仮コード → A/B/C → リハモ3案 → 採用
  - コード1小節だけ → Demo Composer handoff → A/B/C準備完了 → A/B/C再生成 → リハモ3案 → 採用
  - 赤いエラートーストが出ないこと
  - 横スクロールが発生しないこと
  - Console / page errorがないこと
