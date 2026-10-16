# Current Release

更新日: 2026-10-16

## Published main

- Demo Composer: `v0.17-dev`
- Arrangement Lab: `v0.14-dev`
- Music Project Home: `v0.19-dev`
- Composition Sheet latest: `v0.9.1-dev`
- MIDI Archive/Analyzer: `v0.25-dev`（別Repository / 公開済み）
- GitHub Pages公開元: `main`
- Release source: `release/v0.17-publish-20261016`
- Reconciliation commit: `7669b6b1a63d5caabf5534101d01338fb6faf2c5`
- Stable: 未認定

v0.17公開では、develop側の発散モード（Demo Composer v0.17-dev / Arrangement Lab v0.14-dev / Project Home v0.19-dev）を維持したまま、main側で公開確認済みのv0.16 / v0.16.1 SongProject受け渡し修正、保存完了待ち、Arrangement Lab初期化待ち、Version表示修正を2-parent mergeで統合しています。

## Restore points

公開統合前の状態は次のBranchから復元できます。

- `restore/main-before-v0.17-publish-20261016` → `800cd729da6231bb6820f44b79d15ebe81354233`
- `restore/develop-before-v0.17-publish-20261016` → `511dda9368bea10191a0eb415d8bd4403d4d1ae5`
- 発散モード実装前: `restore/v0.16-before-divergence-2026-10-15`

過去Version / Branch / Tagは削除・上書きしません。

## Contracts

- Demo Composer Project Schema: 3
- SongProject: v1 (`schemaVersion: 1`)
- Arrangement Plan Schema: 4
- PPQ: 480
- time signature: 4/4固定
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

今回の公開統合ではSchema変更・Migrationはありません。

## Included release changes

### Demo Composer v0.17-dev

- Seed / Lock / Divergence Distance / Branch / Keep / Freeze
- Snapshot / Restore / Branch Tree
- 5軸Lock（主旋律 / 裏メロ / コード・ハーモニー / リズム・グルーヴ / 音色）
- Decision Progress
- v0.16 / v0.16.1のSongProject ID保持・保存完了待ち・交換情報保持を統合
- AI MonitoringがVersion / Build IDを上書きする問題を修正

### Arrangement Lab v0.14-dev

- 編曲Seed / Lock / Branch / Keep / Freeze / Snapshot / Restore
- 主旋律を固定したままReharm / Density / Counter role / Instrumentationを発散
- SongProject受信時に本体Import完了を明示的にawaitし、初期化前イベント消失を防止

### Music Project Home v0.19-dev

- 創作状態（探索中 / 比較中 / 保留・任意）
- 次にできる選択肢を最大3件表示
- 「今日はここまで」を正式な選択肢として維持

### Composition Sheet v0.9.1-dev

- beginner modeをlatestとして維持
- Home埋め込み時の曲データメニュー重複を防止

## Workflow

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → 必要ならCubasis → PC DAW / Cubase → 完成`

- Composition Sheet: 考える・意図を決める
- MIDI Archive/Analyzer: 集める・理解する・差を説明する
- Demo Composer: 作る・試す・発散する
- Arrangement Lab: 育てる・比較する・決める
- Music Project Home: 案内する・つなぐ
- Cubasis / Cubase: 本制作・完成

## Previous publications

### v0.16.1-dev — 2026-10-16

mainでArrangement Lab受信初期化待ちとVersion / Build ID表示を修正。公開直前のmainは `800cd729da6231bb6820f44b79d15ebe81354233`。

### v0.16-dev — 2026-10-16

SongProject受信曲ID保持、保存完了待ち、交換情報の曲別保持、JSON復帰を修正。

### v0.15-dev — 2026-10-15

PR #255でmain/develop lineageを統合し、公開済みversion資産とSongProject境界回帰を確認。

## Stable

未認定です。Android実機での保存・PWA・主要操作・発散モード・Song.mid書き出しと、必要なCubasis / Cubase実機でのImport / 再生 / MIDI構造確認が完了し、結果をRepositoryへ記録した場合のみstable tagを作成します。
