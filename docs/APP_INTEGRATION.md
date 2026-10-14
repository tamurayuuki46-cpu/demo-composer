# App Integration Contract

更新日: 2026-10-13

正本思想: `docs/WORKFLOW_PRINCIPLES.md`

## 現在の配置

- 作曲シート: Repository内の作曲シート全集 v0.4（31シート）を標準とする。Claude Artifactは旧参照として保持
- Demo Composer: `demo-composer` repository root
- Arrangement Lab: `demo-composer/arranger/`
- MIDI Analyzer: separate `midi-analyzer` repository
- Moises: 外部Stem分離入口
- PC DAW: Cubase等。最終制作の必須工程

Arrangement LabはDemo Composerと同じRepositoryにありますが、将来別Originでも壊れないよう共通交換形式はSongProject JSONを正本とします。

## ユーザーの正式Workflow

1. 作曲シートで「何を作るか」を決める
2. 参考曲調査が必要な場合だけ Moises → MIDI Analyzer
3. MIDI Analyzerで「素材を集める / 曲を理解する」
4. 学び・素材をDemo Composerへ渡す
5. Demo Composerで曲そのものを作る
6. `Draft.mid` / SongProjectをArrangement Labへ渡す
7. Arrangement Labで編曲案を比較・採用する
8. `Song.mid` / DAW引き継ぎ素材を出す
9. 必要に応じてCubasisを経由する
10. PC DAWへ必ず渡し、本制作・完成を行う

スマホアプリ群の目的はPC DAWを不要にすることではない。PC DAWを開く前に可能な限り多くの作曲・編曲判断と素材準備を済ませること。

## Responsibility boundary

### 作曲シート — 決める

担当:
- 場面 / 目的
- 参考曲
- Genre / Mood
- BPM / Key候補
- 制約
- 今回試したいこと

作曲シートへ音編集・分析・編曲機能を増やさない。

### Moises — 分ける

担当:
- 参考音源のStem分離
- Vocal / Drums / Bass / Other等の素材化

Analyzer内のStem機能はMoisesを置き換える主機能にしない。Moises等で作ったStemの受け入れ・保存・試聴・Audio→MIDIを補助する。

### MIDI Analyzer — 集める / 理解する

担当は2つだけ。

素材を集める:
- MIDI / Audio / Stem Import
- Audio→MIDI
- 抽出Noteの最小限の修正 / Quantize
- Clip Library
- Key adaptation / 12 Key material
- 素材Export

曲を理解する:
- BPM / Key / Scale
- Chord / Degree
- Melody / Bass / Rhythm
- Motif / Section / 転調
- 裏メロ分析
- 比較 / Personal Trend
- 可視化 / Explainability / Metrics

Analyzer接続時もComposition / Arrangementは保持する。Analyzerは作曲Projectの所有者にならない。

### Demo Composer — 作る

曲のCompositionを所有する。

- chords
- melody
- counter melody
- bass
- drums
- sections
- BPM / Key / Scale
- 作曲案A/B
- 作曲判断

簡易分析は「現在作っている曲を判断するため」に限る。参考曲の深い分析やPersonal TrendはMIDI Analyzerへ寄せる。

全体MIDIは`Draft.mid`として出力する。これは作曲段階のドラフトであり、最終Song MIDIではない。

### Arrangement Lab — 育てる

編曲判断を所有する。

- reharmonization
- voicing
- counter interaction
- density
- instruments
- development
- alternatives
- decisions
- DAW handoff

Compositionは参照するが通常操作で元Demo Composer Projectを上書きしない。
Demo Composer側へ戻す場合は「新しい作曲ProjectとしてFork」する明示操作に限定する。

採用済み編曲結果の最終一括MIDIは`Song.mid`として出力する。

### PC DAW — 完成させる

必須の最終工程。

- 本格音源 / VST / Plugin
- 詳細MIDI編集
- Audio / Vocal Recording
- Automation
- Mixing / Mastering
- 最終音作り
- 完成音源制作

## 重複機能の扱い

機能が複数アプリに存在しても、所有者は1つにする。

- Analysis owner = MIDI Analyzer
- Composition owner = Demo Composer
- Arrangement owner = Arrangement Lab
- Final production owner = PC DAW

他アプリに残すのは、その場の判断に必要な軽量表示・受け渡し・Previewだけ。

役割に合わない機能は、便利でも削除・縮小・移管してよい。保存済みデータがある場合はデータを先に消さず、主UIから外して互換性を維持する。

## Storage boundary

異OriginではIndexedDBを共有しない。交換は`*_song_project_v1.json` / MIDI / Clip / Analysis / Reference等の明示形式を使う。

同一Origin配下でも、共通IndexedDBはSongProject Adapterが安定してから検討する。

## Privacy / Copyright

Audio→MIDIはユーザーが明示選択したファイルだけを対象とし、端末内処理を優先する。配信サービスから音源を取得・録音・リッピングする機能は本Integration Contractの対象外。

## 変更前復元点

- demo-composer: `restore/before-workflow-boundary-2026-10-13`
- midi-analyzer: `restore/before-workflow-boundary-2026-10-13`
