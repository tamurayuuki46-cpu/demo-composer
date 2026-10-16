# Current Release

更新日: 2026-10-16

## Current source

- Demo Composer: `v0.16-dev`
- Release Branch: `release/handoff-integrity-20261016`（main基準）
- Restore: `restore/main-before-handoff-integrity-20261016` / `8661c88a84a5efc051110f089a7e3f8bfd4cbfe7`
- MIDI Archive/Analyzer: `v0.25-dev` / `5f21e143b0ebf8bc54e539ece08cb4dcf6e04084`
- Arrangement Lab: `v0.13-dev`、Music Project Home: `v0.18-dev`、Composition Sheet: `v0.9.1-dev`
- Contracts: Project Schema 3 / SongProject v1 / Arrangement Plan Schema 4

v0.16は曲ID・所有情報の保持と保存完了待ちを修正。360/390/430pxでAnalyzer → Demo → Arrangementの明示反映、キャンセル・保存失敗時の候補保持、元曲保存、再読み込み、一時storage失敗時のJSON復帰を検証する。重大なConsole errorなし。
実際の公開commitは公開URLの `build.json`、hosted CIと公開結果はGitHub Actionsを正本とする。stable tag未作成。

## Previous publication — v0.15-dev (2026-10-15)

- Demo Composer: `v0.15-dev`
- remote reference: `main`
- reconciliation merge: `0aa2d4d7ec2329cd01bcef8cca4cc527c0133b19`
- published candidate head: `8a73fcb55029f4bdb8d191d4e552f5122fc380fd`
- main統合PR: #255
- Arrangement Lab: `v0.13-dev`
- Music Project Home: `v0.18-dev`
- Composition Sheet latest: `v0.9.1-dev`
- GitHub Pages公開元: `main`

この節は現在remote `main`から公開されているlineageを示します。文書同期commit自身のSHAは自己参照せず、公開を確定したPR #255のmergeと`main`参照で管理します。

## Branch alignment

- published source branch: `integration/main-develop-reconcile-20261015`
- published source head: `8a73fcb55029f4bdb8d191d4e552f5122fc380fd`
- reconciliation merge inside source history: `de64a3323e35cc4915dd1adba8471c296557033f`
- develop head: `b322cb47282261db720bf3b74caf455cb56c9cf7`
- includes: PR #252 / #253 / #254 / #255

統合候補はPR #255からmerge commit方式で`main`へ統合・公開済みです。`develop`は公開時点では元headのままで、別PRによる`main`からのcatch-upが残っています。

## Contracts

- Demo Composer Project Schema: 3
- SongProject: v1 (`schemaVersion: 1`)
- Arrangement Plan Schema: 4
- PPQ: 480
- time signature: 4/4固定
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## Workflow

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → Cubasis / Cubase → 完成`

- Composition Sheet: 決める
- MIDI Analyzer: 集める・理解する（任意）
- Demo Composer: 作る
- Arrangement Lab: 育てる / Final Song.midを書き出す
- Music Project Home: 案内する / 次にやることを示す
- Cubasis / Cubase: 本制作・完成

## Publication validation

- Local static checks: 178 PASS
- Browser invocations: 17 PASS
  - 初回は旧Composition Sheet v0.6とv0.8が失敗し、コード無変更の単独rerunでPASS
  - intermittent causeは未確定
- Published version assets: 38 preserved
- Existing remote restore / backup / tag refs: 162 preserved
- PR #255 hosted CI: exact head `8a73fcb55029f4bdb8d191d4e552f5122fc380fd`で7件PASS
- Post-merge Pages: run `38662526913` PASS
- Post-merge Release Check: run `38662526696` PASS
- Post-merge AI Monitoring: run `38662526651` PASS

## Stable

未認定です。Android実機での保存・PWA・主要操作・Song.mid書き出しと、Cubasis / Cubase実機でのImport / 再生 / MIDI構造確認が完了し、結果をRepositoryへ記録した場合のみstable tagを作成します。
