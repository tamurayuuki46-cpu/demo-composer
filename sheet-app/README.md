# 作曲シート全集 v0.5-dev

GitHubの `claude/sheet-markdown-export` Branchに保存された原文31シート（目次を含め32 Markdown）を全文収録しています。
参照元commit: `c43d2484afd3932c68a2a942afc07e2582fa9efc`。`docs/sheet/`に原文を保持します。

- 制作ガイド、記入用、テーマ・場面・心情、キー、アイデア帳16分野、参考アーティスト、ジャンル、理論、構成、いい曲チェック、DAW工程、所有プラグインなど
- 制作ガイド／アイデア帳のタブ移動、313箇所の記入欄、327チェック、山谷選択、ページメモ
- 端末内の曲別自動保存・曲切替・新規作成。新しい曲は過去の曲を削除しません
- JSON保存は未記入でも可能。Demo Composerへ進むときだけ場面・参考曲1曲が必要です
- `SongProject v1`の既存 `compatibility.compositionSheet.fullWorkbook` に全記入を保持し、他アプリ領域を変更しません
- 記入用の仮タイトル・場面・参考曲1は受け渡しフォームへ連動します
- 端末間の移動・バックアップは「全シートのJSONを保存」。ブラウザ保存領域の削除前にも保存してください

## 入口
`sheet-app/` → `latest/composition_sheet_latest.html` → `versions/v0.5/composition_sheet_v0.5.html`
過去のversions/v0.1・v0.2・v0.3は保持します。

## 検証
```sh
node scripts/composition-sheet-full-smoke-test.mjs
node scripts/song-project-sheet-roundtrip-smoke-test.mjs
npm run build
# distを8080でHTTP配信し、Playwrightを用意して実行
node scripts/composition-sheet-full-browser.test.cjs
```

復元点: `restore/develop-before-sheet-full-v0.4-20261014`。Android実機は未確認、stable tagなし。
