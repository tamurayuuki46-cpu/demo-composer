# Divergence Mode / 発散モード

Version target: **Demo Composer v0.17-dev / Arrangement Lab v0.14-dev**  
Updated: **2026-10-15**

## 1. Purpose

既存の作曲アプリ群は、候補生成・比較・採用・判断履歴などの「収束」に強い。
発散モードはその前段で、元案を壊さずに可能性を増やすための探索レイヤーである。

基本フロー:

`Seed → Lock → Branch → Mutate / Transform → Audition → Keep → Branch → Freeze → Compare / Adopt`

完全ランダム生成を目的にしない。Seedと制約を保ったまま、何を固定し、どこまで離し、どの案から派生したかを明示する。

## 2. UI vocabulary

| Term | 日本語 | 意味 |
| --- | --- | --- |
| Seed | 元案 | 探索の出発点。Seed値は再現用識別情報にも使う |
| Branch | 派生案 | SeedまたはKeepした案から作る子案 |
| Lock | 固定 | 変えない軸 |
| Mutate / Transform | 変形 | 既存案を土台に部分的に変える |
| Divergence Distance | 発散距離 | 1=近い、5=大胆 |
| Keep | 保存 | 良い枝を残して次のSeedとして使える状態にする |
| Freeze | 確定 | 発散を終え、通常編集・比較・採用へ戻す |
| Snapshot | 復元点 | 発散状態の一時保存 |
| Restore | 復元 | Snapshot時点のBranch Treeへ戻す |
| Branch Tree | 派生履歴 | 親子関係・Seed・Distance・Keep/Freezeを表示 |

## 3. Research principles adopted

2026-10-15に参考製品の現行仕様を再確認し、UIコピーではなく次の設計原理だけを抽出した。

- **Ableton Live 12**: Generate（新しく作る）とTransform（既存を変える）を分離する。
- **Bitwig Studio**: Seedで確率的結果を再現可能にし、偶然を「もう一度出せる偶然」にする。
- **XLN Audio XO**: 無制限ランダムではなく、近い候補を探索できる近傍探索の考え方を使う。
- **Synplant 2**: 1つのSeedから枝を育て、近い結果から意外な結果まで連続的に探索する。
- **Scaler / Melody Sauce**: 理論・制約・詳細コントロールを残し、人間が選びながら作る。

発散中は細かな点数・順位付けを避ける。データ破損、MIDI範囲外、構造不正などの安全チェックのみを優先し、評価は収束フェーズへ渡す。

## 4. Shared branch engine

Implementation: `src/core/divergence.js`

発散履歴はProject Schemaへ直接追加しない。共通Branch engineはProject/CandidateのCloneをpayloadとして保持し、以下を提供する。

- deterministic seeded RNG
- Lock map
- Distance 1..5
- parent/child Branch lineage
- Keep
- Snapshot / Restore
- Freeze
- Branch Tree projection

### Reproducibility

同一の親Branch、Seed値、branch round、slot、Distanceから同じ子Seedを導く。
Transform側も渡されたseeded RNGだけを使うことで、同じ条件から同じ結果を再現できる。

### Lock safety

Transformは変更した軸を`changedAxes`で返す。
共通engineはLock中の軸が`changedAxes`へ含まれた場合に例外として拒否する。

Lockは「何を変えないか」を学習するUIでもあるため、暗黙設定にしない。

## 5. Five axes

共通の最低単位:

1. 主旋律
2. 裏メロ
3. コード・ハーモニー
4. リズム・グルーヴ
5. 音色 / 楽器構成

必要に応じて既存のSection、Energy、Density、Transition、Voicing、Motif等を内部Transformへ結びつける。

## 6. Demo Composer responsibility

Route: `/divergence.html`  
Adapter: `src/core/divergence-demo.js`

Demo Composerは「曲そのものを生み出す発散」を担当する。
新しい独立生成器を重複実装せず、既存ロジックを再利用する。

