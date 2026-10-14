# CHANGELOG v0.13-dev

更新日: 2026-10-14

【追加】
- 右上 `📦 曲データ` に `📓 メモ帳` を追加。
- 作曲シート / Music Project Home / Demo Composer / Arrangement Lab で同じメモUIを利用。
- Project IDごとの端末保存と入力中の自動保存。
- Android共有画面からGoogle Drive / NotionへTXTを共有する導線。
- Android共有画面からChatGPTへメモを転送する導線。
- Web Share API非対応時のTXT保存、クリップボードコピー、ChatGPT起動フォールバック。

【変更】
- Arrangement LabのPWA Cacheへ共通メモModuleを追加。
- Demo Composer開発Versionをv0.13-devへ更新。

【修正】
- 同名の別Projectでメモが混ざらないよう、Project IDを保存キーに使用。

【互換性】
- Demo Composer Project Schema 3据え置き。
- SongProject schemaVersion 1据え置き。
- IndexedDB Schema変更なし。

【復元ポイント】
- `restore/develop-before-song-memo-v0.13-20261014`

【未対応】
- Android実機でGoogle Drive / Notion / ChatGPTが共有先として表示され、保存・転送が完了することの確認。
- Cubasis / Cubase実機確認。
- stable tag作成（実機確認後のみ）。
