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
| | `listRecoveries(state, now)` | 通知UI用の一覧(key / level / sectionId / element / candidateId / reason / expiresAt) |
| | `adoptStructureBackup(backup, {source, candidates, planFingerprint, now})` | 構造が戻った時、退避した旧状態を再検証して開き直す(`findStructureBackup`の結果を渡す) |
| dirty | `createDirtyTracker` `recordEdit(tracker, state, {source, before, after})` | **Lab内編集の共通入口**で編集前後の候補を渡す。採用中の枠のうちfingerprintが変わったものだけをdirty記録(宣言方式は使わない)。全体判断は `global:<sectionId>` 単位 |
| | `applySave(state, tracker, {source, candidates, now})` | 記録済みdirtyの枠だけfingerprintを更新→残る不一致は外部変更としてRecoveryへ。純関数。**保存成功後にだけ** 返却の state/tracker を採用(失敗時は旧state・旧trackerを保持) |
| | `isDirty` `dirtyKeys` | 参照系 |
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

## GPT側の統合タスク（v0.15-devへ統合・検証中）

統合境界と端末補助pool、rebase、保存失敗時の制約は `CONVERGENCE_INTEGRATION.md`。純関数コアのAPI・振る舞いは変更しない。

1. 中央保存関数 `saveArrangerPlan({plan, convergenceState, journal, tracker})` と `validationReady` ゲート。起動→復元→`loadState`→`checkPlanFingerprint`→`verifyState`→ready。**検証で例外が出てもゲートを閉じたままにしない**(補助状態をバックアップし警告つきで開く)。
2. dirty判定: **Lab内編集の共通入口(候補を編集する全関数の出口)で `recordEdit` を呼ぶ**(編集前後のfingerprint比較で記録)。保存は `saveArrangerPlan` 内で `applySave`(dirtyだけ更新、非dirtyの不一致=外部変更)。暗黙保存・Export・Drum Fill表示などの保存経路も全て同じ関数を通す。共通入口を通らない書き換えは外部変更として扱われる(Recoveryで救える)。
3. same-project rebase: 旧Plan・補助状態をバックアップ→新source反映(`sourceSnapshot`/原案更新)。`reimportPlan`(snapshot復元)でsourceを巻き戻さない・Planをnullにしない。
4. UI(下部固定ボタン/由来表示/Undoトースト)・Export前確認・`SECTION_INSTRUCTIONS.md`冒頭への持ち越し追記・docs・CI(`node arranger/tests/convergence.test.mjs` を `arranger-ci.yml` に追加)。

## 呼び出し順序と使用例(GPT統合用)

### 起動 / Import / 復元(`validationReady` を立てるまで編集・保存を許可しない)
```js
const ids = { projectId, planId };
const planFp = planStructureFingerprint(source);
const load = loadState(localStorage, ids, Date.now());          // status: ok|missing|corrupt|unsupported|unavailable
let state = load.status === 'ok' ? load.state : createEmptyState({ ...ids, planFingerprint: planFp });
const diag = diagnoseLoad(load, journal);                        // 'warn-missing' | 'warn-corrupt' なら「収束判断が見つかりません」を表示
const chk = checkPlanFingerprint(state, { ...ids, planFingerprint: planFp, now });
state = chk.state;                                               // 構造変更なら空stateに。chk.backup があれば writeStructureBackup() で退避
const ver = verifyState(state, { source, candidates, now });     // ver.message があれば1行通知。listRecoveries(ver.state, now) がボタン用データ
state = purgeExpiredRecovery(ver.state, now);
let tracker = createDirtyTracker();
// 例外が出ても validationReady を閉じたままにしない: 旧補助状態を退避→警告つきで開く
```

### Lab内編集(共通入口の出口で1回)
```js
const before = candidate;                       // 編集前
const after  = updateCandidateSection(before, sectionId, patch);  // 既存の編集関数
tracker = recordEdit(tracker, state, { source, before, after });  // 変更Sectionは宣言しない
```
- `before.id !== after.id` なら例外(`編集前後の候補IDが一致しません。`)。IDは編集で変わらない前提。
- 採用していない候補・実発音が変わらない編集では何も記録しない(tracker不変)。入力は破壊しない。

### 保存(`saveArrangerPlan` の中。暗黙保存・Export経路も同じ関数)
```js
const r = applySave(state, tracker, { source, candidates, now });  // 純関数。副作用なし
const w = saveState(localStorage, r.state);                         // 補助状態を先に
if (!w.ok) { /* state と tracker は旧のまま。dirty保持。補助状態は書けていないのでロールバック不要(部分書込みはreadback不一致→{ok:false}) */ }
else { /* 次にPlan・Journalを保存し、成功後に初めて採用する */ state = r.state; tracker = r.tracker; }
// r.message があれば通知(外部変更で未決定へ戻った枠がある)。r.externalChanges / r.refreshed は表示・ログ用
```
- dirtyの枠だけfingerprintを更新。dirtyでない不一致は外部変更→枠を未決定へ戻し Recovery に退避(元の記録は上書きしない)。
- Plan/Journalの保存に失敗した場合は、`saveState` で書いた新stateを旧stateで書き戻す(`saveState(storage, oldState)`)。tracker は旧のまま保持。

### 判断操作
`setDecision` / `releaseOverride` / `setCarryOver` はいずれも新stateを返す。採用時のfingerprintは `slotFingerprint` / `globalFingerprintMap` で計算して渡す。Journalには `【収束】` を先頭に付けた文を残す(`restoreRecovery().journalText` はその形式)。

### Recovery通知
`listRecoveries(state, now)` の各行 → 「元の判断のまま採用」ボタン → `restoreRecovery(state, row.key, {source, candidates, now})`。
`ok:false` の `error`: `not-found` / `expired` / `candidate-missing`(再生成で候補が消えた) / `global-changed`(全体判断が別案になった)。失敗時 `state` は変更されない。

### Export
`resolveCurrentPlan(source, candidates, state, { defaultCandidateId })` の `candidate` を Preview / Song.mid / DAW Handoff / export用plan clone に共通で渡す。`unresolved.length > 0` の時だけ確認画面。`carryOverList(state)` を `SECTION_INSTRUCTIONS.md` 冒頭に書く。ExportはtrackerやsaveStateの成否に依存させない。

## 未検証・注意

- 実機未確認。`arrangedNotes` の副作用有無(乱数・時刻依存)は純関数前提で使用。ID決定性は `buildThreeCandidates` のテストで確認済み。Mix案のIDは `Date.now()` を含むため再生成で参照切れ→未決定になる(仕様)。
- 補助状態はPlan JSONと一緒に別端末へ移らない(既知の制約・docs明記はGPT側)。
