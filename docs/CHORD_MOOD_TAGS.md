# Chord Mood / Emotion Tags

## 目的

既存のChord Preset 100種類を、曲想 / 感情から探せるようにするための派生タグ層。

コード進行だけで感情を断定しない。同じ進行でもBPM / Melody / Rhythm / Voicing / Soundで印象が変わるため、タグは「候補を探す手掛かり」として扱う。

## 実装

- Tag / Recommendation: `src/chord/chord-mood-tags.js`
- UI: `src/chord/chord-mood-ui.js` / `src/chord/chord-mood-ui.css`
- Preset正本: `src/chord/chord-presets.js`
- Project Schema: 変更なし（schemaVersion 2のまま）
- MIDI: 変更なし
- 保存: タグ選択 / Profile / 推薦ScoreはProject Dataへ保存しない

## タグ体系

### emotion

- 明るい
- 切ない
- 希望
- 高揚
- 優しい
- 哀愁
- 緊張
- 安心
- 力強い

### texture

- 浮遊感
- 透明
- 暖かい
- ダーク
- 壮大
- 開放感
- 都会的
- 幻想的
- 疾走感

### scene

- 夜
- 青春
- 雨
- ドライブ
- 別れ
- 旅立ち
- 回想

既存Hub Moodの `bright / sad / night / strong / gentle` は同じidを使い、将来のHub→Chord連携で変換を増やさない。

## 紐付け方法

Preset本体へ100件分のタグを直接書き込まず、以下から重み1〜5を派生する。

1. Preset Category
   - 王道・明るい
   - J-POP・切ない
   - ロック・力強い
   - バラード・やさしい
   - ダンス・ループ
   - ジャズ・おしゃれ
   - マイナー・暗め
2. Degree列の簡単な特徴
   - vi / VI始まり
   - V終わり
   - I終わり
   - vi終わり
   - vii°を含む
   - 2コード中心の反復
   - 8小節進行

これにより、Chord Preset追加時も既存のCategory / Degree情報から基本Profileを自動生成できる。

## API

`chordMoodProfile(presetOrId)`

1つのPresetについて、mode / difficulty / tags(weight付き)を返す。

`recommendChordPresetsByMood(selectedTags, { mode, limit })`

複数タグを合算してPreset候補を返す。通常は最大3案。

3案の場合は可能な範囲で以下を混ぜる。

- standard: 既存の代表Preset
- expressive: 4小節の追加Preset
- adventurous: 8小節Preset

## UI

Chord Preset欄の直前に `曲想から選ぶ` パネルを表示する。

- 感情 / 質感 / 場面をChipで選択
- 同時選択は最大3タグ
- 現在のMajor / Minorに合わせて最大3候補を表示
- 候補にはDegree進行、合致タグ、`王道 / 少し個性的 / 挑戦的` を表示
- `この進行を使う` で既存Chord Preset選択 / 適用処理へ渡す
- Bass保護など既存Preset適用時の安全チェックをそのまま利用
- タグ選択状態はUI状態のみでProject Dataへ保存しない

UIは `main.js` へ大規模に組み込まず、`#screen` を監視する独立Moduleとして追加する。既存Chord画面への依存箇所を最小化し、並行開発時の競合を避ける。

Androidスマホ向けにChip / 適用ボタンのタップ領域を広めにし、横スクロールを必須にしない。

## テスト

- `scripts/chord-mood-tags-smoke-test.mjs`
- `scripts/chord-mood-ui-smoke-test.mjs`
- `npm run test:chord-presets` から既存Preset Testと一緒に実行する
- `npm run test:syntax` にTag / UI Moduleを含める

## 注意

タグ重みは音楽的な絶対評価ではなく初期ヒューリスティック。実制作テストで違和感がある紐付けを調整する。

今後、BPM / Melody / Rhythm / Soundまで含む推薦へ拡張する場合も、コード進行単体のタグ値を「感情の正解」として扱わない。
