# AI_HANDOFF

ChatGPT / Codex と Claude の引き継ぎ正本。**作業を始める前にこの「現在の状態」だけ読めば再開できる**ように保つ。古い記録は末尾の「過去の引き継ぎ記録」へ移す(削除しない)。

## 現在の状態

最終更新: 2026-10-17(Claude / branch `claude/real-device-prep-20261017` 時点。develop未merge)

現在Version:
- Demo Composer `v0.17-dev`(package `0.17.0-dev`) — ルート`VERSION`
- Arrangement Lab `v0.15-dev` — 正本は`arranger/VERSION`
- Music Project Home `v0.19-dev` — `project-home/VERSION`
- Composition Sheet `v0.9.1-dev` — `sheet-app/`
- MIDI Archive / Analyzer `v0.25-dev` — **別Repository**(このRepoでは扱わない)

公開(main / GitHub Pages): Demo Composer `v0.17-dev` / Arrangement Lab `v0.14-dev` / Home `v0.19-dev`。Arrangement Lab v0.15-dev(収束モード)は**develop統合済み・main未公開**。

最新安定版:
- **未認定**(stable tagなし)。Android / Cubasis / Cubase実機確認が終わるまで作らない。

現在実装済み:
- Hub / Chord / Melody / Rhythm / Arrange / Sound / Demo Player / MIDI Export(Song.mid + パート別)、Project保存(IndexedDB)、AI相談テキストコピー、Decision Progress
- 発散モード(Demo Composer): Seed / Lock(5軸) / Branch / Keep / Freeze / Snapshot。**セッションと Keepライブラリ(上限40案)はIndexedDB `meta` storeに永続化**(`src/core/divergence-library.js` / `src/storage/divergence-store.js`)
- 収束モード(Arrangement Lab v0.15-dev): 全体→Section→Section×要素の採用 / まだ迷う / 不採用、Current Plan、「DAWで決める」持ち越し、Undo / Recovery、Plan共通Export
- SongProject v1による受け渡し(Analyzer→Demo→Lab→Home)、Final Song.midのDAW handoff gate(SMF Format 1 / 5 Track / PPQ 480 / 4/4)
- Music Project Home v0.19-dev(司令塔。Editorは持たない)

開発中:
- `claude/real-device-prep-20261017`(develop起点・未merge): 実機1曲完走の準備。Work代理E2Eで見つけたバグ3件を修正。
  - ↶ / ↷ が「📦 曲データ」ボタンに覆われUndo不能(`src/core/edit-history.css`、回帰: `scripts/browser-handoff-regression.cjs`)
  - DAW引き継ぎZIPが1コーラス規模で書き出せない(`arranger/src/v05-workflow.js`の`createStoreZip`、回帰: `arranger/tests/v05-workflow.test.mjs`)。※`arranger/`の変更なのでChatGPT側にも共有する。
  - Lab「受け取った曲を反映」直後の再読み込みで曲が消える(P1)。`arranger/src/app.js`の`importFile()`新規曲パスで、検証済みなら`arrangerSession.save()`を1回呼ぶ。回帰: `scripts/browser-handoff-regression.cjs`(修正前は失敗を確認)。※`arranger/`の変更・ユーザー承認済み。ChatGPT側へ共有する。
- Work代理検証(390px・Android相当UA、**実機ではない**): Test Project `E2E_ONE_CHORUS_TEST`(5 Section / 32小節 / Chord・Main・裏メロ・Bass・Drums)でDemo → Lab → Song.midを通過。Song.mid(5 Track)は独立パーサで元Demoデータと照合して34/34一致。自動テスト164件PASS(Node 147 / Browser 17)。lint / typecheckはscriptなし(NOT AVAILABLE)。
- 実機で確認する項目(USER TEST REQUIRED): Android PWA起動・再生音、Song.mid保存、Cubasis / BandLab Import・再生、Cubase Import・再生、1コーラス完走。

次に実装:
- **新機能は止める。** まずAndroid実機で1曲を通す(Demo Composer → Arrangement Lab → Song.mid → Cubasis → Cubase)。
- 実機で見つかった問題の修正。
- その結果を`docs/DAW_HANDOFF_VERIFICATION.md`に記録 → 全項目PASSで初めてstable認定を検討。
- 実機後の候補(まだ着手しない): MIDI AnalyzerのAnalyzer / Archive分離、Keep案のArrangement Lab収束モードへの受け渡し(`divergenceStore.loadLibrary(projectId)`が読み取り口)、Arrangement Lab側の発散セッション永続化。

