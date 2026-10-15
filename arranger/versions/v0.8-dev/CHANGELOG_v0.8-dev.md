Version: v0.8-dev
更新日: 2026-10-14

【追加】
・画面右上に共通 `📦 曲データ` メニューを常設。
・右上からSongProject JSONの読込、現在の編曲結果を含むSongProject v1保存、DAW書き出し欄への移動を実行可能化。
・Demo Composer / Project Home / Arrangement Labの360 / 390 / 430px共通メニュー回帰テストを追加。

【変更】
・画面内Version表示をv0.8-devへ更新。
・JSON入出力の入口をスクロール位置に依存しない右上共通メニューへ追加し、既存の詳細書き出しUIは維持。

【修正】
・曲を読み込む前は「今の曲を保存」をdisabledにし、誤操作しにくくした。

【互換性】
・Arrangement Plan Schema 4据え置き。
・SongProject v1据え置き。
・既存保存キー、判断履歴、MIDI / DAW書き出し互換を維持。

【復元ポイント】
・`restore/develop-before-song-data-menu-20261014`

【未対応】
・Android実機でfixedメニューとsafe-area確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
