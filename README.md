# Demo Composer

Androidスマホ中心の作曲支援PWAです。

## Version status

- Published main: `v0.15-dev` (`main`; reconciliation PR #255 / merge `0aa2d4d7ec2329cd01bcef8cca4cc527c0133b19`)
- Development integration: `v0.16-dev` on `develop`
- Divergence development candidate: Demo Composer `v0.17-dev` / Arrangement Lab `v0.14-dev` on `chatgpt/divergence-mode-v0.17`（draft PR #259）
- Music Project Home development candidate: `v0.19-dev`
- Stable: 未認定

GitHub Pages: `https://tamurayuuki46-cpu.github.io/demo-composer/`

公開中GitHub Pagesは引き続き`main`のv0.15-devです。`develop`のv0.16-dev、およびPR #259のv0.17-dev / Arrangement Lab v0.14-devは開発版であり、公開済み・stableとは扱いません。stableはAndroid実機とCubasis / Cubase実機確認後のみ認定します。

## コンセプト

Demo Composerはスマホ版DAWを目指しません。

目的は、PC DAWを開く前に作曲・素材準備・編曲判断をできるだけAndroidスマホで済ませ、PCでは本制作と完成作業へ集中できる状態を作ることです。

PC DAWは最終工程として必須です。

創作は一本道として扱いません。`発散 ↔ 比較 ↔ 収束`を自由に往復し、探索中・比較中・保留・任意も正常な創作状態として扱います。AIは曲を決めるOwnerではなく、候補・比較材料・説明を提示して人間の判断を支援します。

詳細: `docs/CREATIVE_DECISION_PROGRESS.md`, `docs/DIVERGENCE_MODE.md`

## 正式Workflow

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → 必要ならCubasis → PC DAW / Cubase → 完成`

役割:

- 作曲シート = 考える・意図を決める
- MIDI Analyzer = 集める・理解する・差を説明する（任意。発散生成はしない）
- Demo Composer = 作る・試す・曲そのものを発散する
- Arrangement Lab = 育てる・編曲案を発散する・比較する・決める
- Music Project Home = 案内する・つなぐ・今できる選択肢を示す
- Cubasis = 必要に応じたモバイルDAW作業
- PC DAW / Cubase = 本制作・完成

正本: `docs/WORKFLOW_PRINCIPLES.md`

## v0.17-dev — divergence development candidate

発散モードは既存の比較・採用・判断履歴などの収束機能の前段として、元案を壊さず可能性を増やす探索レイヤーです。

基本フロー:

`Seed → Lock → Branch → Mutate / Transform → 試聴 → Keep → 再Branch → Freeze → 比較 / 採用`

主な追加:

- Seed（元案）と再現可能なSeed値
- 5軸Lock: 主旋律 / 裏メロ / コード・ハーモニー / リズム・グルーヴ / 音色
- Divergence Distance 1〜5
- 決定論的Branch / nested Branch
- Keep / Freeze
- Snapshot / Restore
- Branch Tree
- 発散中は点数・ランキングを前面に出さず、まず試聴して案を増やす
- Demo Composerの既存Section Variation / 裏メロ候補 / コード候補 / Sound Presetを再利用し、生成ロジックを二重実装しない
- Arrangement Labは主旋律を常時固定し、既存Reharm / Density / Counter role / Instrumentationを発散対象にする
- Music Project Homeは生成せず、Demo Composer / Arrangement Labの発散モードへ案内する
- MIDI Analyzerは生成せず、Branch差分の分析・説明・実験候補提案を担当する

互換性:

- Demo Project Schema 3変更なし
- SongProject v1変更なし
- Arrangement Plan Schema 4変更なし
- 発散履歴は補助状態として扱い、Freeze前はProject本体を書き換えない
- 大規模変更前の復元Branch: `restore/v0.16-before-divergence-2026-10-15`
- stable tagは未作成

詳細: `docs/DIVERGENCE_MODE.md`, `docs/BACKUP_MANIFEST_v0.17-dev.md`, `versions/v0.17-dev/CHANGELOG_v0.17-dev.md`

## v0.16-dev — development integration

### Decision Progress

HubのAI Monitoringを「何個の機能を使ったか」中心から「曲について今どんな判断状態にいるか」中心へ変更しました。

状態:

- 未着手
- 探索中
- 比較中
- 保留
- 採用
- 完了
- 任意

100%達成を目的にせず、未使用機能を未完成として扱いません。Feature Usageは端末内の補助情報として残し、Decision Progressの主要KPIには使いません。

Decision Progress専用の必須Schema fieldは追加せず、既存Project内容・採用履歴・端末内の操作履歴から導出します。Demo Project Schema 3 / SongProject v1は維持します。

### Music Project Home v0.19-dev

Project HomeはEditor化せず、司令塔として次を表示します。

- 現在工程
- 未決定
- 探索中
- 比較中
- 保留 / 任意
- 次にできる選択肢（最大3件程度）

「次にやること」だけでなく「別案を試す」「もう少し比較する」「今日はここまで」を正式な選択肢として扱います。「今日はここまで」を選んでもSongProjectは変更せず、必要ならHomeの端末内メモだけ残せます。

詳細: `project-home/CHANGELOG.md`, `docs/CREATIVE_DECISION_PROGRESS.md`

### 互換性

- SongProject v1変更なし
- Demo Project Schema 3変更なし
- PPQ 480 / 4/4固定を維持
- 既存Project / Homeメモ / JSON Backup / 作曲シート連携を維持
- stable tagは未作成

## v0.15-dev

### Published reconciliation

- 公開済みmainの資産を保持しながら、developの検証済み機能を通常の2-parent mergeで統合
- PR #252: SongProject v1のMIDI Analyzer → Demo Composer → Arrangement Lab → Composition Sheet境界回帰を追加
- PR #253: Music Project HomeのDAW-ready判定を実際のSong.mid書き出し記録に連動
- PR #254: Song.midのFormat 1、5 Track、PPQ 480、Tempo、4/4、Channel、Marker、Note timingを固定する回帰を強化
- Composition Sheet latestはv0.9.1-dev、Music Project Homeはv0.18-dev、Arrangement Labはv0.13-dev
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4 / PPQ 480 / 4/4は維持
- ローカル静的178件・ブラウザ17件・公開済みversion資産38件の保持検証が成功
- PR #255の同一head `8a73fcb55029f4bdb8d191d4e552f5122fc380fd`でhosted CI 7件が成功
- `main`統合後にPages / Release Check / AI Monitoringが成功し、GitHub Pages公開を確認
- Android / Cubasis / Cubase実機確認は未実施のためstable未認定

## v0.14-dev

### 曲データ共通メモ帳

右上の `📦 曲データ` に `📓 メモ帳` を追加しました。v0.13-devの4大操作はそのまま維持し、メモ帳は補助操作として配置しています。

- Project IDごとの端末保存 / 自動保存
- Android共有画面から Google Drive / Notion へTXT共有
- Android共有画面から ChatGPT へメモ共有
- Web Share API非対応時はTXT保存、コピー、ChatGPT起動へフォールバック
- 作曲シート / Music Project Home / Demo Composer / Arrangement Labで共通利用
- SongProject v1 / Project Schema 3 / IndexedDB Schemaは変更なし

詳細: `docs/SONG_MEMO.md`

## Demo Composerの責務

Demo Composerは**Composition Owner**です。

担当:

- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- BPM / Key / Scale
- 作曲案A/B
- 作曲判断
- Lyrics / Vocalの作曲段階メモ
- Draft.mid
- Seed / Lock / Branchによる曲そのものの発散

深い参考曲分析やPersonal TrendはMIDI Analyzerへ、高度なReharm / Voicing / Density / DevelopmentはArrangement Labへ、本格音源・Vocal本制作・Mix / MasteringはPC DAWへ任せます。

## v0.9-dev

### 作曲シート → Demo Composer

Claude Artifactの作曲シートはClaude側が所有します。

GitHubでは引き渡し契約だけを管理します。

- `docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`
- kind: `composition-sheet-handoff`
- schemaVersion: 1

Music Project HomeでJSONを読み込み、Demo Composerで内容を確認してからTitle / BPM / Key / ScaleおよびVocal/Lyrics初期設計を明示反映できます。

Chord / Melody等をClaude JSONから自動生成しません。

### Lyrics / Vocal

「作曲の判断」で次を保存できます。

- 歌詞テーマ / 言葉の芯
- Vocal音域 / 歌いやすさ
- Phrase歌詞 / 音節メモ
- 歌詞 / Vocal方針

旧Schema 3 Projectにこれらが無くても読み込めます。Project Schemaは3のままです。

本歌、SynthV本制作、Phoneme、詳細Vocal編集、Vocal FX、MixはPC DAW工程です。

詳細: `docs/VOCAL_LYRICS_BOUNDARY.md`

### Music Project Home

`project-home/`を全体Workflow Hubとして使用します。

- SongProject v1を開く
- Analysis / Composition / Arrangement状態
- 現在のWorkflow工程
- 探索中 / 比較中 / 保留・任意の創作状態
- 次にできる選択肢（最大3件程度）
- 作曲シート入口 / handoff JSON受け入れ
- MIDI Analyzer / Demo Composer / Arrangement Labへの導線
- Demo Composer / Arrangement Labの発散モードへの案内
- Project Lineage表示
- SongProject Backup

Project HomeにEditor機能を重複させません。

### SongProject Lineage

SongProject v1はoptionalなlineageを持てます。

- rootProjectId
- parentProjectId
- sourceApp
- createdFrom
- forkReason
- revision

旧SongProject v1でlineageが無くても読み込めます。

### Arrangement Lab Fork

Arrangement LabからDemo Composerへ通常の「戻し」は行いません。

編曲結果をCompositionとして続けたい場合だけ**新しい作曲ProjectとしてFork**します。

Forkは新Project IDを作り、元Projectを変更せず、root / parent / sourceApp / forkReasonを記録します。

通常のArrangement Lab出口はDAW Handoff Packageです。

詳細: `arranger/docs/WORKFLOW_BOUNDARY.md`

## 主要実装

- Hub / Chord / Melody / Rhythm / Arrange / Sound / Counter Melody
- Decision Progress（未着手 / 探索中 / 比較中 / 保留 / 採用 / 完了 / 任意）
- Seed / Lock / Divergence Distance / Branch / Keep / Freeze / Snapshot / Restore / Branch Tree
- Project Schema 3 / PPQ 480 / 4/4
- IndexedDB Save / Restore / AutoSave
- Project一覧 / 開く / 複製 / 削除
- Undo / Redo
- Chord Preset / Diatonic / borrowed / next chord / backing
- Melody Piano Roll / candidates / analysis / A/B
- Bass / Drum 16-step / presets / fills / candidates
- Counter Melody generation / edit / MIDI
- Section / Energy / Transition / Variation / Structure Library
- Sound Sketch Lite
- Demo Player / part mute / solo
- Draft.mid / Part MIDI / project.json
- MIDI Import
- SongProject v1 Adapter
- Music Project Home
- Claude composition-sheet handoff
- Project Lineage / explicit Fork
- Root PWA / offline shell / versioned cache
- 曲データ共通メモ帳 / Drive・Notion・ChatGPT共有

## Arrangement Lab

`arranger/`配下の独立PWAです。

役割は「作った曲を育てる」。

- Reharmonization
- Voicing
- Counter interaction
- Density
- Instrument participation
- Development
- 編曲Seed / Lock / Branch / Keep / Freeze / Snapshot / Restore
- 主旋律は常時固定し、Composition Ownerとの責務境界を維持
- A/B/C comparison
- Decision Journal
- Before / After
- Song.mid
- DAW Handoff Package

Compositionを通常上書きしません。

## データ契約

### Demo Composer Project

- `schemaVersion: 3`
- PPQ 480
- 4/4固定
- `project.json`がDemo Composer内部正本

### SongProject v1

Ownership:

- MIDI Analyzer: `analysis`, `reference`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- Common: `basic`, `lineage`

詳細: `docs/SONG_PROJECT.md`

## PWA

Demo Composer root Service Workerは本体、発散モード、Project Homeをオフライン用にCacheします。
Arrangement Labは独自PWA Cacheを持ち、通常画面と編曲発散モードを管理します。

詳細: `docs/PWA_SERVICE_WORKER.md`

## 開発

```bash
npm run build
npm run test:syntax
npm run test:divergence
npm run test:arranger-divergence
```

ローカル起動例:

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

## 最初に読むファイル

1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/DIVERGENCE_MODE.md`
5. `docs/CREATIVE_DECISION_PROGRESS.md`
6. `docs/WORKFLOW_PRINCIPLES.md`
7. `docs/APP_INTEGRATION.md`
8. `docs/SONG_PROJECT.md`
9. `docs/VOCAL_LYRICS_BOUNDARY.md`
10. `docs/DATA_SCHEMA.md`
11. `arranger/docs/WORKFLOW_BOUNDARY.md`
12. `CHANGELOG.md`
13. `docs/SONG_MEMO.md`
14. `docs/BACKUP_MANIFEST_v0.17-dev.md`

## Git / Release

- `develop`: 開発統合
- `main`: CI合格版 + GitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- mainへの直接変更禁止。main統合 / 公開は既存Release運用に従う
- 過去Version / Branch / Tagを削除・上書きしない
- 大規模変更前には復元Branchを作り、Feature Branchで実装する

## 実機継続課題

- Android: 発散モードのSeed / Lock / Distance / Branch / Keep / Snapshot / Restore / Freezeを縦画面で通し確認
- Android: Decision Progress / Homeの創作状態・選択肢の縦画面とタップ操作確認
- Android: Project Home → Sheet → MIDI Analyzer → Demo Composer → Arrangement Lab → DAW Handoffの通し確認
- Android: メモ帳 → Drive / Notion / ChatGPT共有先の実機確認
- Android PWA install / standalone / offline / update
- Cubasis / CubaseでMIDI / DAW ZIP取込
- SynthV / 本歌はPC DAW工程として確認

実機確認前はstable tagを作成しません。