- 主旋律: `applySectionVariation` のMelody系Transform
- 裏メロ: `counterCandidates` / `withCounterNotes`
- コード: `suggestNextChords`
- リズム: Section VariationのDrums / Melody Rhythm
- 音色: 既存Sound Preset / Tone

発散セッションは端末内IndexedDB(`meta` store)の補助データで、既存Project Schema v3を変更しない(§12)。
Freeze時だけ選択BranchのCloneを現在Projectとして保存し、revisionを進める。

## 7. Arrangement Lab responsibility

Route: `/arranger/divergence.html`  
Adapter: `arranger/src/divergence.js`

Arrangement Labは「既にある曲を編曲として育てる発散」を担当する。

主旋律そのものはArrangement Labで生成・変形しない。Source melodyを常に参照し、責務をDemo Composerへ残す。

Branchで動かす対象:

- Reharmonization: 既存`buildReharmSuggestions`
- Counter melody role/rest policy
- Density / Drums participation
- Instrumentation / harmony/color role
- Section単位の変化量

Distanceが高いほど、対象Section数、Reharmの大胆さ、Density差、Instrumentation差を広げる。

Freeze時は新形式を作らず、既存`createArrangerProject()`形式へ戻して通常のArrangement Lab比較・採用へ接続する。

## 8. Composition Sheet / Music Project Home / MIDI Analyzer

### Composition Sheet

Genre / Mood / BPM / Keyなどの方向性をSeed constraintsとして受け取る。発散エンジンそのものは持たない。

### Music Project Home

発散機能を実装しない。次の2ルートだけを案内する。

- 曲のアイデアを増やす → Demo Composer 発散モード
- 編曲案を増やす → Arrangement Lab 発散モード

### MIDI Analyzer

発散生成エンジンにはしない。

責務は:

`分析 → Branch間の違いを説明 → 次に試す実験候補を提案`

例: 「Branch Cは元案よりコードトーン率が低く跳躍が増えたため緊張感が高い」。
最終的な音楽生成はDemo Composer / Arrangement Labに残す。

## 9. Storage and safety

- 元Seed payloadはBranch生成時にCloneし、直接変更しない。
- Snapshot/Branch historyは補助状態。Project本体のSchema migrationを要求しない。
- Demo Composer schemaVersion: **3（変更なし）**
- Arrangement Lab arrangerSchemaVersion: **4（変更なし）**
- 保存領域の容量不足・書き込み失敗時でもProject本体を破壊しない(§12。保存できなかった場合は画面に表示する)。
- Freeze前はProject本体へ書き戻さない。
- 重要な変更前のGit復元点: `restore/v0.16-before-divergence-2026-10-15`

## 10. Verification

Focused checks:

- `scripts/divergence-smoke-test.mjs`
  - Seed再現性
  - 元案不変
  - Lock違反拒否
  - Keep
  - nested Branch
  - Snapshot / Restore
  - Freeze Clone
- `scripts/arranger-divergence-smoke-test.mjs`
  - 5 Branch生成
  - 元編曲Seed不変
  - 主旋律非変形
  - Harmony Lock
  - 同Seed再現性
- `.github/workflows/divergence-v017.yml`
  - new modules syntax check
  - two smoke tests
  - static build
  - built route / PWA asset verification

## 11. Convergence handoff

Freezeは「最終採用」ではない。
発散モードで探索を止める地点を決めた後、既存の通常画面へ戻り、比較・採用・判断履歴・微調整を行う。

これにより、発散と収束をUI・責務の両方で分離する。

## 12. 保存とKeepライブラリ (v0.17-dev追補 / Demo Composerのみ)

背景: 旧実装は発散セッションを`sessionStorage`に置いていたため、タブ/アプリを閉じるとKeep案も消えた。またFreezeは選んだ1案しか残さず、他のKeep案は捨てられていた。「案を安全に保存できる・過去案を再利用できる」(`CREATIVE_DECISION_PROGRESS.md`の成功指標)を満たすため、次の2つを追加した。

