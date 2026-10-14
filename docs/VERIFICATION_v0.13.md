# v0.13-dev 検証記録

更新日: 2026-10-14

## 対象

右上 `📦 曲データ` の4大操作:

- 全アプリ遷移
- MIDI保存
- JSON保存
- 作曲シート成果物

## 自動検証

GitHub Actionsで以下を確認する。

- syntax
- song-data-menu smoke test
- MIDI smoke test
- SongProject smoke test
- static build
- Demo Composer CI
- Arrangement Lab CI
- Song Project Integration CI
- Project Home / Sheet CI

## 互換性

- Demo Composer Project Schema 3据え置き
- SongProject schemaVersion 1据え置き
- IndexedDB / localStorage / JSON既存形式変更なし
- 31枚の作曲シート本体は非公開のまま

## 実機確認待ち

- Android Chromeで4大操作
- 複数MIDIダウンロード
- JSON保存 / 再読込
- 作曲シート成果物表示
- Cubasis / Cubase MIDI取込

実機確認完了前はstable tagを作成しない。
