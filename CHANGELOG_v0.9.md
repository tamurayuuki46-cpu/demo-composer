Version: v0.9-dev
更新日: 2026-10-14

【追加】
・右上「📦 曲データ」を4つの大きな操作へ整理。
・「🧭 全アプリ遷移」から Music Project Home / 作曲シート / MIDI Analyzer / Demo Composer / Arrangement Lab を直接開けるようにした。
・「🎹 MIDI保存」を Demo Composer / Music Project Home / Arrangement Lab へ接続。Demo Composerは既存のDraft/各パートMIDI、Arrangement Labは採用案Song.midを書き出す。
・「💾 JSON保存」でSongProject v1をバックアップ。
・「📝 作曲シート成果物」で現在のSongProjectに保存済みの記入内容を読み取り専用表示。
・公開専用smoke testを追加し、4操作の配線と非公開31シート本体を公開コードへ埋め込んでいないことを検証。

【変更】
・従来の「保存した曲を開く」は補助操作「保存JSONを開く」として残し、主要操作を4項目へ集約。
・スマホでは2列×2段の大ボタンを優先表示。
・公開版Version表示を v0.9-dev へ更新。

【修正】
・右上メニューからMIDI保存へ直接到達できなかった導線を解消。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・IndexedDB / localStorage / JSON形式変更なし。
・31枚の作曲シート本体は非公開Siteのまま。公開GitHub Pagesには含めない。

【未対応】
・Android実機で4操作、複数MIDIダウンロード、JSON保存、作曲シート成果物表示の最終確認。
・Cubasis / Cubase実機でMIDI取込確認。
・stable tag作成（実機確認後のみ）。
