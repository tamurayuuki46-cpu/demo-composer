# Current Release

更新日: 2026-10-15

## Published main

- Demo Composer: `v0.15-dev`
- remote main head: `28f85e64adeed26da1d40fc491723438ffecd2f9`
- main統合PR: #249
- Arrangement Lab: `v0.13-dev`
- Music Project Home: `v0.16-dev`
- Composition Sheet latest: `v0.9-dev`
- GitHub Pages公開元: `main`

この節は現在remote `main`から公開されているlineageを示します。

## Development candidate

- Demo Composer: `v0.15-dev`
- branch: `integration/main-develop-reconcile-20261015`
- reconciliation merge: `de64a3323e35cc4915dd1adba8471c296557033f`
- Arrangement Lab: `v0.13-dev`
- Music Project Home: `v0.18-dev`
- Composition Sheet latest: `v0.9.1-dev`
- includes: PR #252 / #253 / #254

Development candidateはまだ`main`へ統合・公開されていません。同じDemo Composer Version名でもpublished mainと内容が異なるため、branch / commitを併記します。

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

## Candidate validation

- Local static checks: 178 PASS
- Browser invocations: 17 PASS
  - 初回は旧Composition Sheet v0.6とv0.8が失敗し、コード無変更の単独rerunでPASS
  - intermittent causeは未確定
- Published version assets: 38 preserved
- Existing remote restore / backup / tag refs: 162 preserved
- Candidate hosted CI: 未実行

push / PR作成後、同一candidate headのhosted CIを確認してからmainへ統合します。

## Stable

未認定です。Android実機での保存・PWA・主要操作・Song.mid書き出しと、Cubasis / Cubase実機でのImport / 再生 / MIDI構造確認が完了し、結果をRepositoryへ記録した場合のみstable tagを作成します。
