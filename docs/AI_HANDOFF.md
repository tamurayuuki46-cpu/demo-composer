# AI_HANDOFF

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
- `docs/REAL_DEVICE_TEST.md`
- `docs/SONG_PROJECT.md`
- `docs/RELEASE_POLICY.md`
- `VERSION_HISTORY.md`
- `CHANGELOG.md`
- `project-home/CHANGELOG.md`
