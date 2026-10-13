# VERSION_HISTORY

## 2026-10-13 — main運用変更

Git運用を以下へ変更。

- `develop`: 開発統合用
- `main`: 自動テスト・build・回帰CI合格版
- `stable tag`: Android実機および必要なCubasis / Cubase実機確認済み版

現在のmain統合候補:
- Demo Composer `v0.4-dev`
- Arrangement Lab `v0.5-dev`
- Song Project schema `v1`

統合前develop:
- `0f67fb8713a457bb55ac3bad8b3d6e74d2c52c44`

既存復元点:
- 統合前: `backup/v0.3-dev_v0.4.1-dev_before_songproject`
- SongProject統合後: `backup/v0.4-dev_v0.5-dev_songproject-integrated`

実機確認が終わるまでstable tagは作成しない。
