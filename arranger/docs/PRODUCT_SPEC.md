# Arrangement Lab v0.5-dev

更新日: 2026-10-13

## 目的
Demo Composerで作った曲の骨格を、Cubasis / Cubaseへ渡す前に「複数の編曲候補を鳴らして比べ、Section単位で混ぜ、判断理由を残し、DAWへ渡せる状態」にする。

Arrangement Labは自動で正解を決めるアプリではない。候補を生成・比較し、ユーザーが編曲判断を行うための独立PWAとする。

## 位置づけ
`Demo Composer → Arrangement Lab → Cubasis → Cubase → 本制作`

Demo Composer:
- コード
- 主旋律
- 裏メロ
- ベース
- ドラム
- 曲構成
- 作曲判断

Arrangement Lab:
- 編曲候補比較
- ハーモニー/裏メロ/展開の実験
- Section単位の密度・パート参加
- リハモ
- 判断履歴
- MIDI / DAW引き継ぎ

## 6つの部屋
詳細一覧は `V0.5_SIX_ROOMS.md` を正本とする。

### ① 比較試聴室
ユーザーが決めること: **どの案を選ぶか**。

- A: 余白重視 / B: 標準 / C: 展開強め
- 2案Mix
- Web Audio簡易試聴
- 簡易ラウドネス補正
- 目隠し消去式比較
- 選択Sectionの変更パートだけ再生
- Bメロ/Prechorus → サビ連続試聴
- 比較中はCandidate名/詳細/曲線/Section情報を隠す

音量補正は完成音源のLUFS測定ではない。Note数・Velocity・長さから簡易的なエネルギーを推定してGainを補正し、単純な音量差で候補を選びにくくするための比較補助とする。

### ② ハーモニー実験室
ユーザーが決めること: **同じメロディをどう響かせるか**。

v0.4のHarmony Lab 14手法とv0.3理論Labを継続する。

含む:
- リハモ
- メロディ音の再解釈
- 共通音
- ベース固定/ベースから逆算
- 解決
- 借用
- 転調候補
- Voicing
- トップライン
- 内声
- 浮遊
- Secondary Dominant / Tritone Sub / Approach dim等

リハモ案は元Demo Composer project.jsonを直接変更しない。

### ③ 裏メロ・対話設計
ユーザーが決めること: **主旋律とどう関わらせるか**。

v0.4 Counter Lab 16手法を継続する。

含む:
- スケール変更
- コード別音階
- リハモ追従
- 輪郭/リズム保持
- 反行/斜行/並行
- 語尾応答
- 入り方
- モチーフ共有
- 持続
- 音域
- 衝突修正
- 独立性
- Section展開
- 制約
- A/B分担
- 主旋律の休みにだけ入るrestPolicy

### ④ 展開・密度設計
ユーザーが決めること: **曲のどこで何を際立たせるか**。

v0.4 Development Lab 15手法＋連動5セットを継続する。

含む:
- サビ5案
- 引き算
- 楽器入口/出口
- 密度
- 音域
- 主役交代
- サビ前落差
- サビ反復差
- ラスサビ
- 間奏
- イントロ回収
- 終わり方

v0.5追加:
- Drum Fill 3案を実Note生成
- Bass Approach 3案を実Note生成
- SectionのpartOverridesへ適用
- 解除時は既存Overrideをバックアップから復元

## ⑤ 判断の記録と復元
ユーザーが決めること: **何を試し、なぜ選んだか**。

判断種別:
- 採用
- 不採用
- 保留
- 気になる
- 制作日記

記録内容:
- 時刻
- 対象Section / 曲全体
- 判断種別
- 理由/制作メモ
- Section snapshot

復元:
- v0.5で判断記録を始めた時点のSection原案へ戻す
- 任意の過去判断snapshotへ戻す
- 復元操作も履歴へ追加

保存:
- Arrangement Plan内 `decisionJournal`
- 補助localStorage `demo-composer-arranger-decisions-v0.5`
- 最大300件

判断履歴は「正誤」や評価点ではない。ユーザーの制作判断を復元可能にするための記録とする。

## ⑥ DAW引き継ぎ
ユーザーが決めること: **本制作で何を実現するか**。

### 個別MIDI
- Melody.mid
- Harmony.mid
- Bass.mid
- Drums.mid
- Counter.mid
- Counter A/Bは既存music labから個別出力可能

### Song.mid
変更後Song.mid:
- SMF Type 1
- Conductor Track
- Tempo
- 4/4
- Section Marker
- 各パートTrack
- 入力PPQを維持
- Drums MIDI Channel 10

変更前Song.mid:
- 元project.jsonのNote/Chordを基準にした比較用baseline
- Before / AfterをDAWでA/Bする用途

### Demo Composer戻し
Arrangement結果を反映した複製project.jsonを生成する。