既知の問題:
- Android実機(PWA)・Cubasis・Cubaseは**すべて未確認**。自動テストのPASSは実機PASSを意味しない。
- 収束補助状態はPlan JSONだけでは別端末へ移らない。
- 発散モードの保持(アプリ切替・再起動後)は実機未確認。
- `dist/`はGit管理下。build成果物はfeature branchでコミットしない。
- 発散モードがDemo ComposerとArrangement Labの両方にあり、仕様が重複気味(統合は実機後に検討)。
- `npm test`の一括コマンドはない。`package.json`の`test:*`を個別に実行する(`test:build-cache`は先に`npm run build`が必要)。
- ルートの`undefined/`フォルダ(スクショ保存先の誤り)は未整理。
- `arranger/tests/browser.test.cjs` は探索モード専用。初心者モード(既定)では `.mix-row` 等が非表示のため、CIと同じく `ARRANGER_URL='http://127.0.0.1:8080/arranger/?mode=explore'` を付けて実行する(付けないと `#mix-btn` でタイムアウトする)。
- (仕様)Labの初心者モードでは「この案を採用」「Song.mid(採用案)」「編曲プランJSON」が非表示。⑥では「変更後 Song.mid」(6 Track・Chordsはch5)が出る。DAW gate準拠の5 Track版は「📦 曲データ → MIDI保存」か「もっと試す」で出す。両者のNote内容は一致を確認済み。
- (仕様)Labの編集(Section密度など)は「この案を採用」・判断・Exportで保存される。その前に再読み込みすると失われる。
- (仕様)Demo ComposerはBassがある間コードを追加できない。テンプレート構成で前のSectionにコードの空きがあると次のSectionへコピーできない(案内文は出る)。Bass候補は現在の1小節にだけ入る。
- 未commitのbuildでは build idが同じため、Service Workerが古いCSS / JSを返すことがある(公開時はcommitごとにbuild idが変わる)。

触らない部分:
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4 / PPQ 480 / 4/4固定(Migrationなしに変更しない)
- `versions/`、`arranger/versions/`、`sheet-app/versions/`、restore / backup branch、tag(削除・上書き禁止)
- 他appの所有領域(下記Data ownership)
- `main`への直接変更、`main` / `develop`へのforce push
- `arranger/`配下の既存ファイルの統合作業はChatGPT側の担当(`docs/CONVERGENCE_CONTRACT.md`)。Claudeが触る場合は事前に確認。

最近の重要な設計判断:
- 思想は「AIで自動完成させず、発散 → 比較 → 理解 → 収束を人間が往復して自分で決める」。100%達成を目的にしない(探索中 / 比較中 / 保留 / 任意は正常な状態)。
- 収束機能を先に最小版で入れ、その後は新機能を止めて実機確認に入る(2026-10-16決定)。
- MIDI Analyzerは同一リポジトリ・同一PWAのままAnalyzer(今見る3つ)とArchive(素材保存)へUI / Module分離する方針。Arrangement Lab完了後に着手。
- Arrangement LabからDemo Composerへ戻す場合は、元Projectを上書きせず明示的にForkする。
- 作業flow: `develop`起点でClaude専用branch(`claude/*`)を切り、tests / CIが通ればClaudeが`develop`へmergeする。PRは小さく乱立させず、まとめる。

現在のデータSchema:
- Demo Composer Project Schema `3` / SongProject `v1`(`schemaVersion: 1`) / Arrangement Plan Schema `4` / PPQ `480` / `4/4`固定
- 一時受け渡しKey: `music-project-songproject-handoff-v1`
- IndexedDBのDB_VERSIONは発散モードの追加でも変更していない

## Data ownership

- MIDI Analyzer: `analysis`, `reference`, `assets`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- 共通: `basic`, `lineage`, `compatibility`
- Music Project Home: Navigation / Workflow表示のみ(SongProjectのOwnerにならない)

## 正式Workflow

`作曲シート → 必要ならMoises → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → 必要ならCubasis → PC DAW / Cubase → 完成`

一本道として強制しない。`発散 ↔ 比較 ↔ 収束`を自由に往復できる。

## Release / Branch rules

- `main`: 自動テスト・build・必要な回帰CIに合格した公開元(GitHub Pages)
- `develop`: 開発統合用
- `chatgpt/*` / `claude/*`: AI作業branch
- `stable tag`: Android実機とCubasis / Cubase実機の確認が完了した版のみ

