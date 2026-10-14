# Work handoff — 2026-10-15

対象Repository: `tamurayuuki46-cpu/demo-composer`

高推論Workで継続するためのsnapshot。実行前に必ずRepositoryの現在状態を再取得し、この文書より新しいcommit / PRを優先する。

## 絶対ルール

- 過去Version / Branch / Tag / Backup / restore pointを削除・上書きしない
- `main`へ直接変更しない
- `main` / `develop`へforce pushしない
- 大きな変更前にrestore pointを作る
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4をMigrationなしに破壊しない
- PPQ 480 / 4/4固定方針を勝手に変えない
- stable tagはAndroid実機 + Cubasis実機 + Cubase実機の確認後のみ

## ユーザー指定の優先順

1. SongProject v1テスト強化
2. main / develop安全整理
3. VERSION / README / AI_HANDOFF同期
4. Music Project Home司令塔仕上げ
5. Android → MIDI → Cubasis / Cubase実機検証
6. 最後にUX改善

## 作成済みrestore points

- `restore/main-before-songproject-branch-sync-20261015`
- `restore/develop-before-songproject-branch-sync-20261015`
- `restore/develop-before-project-home-daw-ready-20261015`
- `restore/develop-before-daw-handoff-verification-20261015`

削除しない。

## 1. SongProject v1テスト強化 — 完了

PR #252を`develop`へmerge済み。
Merge commit: `1aeb72850adeb435b5692d56774e22e1221a41a2`

追加: `scripts/song-project-cross-app-boundary-smoke-test.mjs`

固定した境界:

- MIDI Analyzer-shaped analysis / reference / assets
- JSON normalize / serialize / parse round-trip
- Demo Composer編集でAnalyzer所有領域を保持
- Arrangement Lab編集でAnalyzer / Demo所有領域を保持
- Composition Sheet編集でAnalyzer / Demo / Arrangement所有領域を保持
- lineage / assets / compatibility保持

CI組み込み済み。

## 2. main / develop整理 — 調査・準備まで完了、本統合は未実施

専用staging branch:
`integration/main-develop-reconcile-20261015`

まず読む:

- `docs/BRANCH_RECONCILIATION_2026-10-15.md`
- `docs/MAIN_ONLY_RELEASE_ASSETS_2026-10-15.md`
- `docs/DOC_SYNC_AUDIT_2026-10-15.md`
- この文書

2026-10-15の最終確認時点:

- main head: `28f85e64adeed26da1d40fc491723438ffecd2f9`
- developはmainに対して `ahead 397 / behind 114`
- merge base: `365b577685cf74c512d5f84e3c78ca6ecfb0e7e9`

commit数だけで機能差を判断しない。

重要:

- top-level `VERSION`はmain/developとも`v0.15-dev`
- `arranger/VERSION`はmain/developとも`v0.13-dev`
- SongProject coreは履歴分岐に比べ実装差が小さい
- Composition Sheet latest / Project Homeには実content差がある
- mainにはdevelopに無い公開専用資産がある
  - `.github/workflows/ai-monitoring-release-ci.yml`
  - `docs/CURRENT_RELEASE.md`
  - `docs/MOBILE_FIRST_WORKFLOW_MAIN.md`
  - `project-home/VERSION`
  - public-specific changelog / smoke test等

したがってblind `develop → main` merge / resetは禁止。

Workではlocal cloneして最低限以下を確認:

```text
git merge-base main develop
git log --graph --decorate --oneline --all
git log develop..main --name-status
git log main..develop --name-status
git diff --name-status main..develop
git diff --name-status develop..main
```

差分を以下に分類して必要分だけintegration branchへ統合:

- same/equivalent
- main-only release infrastructure
- develop-only verified feature
- stale/generated metadata
- uncertain / requires test

全CI後、PR経由でmainへ。main確定後にdevelopを正常な開発統合線へ戻す。古いdevelop headはrestore branchで保存する。

## 3. VERSION / README / AI_HANDOFF同期 — audit済み、更新は②の後

`docs/DOC_SYNC_AUDIT_2026-10-15.md`参照。

確認済みのズレ:

- `VERSION`: v0.15-dev
- develop README: v0.14-dev表記
- main README: v0.5-dev表記
- develop package: 0.15.0-dev
- main package: 0.10.0-dev
- develop AI_HANDOFF: 古い`現在Version: v0.9-dev`節が残る
- main AI_HANDOFF: 冒頭v0.5-dev
- develop Project Home CHANGELOG: v0.18-dev
- main Project Home CHANGELOG: v0.17-dev
- develop Composition Sheet latest: v0.9.1-dev
- main Composition Sheet latest: v0.9-dev

②のlineage確定後に一括同期する。README / AI_HANDOFFでは「development」「published main」「stable」を分けて書く。

PR #252 / #253 / #254の内容も最終CHANGELOG / VERSION_HISTORYへ反映すること。

## 4. Music Project Home司令塔 — 重要修正完了

PR #253を`develop`へmerge済み。
Merge commit: `0cccda3b4bb055a95f6345b4d00124f3dbb1c22e`

修正:

- Arrangement Labの`arrangerProjectId`だけではDAW-readyにしない
- `export.lastSongMidiAt`または`lastDawHandoffAt`でDAW-ready判定
- Arrangement LabのSong.mid成功時にactive SongProjectへ`lastSongMidiAt`記録
- smoke testで「編曲採用だけではDAW未完」「MIDI書き出し後にcomplete」を固定

PR #253でPASS:

- Demo Composer CI
- Song Project Integration CI
- Project Home Sheet Link CI
- Arrangement Lab CI / Mobile Chromium E2E

Arrangement Lab→Project Homeの自動戻りhandoffは、実機UXで必要性が確認できてから検討。先に機能を増やしすぎない。

## 5. Android → Song.mid → Cubasis / Cubase — 自動化部分完了、実機のみ残り

PR #254を`develop`へmerge済み。
Merge commit: `b322cb47282261db720bf3b74caf455cb56c9cf7`

追加・更新:

- `arranger/tests/song-midi.test.mjs`
  - SMF Format 1
  - 実MTrk count = 5
  - PPQ 480
  - Chords / Melody / Counter Melody / Bass / Drums
  - channel ch.1 / 2 / 4 / 3 / 10
  - exact Tempo meta payload
  - exact 4/4 meta payload
  - Section Marker数
  - Note On / Off
  - Melody / Counter / Bass / Kickの具体的startTick / endTick
- `docs/DAW_HANDOFF_VERIFICATION.md`
  - 自動テストと実機を分離
  - Android / Cubasis / Cubase PASS条件
  - stable gate
  - 実機結果テンプレート
- `docs/REAL_SONG_TEST.md`
  - Final Song.midをArrangement Lab採用案から出力する現行Workflowへ更新

PR #254でPASS:

- Demo Composer CI
- Song Project Integration CI
- Arrangement Lab CI / Mobile Chromium E2E

実機でしかできない残り:

- Android Chrome/PWAからSong.mid実保存
- Android Files / Download / Share確認
- Cubasis実機Import / 再生 / Tempo / 4/4 / track分離 / note timing
- Cubase実機Import / 再生 / channel / marker / note timing
- 実機結果をRepositoryへ記録

これらが終わるまでstable tagは禁止。

## 6. UX改善 — 未着手で正しい

実機テストで見つかった問題だけを優先。
まず「減らす / まとめる / 分かりやすくする」で解決できないか確認し、大きな新機能を先に増やさない。

## Workで次にやること

1. main/developの最新headを再取得
2. ②branch reconciliationを高推論で実施
3. 全CI
4. PR経由でmainへ統合
5. ③VERSION / README / AI_HANDOFF / CHANGELOG / VERSION_HISTORY同期
6. Project Home / public Pages最終回帰
7. Android/Cubasis/Cubase実機結果を受けて記録・必要修正
8. stable条件を満たした場合だけstable tag
9. 最後にUX改善

## 完了報告

- current develop/main heads
- mergeしたPR
- restore points
- CI結果
- main/develop divergence解消方法
- VERSION / README / AI_HANDOFF整合状況
- Android / Cubasis / Cubase実機状況
- stable判定: 可 / 不可（理由）
- 残タスク