- 元Projectを上書きしない
- 新しいProject ID
- revision=1
- Chord/各Track Noteへ現在のArrangement結果を反映

### DAW引き継ぎZIP
以下をStore方式ZIPでまとめる。

- `01_compare/Before_Source_Song.mid`
- `01_compare/After_Arrangement_Song.mid`
- `02_plan/Arrangement_Plan.json`
- `02_plan/Demo_Composer_Project.json`
- `03_notes/TRACK_INSTRUCTIONS.md`
- `03_notes/SECTION_INSTRUCTIONS.md`
- `03_notes/DAW_CHECKLIST.md`
- `03_notes/DECISIONS.json`
- `03_notes/COMPARE_MANIFEST.json`
- `04_parts/*.mid`

COMPARE_MANIFESTにはSectionごとの変更パートを記録する。

## v0.4 Musical Transformation Labs
50手法の正本は `MUSIC_LAB_METHODS_v0.4.md` と `music-lab-catalog.js`。

カテゴリ:
- Harmony 14
- Counter 16
- Development 15
- Linked 5

候補は現在Arrangementの実発音を読み、Chord変更は `reharmonization.chords`、実配置は `chord.voicing`、Note変更は `partOverrides` へ保存する。

主旋律は原則保持する。全休符/停止/減衰など、展開操作として主旋律を明示的に対象にする場合のみ変更可能。

## Data Contract
Arrangement PlanはDemo Composer Schemaとは別形式。

### Schema
- `arrangerSchemaVersion`: 4を維持
- 旧Schema 1/2/3を受理
- v0.5でSchema番号は上げない

### Sectionの主な追加Field
- `harmonyPattern`
- `chorusDirection`
- `counterArrangement`
- `restPolicy`
- `leadRole`
- `reason`
- `decisionNote`
- `adoptedFrom`
- `partOverrides`
- `musicLab`
- `tonalTarget`
- `voiceRoles`
- `performanceBackup`
- `performanceGenerator`

### 保存キー
- 現行Plan: `demo-composer-arranger-v0.4`
- 判断履歴補助: `demo-composer-arranger-decisions-v0.5`
- v0.3/v0.2/v0.1キーは読込fallbackとして保持し、自動削除しない

元Project snapshotは読取専用コピーとして保持する。Demo Composer IndexedDB/元project.jsonへArrangement Labから破壊的書込みを行わない。

## MIDI共通契約
- Noteは0〜127
- Velocityは1〜127
- Note Offを同tickのNote Onより先に配置
- DrumsはMIDI Channel 10
- Section OFF境界では持続Noteを切る
- 連続ON Sectionでは同一source Noteの持続を維持
- HarmonyはChord quality定義に基づきVoicingを生成
- 選択リハモ/partOverridesは試聴とMIDIで同じ発音経路を使用

パート別MIDIはSMF Type 0、Song.midはSMF Type 1。

## Preview Contract
- Web Audio
- 選択Sectionから最大16秒
- 最大32同時Oscillator
- 短いlookahead
- 停止/画面非表示/pagehideでAudioContextを破棄
- 完成音源の代替ではなく編曲比較用スケッチ

## PWA / Offline
- Arrangement Lab自身のscope/cacheだけを管理
- Build時にHTML/CSS/Module依存を同じbuild queryへ固定
- Service Workerはbuild別cache
- Online navigationはnetwork-first
- Offlineは同build cache
- 旧localStorageと別PWA cacheは保持
- v0.5 Moduleと `v05.css` をprecache

## Non-goals
- Mixing / Mastering
- Plugin Hosting
- DAW級Piano Roll
- 高品質音源レンダリング
- 自動で編曲の正解を決めること
- 調性感/転調成立の完全自動判定
- 全声部の厳密なクラシック和声チェック

## Verification
自動検証の正本: `VERIFICATION_v0.5.md`。

継続する既存検証:
- core / regression
- v0.3 7機能
- v0.4 50手法 / 157 Variant
- 360 / 390 / 430px Browser
- PWA Offline / update

v0.5追加検証:
- Song.mid Type 1
- Drum Fill / Bass Approach
- 比較範囲/変更パート
- 判断履歴/復元
- DAW ZIP
- 390pxの6部屋Browser flow

## 実機継続課題
- Android Chrome実機の音量感・長時間操作
- Cubasis / CubaseでのBefore/After Song.mid実取込
- DAW ZIP内各Trackの実取込と音源割当確認

## 参考資料
理論実装の既存参考:
- Berklee / Chord Substitution and Reharmonization
- Open Music Theory / Applied Chords
- Open Music Theory / Embellishing Chords
- Berklee / Basic Piano Voicing Techniques
- Berklee / Voice Leading Paradigms

教材本文や譜例は転載せず、Arrangement Labの候補生成規則・UI・コードは独自実装とする。
