# Chord Module

Chord Moduleは `project.chords[]` の責任Module。

## v0.1-dev implemented

- HubのKey / Scaleを参照
- Major / Natural Minorのダイアトニックコード7つを生成
- コード名 + Degree表示
- 候補タップで1小節追加
- 追加済みコード削除
- Clearで全削除
- 削除後のstartTick再配置
- Project Stateの `updateChords()` を通して更新

## Data

1コード = 1小節。

4/4 / PPQ 480のため、現在は `durationTick = 1920`。

主なフィールド:

- root: 0〜11
- quality: major / minor / diminished
- degree
- startTick
- durationTick

## Later

- 並べ替え
- コード長変更
- 7th等のQuality追加
- 借用和音
- 次コード候補3案
- コード試聴