## 実機確認ゲート(stable認定の条件)

- [ ] Android Chrome / PWAで起動・縦画面操作・オフライン再起動
- [ ] Song.midの保存(Files / Download / Share)
- [ ] CubasisでImport / 再生 / Tempo / 4/4 / Track分離 / Note timing
- [ ] CubaseでImport / 再生 / Channel / Marker / Note timing
- [ ] 収束モード・発散モード(Keep保存)の保持確認
- [ ] 結果を`docs/DAW_HANDOFF_VERIFICATION.md`へ記録

## 作業開始・終了時

- 開始時: `README.md` → `VERSION` → このファイル → `PRODUCT_SPEC.md` → `ARCHITECTURE.md` → `DATA_SCHEMA.md` → `CHANGELOG.md`
- 終了時: 変更があればこのファイルの**「現在の状態」を更新**する(新しい記録を末尾に積むだけにしない)。古くなった記録は「過去の引き継ぎ記録」へ移す。

## 主な参照先

`docs/CURRENT_RELEASE.md` / `docs/REAL_DEVICE_TEST.md` / `docs/DAW_HANDOFF_VERIFICATION.md` / `docs/DIVERGENCE_MODE.md` / `docs/CONVERGENCE_INTEGRATION.md` / `docs/CONVERGENCE_CONTRACT.md` / `docs/SONG_PROJECT.md` / `docs/RELEASE_POLICY.md` / `VERSION_HISTORY.md` / `CHANGELOG.md`

---

# 過去の引き継ぎ記録(履歴・参考)

以下は2026-10-17以前の記録。古い「現在の状態」の記述(v0.15-dev / v0.16-devなど)は当時のもので、**現在値は上の「現在の状態」が正**。


## 2026-10-17 — Arrangement Lab v0.15-dev（収束モード統合候補）

【追加】
- 全体 / Section / 個別の採用・まだ迷う・不採用、定型理由、上書き解除、Undo、Recovery。
- 中央保存、dirty共通入口、validation gate、編集済み候補poolの再読込保持。
- 同一projectIdのrebase、Current Plan共通Export、未決定のLab/DAW選択とZIP指示。

【修正】
- 保存失敗でExportまで停止する経路を解消し、state/trackerを保存成功後だけ更新。
- snapshotによるsource revision巻き戻し、曲間Journal混在、再読込時の編集済み判断参照切れを防止。

【互換性・状態】
- Plan Schema 4 / SongProject v1 / Demo Schema 3 / PPQ 480 / 4/4を維持。本体とHomeは変更しない。
- ルートVERSIONはDemo Composer v0.17-devを維持。Labの正本はarranger/VERSION。
- 収束補助状態はPlan JSONだけでは別端末へ移らない。
- develop向けPRのみ。main公開・自動merge・stable認定は行わない。
- Android / Cubasis / Cubase実機未確認。検証結果はdocs/CONVERGENCE_VERIFICATION_v0.15-dev.md。

検証確定: 静的68/68、GitHub Arrangement Lab CI 38938808935（全step成功）。コード確定5d666c4。Android / Cubasis / Cubase実機未確認、stable未認定。PR #271はdevelop向けで、自動merge禁止。

詳細: `docs/CONVERGENCE_INTEGRATION.md` / `docs/REAL_DEVICE_TEST.md`。以下は過去の引き継ぎ記録。


更新日: 2026-10-15

## (旧)現在の状態 2026-10-15

- Published main: Demo Composer `v0.15-dev`
  - remote reference: `main`
  - reconciliation PR: #255
  - reconciliation merge: `0aa2d4d7ec2329cd01bcef8cca4cc527c0133b19`
  - GitHub Pages公開元は`main`
- Development integration branch:
  - `develop`: 公開済み`main`のcatch-up済み
- Current feature candidates:
  - Demo Composer `v0.16-dev`: `chatgpt/decision-progress-home-v0.16`
  - Music Project Home `v0.19-dev`: 同Branch内
- Stable: 未認定

公開中のGitHub Pagesは`main`のv0.15-devです。v0.16-dev / Home v0.19-devは開発候補であり、PR / hosted CI / develop統合前に公開済みとは扱いません。

Component versions / candidates:

