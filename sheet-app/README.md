# 作曲シート全集

現在の最新版: **v0.8-dev**

入口: `sheet-app/index.html` → `latest/composition_sheet_latest.html` → `versions/v0.8/composition_sheet_v0.8.html`

## v0.8 の主な機能

- 原文31シートをタブで移動
- 各表の記入欄 / チェック / シートごとのメモ
- **各シートへ手動アイデアを追加**
  - 見出し + 本文
  - 編集 / 削除
  - 「このシート」 / 「全シートのアイデア」切替
  - 全シート表示から元シートへ移動
- 曲ごとに端末へ自動保存
- 複数曲の切替
- SongProject v1 JSON保存 / 読込
- Android共有画面からGoogle Driveへ保存
- Demo ComposerへのSongProject受け渡し
- 右上「📦 曲データ」共通メニュー

## 手動アイデアの保存場所

手動アイデアはSongProject v1の既存互換領域

`compatibility.compositionSheet.fullWorkbook.customIdeas`

へ保存します。SongProjectの`schemaVersion`は1のままで、既存の31シート記入内容・作曲データ・編曲データを壊しません。

旧v0.1〜v0.7は`versions/`に残し、上書きしません。

## 保存とバックアップ

普段の記入内容と手動アイデアは端末のlocalStorageへ自動保存されます。別端末へ移る前や大きな変更前は「端末へJSONを保存」でSongProject JSONをバックアップしてください。

## 開発・検証

Composition Sheet CIでは、静的smoke、SongProject round-trip、Production build、Chromium 360 / 390 / 430 / desktop幅での主要導線を確認します。v0.8では手動アイデアの追加・再読込・編集・複数シート・JSON・曲切替・Demo Composer受け渡しも回帰対象です。
