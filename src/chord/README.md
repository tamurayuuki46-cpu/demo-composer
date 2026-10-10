# Chord Module

Chord Moduleは `project.chords[]` の責任Module。

## v0.2-dev implemented

- HubのKey / Scaleを参照
- Major / Natural Minorのダイアトニックコード7つを生成
- コード名 + Degree表示
- 任意の基準音（C〜B）を選択
- 基準音ごとに Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug を候補表示
- 候補タップで1小節追加
- 追加済みコード削除
- Clearで全削除
- 削除後のstartTick再配置
- Project Stateの `updateChords()` を通して更新
- Demo Player / MIDI Exportで各Qualityの構成音を反映

## Data

1コード = 1小節。

4/4 / PPQ 480のため、現在は `durationTick = 1920`。

主なフィールド:

- root: 0〜11
- quality: major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented
- degree
- startTick
- durationTick

Schema v2でQualityを拡張。旧Schema v1の major / minor / diminished はそのまま互換。

## Later

- 並べ替え
- コード長変更
- 借用和音を目的別に整理した候補
- 次コード候補3案
- コード試聴の個別ボタン
