# 作曲支援アプリ群 Workflow Principles

更新日: 2026-10-13

## 目的

作曲に必要な作業は、PC DAWへ渡す前に可能な限りAndroidスマホだけで済ませる。
ただしPC DAW（Cubase等）は最終制作の必須工程とし、スマホアプリ群はPC DAWを置き換えない。

目標は「PCを開く前に、曲の方向性・参考分析・素材・作曲・編曲判断をできるだけ終わらせ、PC DAWでは完成作業へ集中できる状態」を作ること。

## 正式Workflow

作曲シート
→ 必要に応じて Moises → MIDI Analyzer
→ Demo Composer
→ Arrangement Lab
→ 必要に応じて Cubasis
→ PC DAW（必須）
→ 完成

参考曲調査は分岐レーンであり、毎回必須ではない。

## 各工程の一言定義

- 作曲シート = 決める
- Moises = 分ける
- MIDI Analyzer = 集める・理解する
- Demo Composer = 作る
- Arrangement Lab = 育てる
- PC DAW = 完成させる

## 作曲シート

担当:
- 曲の場面・目的
- 参考曲
- Genre / Mood
- BPM / Key候補
- 制約
- 今回試したいこと

担当しない:
- MIDI編集
- 詳細分析
- 編曲
- 音作り

作曲シートは軽い入口であり、制作機能を増やして重くしない。

### Claude Artifact連携

作曲シート本体の所有者はClaude Artifactとする。GitHub側へ作曲シート本体を複製・再実装しない。

GitHub側では以下だけを正本管理する。

- Claude Artifactへ渡す仕様変更プロンプト
- Demo Composerへ渡す構造化Handoff JSONの契約
- Handoff Schema Version

正本プロンプト:
`docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`

Claude Artifact側には、人間向けの作曲シートまとめに加えて、`kind: composition-sheet-handoff` / `schemaVersion: 1` のJSONを生成できるよう依頼する。

Demo Composerは将来このJSONを初期値・設計メモとしてImportする。Claude Artifact側が完成済みChord / Melody / Bass / Drums等のCompositionを所有・確定しない。

Schemaを変更する場合は、先に上記GitHub正本プロンプトを更新し、旧Versionとの互換方針を決める。

## Moises

担当:
- 参考音源のStem分離
- Vocal / Drums / Bass / Other等の素材化

担当しない:
- 作曲
- MIDI Analyzerの詳細分析
- 編曲判断

MIDI Analyzer自身のStem関連機能はMoisesを置き換える主機能にしない。Moisesから受け取ったStemの保存・試聴・Audio→MIDI等を補助する。

## MIDI Analyzer

役割は2つだけに固定する。

### 1. 素材を集める

- MIDI / Audio / StemのImport
- Audio→MIDI
- Basic Pitch結果の最小限のNote修正 / Quantize
- Clip Library
- Chord / Melody / Bass / Drum / Motif素材保存
- Key adaptation / Degree Preserve / 12 Key生成
- RipX / Moises等からの受け入れ

### 2. 曲を理解する

- Key / Scale
- Chord / Degree
- Melody / Bass / Rhythm
- Motif / Section / 転調
- 裏メロ分析
- 比較分析
- Personal Trend
- 可視化
- Explainability
- Higher-level Metrics

担当しない:
- 自分の曲の本格作曲
- 編曲案の採用管理
- 完成音源制作
- Mixer / Mastering / Plugin Hosting

分析結果を作曲へ渡すことはできるが、Analyzer自身が作曲の所有者にならない。

## Demo Composer

担当:
- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- BPM / Key / Scale
- 作曲案のA/B比較
- 作曲判断
- Draft.mid

許可する分析は「今作っている曲を判断するための簡易・文脈内分析」に限定する。

担当しない:
- 参考曲ライブラリ分析
- Personal Trend
- 深い楽曲分析
- リハモ / 高度Voicing / 編曲密度設計
- Mixing / Mastering

## Arrangement Lab

担当:
- リハモ
- Voicing
- 裏メロ対話設計
- 密度
- 楽器の入口/出口
- 主役交代
- サビ展開
- 引き算
- Section変化
- A/B/C比較
- 判断履歴
- DAW引き継ぎ
- final Song.mid

Compositionは参照するが、通常操作でDemo Composerの元Projectを上書きしない。
Demo Composerへ戻す必要がある場合は「新しい作曲ProjectとしてFork」する明示操作に限定する。

## PC DAW

最終工程として必須。

担当:
- 本格音源 / VST / Plugin
- 詳細MIDI編集
- Audio Recording
- Vocal制作
- Automation
- Mixing
- Mastering
- 最終音作り
- 完成音源制作

## UX原則

1. 機能数よりWorkflowの直感性を優先する。
2. 常に「今どこか」「次に何をするか」「次はどのアプリか」が分かるUIにする。
3. 同じ作業を複数アプリで重複させない。
4. 前工程の成果を再入力させない。
5. 各アプリに明確な入口と出口を持たせる。
6. 主導線から外れる機能は、便利でも削除・縮小・移管を検討する。
7. 保存済みデータを壊す削除は避け、まずUIから外して互換性を保つ。

## 機能配置の判定ルール

新機能は次の質問で配置する。

- 何を作るか決める? → 作曲シート
- 音源を分ける? → Moises
- 素材を集める / 曲を理解する? → MIDI Analyzer
- 曲そのものを書く? → Demo Composer
- 既存曲を変形・比較して編曲する? → Arrangement Lab
- 最終品質へ仕上げる? → PC DAW

2つ以上に当てはまる場合は、所有者を1つだけ決め、他アプリは参照・受け渡しUIだけにする。

## 変更前復元点

- demo-composer: `restore/before-workflow-boundary-2026-10-13`
- midi-analyzer: `restore/before-workflow-boundary-2026-10-13`

境界整理では過去Version・保存済みデータを削除せず、まず責務・UI・導線から整理する。
