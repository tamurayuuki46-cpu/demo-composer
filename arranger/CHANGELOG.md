# CHANGELOG

Version: v0.1.1-dev
更新日: 2026-10-13

【追加】
・GitHub Pagesの公開ビルドで `dist/arranger/index.html` の存在を確認するCIチェックを追加

【変更】
・静的ビルド時に `arranger/` を `dist/arranger/` へコピーするよう変更

【修正】
・GitHub PagesへのDeploy自体は成功していても、編曲アプリのファイルが公開成果物に含まれず `/arranger/` が開けなかった問題を修正

【未対応】
・MIDI実生成
・Sectionごとの手動編集
・Cubasis / Cubase実機取り込み

---

Version: v0.1-dev
更新日: 2026-10-13

【追加】
・Demo Composer project.json読み込み
・3スタイル × 3方向の編曲候補生成
・Section単位のDrums / Bass / Harmony / 裏メロ / 色付け / Transition表示
・候補採用とlocalStorage保存
・Arrangement Plan JSON出力
・PWA Service Worker / manifest

【変更】
・なし（Demo Composer本体は変更しない独立フォルダとして追加）

【修正】
・なし

【未対応】
・MIDI実生成
・Sectionごとの手動編集
・Cubasis / Cubase実機取り込み
