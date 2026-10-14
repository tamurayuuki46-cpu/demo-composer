Version: v0.10-dev
更新日: 2026-10-14

【追加】
・右上「📦 曲データ」に補助操作「📓 メモ帳」を追加。
・曲ごとのメモをProject ID単位で端末へ自動保存。
・Android共有画面からGoogle Drive / NotionへTXT共有できる導線を追加。
・Android共有画面からChatGPTへメモを共有できる導線を追加。
・Web Share API非対応時はTXT保存、クリップボードコピー、ChatGPT起動へフォールバック。

【変更】
・公開版Demo Composerをv0.10-devへ更新。
・既存の「全アプリ遷移 / MIDI保存 / JSON保存 / 作曲シート成果物」の4大操作は維持。
・Arrangement LabのオフラインCacheへメモModuleを追加。

【修正】
・同名曲でもProject IDが異なる場合はメモが混ざらない保存キーにした。
・共有キャンセルを成功扱いしない。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・既存IndexedDB / localStorage / JSON形式は変更しない。
・非公開の31枚作曲シート本体はmainへ追加しない。

【テスト】
・公開用song-data-menu smoke testでメモModule、共有導線、PWA Cache、Version表示を検証。
・develop側では360 / 390 / 430px Mobile Chromiumでメモ入力→自動保存→再表示を確認済み。

【復元ポイント】
・restore/main-before-song-memo-public-v0.10-20261014

【未対応】
・Android実機で共有先にGoogle Drive / Notion / ChatGPTが表示され、実際に保存・転送できることの確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
