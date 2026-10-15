# Backup Manifest — v0.17-dev

Updated: 2026-10-15

## Restore point before divergence work

- Repository: `tamurayuuki46-cpu/demo-composer`
- Restore branch: `restore/v0.16-before-divergence-2026-10-15`
- Base commit: `4734870ff82a7ff5f58600c41544b6eccfb9abfd`
- Meaning: 発散モード実装開始直前のdevelop完全スナップショット

この復元Branchは削除・上書きしない。

## Development version

- Feature branch: `chatgpt/divergence-mode-v0.17`
- Demo Composer: `v0.17-dev`
- Arrangement Lab: `v0.14-dev`
- Demo Composer schemaVersion: `3`（変更なし）
- Arrangement Lab arrangerSchemaVersion: `4`（変更なし）

## Version records

- `versions/v0.17-dev/CHANGELOG_v0.17-dev.md`
- `arranger/versions/v0.14-dev/CHANGELOG_v0.14-dev.md`
- `docs/DIVERGENCE_MODE.md`

## Latest / stable policy

現時点ではこのFeature Branchを`latest`または`stable`とは扱わない。

1. Feature BranchでFocused CIを通す
2. PRでdevelopへ統合
3. developで回帰確認
4. main昇格条件を満たした場合のみmainへ進める
5. Android実機 + Cubasis/Cubase等の実機確認後のみstable tagを作る

過去Version / Branch / Tagは削除・上書きしない。
