# 作曲シート CHANGELOG v0.9.1

Version: v0.9.1-dev
更新日: 2026-10-15

【追加】
- Home埋め込み用の`embed=1`表示を追加。

【変更】
- 起動時は前回の表示モードに関係なく、必ず「かんたん入力」から開始。
- 31シート詳細はページ内で明示的に切り替えた時だけ表示。

【修正】
- Music Project Homeの内側に「📦 曲データ」が重複表示される問題を修正。

【互換性】
- v0.9本体は上書きせず保持。
- SongProject v1、31シート、保存、Drive共有、手動アイデアはv0.9と互換。

【復元ポイント】
- `backup/sheet-home-before-inner-songdata-beginner-fix-20261015`
