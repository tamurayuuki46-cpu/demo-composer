# 作曲シート全集

現在の最新版: **v0.9.1-dev**

Canonical入口: `sheet-app/`

内部導線:
`sheet-app/index.html` → `latest/composition_sheet_latest.html` → 現在の最新版

最新版情報:
`sheet-app/latest/manifest.json`

Music Project HomeはVersion付きURLを直接参照せず、このCanonical入口とmanifestだけを参照します。そのため次回v0.10以降へ更新しても、Home側のVersion固定コードを変更する必要はありません。

## v0.9.1 の初心者導線

初期表示は**かんたん入力**です。

まず決める必須項目は2つだけです。

1. 場面・気持ち
2. 参考曲1曲

以下は分からなければ空欄で進めます。

- 曲名
- BPM
- Key
- ジャンル
- 気分・雰囲気
- 歌もの / インスト
- 自由メモ

「もっと詳しく決める」または「31シート詳細」で、従来の31シート全集へ切り替えられます。詳細機能を削除せず、初心者が最初から全項目を判断しなくてよい段階式UIにしています。

## 継続して使える機能

- 原文31シートをタブで移動
- 各表の記入欄 / チェック / シートごとのメモ
- 各シートへ手動アイデアを追加 / 編集 / 削除
- 「このシート / 全シートのアイデア」切替
- 曲ごとに端末へ自動保存
- 複数曲の切替
- SongProject v1 JSON保存 / 読込
- Android共有画面からGoogle Driveへ保存
- Demo ComposerへのSongProject受け渡し
- 右上「📦 曲データ」共通メニュー

## データ互換性

SongProject v1 (`schemaVersion: 1`)を維持します。

既存localStorage key:
`composition-sheet-full-library-v0.4`

手動アイデア:
`compatibility.compositionSheet.fullWorkbook.customIdeas`

v0.1〜v0.8は`versions/`に残し、削除・上書きしません。

## 保存とバックアップ

普段の記入内容は端末のlocalStorageへ自動保存されます。別端末へ移る前や大きな変更前は「端末へJSONを保存」でSongProject JSONをバックアップしてください。v0.9.1のJSONバックアップ名には`composition_sheet_v0.9.1`を含めます。

## 開発・検証

`npm run test:project-home`からv0.9.1初心者導線とHomeのcanonical latest契約も回帰確認します。

確認対象:
- 初心者モードが標準表示
- 必須2項目とBPM/Key任意表示
- 31シート詳細モードの保持
- SongProject v1 / localStorage互換
- latest manifest / latest redirect
- Music Project HomeがVersion付きURLを固定参照しないこと
- v0.9.1 JavaScript構文
- Production build / 既存CI
