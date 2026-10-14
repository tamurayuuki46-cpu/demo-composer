# Work handoff — 2026-10-15

対象Repository: `tamurayuuki46-cpu/demo-composer`

この文書は高推論Workで継続するための引き継ぎ。実行前に必ずRepositoryの現在状態を再取得し、このsnapshotより新しいcommit / PRを優先する。

## 絶対ルール

- 過去Version / Branch / Tag / Backup / restore pointを削除・上書きしない
- `main`へ直接変更しない
- `main` / `develop`へforce pushしない
- 大きな変更前に新しいrestore pointを作る
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4を、明示したMigrationなしに破壊しない
- PPQ 480 / 4/4固定方針を勝手に変えない
- stable tagはAndroid実機 + Cubasis実機 + Cubase実機の確認後のみ

## ユーザーが指定した優先順

1. SongProject v1テスト強化
2. main / develop安全整理
3. VERSION / README / AI_HANDOFF同期
4. Music Project Home司令塔仕上げ
5. Android → MIDI → Cubasis / Cubase実機検証
6. 上記完了後に細かいUX改善

## このチャットで作成したrestore points

- `restore/main-before-songproject-branch-sync-20261015`
- `restore/develop-before-songproject-branch-sync-20261015`
- `restore/develop-before-project-home-daw-ready-20261015`
- `restore/develop-before-daw-handoff-verification-20261015`

削除しない。

## 1. SongProject v1テスト強化 — 完了

PR #252を`develop`へmerge済み。

Merge commit:
`1aeb72850adeb435b5692d56774e22e1221a41a2`

追加:
`script/song-project-cross-app-boundary-smoke-test.mjs`ではなく、正しいpathは `scripts/song-project-cross-app-boundary-smoke-test.mjs`。

検証対象:

- MIDI Analyzer-shaped analysis / reference / assets
- JSON normalize / serialize / parse round-trip
- Demo Composer編集でAnalyzer所有領域を保持
- Arrangement Lab編集でAnalyzer / Demo所有領域を保持
- Composition Sheet編集でAnalyzer / Demo / Arrangement所有領域を保持
- lineage / assets / compatibility保持

CIへ組み込み済み。PR時点でDemo Composer CI / Song Project Integration CI PASS。

## 2. main / develop整理 — 調査・準備まで完了、本統合は未実施

専用staging branch:
`integration/main-develop-reconcile-20261015`

読むファイル:

- `docs/BRANCH_RECONCILIATION_2026-10-15.md`
- `docs/DOC_SYNC_AUDIT_2026-10-15.md`
- この文書

調査時点でmain/developは大幅にdiverged。commit数だけで判断しないこと。

重要な観測:

- top-level `VERSION`はmain/developとも`v0.15-dev`
- `arranger/VERSION`はmain/developとも`v0.13-dev`
- SongProject coreは履歴分岐に比べ実装差が小さい
- 一方でComposition Sheet latestとProject Homeには実際のcontent差がある
- main固有の公開修正を消さず、developの新機能を選択的に統合する必要あり

推奨:

1. Workでcloneして`git log --graph --all` / merge-base / `git diff main..develop` / `git cherry`等を確認
2. integration branchを現在main headへ安全に更新する方法を検討
3. 実ファイル差分を「同等」「develop-only」「main-only」「docs metadata」に分類
4. blind merge / resetは禁止
5. 必要な差分のみ統合
6. 全CI
7. PR経由でmain
8. main確定後にdevelopを正常な開発統合線へ戻す。古いdevelop headはrestore branchで保存

## 3. VERSION / README / AI_HANDOFF同期 — audit済み、更新は②の後

`docs/DOC_SYNC_AUDIT_2026-10-15.md`を参照。

確認済みのズレ:

- `VERSION`: v0.15-dev
- develop README: v0.14-dev表記が残る
- main README: v0.5-dev表記が残る
- develop package: 0.15.0-dev
- main package: 0.10.0-dev
- develop AI_HANDOFF: 新しい追補に加えて古い`現在Version: v0.9-dev`節が残る
- main AI_HANDOFF: 冒頭がv0.5-dev
- develop Project Home CHANGELOG: v0.18-dev
- main Project Home CHANGELOG: v0.17-dev
- develop Composition Sheet latest: v0.9.1-dev
- main Composition Sheet latest: v0.9-dev

②のlineage確定後に一括同期する。先に同期すると二度手間になる。

## 4. Music Project Home司令塔 — 重要修正をdevelopへmerge済み

PR #253 merge済み。

Merge commit:
`0cccda3b4bb055a95f6345b4d00124f3dbb1c22e`

修正内容:

- 旧判定はArrangement Labの`arrangerProjectId`があるだけでDAW-readyになっていた
- 現在は実際の`export.lastSongMidiAt`または`lastDawHandoffAt`が必要
- Arrangement LabのSong.mid成功時にactive SongProjectへ`lastSongMidiAt`を記録
- Project Home smoke testで「編曲採用だけではDAW未完」「Song.mid書き出し後にcomplete」を固定

PR #253では以下がPASS:

- Demo Composer CI
- Song Project Integration CI
- Project Home Sheet Link CI
- Arrangement Lab CI（Mobile Chromium E2E含む）

追加検討するなら、Arrangement LabからProject Homeへ戻るlocalStorage handoffを設ける余地はある。ただし必須かはUX実機確認後に判断し、先に機能を増やしすぎない。

## 5. Android → Song.mid → Cubasis / Cubase — 自動化部分を作業中

PR #254:
`test: strengthen Android to Cubasis/Cubase DAW handoff gate`

作業branch:
`test/daw-handoff-verification-20261015`

この文書作成時点ではPR状態を必ず再確認すること。merge済みならやり直さない。

追加内容:

- `arranger/tests/song-midi.test.mjs`強化
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
  - 自動テストと実機テストを分離
  - Android / Cubasis / CubaseのPASS条件
  - stable gate
  - 実機結果テンプレート
- `docs/REAL_SONG_TEST.md`
  - 旧「Hubから最終Song.mid」導線を修正
  - Final Song.midはArrangement Lab採用案から出力する正式Workflowへ同期

実機でしかできない残作業:

- Android Chrome/PWAでSong.midを実際に保存
- Android Files / Download / Share確認
- Cubasis実機Import / 再生 / Tempo / 4/4 / track分離 / note timing
- Cubase実機Import / 再生 / channel / marker / note timing
- 結果をRepositoryへ記録

これらが終わるまでstable tagは禁止。

## 6. UX改善 — 未着手で正しい

実機テストで見つかった問題だけを優先する。

まず「減らす / まとめる / 分かりやすくする」で解決できないか確認し、大きな新機能を先に増やさない。

## Workで次にやること

1. PR #254の現在状態とCIを確認。PASS済み・merge可能ならdevelopへmerge
2. main/developの最新headを再取得
3. ②branch reconciliationを高推論で実施
4. reconciliationの全CIを通す
5. PR経由でmainへ統合
6. ③のdocs metadata syncを実施
7. Project Home / public Pagesの最終回帰
8. Android/Cubasis/Cubaseの実機部分はユーザーの実機結果を受けて記録・修正
9. stable条件を満たした場合だけstable tag候補を提示/作成
10. 最後にUX改善

## 完了報告フォーマット

- current develop/main heads
- mergeしたPR
- 作成したrestore points
- CI結果
- main/develop divergenceがどう解消されたか
- VERSION / README / AI_HANDOFF整合状況
- Android / Cubasis / Cubase実機状況
- stable判定: 可 / 不可（理由）
- 残タスク
