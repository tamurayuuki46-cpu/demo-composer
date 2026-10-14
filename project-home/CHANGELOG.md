# Music Project Home CHANGELOG

Version: v0.17-dev
更新日: 2026-10-15

【追加】
- 作曲シート最新版をHome内へ埋め込み表示。
- `sheet-app/latest/manifest.json`から現在の作曲シートVersionを表示。
- Homeの作曲シートカードからcanonical `../sheet-app/`を開く導線を追加。

【変更】
- 作曲シート導線を外部サイトのv0.5固定URLからRepository内のcanonical latest routeへ変更。
- 「次にやること：作曲シート」もVersion付きURLではなく`../sheet-app/`へ統一。
- 制作フロー先頭の作曲シートを「常に最新版」と明示。
- JSON受け渡し説明を同一Repository内の最新作曲シート前提へ更新。

【修正】
- Homeだけ旧v0.5作曲シートを参照し続ける不整合を解消。
- 今後作曲シートをv0.10以降へ更新してもHome側コード変更が不要な構成へ変更。

【互換性】
- SongProject v1の境界は変更なし。
- 既存のSongProject読込 / Backup / 旧Claudeリンクを維持。
- Homeの今日/次回メモ保存キーを維持。

【復元ポイント】
- `restore/develop-before-sheet-beginner-latest-home-v0.9-20261015`

【未対応】
- Android実機でのHome内iframe操作と縦画面最終確認。
- Cubasis / Cubase実機引き継ぎ確認。
- stable tag（実機確認後のみ）。
