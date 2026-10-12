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
- 既存100 Presetを曲想 / 感情タグへ紐付ける派生Profile
  - 感情: 明るい / 切ない / 希望 / 高揚 / 優しい / 哀愁 / 緊張 / 安心 / 力強い
  - 質感: 浮遊感 / 透明 / 暖かい / ダーク / 壮大 / 開放感 / 都会的 / 幻想的 / 疾走感
  - 場面: 夜 / 青春 / 雨 / ドライブ / 別れ / 旅立ち / 回想
  - `src/chord/chord-mood-tags.js` でPreset CategoryとDegree列から重み1〜5を派生計算
  - 複数タグからMajor / Minorを絞り、最大3つのPreset候補を返す
  - `src/chord/chord-mood-ui.js` でChord Preset欄の前に「曲想から選ぶ」を表示
  - タグは最大3個。候補にDegree進行 / 合致タグ / 王道・少し個性的・挑戦的を表示
  - Hub / 作曲シート由来の `metadata.mood[]` を `src/core/composition-intent.js` 経由で初期Tagへ自動反映
  - Hubの日本語Label（`切ない` / `夜` / `やさしい` 等）とChord Tag IDの両方を受け取れる
  - 同じHub Intentの間はChord側の手動Tag調整を維持し、Hub Intentが変わった時だけ再同期
  - `この進行を使う` は既存Preset適用処理へ渡すため、Bass保護など既存安全策を維持
  - 保存Schemaは変更せず、タグ選択 / 評価値はProject Dataへ保存しない
- 追加済みコード削除
- Clearで全削除
- 削除後のstartTick再配置
- Project Stateの `updateChords()` を通して更新
- Demo Player / MIDI Exportで各Qualityの構成音を反映

## Preset Policy

`src/chord/chord-presets.js` はDegree Indexの並びだけをPresetとして持つ。

Preset追加はこの表へ度数文字列を足すだけ（重複はSmoke Testで検出）。

曲想 / 感情タグはPreset本体へ重複保存せず、`chord-mood-tags.js` が派生Profileとして付与する。コード進行だけで感情が決まるとは扱わず、BPM / Melody / Rhythm / Voicing / Soundで印象が変わる前提とする。

Preset選択状態とChord側の曲想タグ選択はProject Dataへ保存しない。Hub / 作曲シート側の曲想の正本は `metadata.mood[]` とし、ChordはComposition Intent経由で読み取るだけ。Presetを適用すると通常の `project.chords[]` へ展開するため、Schema変更は不要。

Bass Noteがある場合は従来どおりChord変更を拒否する。Presetを適用したい場合はRhythmで `Clear Bass` を先に行う。

## Data

1コード = 1小節。

4/4 / PPQ 480のため、現在は `durationTick = 1920`。

主なフィールド:

- root: 0〜11
- quality: major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / dim / aug
- degree
- startTick
- durationTick

Schema v2でQualityを拡張。旧Schema v1の major / minor / diminished はそのまま互換。

## Later

- 実制作テストからタグWeightを調整
- 作曲シートからDemo ComposerへIntentをImportする入口を追加
- 並べ替え
- コード長変更
- 借用和音を目的別に整理した候補
- 次コード候補3案
- コード試聴の個別ボタン
- Scaler / Melody Sauce / Cubase等から整理したPreset Libraryの拡張
