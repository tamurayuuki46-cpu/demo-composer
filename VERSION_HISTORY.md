## v0.5-dev
更新日: 2026-10-13

【追加】
・390px幅で保存・再読込・主要画面・Draft.midダウンロードを確認するブラウザ回帰テスト。

【変更】
・Demo ComposerのMIDI出力ボタン、Drive共有、制作ガイドをDraft.midへ統一。Arrangement Labのfinal Song.midとは役割を分離。
・Legacy Schema 3 / Song Project v1と保存データは維持。

【修正】
・Song.midボタンが存在しない出力キーを参照して「生成できませんでした」となる不具合を修正。

【未対応】
・Android実機とCubasis/Cubase実機確認。
・Cloud Browserはviewport変更APIがないためスマホ幅の直接確認は未実施（390pxはCIで確認）。

# VERSION_HISTORY

## 2026-10-13 — main統合・公開後の整合性修正

- Demo Composer v0.4-dev / Arrangement Lab v0.5-dev / SongProject v1はPR #177でmain統合済み。
- PR #178でCI gate、PR #179/#180でPages公開元をmainへ変更。main CI / Deploy成功。
- README / AI_HANDOFF / Arrangement VERSION_HISTORYの旧運用記載と、画面Version表示を修正。Version番号・Schema・音楽処理は維持。
- Android/Cubasis/Cubase実機確認は未完了、stable tag未作成。


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
