# 作曲シート Version History

## v0.5-dev — 2026-10-14
- 検索から制作ガイド／アイデア帳のタブ移動へ変更。スマホは2列表示
- 31シートとv0.4の保存内容を保持。詳細: `CHANGELOG_v0.5.md`
- 復元点: `restore/develop-before-sheet-tabs-v0.5-20261014`


## v0.4-dev — 2026-10-14
- 原文31シート全文、検索、記入欄・チェック・メモ、複数曲の保存・復元
- SongProject v1のcompatibilityに全シートの記入内容を保持
- 原文: `claude/sheet-markdown-export` / `c43d248`
- 復元点: `restore/develop-before-sheet-full-v0.4-20261014`
- Branch: `feature/composition-sheet-full-v0.4`
- 詳細: `CHANGELOG_v0.4.md`


## v0.3-dev — 2026-10-14
- 画面右上に全アプリ共通の「📦 曲データ」を常設
- 右上からSongProject v1の読込 / 保存 / Demo Composerへの受け渡しを実行可能化
- 「次へ」はJSONバックアップを必ず保存してから一時受け渡しを行い、失敗時は保存JSONから復帰可能
- v0.1 / v0.2は変更せず保持し、latestのみv0.3へ更新

復元ポイント:
- `restore/develop-before-song-data-menu-20261014`

開発Branch:
- `feature/song-data-menu-v0.12`

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

## 作曲シート v0.6-dev — 2026-10-14
記入用を先頭へ。保存・Drive共有と各アプリ簡易表示。旧v0.1〜v0.5保持。stable未認定。
