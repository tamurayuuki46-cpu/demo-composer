# CLAUDE.md

Claude向けの作業入口です。

## 必須

作業開始前に以下を読むこと。

1. README.md
2. VERSION
3. docs/AI_HANDOFF.md
4. docs/PRODUCT_SPEC.md
5. docs/ARCHITECTURE.md
6. docs/DATA_SCHEMA.md
7. CHANGELOG.md

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

`claude/v0.1-ui-review`
`claude/v0.2-chord-review`

mainは安定版のみ。
developは開発統合用。
