# 曲データ共通メニュー

更新日: 2026-10-14

## 目的

JSONの読込・保存場所をアプリごとに探さなくてよいように、曲づくり関連アプリの画面右上へ `📦 曲データ` を常設する。

表向きはJSONという技術用語より「曲データ」を優先する。共通交換形式は従来どおり `SongProject v1` (`schemaVersion: 1`) とし、新しいSchemaは作らない。

## 共通操作

右上の `📦 曲データ` を押すと、原則として次の3操作を表示する。

1. `保存した曲を開く` — SongProject JSONを読み込む
2. `今の曲を保存` — 現在のSongProject v1を端末へ保存する
3. `次の工程へ進む` — JSONバックアップを確保したうえで次のアプリ / DAW工程へ進む

現在扱っている曲名も同じパネル内に表示する。

## 各アプリの出口

- 作曲シート v0.3: Demo Composerへ進む
- Music Project Home: SongProjectの状態に応じた次工程へ進む
- MIDI Analyzer v0.15: Demo Composerへ進む。解析前でも既存SongProjectを先に開ける
- Demo Composer v0.12: Arrangement Labへ進む
- Arrangement Lab v0.8: DAW書き出し欄へ進む

## データ安全性

- 次アプリへ渡す場合でも、先にSongProject JSONを端末バックアップとして保存する。
- 同じChromeでは `music-project-songproject-handoff-v1` を補助的な一時受け渡しに使用できる。
- localStorageが使えない、または一時受け渡しに失敗した場合は、保存済みJSONから復帰できる。
- 自動反映は行わず、既存のImport / mergeルールを維持する。

## 所有領域と互換性

- SongProject v1は変更しない。
- Demo Composer Project Schema 3、Arrangement Plan Schema 4を変更しない。
- MIDI Analyzerは既存SongProjectへ解析を書き戻す場合、analysis / referenceを更新し、composition / arrangement / intent等を保持する。
- Arrangement Labはarrangement領域だけを書き戻し、Demo Composerのcompositionを上書きしない。

## モバイル要件

- 右上へfixed配置し、safe-areaを考慮する。
- 360 / 390 / 430pxで横スクロールを発生させない。
- メニューは画面遷移・長いスクロール位置に関係なく常時呼び出せる。
- 曲が無い状態で保存できない画面では、保存ボタンをdisabledにして理由を明確にする。
