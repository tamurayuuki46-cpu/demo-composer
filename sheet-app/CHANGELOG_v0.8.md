# 作曲シート v0.8-dev CHANGELOG

Version: v0.8-dev
更新日: 2026-10-14

【追加】
- 各シートに「自分のアイデアを追加」を追加。
- 見出し（任意）とアイデア本文を手動入力可能化。
- 手動アイデアの編集・削除に対応。
- 「このシート」と「全シートのアイデア」を切り替えて確認可能化。
- 全シート表示からアイデアの登録先シートへ移動できる導線を追加。
- 手動アイデア用の純粋データモデルテストとChromium回帰テストを追加。

【変更】
- 最新版リンクをv0.7からv0.8へ更新。
- SongProject v1の既存互換領域`compatibility.compositionSheet.fullWorkbook.customIdeas`へ手動アイデアを保存。
- JSONバックアップ / Drive共有 / Demo Composer受け渡しに手動アイデアを含める。
- v0.7のThe Cardigans / The Weekndベース参考アイデアをv0.8でも維持。

【修正】
- なし。

【互換性】
- SongProject `schemaVersion: 1`を維持。
- 既存31シート、セル、チェック、ページメモ、複数曲保存を維持。
- v0.1〜v0.7は変更・上書きしない。
- customIdeasがない旧JSONは空配列として読み込み可能。

【復元ポイント】
- `restore/develop-before-sheet-manual-ideas-v0.8-20261014`

【未対応】
- Android実機でのタッチ操作確認。
- main公開候補への昇格。
- stable tag作成（実機確認後のみ）。
