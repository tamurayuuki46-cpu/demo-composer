# 作曲シート v0.2-dev CHANGELOG

## 2026-10-13
- JSON交換形式を `SongProject v1` に統一。
- 必須入力2項目のUIは維持。
- 作曲シートは `intent` とBPM/Keyのみ更新し、`composition` / `arrangement` / `analysis` / `assets` を保持。
- 旧作曲シートJSON、旧handoff JSON、Demo Composer project.jsonをImport互換として変換可能にした。
- MIDI / Audio実体はJSONへ埋め込まず、必要に応じて `assets.files` の参照情報で扱う方針に統一。
- 過去v0.1は削除・上書きしない。