### 12.1 セッションの端末内保存

- 保存先: IndexedDB `demo-composer` の `meta` store。**DB_VERSION・Project Schema 3・SongProject v1は変更しない**(`migrationBackup:*`と同じ使い方)。
- キー: `divergence:session:v1:<projectId>:<revision>`。値は `{version, projectId, revision, savedAt, session}`。
- 復元条件は従来どおり「同じProject id・同じrevision」。別Project/別revisionのセッションは読まない。
- 保存は1件ずつ順番に実行(古い内容が新しい内容を上書きしない)。
- 旧版のsessionStorageセッションは初回読み込み時にIndexedDBへ移行して旧キーを消す。
- IndexedDBに書けない時はsessionStorageへ退避し、画面に「タブを閉じると消える」と表示する。どちらにも書けない時は「保存できなかった」と表示する(黙って失敗しない)。
- Freeze後は、使い終わった旧revisionのセッションだけ削除する。

### 12.2 Keepライブラリ (Freezeしても残る)

- 保存先: `divergence:library:v1:<projectId>`(revisionに依存しない)。値は `{version, projectId, entries[]}`。
- KeepするとBranchのCloneがEntryとして追加される。Entryは `id / label / seedValue / distance / changedAxes / summary / operation / sourceRevision / savedAt / payload`。`payload`は**Demo Project Schema 3の完全なClone**。
- 上限40案。超える場合は黙って捨てず、「Keepを外してから」と表示してKeepしない。Keepを外す(`Keepを外す`)/ライブラリから削除でき、削除時はツリー側のKeep表示も外す。
- Keepの保存に失敗した場合はKeep状態にしない(画面とライブラリを食い違わせない)。
- 「ツリーに呼び出す」で、ライブラリの案を現在のBranch Treeに**Originalの子**として追加できる(同じ案は1回だけ。branchRoundは進めない)。呼び出した案も試聴・Branch・Freezeができる。
- 元案のrevisionが現在と違うEntryは「前の元案から」と表示する。そのEntryをFreezeすると現在の曲の内容が置き換わるため、確認ダイアログを出し、キャンセルすれば何も変えない。
- Freezeしてもライブラリは消えない。次の探索で他のKeep案を使える。

### 12.3 他Moduleへの受け渡し口

- 読み取り: `src/storage/divergence-store.js` の `divergenceStore.loadLibrary(projectId)` → `{ entries, error }`。形の検証・整形は `src/core/divergence-library.js`(純関数)。
- 書き込みは発散画面だけが行う。他Moduleはライブラリを読むだけにする。
- **Arrangement Lab収束モード(保留への受け渡し)は未接続。** `CONVERGENCE_CONTRACT.md`により、収束モードの既存ファイルへの統合・UIはGPT側の担当。接続する場合は、Demo ComposerのKeep案(曲そのもののProject)をどの収束枠で扱うかを先に決める必要がある。
- Arrangement Lab自身の発散セッション(`arranger/src/divergence-ui.js`)は従来どおりsessionStorageで、今回は変更していない。

### 12.4 検証

- `scripts/divergence-library-smoke-test.mjs`: Keep解除・ライブラリ呼び出し(冪等)・上限・壊れたEntryの除去・別Project/別revisionの分離・旧sessionStorage移行・IndexedDB書き込み失敗時の退避・予約キー保護。
- `scripts/divergence-library-browser.test.cjs`(Chromium): タブを閉じて開き直しても残る / Freezeしても他のKeep案が残る / 呼び出し・古い元案のFreeze確認・削除。保存処理を壊したビルドで失敗することを確認済み。
- 実機(Android + PWA)でのアプリ切替・端末再起動後の保持は**未確認**。
