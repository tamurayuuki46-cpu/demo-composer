# AI_HANDOFF

更新日: 2026-10-15

## 現在の状態

- Development candidate: Demo Composer `v0.15-dev`
  - branch: `integration/main-develop-reconcile-20261015`
  - reconciliation merge: `de64a3323e35cc4915dd1adba8471c296557033f`
  - main側親: `427bd37`
  - develop側親: `b322cb47282261db720bf3b74caf455cb56c9cf7`
- Published main: Demo Composer `v0.15-dev`
  - remote head: `28f85e64adeed26da1d40fc491723438ffecd2f9`
  - GitHub Pages公開元は`main`
- Stable: 未認定

Development candidateは公開済みmainと同じVersion名ですが、PR #252 / #253 / #254を含む未公開の統合候補です。branch / commitを確認せず「公開済み」と扱わないでください。

Component versions:

- Demo Composer: `v0.15-dev` / package `0.15.0-dev`
- Arrangement Lab: `v0.13-dev`
- Music Project Home: `v0.18-dev`
- Composition Sheet latest: `v0.9.1-dev`
- SongProject: v1
- Demo Composer Project Schema: 3
- Arrangement Plan Schema: 4
- PPQ: 480
- time signature: 4/4固定

## Reconciliation status

公開済みmainの履歴を起点に、検証済みdevelop headを通常の2-parent mergeで統合しました。reset / squash / rebase / force pushは使っていません。

保持したもの:

- main-only release workflow / public docs / AI monitoring entry
- `versions/`、`arranger/versions/`、`sheet-app/versions/`の公開済み資産
- develop側の全履歴と検証済み機能
- 既存restore / backup branches / tags

この候補はまだremoteへpushされておらず、PRもありません。`main` / `develop`のremote headは変更されていません。

## 2026-10-15 integration contents

### PR #252 — SongProject v1 boundary

- MIDI Analyzer-shaped `analysis` / `reference` / `assets`を保持
- JSON normalize / serialize / parse round-tripを確認
- Demo Composer、Arrangement Lab、Composition Sheetが他app所有領域を消さないことを回帰化
- lineage / assets / compatibilityを保持

Merge to develop: `1aeb72850adeb435b5692d56774e22e1221a41a2`

### PR #253 — Project Home DAW readiness

- `arrangerProjectId`だけではDAW-readyにしない
- `export.lastSongMidiAt`または`lastDawHandoffAt`を完了条件に使用
- Arrangement LabのSong.mid成功時にactive SongProjectへ`lastSongMidiAt`を記録

Merge to develop: `0cccda3b4bb055a95f6345b4d00124f3dbb1c22e`

### PR #254 — DAW handoff gate

- Song.midをSMF Format 1として検証
- Track数5、PPQ 480、Tempo、4/4 meta eventをexact検証
- Chords / Melody / Counter Melody / Bass / Drumsとchannel 1 / 2 / 4 / 3 / 10を検証
- Section Markerと代表NoteのstartTick / endTickを検証
- Android / Cubasis / Cubase実機結果テンプレートを追加

Merge to develop: `b322cb47282261db720bf3b74caf455cb56c9cf7`

## Validation evidence

Reconciliation工程で次を確認済みです。

- 静的チェック: 178件PASS
- Browser: 17 invocation PASS
  - 初回は15/17。旧Composition Sheet v0.6とv0.8が一時失敗し、コード無変更の単独rerunでPASS
  - intermittent causeは未確定
- 公開済みversion資産: 38件すべて記録済みblobと一致
- 既存remote restore / backup / tag refs: 162件すべて保持
- PR #252 / #253 / #254の当時のCI: PASS

統合候補commitそのもののhosted CIは未実行です。push / PR作成後に、同一headでhosted CIを確認する必要があります。ローカル結果や過去PRのCIを候補headのCIとして扱わないでください。

## 正式Workflow

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → Cubasis / Cubase → 完成`

- Composition Sheet = 決める
- MIDI Analyzer = 集める・理解する（任意）
- Demo Composer = 作る
- Arrangement Lab = 育てる / Final Song.midを書き出す
- Music Project Home = 案内する / 次にやることを示す
- Cubasis / Cubase = 本制作・完成

Project HomeはEditor機能を重複所有しません。Arrangement LabからDemo Composerへ戻す場合は、元Projectを上書きせず明示的にForkします。

## Data ownership

SongProject v1:

- MIDI Analyzer: `analysis`, `reference`, `assets`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- Common: `basic`, `lineage`, `compatibility`

Compatibility rules:

- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4をMigrationなしに変更しない
- PPQ 480 / 4/4固定方針を変更しない
- 他app所有領域を編集時に消さない
- 過去versionファイル、restore / backup branch、tagを削除・上書きしない

## Branch / release rules

- `develop`: 開発統合用
- `main`: 自動テスト・build・必要な回帰CIに合格した公開元
- `stable tag`: Android実機とCubasis / Cubase実機の確認が完了した版のみ
- `main`へ直接変更しない
- `main` / `develop`へforce pushしない
- reconciliation PRはmerge commitで統合し、両親のancestryを保持する
- main統合後に別PRでmainからdevelopをcatch upする

## Remaining gates

- 統合候補を認証済みremoteへpush
- main向けPRを作成し、候補headのhosted CIを確認
- 承認後にmerge commitでmainへ統合
- mainからdevelopへのcatch-up PR
- Android Chrome/PWAでSong.midの保存、Files / Download / Shareを確認
- CubasisでImport / 再生 / Tempo / 4/4 / Track分離 / Note timingを確認
- CubaseでImport / 再生 / Channel / Marker / Note timingを確認
- 実機結果を`docs/DAW_HANDOFF_VERIFICATION.md`へ記録

実機gateがすべて完了するまでstable tagは作成しません。

## Primary references

- `docs/RECONCILIATION_RESULT_2026-10-15.md`
- `docs/BRANCH_RECONCILIATION_2026-10-15.md`
- `docs/DOC_SYNC_AUDIT_2026-10-15.md`
- `docs/DAW_HANDOFF_VERIFICATION.md`
- `docs/SONG_PROJECT.md`
- `docs/RELEASE_POLICY.md`
- `VERSION_HISTORY.md`
- `CHANGELOG.md`