- Demo Composer published: `v0.15-dev`
- Demo Composer development candidate: `v0.16-dev` / package `0.16.0-dev`
- Arrangement Lab: `v0.13-dev`
- Music Project Home development candidate: `v0.19-dev`
- Composition Sheet latest: `v0.9.1-dev`
- SongProject: v1
- Demo Composer Project Schema: 3
- Arrangement Plan Schema: 4
- PPQ: 480
- time signature: 4/4固定

## 2026-10-17 Demo Composer 発散モード: 保存とKeepライブラリ (Claude)

Branch: `claude/v0.18-divergence-keep-persist`(develop起点)。詳細・仕様は `docs/DIVERGENCE_MODE.md` §12。

- 発散セッションをsessionStorageからIndexedDB(`meta` store)へ移し、タブ/アプリを閉じても続きから使えるようにした。DB_VERSION / Project Schema 3 / SongProject v1は変更なし。
- Keepライブラリ(上限40案)を追加。Freezeしても他のKeep案が残り、「ツリーに呼び出す」で次の探索に使える。古い元案の案をFreezeする時は確認ダイアログを出す。
- 新規: `src/core/divergence-library.js`(純関数) / `src/storage/divergence-store.js` / `scripts/divergence-library-smoke-test.mjs` / `scripts/divergence-library-browser.test.cjs`。変更: `src/core/divergence.js`(`unkeepDivergenceBranch` / `importDivergenceBranch` 追加のみ) / `src/storage/indexeddb-storage.js`(`saveMetaEntry` / `loadMetaEntry` / `deleteMetaEntry` 追加のみ) / `src/divergence/app.js`。
- **未対応(意図的)**: Arrangement Labの収束モード(保留)へのKeep案の受け渡しと、Arrangement Lab自身の発散セッションの永続化。`docs/CONVERGENCE_CONTRACT.md`の分担(収束の既存ファイル統合はGPT側)に従い、`arranger/`配下の既存ファイルは編集していない。読み取り口は `divergenceStore.loadLibrary(projectId)`。
- **未確認**: Android実機(PWA)でのアプリ切替・再起動後の保持。`dist/`はGit管理下のため、この作業ではbuild成果物をコミットしていない。

## 2026-10-15 current feature work

### ① Hub / Decision Progress

`src/hub/ai-monitoring.js`の主表示をFeature Usageの達成率からDecision Progressへ変更。

状態:

- 未着手
- 探索中
- 比較中
- 保留
- 採用
- 完了
- 任意

方針:

- 100%達成を目的にしない
- 探索中 / 比較中 / 保留 / 任意を正常状態として扱う
- Feature Usageは端末内の補助情報として残す
- Decision Progress専用の必須Schema fieldを追加しない
- 既存Project内容、採用履歴、端末内操作履歴から導出する

詳細: `docs/CREATIVE_DECISION_PROGRESS.md`

### ③ Music Project Home v0.19-dev

HomeはEditor化せず司令塔として維持。

追加したRead Model / UI:

- 探索中
- 比較中
- 保留 / 任意
- 次にできる選択肢を最大3件程度
- `今日はここまで`

`今日はここまで`を選んでもSongProjectは変更しません。必要なら既存のHome端末内メモだけ残します。

互換性:

- SongProject v1変更なし
- HomeはSongProjectのOwnerにならない
- 既存`composition / arrangement / export / lineage`を読み取り専用で使用
- 既存JSON読込 / Backup / 作曲シート連携 / Claudeリンク / Homeメモを維持

詳細: `project-home/CHANGELOG.md`

## Reconciliation status

PR #252 / #253 / #254を含む統合候補は、PR #255からmerge commit方式で`main`へ統合・公開済みです。reset / squash / rebase / force pushは使用していません。

保持したもの:

- main-only release workflow / public docs / AI monitoring entry
- `versions/`、`arranger/versions/`、`sheet-app/versions/`の公開済み資産
- develop側の全履歴と検証済み機能
- 既存restore / backup branches / tags

PR #255のhosted CIとmain統合後のPages / Release Check / AI Monitoringは成功済みです。その後のmain→develop catch-upも完了しています。

## 2026-10-15 previous integration contents

### PR #252 — SongProject v1 boundary

- MIDI Analyzer-shaped `analysis` / `reference` / `assets`を保持
- JSON normalize / serialize / parse round-tripを確認
- Demo Composer、Arrangement Lab、Composition Sheetが他app所有領域を消さないことを回帰化
- lineage / assets / compatibilityを保持

### PR #253 — Project Home DAW readiness

