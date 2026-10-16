# Arrangement Lab 収束モード統合 v0.15-dev

更新日: 2026-10-17。正式な純関数契約は CONVERGENCE_CONTRACT.md。

## 統合境界

`convergence-session.js` を各UIの共通境界とする。通常候補編集、performance、snapshotは `applyCandidateEdit(before, after)` へ集約。試聴専用の一時候補とMix等の候補追加は編集として扱わない。

`saveArrangerPlan` は validationReady の後だけ保存し、候補poolと収束補助状態 → Plan → Journal の順で書き込む。全成功後にapplySaveの返却state/trackerを採用。失敗時は補助状態・pool・Plan・Journalの保存前のraw値へbest effortで戻し、メモリ上の編集とdirtyを保持する。ストレージが全書込みを拒否する場合、rollback自体も失敗し得る。Exportは保存成功に依存しない。

候補poolは `demo-composer-arranger-candidates:<projectId>:<planId>` に保存する。複数候補への判断が参照する編集済み候補を再読込で失わないための補助データであり、Arrangement Plan Schema 4へ必須fieldや新Schemaを追加しない。

起動は Plan復元 → pool復元 → loadState → checkPlanFingerprint → 必要ならwriteStructureBackup → verifyState → purgeExpiredRecovery → createDirtyTracker → validationReady。検証例外時は補助状態を退避し、警告付きで起動する。unsupported / unavailable / 検証例外では補助状態の自動上書きを止め、Exportは可能とする。

## 更新と復元

同じprojectIdの新revisionはPlan IDを維持してrebaseする。先に旧Plan・判断・tracker・全候補を別キーへバックアップし、旧sourceで未保存dirtyを整理してから新sourceとsourceSnapshotへ更新し再検証する。古いrevisionは通知する。

Section ID・順序・境界が変わる場合は正式契約どおり旧判断を構造バックアップへ退避して未決定へ戻す。元の構成へ戻るとfindStructureBackupで復元を提案し、adoptStructureBackupで再検証して戻せる。これを通常のrevisionだけの更新と区別する。

snapshotは現在sourceを正本とし、Candidate部分だけを復元する。source revision / Plan IDを戻さない。Sectionのbars/name/kindは現sourceへ合わせる。

## 出力

Current Plan表示と専用試聴、Song.mid、DAW ZIP、パートMIDI、Export Plan cloneはresolveCurrentPlanのcandidateを共通利用する。既存候補の試聴は比較用に引き続き使用できる。Export cloneのarrangement / selectedCandidateIdも同じ候補へ合わせる。

未決定がある時だけLab / DAWの選択を要求する。補助判断欠損・破損等の警告は別途明示確認する。carryOverListの内容はZIP `03_notes/SECTION_INSTRUCTIONS.md` 冒頭へ出力し、Song.mid単体は警告を表示する。

**収束補助状態はPlan JSONだけでは別端末へ移らない。** JSONにはCurrent Planの音楽結果とJournalを含むが、端末内の階層判断・Recovery・全候補poolは別管理。判断履歴があるJSONを補助状態の無い端末へImportした時は「収束判断が見つかりません」と通知する。

## Version / 復元

Arrangement Labのみ v0.14-dev → v0.15-dev。`arranger/VERSION` が正本。ルートVERSIONはDemo Composer v0.17-devのため維持し、Demo Composer / Home本体は変更しない。stable未認定。

- 当初復元: restore/convergence-integration-before-implementation-20261017 (55e363d)
- 配線直前: restore/convergence-integration-before-ui-wiring-20261017 (7238547)
- v0.14-devのソースarchive: versions/convergence-before-v0.15-dev/
- 並行更新は履歴を含むmergeで保持し、保存境界を共通sessionへ統一した。

検証結果は CONVERGENCE_VERIFICATION_v0.15-dev.md、実機確認項目は REAL_DEVICE_TEST.md を参照。

## 独立レビューでの修正（PR #271 対応）
- Undo: 判断直後に行った正規編集のdirtyは、Undoで旧trackerへ戻しても失わない（旧tracker ∪ 現tracker を保存に渡す）。契約「通常編集は外部変更扱いにしない」の維持。
- 保存失敗: `saveArrangerPlan` は rollback に失敗した key を `rollbackFailed` で返す。UIは通常の保存失敗とは別に「巻き戻しにも失敗」を通知し、JSON書き出しでの退避を促す。
- 回帰テスト: `arranger/tests/convergence-session.test.mjs` 末尾。
- 既知の未対応: `warn-missing` の警告は再読込をまたいで保持されない（Journalに【収束】がある限り再診断されるため実害は限定的）。実機G章で確認する。
