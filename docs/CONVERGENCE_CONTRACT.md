# CONVERGENCE_CONTRACT — 収束モード Claude/GPT 共有契約

更新日: 2026-10-17 / 対象: Arrangement Lab 収束モード(最小版)
分担: **Claude = `arranger/convergence/*`(純関数コア・新規ファイルのみ)** / **GPT = 既存ファイルへの統合・UI・docs**。
Claudeは既存ファイルを編集しない。GPTは `arranger/convergence/*` を変更する場合、契約を更新して通知する。

不変: Arrangement Plan Schema 4 / SongProject v1 / Demo Project Schema 3 / PPQ 480 / 4/4 / Demo Composer本体・Home本体。

## 公開API(`arranger/convergence/index.js`)

| 領域 | 関数 | 概要 |
|---|---|---|
| canonical | `canonicalize` `stableStringify` `hash64` `hashOf` | 正規化と64bit相当hash(16桁hex)。依存なし |
| fingerprint | `slotFingerprint(source, candidate, sectionId, element=null)` | 実発音Note(Section clip)。element=`null`(全5Part)/`'drums'`/`'counter'`(裏メロ=counter+melody+harmony) |
| | `globalFingerprintMap` / `globalFingerprint` | SectionID→fpのmap / その合成hash |
| | `planStructureFingerprint(source)` | Section id・順序・start/end・bars・拍子・ppq。BPM・名前・kind・revision・編曲内容は含まない |
| | `FINGERPRINT_VERSION`(=1) | canonicalization/対象を変えたら必ず上げる。goldenテストで固定 |
| state | `createEmptyState` `setDecision` `clearDecision` `releaseOverride` `setCarryOver` `clearCarryOver` | **全て非破壊(新stateを返す)** |
| | `getAdopted` `getStatus` `hasHold` `computeUnresolved` `carryOverList` | 参照系 |
| | `GLOBAL_KEY` `sectionKey(id)` `elementKey(id, el)` | slot key: `global` / `section:<id>` / `element:<id>:<el>` |
| resolver | `resolveCurrentPlan(source, candidates, state, {defaultCandidateId})` | → `{candidate, provenance, tentative, tentativeLabel, unresolved}` |
| recovery | `verifyState(state, {source, candidates, now})` | fingerprint/候補消失の検出→枠を未決定へ戻しRecovery化 |
| | `restoreRecovery(state, recKey, {source, candidates, now})` | 「元の判断のまま採用」。`journalText`(【収束】…)を返す |
| | `purgeExpiredRecovery` `checkPlanFingerprint` | 7日保持 / Plan構造変更時の退避 |
| store | `loadState(storage, ids, now)` `saveState(storage, state)` | storageはWeb Storage互換を注入。破損は別キー退避 |
| | `writeStructureBackup` `findStructureBackup` `purgeExpiredBackups` | 構造変更時の旧状態退避(7日) |
| | `journalHasConvergenceEntry` `diagnoseLoad(load, journal)` | `ok`/`fresh`/`warn-missing`/`warn-corrupt`/`unsupported` |

## 振る舞いの約束

- 判断状態は 未判断(エントリなし)/`adopted`/`hold`/`rejected`。「空」は無い。別案の採用は他案を自動不採用にしない(前の採用は未判断へ戻る)。
- 「DAWで決める」= `carryOver`(別Flag)。同じ枠を採用/不採用にすると自動解除。
- 未決定 = ①同じ枠に採用の無い保留 ②どの階層(Section/全体)でも採用が無いSection(`kind:'no-base'`)。継承・採用済み・持ち越し済みは数えない。
- `resolveCurrentPlan` は1つのmaterialized Candidate(`id: current-plan-<hash>`, label「Current Planから合成」)を返す。**Preview / `createSongMidi` / `createDawHandoffBundle` / export用plan clone に同じ候補を渡す**。判断の参照先にはしない。小節数が候補とsourceで不一致なら例外(`source.sections`が正本)。
- 個別上書きで差し替えるfield: drums=`enabled.drums, roles.drums, partOverrides.drums` / 裏メロ=`enabled.counter, roles.counter, partOverrides.counter, counterArrangement, restPolicy, leadRole`。
- 全体判断の無効化はSection単位(`state.invalidGlobalSections` + `recovery['global:<sid>']`)。Recoveryは同じ枠に新判断をするか7日で消える。2回目の無効化で元のRecoveryを上書きしない。
- 保存: 補助状態を先、Journalを後。`saveState`失敗時は `{ok:false}`。呼び出し側はdirtyを保持し補助状態をロールバックする。Exportは保存成功に依存させない。

## GPT側の統合タスク(未実装・契約外)

1. 中央保存関数 `saveArrangerPlan({plan, convergenceState, journal, dirty})` と `validationReady` ゲート。起動→復元→`loadState`→`checkPlanFingerprint`→`verifyState`→ready。**検証で例外が出てもゲートを閉じたままにしない**(補助状態をバックアップし警告つきで開く)。
2. dirty判定は「呼び出し側の宣言」でなく**保存前後のfingerprint差分**から導出。dirty枠のみfingerprintを更新し、非dirtyの不一致は外部変更扱い。
3. same-project rebase: 旧Plan・補助状態をバックアップ→新source反映(`sourceSnapshot`/原案更新)。`reimportPlan`(snapshot復元)でsourceを巻き戻さない・Planをnullにしない。
4. UI(下部固定ボタン/由来表示/Undoトースト)・Export前確認・`SECTION_INSTRUCTIONS.md`冒頭への持ち越し追記・docs・CI(`node arranger/tests/convergence.test.mjs` を `arranger-ci.yml` に追加)。

## 未検証・注意

- 実機未確認。`arrangedNotes` の副作用有無(乱数・時刻依存)は純関数前提で使用。ID決定性は `buildThreeCandidates` のテストで確認済み。Mix案のIDは `Date.now()` を含むため再生成で参照切れ→未決定になる(仕様)。
- 補助状態はPlan JSONと一緒に別端末へ移らない(既知の制約・docs明記はGPT側)。
