# Arrangement Lab v0.15-dev verification

更新日: 2026-10-17。Branch: chatgpt/convergence-integration。PR #271 → develop。

Story: 候補の比較・編集 → 全体/Section/個別の判断 → 中央保存 → 再読込 / 同一曲更新 → Current Planの試聴とMIDI/ZIP。

## ローカルで確認済み

- package.jsonのtest:*とarrangerの全.mjs（fixture単体を除く）: 68コマンド成功。
- 直近のArrangement JS全構文検査とarranger全.mjs: 48コマンド成功。
- npm run build成功。convergenceモジュールも同一build queryへ固定。
- build / syntax / unit / integration / regression / SongProject関連静的回帰。
- dirty共通入口 / 未採用・非発音編集はdirty不要 / 直接変更Recovery。
- validationReady前は保存なし / verify例外でもgate開放 / unsupportedは自動上書きなし。
- 暗黙保存のapplySave / Journal失敗時の補助state・tracker rollback。
- revision-only rebase後の判断維持 / sourceSnapshot更新 / snapshotのcurrent-source維持。
- 全候補poolと判断のreload / 2曲目への判断とJournal分離。
- 補助状態欠損・破損警告 / 保存失敗後のMIDI生成継続。
- export PlanのarrangementとselectedCandidateId一致 / その候補からのSong.mid byte一致。
- carryOverListの内容が実ZIPのSECTION_INSTRUCTIONS.mdへ出力。
- 構成変更の退避と元構成への復帰提案・採用。

## ブラウザ

ローカルのPlaywright用ブラウザdownloadは不正ZIPで失敗。代替Chromiumもsandbox環境でSIGTRAPとなるため、ブラウザ結果はGitHub Actionsで確認する。

GitHub Actions run 38937928138（commit 87fe7b5）で確認:
- syntax / core regression / static build成功。
- 既存50手法・7機能のbrowser回帰: 360 / 390 / 430pxすべて成功（audio / MIDI / JSON / offline含む）。
- 曲データメニュー回帰とSection / reharm試聴・音色保持: 3幅すべて成功。
- 新規convergence-browser回帰: 360 / 390 / 430pxすべて成功。
- 既存v0.5 browserは明示採用操作をせず未決定Export確認で停止。テストを新仕様に合わせて更新。commit 6985cee / run 38938140767ではMobile Chromium end-to-endとSongProject handoff mobile regressionがすべて成功。
- Console例外・横overflowなしは新規3幅と既存browserで確認。

証拠: https://github.com/tamurayuuki46-cpu/demo-composer/actions/runs/38937928138
## 最終結果（確定）

コード・テスト確定commit: `5d666c4aa99d7585b97bb1d66552cf167a82f6bc`。
最新develop同期 `8393e3b` は実機手順docsのみの追加で、対象コードは同一。

- 最終ローカル静的68コマンド: 68成功 / 0失敗。
- Arrangement Lab CI run **38938808935**: **全step成功**。core / integration / build / Mobile Chromium / SongProject handoff / 証拠uploadを含む。
- Mobile Chromium: 360 / 390 / 430px、既存50手法・7機能、新規収束回帰、v0.5 / v0.6、PWA更新・offlineすべて成功。
- 同一commitのDemo Composer CI / Song Project Integration CI / Divergence v0.17 / Composition Sheet CI / PR Pages buildも成功。
- mainは `a92f3511c9e3e7cedb84cfae87266efd99f220ab` のまま。main / stableへのmerge・公開を行っていない。
- Git差分: Demo Composerのsrc/、project-home/、arranger/convergence/とルートVERSIONは変更なし。作業ツリーの未commit変更なし。

最終CI: https://github.com/tamurayuuki46-cpu/demo-composer/actions/runs/38938808935

実装上の残課題なし。実機未確認と別端末移行の制約は以下のとおり。

新規ブラウザ回帰は360 / 390 / 430pxで、判断 / Undo / 上書き解除 / dirty / Current Planと実Song.midのbyte一致 / reload / rebase / Recovery / app data削除後の警告とExport停止 / DAW carry-over ZIP / quota失敗中の実download / 2曲目分離 / Console / 横overflowを検証する。

## 構成と限界

- lint / typecheckの独立scriptと設定は本Repositoryに無い。JS構文検査・module実行・回帰testを実施し、存在しないチェックの成功とは扱わない。
- Android / Cubasis / Cubase実機は未確認。stableタグは作成しない。
- 収束補助状態はPlan JSONだけでは別端末へ移らない。
- ストレージ全書込み拒否時にはrollbackもbest effort。メモリ上の編集を維持しExportを継続する。
