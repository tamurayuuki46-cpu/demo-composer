Version: v0.14-dev
更新日: 2026-10-15

【追加】
- Arrangement Lab専用の発散モードを追加
- Seed / Lock / Divergence Distance / Branch / Keep / Freeze / Snapshot / Restore / Branch Treeを追加
- 既存のReharm Suggestion、Density、Drums参加、Counter role、Style/InstrumentationロジックをBranch Transformとして再利用
- Branchの簡易試聴を既存Preview engineへ接続
- Arrangement Lab発散Smoke Testを追加

【変更】
- Arrangement Labの開発Versionファイルをv0.14-devへ更新
- Arrangement Lab PWA cacheへ発散モード資産を追加

【責務】
- 主旋律そのものは常に固定し、Demo Composerの作曲責務を侵食しない
- Freeze結果は新形式にせず既存Arrangement Project形式へ戻す
- arrangerSchemaVersionは4のまま変更なし

【未対応】
- Android実機での発散→Freeze→通常比較→Song.midまでの通し確認
- stable tagは実機確認後
