# 作曲シート

Demo Composerの前段で使う、入力を最小限にした作曲準備シートです。

## v0.1の必須入力
1. どんな場面の曲か
2. 参考曲1曲

Genre / Mood / BPM / Key / メモは任意です。

## 共通JSON
作曲シートは `demo-composer-project` 形式のJSONを読み書きします。
他アプリが追加した `composer` / `arrangement` / `midiAnalysis` などのデータは、作曲シートで読み込んでも削除せず保持します。

## ファイル構成
- `versions/v0.1/composition_sheet_v0.1.html` — v0.1本体
- `latest/composition_sheet_latest.html` — 最新版への入口
- `index.html` — 作曲シートの入口
- `CHANGELOG_v0.1.md` — v0.1変更履歴
- `VERSION_HISTORY.md` — バージョン履歴

## 開発
- 開発Branch: `feature/composition-sheet-json-v0.1`
- 復元ポイント: `restore/develop-before-sheet-app-20261013`
