# SongProject JSON 受け渡しガイド

更新日: 2026-10-14

追記: 2026-10-16 / v0.16-dev

v0.16.1: Arrangement Labの受信UIは本体app.jsへ明示依存し、本体のImport完了をawaitする。初期化前のイベント送出やDOMの変化を反映成功の代わりにしない。本体Scriptを1.5秒遅延すると旧実装では反映に失敗することを再現し、同じ条件で成功を確認する。反映失敗時は受信候補を保持する。

## 保存・反映の完了判定

Demo Composerでは現在曲の保存完了を待ってJSONを書き出す。受信時は元の曲を端末保存してから、受信曲を元のProject IDで保存・反映する。確認のキャンセルや保存失敗時は一時受け渡し候補を保持する。
共通「曲データ」メニューも同じ完了を待つ処理を使用する。従来のproject.json置き換え・MIDI取り込みでは既存のID保持動作を維持する。

受信曲の解析・編曲・intent・reference等は、Demo Projectの任意 `songProjectContext` に曲別に保持する。IndexedDB保存・再読み込み・project.jsonバックアップを経ても維持する。元のProject IDが一致する場合のみcompositionと共通基本情報を合流し、再出力する。
legacyProject内からは交換コンテキストを除き、往復による再帰埋め込みを防ぐ。localStorageは引き続き一時受け渡しの補助で、ファイル復帰と曲別情報保持の前提にはしない。

復元点: `restore/main-before-handoff-integrity-20261016`。Schema 3 / SongProject v1 / Arrangement Plan Schema 4は据え置き。

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
