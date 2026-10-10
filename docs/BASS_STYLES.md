# Bass Candidate Styles

## Purpose

Rhythm ModuleのBass候補は、完成したベースラインを自動作曲するための機能ではない。

目的は、同じChord / Barに対して異なる役割のBassを少数提示し、ユーザーが聴き比べて選び、16 stepで修正しながら作曲判断を学べるようにすること。

基本フロー:

候補を比較
→ 1つ選ぶ
→ 通常のBass Noteとして適用
→ 16 stepで手修正
→ Demo Player / MIDI Exportで確認

候補名・候補IDはProject Dataへ保存しない。適用結果だけを通常の `tracks[role=bass].notes[]` に保存するため、schemaVersionは2のまま。

## Five Styles

### 1. ルート型

役割: 土台・安定。

- Root中心
- 音数を減らす
- 長めのNote
- まず迷ったときの基準案

### 2. リフ型

役割: Bass自体をフックにする。

- 短い1小節フレーズを反復
- Root / 5th / Octave中心
- 休符を残す
- 小節頭だけでなく16分Grid上のずれを使う

The WeekndなどのダークPop / R&Bで見られる「低音の短い反復をフック化する」という考え方を参考にする。ただし、特定曲のBass Lineを再現・コピーする機能にはしない。

### 3. ファンク型

役割: Kickとの噛み合わせとシンコペーション。

- 現在BarにKickがある場合、その位置をAnchorにする
- Kickの直後に短い返しを加える
- Rootだけで埋めず、Chord Toneも少量使う
- Noteを短くし、休符を残す

Kickが無い場合は、既定のSyncopation Patternを叩き台として提示する。

### 4. シンセウェーブ型

役割: 一定の推進力。

- 8分音符の連続
- Root / Octaveを中心にする
- 音程変化よりもPulseを優先
- Synth Bassの方向性を決めやすくする

### 5. 裏メロ型

役割: Bassにも小さな旋律を持たせる。

- RootだけでなくChord Toneを使う
- 3rd相当 / 5th等を混ぜる
- Main Melodyを邪魔しない範囲でContourを作る
- Bassを「低音伴奏」だけでなくCounter Lineとして考える入口にする

## Generation Rules

- 1 Bar = 16 step
- 現在BarのChord QualityからChord Intervalを取得する
- Chord未設定時は既存のBass Root fallbackを使う
- MIDI Note Dataは既存形式を使う
- 現在Barだけを置き換え、他Barは保持する
- 適用前にBassがある場合は既存UIの上書き確認を使う
- Undo / AutoSave / Demo Player / MIDI Exportは既存処理を再利用する

## UX Principle

5タイプは「正解5つ」ではなく、「Bassの役割を変える5つの視点」として扱う。

初心者向けには、各候補で何が変わるかを短い説明と16 step Previewで見せる。候補数を無制限に増やさず、実制作テストで不足が確認された場合のみVariation / Refreshを検討する。
