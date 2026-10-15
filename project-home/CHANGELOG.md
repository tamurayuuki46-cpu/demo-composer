# Music Project Home CHANGELOG

## Version: v0.19-dev
更新日: 2026-10-15

【追加】
- Home上部へ「創作状態」を追加し、探索中 / 比較中 / 保留・任意をSongProject既存情報から表示。
- 「次にやること」1件だけでなく、最大3件の選択肢を表示する`buildNextOptions()`を追加。
- 「今日はここまで」を正式な選択肢として追加。選択してもSongProjectは変更せず、必要ならHomeメモだけ残せる。

【変更】
- Homeの役割をEditorではなく司令塔に限定したまま、命令型の「次の1手」から選択肢型の導線へ変更。
- 作曲済み・未編曲の時は「Arrangement Labへ進む」に加えて「Demo Composerへ戻って別案を試す」を提示可能にした。
- Arrangement採用後・DAW未書き出し時は「もう少し比較する」と「今日はここまで」を提示可能にした。

【修正】
- なし。

【互換性】
- SongProject v1のSchema変更なし。
- HomeはSongProjectのOwnerにならず、表示用Read Modelとして既存`composition / arrangement / export / lineage`だけを参照。
- 既存のHomeメモ保存キー、JSON読込 / Backup、作曲シート連携、旧Claudeリンクを維持。

【復元ポイント】
- `restore/develop-before-decision-progress-home-20261015`

【未対応】
- Android実機での縦画面・タップ操作最終確認。
- stable tag（Android実機＋必要なCubasis / Cubase実機確認後のみ）。
- 統合後Adversarial Review。

---

## Version: v0.18-dev
更新日: 2026-10-15

【変更】
- Home内の作曲シートiframeはcanonical `../sheet-app/?embed=1`を開くよう変更。
- `sheet-app/index.html`→`latest/composition_sheet_latest.html`→最新版の各リダイレクトでqueryを保持し、Version固定せず埋め込み表示専用モードを渡す構成に変更。
- 作曲シートの最新版追従を維持。

【修正】
- Home内の作曲シートに内側の「📦 曲データ」メニューが重複表示される問題を修正。
- Home側の動的latest同期でも`embed=1`を失わないよう修正。
- 作曲シートを開くたびに「かんたん入力」が初期表示されるv0.9.1へ接続。

【互換性】
- Home上部の「📦 曲データ」メニューは維持。
- SongProject v1、既存のHomeメモ、JSON読込 / Backup、旧Claudeリンクを変更しない。

【復元ポイント】
- `backup/sheet-home-before-inner-songdata-beginner-fix-20261015`

【未対応】
- Android実機での縦画面最終確認。
- stable tag（実機確認後のみ）。

---

## Version: v0.17-dev
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
