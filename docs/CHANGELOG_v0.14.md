# CHANGELOG v0.14-dev

更新日: 2026-10-14

【追加】
- 右上 `📦 曲データ` に補助操作 `📓 メモ帳` を追加。
- 作曲シート / Music Project Home / Demo Composer / Arrangement Labで同じ曲メモUIを利用。
- Project IDごとの端末保存と入力中の自動保存。
- Android共有画面からGoogle Drive / NotionへTXTを共有する導線。
- Android共有画面からChatGPTへメモを転送する導線。
- Web Share API非対応時のTXT保存、クリップボードコピー、ChatGPT起動フォールバック。

【変更】
- v0.13-devの4大操作は4個のまま維持し、メモ帳は補助操作へ配置。
- Arrangement LabのPWA Cacheへ共通メモModuleを追加。
- Demo Composer開発Versionをv0.14-devへ更新。
- READMEの開発Version / 公開Version表示を現在状態へ同期。

【修正】
- 同名の別Projectでメモが混ざらないよう、Project IDを保存キーに使用。
- `APP_VERSION` が旧v0.9-devのままだった不整合をv0.14-devへ同期。

【互換性】
- Demo Composer Project Schema 3据え置き。
- SongProject schemaVersion 1据え置き。
- IndexedDB Schema変更なし。
- 既存v0.13曲データメニューのMIDI / JSON / 作曲シート導線を維持。

【テスト】
- song-data-menu smoke testへメモ保存キー / 共有文 / PWA Cache確認を追加。
- Mobile Chromium 360 / 390 / 430pxへメモ入力→自動保存→再表示回帰を追加。

【復元ポイント】
- `restore/develop-before-song-memo-v0.14-20261014`

【未対応】
- Android実機でGoogle Drive / Notion / ChatGPTが共有先として表示され、保存・転送が完了することの確認。
- Cubasis / Cubase実機確認。
- stable tag作成（実機確認後のみ）。
