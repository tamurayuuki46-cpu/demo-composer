Version: v0.13-dev
更新日: 2026-10-14

【追加】
・右上「📦 曲データ」を4つの大きな入口へ再設計。
・「🧭 全アプリ遷移」から Music Project Home / 作曲シート / MIDI Analyzer / Demo Composer / Arrangement Lab を直接開けるようにした。
・「🎹 MIDI保存」を Demo Composer / Music Project Home / Arrangement Lab / 作曲シートへ接続。Demo ComposerはDraft/各パート、Arrangement Labは採用案Song.midを既存MIDI処理で書き出す。
・「💾 JSON保存」でSongProject v1を保存。
・「📝 作曲シート成果物」で、現在のSongProjectに保存済みの作曲シート記入内容を読み取り専用表示。
・4入口の配線を確認する song-data-menu 回帰テストを追加。

【変更】
・従来の「保存した曲を開く」は補助操作「保存JSONを開く」として残し、主要操作を4項目へ整理。
・スマホでは2列の大ボタンを基本とし、アプリ一覧ダイアログは1列表示に切り替える。
・Demo Composer Versionを v0.13-dev へ更新。

【修正】
・右上メニューからMIDI保存へ直接到達できなかった導線を解消。
・作曲シートの右上メニューでも、SongProjectに含まれる作曲データをMIDIへ書き出せるようにした。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・既存JSON / IndexedDB / localStorageの保存形式は変更しない。
・31枚の作曲シート本体は非公開Siteのまま。公開GitHub Pages側は成果物の読み取り専用表示だけを扱う。

【復元ポイント】
・restore/develop-before-song-data-four-actions-v0.13-20261014

【未対応】
・Android実機で4入口、複数MIDIダウンロード、JSON保存、作曲シート成果物表示の最終確認。
・Cubasis / Cubase実機でMIDI取込確認。
・stable tag作成（実機確認後のみ）。
