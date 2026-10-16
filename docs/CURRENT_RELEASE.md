# Current Release

更新日: 2026-10-17

## Published main

- Demo Composer: `v0.17-dev`
- Arrangement Lab: `v0.15-dev`（収束モード統合版を公開）
- Music Project Home: `v0.19-dev`
- Composition Sheet latest: `v0.9.1-dev`
- MIDI Archive/Analyzer: `v0.26-dev`（別Repository / 公開済み）
- GitHub Pages公開元: `main`
- Release source: `release/v0.17-arranger-v0.15-publish-20261017`
- Public main commit: `92bdd6b55addf9f42895d8d61ba8a9713c1ad9b2`
- Develop publication-history sync: PR `#278` / `4e090014f03d8936ba6bee0b30e687312be54843`
- Stable: 未認定

2026-10-17公開では、developで検証済みのArrangement Lab v0.15-dev収束モードと、Demo Composer v0.17-devの発散セッション保存 / Keepライブラリを含むdevelop最新状態をmainへ昇格しました。Demo Composer v0.17-dev / Music Project Home v0.19-dev / Composition Sheet v0.9.1-devのVersionは維持しています。

## Restore points

今回の公開直前状態は次のBranchから復元できます。

- `restore/main-before-arranger-v0.15-publish-20261017` → `a92f3511c9e3e7cedb84cfae87266efd99f220ab`
- `restore/develop-before-arranger-v0.15-publish-20261017` → `9124d41350fd17ed7d76763b0e22e108b3543ba5`

以前の復元点も保持しています。

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

今回の公開統合でもSchema変更・Migrationはありません。

## Included release changes

### Demo Composer v0.17-dev

- Seed / Lock / Divergence Distance / Branch / Keep / Freeze
- Snapshot / Restore / Branch Tree
- 5軸Lock（主旋律 / 裏メロ / コード・ハーモニー / リズム・グルーヴ / 音色）
- Decision Progress
- 発散セッションのIndexedDB保存
- KeepライブラリとFreeze後の候補保持
- v0.16 / v0.16.1のSongProject ID保持・保存完了待ち・交換情報保持を維持

### Arrangement Lab v0.15-dev

- 全体 / Section / 個別の「採用 / まだ迷う / 不採用」
- 定型理由、上書き解除、Undo、Recovery
- 中央保存、dirty共通入口、validation gate
- 編集済み候補poolの再読込保持
- 同一projectIdのrebase
- Current Plan共通Export
- 未決定項目のLab / DAW持ち越し
- Preview / Song.mid / DAW ZIP / Plan / SongProjectのCurrent Plan統一
- 360 / 390 / 430px Mobile ChromiumとSongProject handoff回帰を公開前CIで確認

### Music Project Home v0.19-dev

- 創作状態（探索中 / 比較中 / 保留・任意）
- 次にできる選択肢を最大3件表示
- 「今日はここまで」を正式な選択肢として維持

### Composition Sheet v0.9.1-dev

- beginner modeをlatestとして維持
- Home埋め込み時の曲データメニュー重複を防止

## Publication verification

公開PR `#277` のheadで、Demo Composer CI / Arrangement Lab CI / Song Project Integration CI / Composition Sheet CI / Divergence v0.17 / GitHub Pages / AI Monitoring Release CIが成功しました。

main merge後のGitHub Pages run `#501` も成功しています。

## Workflow

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → 必要ならCubasis → PC DAW / Cubase → 完成`

- Composition Sheet: 考える・意図を決める
- MIDI Archive/Analyzer: 集める・理解する・差を説明する
- Demo Composer: 作る・試す・発散する
- Arrangement Lab: 育てる・比較する・決める
- Music Project Home: 案内する・つなぐ
- Cubasis / Cubase: 本制作・完成

## Previous publications

### v0.17-dev — 2026-10-16

発散モードとProject Home v0.19を公開し、main側のv0.16 / v0.16.1 SongProject受け渡し修正・保存完了待ち・Arrangement Lab初期化待ち・Version表示修正を統合。

### v0.16.1-dev — 2026-10-16

mainでArrangement Lab受信初期化待ちとVersion / Build ID表示を修正。公開直前のmainは `800cd729da6231bb6820f44b79d15ebe81354233`。

### v0.16-dev — 2026-10-16

SongProject受信曲ID保持、保存完了待ち、交換情報の曲別保持、JSON復帰を修正。

### v0.15-dev — 2026-10-15

PR #255でmain/develop lineageを統合し、公開済みversion資産とSongProject境界回帰を確認。

## Stable

未認定です。Android実機での保存・PWA・主要操作・発散 / 収束モード・Song.mid書き出しと、必要なCubasis / Cubase実機でのImport / 再生 / MIDI構造確認が完了し、結果をRepositoryへ記録した場合のみstable tagを作成します。
