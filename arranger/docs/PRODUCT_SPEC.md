# Arrangement Lab v0.2-dev

## 目的
Demo Composerで作った曲の骨格を、Cubasis / Cubaseへ渡す前に「複数の編曲候補を鳴らして比べ、Section単位で混ぜ、必要ならリハモして、MIDIへ渡せる状態」にする。

## 位置づけ
Demo Composer → Arrangement Lab → Cubasis → Cubase

Demo ComposerのArrangeは曲構成（Section順・小節数・Energy・Transition）を担当する。Arrangement Labは同じ構成を前提に、楽器参加・密度・リハモ・比較・MIDI出力を担当する。

## v0.2 Scope
- Demo Composer project.json読み込み
- J-POP Band / Modern Synth Pop / Piano Ballad
- A: 余白重視 / B: 標準 / C: 展開強め
- A/B/CのWeb Audio簡易試聴
- 2案Mix
- Section単位の密度編集
- Drums / Bass / Harmony / 裏メロ / 色付けのON/OFF
- Energy / Density / 楽器数の可視化
- 主旋律×裏メロの近接衝突チェック
- リハモ3案: 自然 / 色付け / 大胆
- 選択リハモをArrangement Planへ保存
- Melody / Bass / Drums / Counter / Harmonyの個別MIDI出力
- Harmony MIDIへ選択リハモを反映
- 採用案localStorage保存
- Arrangement Plan JSON出力
- PWA / Offline cache

## リハモ方針
- 自然: Rootを保ち、major→maj7 / minor→m7を中心に色を追加
- 色付け: 一部を次コードへのSecondary Dominantへ変更
- 大胆: DominantのTritone Sub、Approach Diminished、9th系を利用

リハモ案は元のDemo Composer project.jsonを書き換えない。Arrangement PlanのSection内に選択結果だけを保持する。

## 簡易試聴
Web Audioを使う比較用スケッチ。Demo ComposerのMelody / Counter NoteとChordを使い、Arrangement LabのHarmony / Bass / Drums ON/OFFとリハモを反映する。完成音源の代替ではない。

## MIDI
- Melody / Bass / Drums / Counter: Demo ComposerのNoteをSection ON/OFFでフィルタして書き出す
- Harmony: Chordから簡易Voicingを生成し、Section密度と選択リハモを反映する
- MIDIはDAWへ渡すドラフトで、音色 / Mix / HumanizeはCubasis / Cubase側で行う

## Non-goals
- Mixing / Mastering
- Plugin Hosting
- DAW級Piano Roll
- 高品質音源レンダリング
- 元のDemo Composer project.jsonの破壊的変更

## 次Version候補
- Demo ComposerへArrangement Planを戻す双方向連携
- SectionごとのVoicing詳細編集
- Drum Fill / Bass Approachの実Note生成
- Song.mid一括出力
- Android Chrome / Cubasisの実機受け渡し自動テスト手順整備
