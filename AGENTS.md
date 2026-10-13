# AGENTS.md

ChatGPT / Codex向けの作業入口です。

## 必須

作業開始前に以下を読むこと。

1. README.md
2. VERSION
3. docs/AI_HANDOFF.md
4. docs/PRODUCT_SPEC.md
5. docs/ARCHITECTURE.md
6. docs/DATA_SCHEMA.md
7. CHANGELOG.md
8. docs/RELEASE_POLICY.md

## 共通ルール

- 共通仕様をこのファイルだけに書かない。
- 重要な設計判断は必ず docs/ に反映する。
- 既存機能を無断で削除しない。
- Schema変更は DATA_SCHEMA.md と Migration方針を同時更新する。
- 大規模変更前は versions/ に復元ポイントを作る。
- 作業終了時は必要に応じて AI_HANDOFF.md / CHANGELOG.md / VERSION を更新する。
- Module同士を直接依存させない。
- UIはAndroidスマホ優先。
- 「この機能でスマホ上の作曲判断がしやすくなるか？」を追加判断の基準にする。

## Git Branch例

`chatgpt/v0.1-hub-shell`
`chatgpt/v0.2-melody-analyzer`

- `develop`: 開発統合用。
- `main`: 自動テスト・build・必要な回帰CIに合格した統合版。実機未確認でも可。
- `stable tag`: Android実機と、該当する場合はCubasis / Cubase実機確認まで完了した版だけに付与する。
- `main`へ入れる前に復元Branchを作成し、過去Version / 復元Branchは削除・上書きしない。
- 詳細は `docs/RELEASE_POLICY.md` を正本とする。
