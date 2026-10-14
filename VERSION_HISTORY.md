## v0.7-dev
更新日: 2026-10-14

【追加】
・MIDI Analyzer → Demo Composer → Arrangement Lab のSongProject受け渡しを「保存 → 開く → 反映」の一本道へ整理。
・同じChromeでは `music-project-songproject-handoff-v1` を補助導線として使用し、JSONファイル選択の手間を減らした。
・JSONファイルは毎回バックアップとして保存し、一時受け渡しに失敗した場合はファイル選択へフォールバック。
・Demo Composerで受け取ったSongProjectのanalysis / arrangement等を保持したままcompositionを書き戻す導線を追加。

【変更】
・初心者向けの主表示を「前のアプリから受け取る」「Arrangement Labへ渡す」に変更。SongProject / Schema等の詳細操作は補助扱い。
・Arrangement LabはDemo Composerからの受け渡しを検知すると「Demo Composerから続ける」を表示。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・Arrangement Plan Schema 4据え置き。
・旧project.json / SongProject JSON読込を維持。

【復元ポイント】
・`restore/develop-before-json-handoff-guide-20261014`

【未対応】
・Android実機でMIDI Analyzer → Demo Composer → Arrangement Labの通し確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。

## v0.6-dev
更新日: 2026-10-13

【追加】
・Project Homeに「Claude Artifact / 作曲シート」を追加。claude.aiリンクを端末内に保存し、1タップで新しいタブに開ける。
・Project Home用のClaudeリンク回帰テストを追加。

【変更】
・Demo Composer HubとProject Homeで同じ `demo-composer.sheetLink` を共有。リンクはlocalStorageのみで保持し、Song Project JSON・MIDI・公開コードには保存しない。
・Project HomeのModule依存にもBuild IDを付与し、更新時の新旧Module混在を防止。

【修正】
・なし。

【未対応】
・mainへの統合／GitHub Pages公開は本番反映のため未実施。
・Android実機とCubasis/Cubase実機確認は引き続き未完了。

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

## 記入シート簡易表示 v0.6 — 2026-10-14
Home / Demo / Arrangementの右上「曲データ」に、現在のSongProjectの記入内容を表示。記入シート本体の非公開範囲を保持。
