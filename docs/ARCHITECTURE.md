# ARCHITECTURE

## Module構成
- Hub: 曲全体の基本情報と作曲意図を管理
- Chord: コード進行、Degree、候補提示、試聴
- Melody: 主旋律、Piano Roll、分析
- Rhythm: Bass / Kick / Snare / Hi-Hat / Percussion
- Arrange: Section / Counter Melody
- Sound: Presetと音色方向性タグ

## 責任分離
- Hubは project.intent と基本情報の責任Module。
- Chordは project.chord の責任Module。
- Chordは project.intent.tags を読み取って候補を計算するが、intent自体は書き換えない。
- 曲想タグDBは Chord Module内の参照データとして扱う。

## Chord推薦フロー
1. Hubまたは作曲シートから曲想タグを受け取る
2. Chord Moduleが progression catalog と照合
3. タグ重みの一致度をスコア化
4. mode / key条件で不適合候補を除外
5. 上位候補から難易度が偏りすぎないよう最大3案を提示
6. ユーザーが選択・修正する

## 設計原則
- タグは感情の断定ではなく検索・提案補助として使う
- コード進行と感情を1対1に固定しない
- 同じ進行でもBPM、メロディ、リズム、ボイシング、音色で印象が変わる前提を維持する
- 推薦ロジックはUIから分離し、後から調整可能にする
