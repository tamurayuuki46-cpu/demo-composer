# 作曲シート v0.8-dev CHANGELOG

Version: v0.8-dev
更新日: 2026-10-15

【追加】
- 各シートに「自分のアイデアを追加」を追加。
- 見出し（任意）とアイデア本文を手動入力可能化。
- 手動アイデアの編集・削除に対応。
- 「このシート」と「全シートのアイデア」を切り替えて確認可能化。
- 全シート表示からアイデアの登録先シートへ移動できる導線を追加。
- 手動アイデア用の純粋データモデルテストとChromium回帰テストを追加。

【変更】
- 公開版（main / GitHub Pages）をv0.7からv0.8へ更新する公開候補を作成。
- 最新版リンクをv0.7からv0.8へ更新。
- SongProject v1の既存互換領域`compatibility.compositionSheet.fullWorkbook.customIdeas`へ手動アイデアを保存。
- JSONバックアップ / Drive共有 / Demo Composer受け渡しに手動アイデアを含める。
- v0.7のThe Cardigans / The Weekndベース参考アイデアをv0.8でも維持。
- developとmainの大きな分岐を避けるため、main基点のrelease branchへ作曲シートv0.8関連のみを移植。
- v0.8が参照するv0.4シートデータ/描画モデルとv0.6基礎CSSを、既存公開v0.7と同一内容のblobで補完。

【修正】
- 旧CIがlatestをv0.6固定で期待していたため、最新版v0.8を検証するよう更新。
- v0.7で追記済みのベース資料をv0.4原文と完全一致で比較していた回帰テストを、原文保持＋追記保持を確認する検証へ修正。
- Chromium回帰で折りたたみ状態のDemo Composer受け渡し欄へ入力しようとしていたテスト操作順を修正。
- 公開mainの履歴構成に合わせ、v0.8の実行時依存ファイルと公開用CIを明示的に検証するよう修正。
- Chromium回帰の曲復元を表示名ではなくProject IDで選択し、画面幅ごとの再現性を改善。

【互換性】
- SongProject `schemaVersion: 1`を維持。
- 既存31シート、セル、チェック、ページメモ、複数曲保存を維持。
- v0.1〜v0.7は変更・上書きしない。
- customIdeasがない旧JSONは空配列として読み込み可能。

【復元ポイント】
- `restore/develop-before-sheet-manual-ideas-v0.8-20261014`
- `restore/main-before-sheet-v0.8-20261015`

【未対応】
- Android実機でのタッチ操作確認。
- stable tag作成（Android実機＋必要なCubasis/Cubase実機確認後のみ）。
