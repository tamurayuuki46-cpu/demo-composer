# AI_HANDOFF

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

## 現在の状態

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
