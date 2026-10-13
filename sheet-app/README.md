# 作曲シート

Demo Composerの前段で使う、入力を最小限にした作曲準備シートです。

## 必須入力
1. どんな場面の曲か
2. 参考曲1曲

Genre / Mood / BPM / Key / メモは任意です。

## 共通JSON
v0.2から、アプリ間の交換JSONは `SongProject v1` を正本にします。

- 作曲シート: `intent` とBPM/Keyを更新
- Demo Composer: `composition` を更新
- Arrangement Lab: `arrangement` を更新
- MIDI Analyzer: `analysis` を更新
- MIDI / Audioなど大きな実ファイル: JSONへ埋め込まず `assets.files` で外部参照可能

旧 `demo-composer-project` / `composition-sheet-handoff` / Demo Composer `project.json` はImport互換として読み込めますが、作曲シートからの新規ExportはSongProject v1だけです。

## ファイル構成
- `versions/v0.1/composition_sheet_v0.1.html` — 旧v0.1（保存）
- `versions/v0.2/composition_sheet_v0.2.html` — SongProject v1対応版
- `latest/composition_sheet_latest.html` — 最新版への入口
- `index.html` — 作曲シートの入口
- `CHANGELOG_v0.1.md` / `CHANGELOG_v0.2.md` — 変更履歴
- `VERSION_HISTORY.md` — バージョン履歴

## 復元ポイント
- `restore/develop-before-sheet-app-20261013`
- `restore/develop-before-songproject-unification-20261013`
