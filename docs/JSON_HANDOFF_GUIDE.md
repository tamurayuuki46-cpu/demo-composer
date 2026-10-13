# SongProject JSON 受け渡しガイド

更新日: 2026-10-14

## 目的

初心者が `JSON` / `Schema` / `Import` という技術用語を意識せず、次のアプリへ曲を渡せるようにする。

基本導線は次の3段階だけを前面に出す。

1. 曲データを保存
2. 次のアプリを開く
3. 受け取った曲を反映

## 正式な交換形式

- 共通交換形式: `SongProject v1`
- 推奨ファイル名: `<song>_song_project_v1.json`
- MIDI / Audio / Stem本体はJSONへ埋め込まない
- JSONファイルは必ずバックアップとして端末へ保存する

## 同じChromeでの補助導線

GitHub Pages公開版は MIDI Analyzer / Demo Composer / Arrangement Lab が同じOrigin配下にあるため、SongProject本体だけをlocalStorageへ一時保存して次のアプリへ受け渡す。

Storage key:

`music-project-songproject-handoff-v1`

一時受け渡しが失敗した場合でも、先に保存したJSONを選べば同じ処理を続行できる。

## MIDI Analyzer → Demo Composer

MIDI AnalyzerのExport画面では初心者向けに次だけを前面表示する。

1. `曲データを保存`
2. `Demo Composerを開く`
3. Demo Composer側で `受け取った曲を反映`

詳細なAnalysis JSON / CSV / Markdown / 旧Demo Composer project.jsonは `もっと詳しい書き出し` に収納する。

## Demo Composer → Arrangement Lab

Demo ComposerのExport画面では以下を表示する。

1. `前のアプリから受け取る`
2. Demo Composerで作曲
3. `Arrangement Labへ渡す`
4. `Arrangement Labを開く`

SongProjectをMIDI Analyzer等から受け取った場合は、Demo Composerの編集を `composition` にMergeして、元の `analysis` / `arrangement` / `intent` を保持する。

## Arrangement Lab

Demo Composerからの一時受け渡しを検知した場合は、画面上部に `Demo Composerから続ける` を表示する。

- `受け取った曲を反映`
- `保存したJSONを選ぶ`

反映後は `②A/B/Cを聴く → ③1案選ぶ → ④Section調整` を案内する。

## 安全性

- 自動反映はしない。必ずユーザーが `反映` を押す。
- JSONファイル保存を先に行い、localStorageは補助導線として扱う。
- Demo Composerで別Projectを開いた場合、projectIdが一致しない過去SongProjectはMergeしない。
- SongProject v1 / Demo Composer Project Schema 3 / Arrangement Plan Schema 4は変更しない。
