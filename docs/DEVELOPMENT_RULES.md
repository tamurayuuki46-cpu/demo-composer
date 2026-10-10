# DEVELOPMENT_RULES

## 1. AI共通

Claude / ChatGPT / Codexのどれが作業しても、共通仕様はdocsを正本とする。

## 2. Change Flow

1. 現在挙動を確認
2. 変更目的を確認
3. 影響範囲を確認
4. 必要ならBackup
5. 最小変更
6. 動作確認
7. CHANGELOG更新
8. AI_HANDOFF更新

## 3. Versioning

- 過去Versionを上書きしない
- 大規模変更前に復元ポイントを作る
- latestとstableを混同しない

## 4. Forbidden

- 理由なくFramework変更
- 全コード書き直し
- 既存機能の無断削除
- Schema無断変更
- Version履歴削除
- AIごとに別仕様を作る
- 巨大な1ファイル化
- Module間の強依存
- 初心者UXを犠牲にした機能追加

## 5. Feature Gate

新機能は次を満たすか確認する。

- スマホで作曲判断しやすくなるか
- Cubasis/Cubase側でやるべき機能ではないか
- 初心者UIを複雑化しないか
- 保守コストに見合うか
