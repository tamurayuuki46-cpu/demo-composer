# Counter Melody 4 Styles

更新日: 2026-10-11
対象Version: v0.2-dev

## 目的

Arrange の裏メロ候補を、役割が分かりやすい4系統へ整理する。

完成フレーズを自動作曲する機能ではなく、Sectionごとに4つを聴き比べて選び、必要なら別候補へ替えるための叩き台とする。

## 4系統

### Sparse（隙間型）

- メインMelodyの休符・隙間を優先する
- 音数は少なめ
- 短いレスポンスを中心にする
- メインMelodyが詰まった小節では無理に入れない
- ※イメージ: 米津系。特定曲のコピーや旋律再現ではなく「隙間を使う役割」の参考分類

### Active（動く型）

- 8分音符中心
- メインMelodyより下側を基本にする
- 土台のコード進行自体は変えない
- 1小節の中で、次の3つの色を順番に混ぜる
  1. コードトーン型: 強拍を中心に現在コードの構成音で安定させる
  2. テンション型: 現在Key内のコード外音を使い、9th / 11th / 13th系の色を足す
  3. 薄い別コード感型: 現在コードの3度上のScale Degreeから作る3音を薄く重ね、第二のハーモニーの輪郭を作る
- 例: C Major上のCコードなら、薄い別コード感型では E-G-B の輪郭を使える。土台はCのままなので、Emへ転調・コード変更するわけではない
- 主旋律と同じ音をなぞるのではなく、主旋律とは違うDegreeを選んでコードの色と推進力を足す
- ※イメージ: YOASOBI / Ayase系。特定曲のコピーや旋律再現ではなく「動きながら第二のハーモニーを薄く作る役割」の参考分類

### Hook（フック型）

- 少ない音で覚えやすい輪郭を作る
- 同じリズム形を小節ごとに繰り返す
- コードが変わっても「上がって戻る」輪郭を保つ
- もう1つの歌えるフックとして使う
- ※イメージ: Oasis系。特定曲のコピーや旋律再現ではなく「反復フックの役割」の参考分類

### Answer（応答型）

- メインMelodyの語尾や小節後半の空きを優先する
- Sparseより音価を長めにし、短い装飾より「歌への返答」を感じる形にする
- ルートより3度・7度など、コードの明暗や色が出やすい音を優先する
- 4つ空きstepがある場合は2音を2stepずつ置き、少し上がる / 下がる流れで感情を補強する
- 主旋律が詰まっている小節では無理に入れない
- ※イメージ: Mr.Children系。特定曲のコピーや旋律再現ではなく「歌の語尾に応答して感情を補強する役割」の参考分類

## 使い分けの目安

- Sparse = 隙間を短く埋める
- Active = 主旋律の下で動き続ける
- Hook = 反復するもう1つのフックを作る
- Answer = 主旋律が言い切った後に、少し長めに返す

Sparse と Answer はどちらも休符を使うが、Sparse は短い装飾、Answer は語尾への応答という役割で分ける。

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
- Sparse / Active / Hook の既存3系統の役割

## Backup

3系統整理前の復元点:

`restore/v0.2-before-counter-style-3ways`

Activeハーモニー強化前の復元点:

`restore/v0.2-before-active-harmony`

Answer（応答型）追加前の復元点:

`restore/v0.2-before-counter-answer-style`

今回の作業Branch:

`chatgpt/v0.2-counter-answer-style`
