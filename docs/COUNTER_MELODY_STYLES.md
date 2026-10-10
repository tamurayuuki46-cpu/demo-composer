# Counter Melody 3 Styles

更新日: 2026-10-11
対象Version: v0.2-dev

## 目的

Arrange の裏メロ候補を、役割が分かりやすい3系統へ整理する。

完成フレーズを自動作曲する機能ではなく、Sectionごとに3つを聴き比べて選び、必要なら別候補へ替えるための叩き台とする。

## 3系統

### Sparse（隙間型）

- メインMelodyの休符・隙間を優先する
- 音数は少なめ
- 短いレスポンスを中心にする
- メインMelodyが詰まった小節では無理に入れない
- ※イメージ: 米津系。特定曲のコピーや旋律再現ではなく「隙間を使う役割」の参考分類

### Active（動く型）

- 8分音符中心
- メインMelodyより下側を基本にする
- Chord Toneを軸にScale Toneも使う
- コード感と推進力を足す
- ※イメージ: YOASOBI系。特定曲のコピーや旋律再現ではなく「動いて推進力を出す役割」の参考分類

### Hook（フック型）

- 少ない音で覚えやすい輪郭を作る
- 同じリズム形を小節ごとに繰り返す
- コードが変わっても「上がって戻る」輪郭を保つ
- もう1つの歌えるフックとして使う
- ※イメージ: Oasis系。特定曲のコピーや旋律再現ではなく「反復フックの役割」の参考分類

## Data / Compatibility

- 保存先は従来どおり `tracks[role=counter].notes[]`
- 候補名や候補IDはProject Dataへ保存しない
- 適用結果だけを通常Noteとして保存する
- `schemaVersion: 2` のまま
- Migration不要
- AutoSave / Undo / Redo / Demo Player / `CounterMelody.mid` / `Song.mid` は既存処理を再利用する

## 変更しないもの

- Counter Melody TrackのSchema
- MIDI Channel 4
- Section単位で適用・消去する操作
- Key変更時の移調
- Scale変更時の安全制約
- Cubasis / Cubaseへ渡すMIDI形式

## Backup

変更前復元点:

`restore/v0.2-before-counter-style-3ways`

作業Branch:

`chatgpt/v0.2-counter-style-3ways`
