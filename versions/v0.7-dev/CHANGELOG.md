Version: v0.7-dev
更新日: 2026-10-13

【追加】
・Demo Composer本体Root Service Worker。
・Production Build IDごとのversioned precache。
・Root scopeのWeb App Manifest強化とPWAアイコン。
・初回オンライン読込後のDemo Composer本体 / Project Homeオフラインfallback。
・PWA生成物を検証するCI smoke test。

【変更】
・更新通知の「更新する」はwaiting Service Workerを安全に有効化してからreloadする方式へ変更。
・Cache削除対象を `demo-composer-shell-*` のみに限定し、Arrangement Lab等の別Cacheを保護。
・`build.json` は更新検知のためService Worker Cache対象外に維持。
・package / VERSION / 画面Versionをv0.7-devへ更新。

【修正】
・旧更新処理がCache API上の全Cacheを削除し、同一OriginのArrangement Lab Cacheまで消す可能性があった問題を修正。

【互換性】
・Legacy Project Schema 3変更なし。
・Song Project v1変更なし。
・IndexedDB保存形式変更なし。
・MIDI Export形式変更なし。
・Arrangement Labの独自Service Worker / Cacheへ変更なし。

【復元ポイント】
・`restore/v0.6-before-root-pwa-service-worker`

【未対応】
・Android Chrome実機でのホーム画面追加、standalone起動、offline reload、更新切替確認。
・Cubasis / Cubase実機MIDI取込確認。
・stable tag作成（実機確認後のみ）。
