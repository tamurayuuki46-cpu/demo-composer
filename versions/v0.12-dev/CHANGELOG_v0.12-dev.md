Version: v0.12-dev
更新日: 2026-10-14

【追加】
・作曲シート / Music Project Home / Demo Composer / Arrangement Labへ画面右上の共通 `📦 曲データ` メニューを追加。
・共通メニューから「保存した曲を開く」「今の曲を保存」「次の工程へ進む」を呼び出せるようにした。
・360 / 390 / 430pxで右上メニューを確認するMobile Chromium回帰を追加。
・作曲シートv0.3を追加し、SongProject v1保存＋Demo Composerへの一時受け渡しに対応。

【変更】
・Demo Composerをv0.12-dev、Arrangement Labをv0.8-dev、作曲シートをv0.3-devへ更新。
・JSONという技術用語は詳細表示へ寄せ、初心者向け操作名を「曲データを開く / 保存」へ統一。
・次工程は各アプリの責務に合わせ、作曲シート→Demo Composer、Demo Composer→Arrangement Lab、Arrangement Lab→DAWと表示する。

【修正】
・Demo Composer画面内Version表示とVERSIONファイルのズレを解消。
・一時受け渡しが利用できない環境でも、先に保存したSongProject JSONから復帰できる経路を維持。

【互換性】
・SongProject v1 / schemaVersion 1据え置き。
・Demo Composer Project Schema 3据え置き。
・Arrangement Plan Schema 4据え置き。
・既存IndexedDB / localStorage / project.json / MIDI互換を維持。

【復元ポイント】
・`restore/develop-before-song-data-menu-20261014`

【未対応】
・Android実機で右上メニュー、ファイルピッカー、safe-areaを確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
