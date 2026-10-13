# 作曲シート Version History

## v0.2-dev — 2026-10-13
- アプリ間の交換JSONを `SongProject v1` に統一
- 作曲シートは `intent` とBPM/Keyだけを更新し、他アプリ領域を保持
- 旧 `demo-composer-project` / `composition-sheet-handoff` / Demo Composer `project.json` をImport時に自動変換
- MIDI / Audioなどの実ファイルはJSONへ埋め込まず `assets.files` で外部参照する方針へ統一

復元ポイント:
- `restore/develop-before-songproject-unification-20261013`

開発Branch:
- `feature/songproject-unification`

## v0.1-dev — 2026-10-13
- 新デザインで作曲シートを再構築
- 必須入力を2項目に明確化
- 共通Project JSONの読み込み／保存に対応
- 任意項目を折りたたみ化

復元ポイント:
- `restore/develop-before-sheet-app-20261013`

開発Branch:
- `feature/composition-sheet-json-v0.1`
