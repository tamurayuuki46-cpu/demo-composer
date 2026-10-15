# Current Release

更新日: 2026-10-15

## Published main

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
