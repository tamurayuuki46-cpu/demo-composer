Version: v0.2-dev / counter-answer-style
更新日: 2026-10-11

【追加】
- Counter Melodyに `Answer（応答型）` を追加。
- 主旋律の語尾・小節後半の空きを優先し、コードの3度・7度など色が出やすい音で少し長めに返す。
- 参考イメージを `Mr.Children系` として小さく補足（特定曲のコピーではない）。

【変更】
- 裏メロ候補を Sparse / Active / Hook の3系統から、Answerを加えた4系統へ拡張。
- `docs/COUNTER_MELODY_STYLES.md` を4系統仕様へ更新。
- Counter Melody smoke testを4候補対応へ更新。

【修正】
- なし。

【未対応】
- Android実機で4候補のカード表示・試聴・適用・Undoを確認する。
- 実曲でSparseとAnswerの聞き分けやすさを確認し、必要なら音価・Velocityを微調整する。

Backup:
- `restore/v0.2-before-counter-answer-style`

Working branch:
- `chatgpt/v0.2-counter-answer-style`

Schema:
- `schemaVersion: 2` のまま。Migration不要。