- `arrangerProjectId`だけではDAW-readyにしない
- `export.lastSongMidiAt`または`lastDawHandoffAt`を完了条件に使用
- Arrangement LabのSong.mid成功時にactive SongProjectへ`lastSongMidiAt`を記録

### PR #254 — DAW handoff gate

- Song.midをSMF Format 1として検証
- Track数5、PPQ 480、Tempo、4/4 meta eventをexact検証
- Chords / Melody / Counter Melody / Bass / Drumsとchannel 1 / 2 / 4 / 3 / 10を検証
- Section Markerと代表NoteのstartTick / endTickを検証
- Android / Cubasis / Cubase実機結果テンプレートを追加

## Validation evidence

公開済みv0.15-devのreconciliation工程では次を確認済みです。

- 静的チェック: 178件PASS
- Browser: 17 invocation PASS
- 公開済みversion資産: 38件すべて記録済みblobと一致
- 既存remote restore / backup / tag refs: 162件すべて保持
- PR #252 / #253 / #254の当時のCI: PASS
- Music Project Home: Home browser 360 / 390 / 430 / 1440px PASS
- Arrangement採用だけではDAW-readyにならず、実Song.mid download後のみDAW工程へ進むことを確認
- Homeメモ再読込、SongProject JSON backup round-trip、Analyzer / Demo所有領域の保持を確認

v0.16-dev / Home v0.19-devについては、新しいfeature branchでsmoke testを追加済みです。hosted CIの結果はPR作成後に確認し、未実行時点ではPASSとみなしません。

## 正式Workflow

`作曲シート → 必要ならMoises → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → 必要ならCubasis → PC DAW / Cubase → 完成`

- Composition Sheet = 考える・意図を決める
- MIDI Analyzer = 集める・理解する（任意）
- Demo Composer = 作る・試す
- Arrangement Lab = 育てる・比較する・決める / Final Song.midを書き出す
- Music Project Home = 案内する・つなぐ・今できる選択肢を示す
- Cubasis = 必要に応じたモバイルDAW作業
- PC DAW / Cubase = 本制作・完成

一本道として強制しません。`発散 ↔ 比較 ↔ 収束`を自由に往復可能にします。

Project HomeはEditor機能を重複所有しません。Arrangement LabからDemo Composerへ戻す場合は、元Projectを上書きせず明示的にForkします。

## Data ownership

SongProject v1:

- MIDI Analyzer: `analysis`, `reference`, `assets`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- Common: `basic`, `lineage`, `compatibility`
- Music Project Home: Navigation / Workflow表示のみ

Compatibility rules:

- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4をMigrationなしに変更しない
- PPQ 480 / 4/4固定方針を変更しない
- 他app所有領域を編集時に消さない
- Decision Progressだけのために保存Schemaを増やさない
- 過去versionファイル、restore / backup branch、tagを削除・上書きしない

## Branch / release rules

- `develop`: 開発統合用
- `main`: 自動テスト・build・必要な回帰CIに合格した公開元
- `stable tag`: Android実機とCubasis / Cubase実機の確認が完了した版のみ
- `main`へ直接変更しない
- `main` / `develop`へforce pushしない
- main統合後は必要に応じて別PRでdevelopをcatch upする

Current restore points:

- `restore/develop-before-decision-progress-home-20261015`

## Remaining gates

- v0.16-dev / Home v0.19-devのhosted CI
- feature branchからdevelopへのPR統合
- Android Chrome/PWAでDecision Progress / Home選択肢の縦画面・タップ操作確認
- Android Chrome/PWAでSong.midの保存、Files / Download / Shareを確認
- CubasisでImport / 再生 / Tempo / 4/4 / Track分離 / Note timingを確認
- CubaseでImport / 再生 / Channel / Marker / Note timingを確認
- 実機結果を`docs/DAW_HANDOFF_VERIFICATION.md`へ記録
- ①〜⑤統合後のAdversarial Review

実機gateがすべて完了するまでstable tagは作成しません。

## Primary references

- `docs/CREATIVE_DECISION_PROGRESS.md`
- `docs/RECONCILIATION_RESULT_2026-10-15.md`
- `docs/PROJECT_HOME_FINAL_VERIFICATION_2026-10-15.md`
- `docs/DAW_HANDOFF_VERIFICATION.md`
- `docs/SONG_PROJECT.md`
- `docs/RELEASE_POLICY.md`
- `VERSION_HISTORY.md`
- `CHANGELOG.md`
- `project-home/CHANGELOG.md`
