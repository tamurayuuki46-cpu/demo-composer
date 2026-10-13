Version: v0.6-dev
更新日: 2026-10-13

【追加】
・Project Homeに「Claude Artifact / 作曲シート」を追加。
・claude.aiリンクをProject Homeから保存・削除・新しいタブで開けるようにした。
・Project Home用のClaudeリンク回帰テストを追加。

【変更】
・Demo Composer HubとProject Homeで同じ端末内リンク `demo-composer.sheetLink` を共有する。
・リンクはlocalStorageだけに保存し、Song Project JSON・MIDI・Repository内コードには保存しない。
・Project HomeのJavaScript Module importにもBuild IDを付け、キャッシュによる新旧Module混在を防ぐ。

【修正】
・なし。

【未対応】
・mainへの統合／GitHub Pages公開は未実施。
・Android実機確認。
・Cubasis / Cubase実機確認。
