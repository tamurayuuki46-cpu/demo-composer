# 公開版 曲データメニュー v0.9

更新日: 2026-10-14

公開GitHub Pagesの右上 `📦 曲データ` を4つの主要操作へ統一する。

1. **全アプリ遷移** — Music Project Home / 非公開作曲シート / MIDI Analyzer / Demo Composer / Arrangement Lab を開く。
2. **MIDI保存** — Demo Composerでは既存のDraft/各パートMIDI、Arrangement Labでは採用案Song.mid、Music Project HomeではSongProjectから既存MIDI Writerを利用して保存する。
3. **JSON保存** — SongProject v1を保存する。
4. **作曲シート成果物** — 現在のSongProject内に保存された作曲シート記入内容だけを読み取り専用表示し、必要なら非公開作曲シート本体を開く。

公開範囲は拡大しない。31シート本体はこのリリースへ追加しない。SongProject schemaVersion 1 / Demo Project Schema 3 / IndexedDB / localStorage形式は変更しない。

公開前確認: Demo Composer CI / Song Project Integration CI / Arrangement Lab CI / Project Home Sheet Link CI / Pages PR buildをすべて成功させる。Android/Cubasis/Cubase実機確認まではstable tagを作らない。
