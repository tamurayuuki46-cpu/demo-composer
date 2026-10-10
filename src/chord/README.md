# Chord Module

Chord Moduleは `project.chords[]` の責任Module。

## v0.2-dev implemented

- HubのKey / Scaleを参照
- Major / Natural Minorのダイアトニックコード7つを生成
- コード名 + Degree表示
- 任意の基準音（C〜B）を選択
- 基準音ごとに Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug を候補表示
- 候補タップで1小節追加
- Chord Preset 100種類（4小節 / 8小節）
  - 王道・明るい / J-POP・切ない / ロック・力強い / バラード・やさしい / ダンス・ループ / ジャズ・おしゃれ / マイナー・暗め の7カテゴリ
  - 既存6種（Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行）はid・名前を維持
  - 追加分は `src/chord/chord-presets.js` の度数文字列表（例 `1451`）から生成。idは `<カテゴリ>-<度数>`
- Presetは現在Key / Scaleのダイアトニックコードへ自動変換
- Preset適用時は現在進行を置き換え、適用後は個別追加 / 削除で修正可能
- 追加済みコード削除
- Clearで全削除
- 削除後のstartTick再配置
- Project Stateの `updateChords()` を通して更新
- Demo Player / MIDI Exportで各Qualityの構成音を反映

## Preset Policy

`src/chord/chord-presets.js` はDegree Indexの並びだけをPresetとして持つ。

Preset追加はこの表へ度数文字列を足すだけ（重複はSmoke Testで検出）。

Preset選択状態はProject Dataへ保存しない。適用すると通常の `project.chords[]` へ展開するため、Schema変更は不要。

Bass Noteがある場合は従来どおりChord変更を拒否する。Presetを適用したい場合はRhythmで `Clear Bass` を先に行う。

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
- Scaler / Melody Sauce / Cubase等から整理したPreset Libraryの拡張
