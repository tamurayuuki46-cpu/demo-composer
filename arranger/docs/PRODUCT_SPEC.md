# Arrangement Lab v0.2.1-dev

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

## v0.2.1 検証後の契約
- 試聴は選択Sectionから最大16秒。MIDIと同じNote生成を利用。元Bass/Drumsが無ければそのパートは無音。
- 色付けON/OFFは計画・楽器数の指標のみ。音源やMIDI Noteを生成しない。
- Harmonyは44 Quality対応。thinは2音、standardは最大3音、fullは全構成音。拡張コードでは特徴音を残す。
- リハモはSection内で開始するコードだけを対象にし開始tick/長さを維持。音声/MIDI出力時はSection境界に切り詰める。
- 自然はRoot保持。Secondary Dominantは次Root+7。Tritoneは次Rootへ解決するV7のみRoot+6。Approach dim7は次Root-1。
- SMF Type 0、1トラック、入力PPQ、Tempo/4/4/Track Name/EOT。Note Offを同tickのNote Onより先に置く。Drumsはch10固定。
- パートのON範囲内にNoteを切り詰める。連続ON Sectionでは元持続音を維持する。
- localStorageキーはv0.2のまま、Schema 2への任意sourceSnapshot追加。採用時に保存。変更後は再採用で保存、JSONは表示中の案を出力。
- sourceSnapshotは元Projectのコピー。元Project/IndexedDBには書込まない。
- v0.1/初期v0.2のsnapshotなしプランはJSON出力を維持。同じID/revisionの元project.jsonを再読込すると編集再開。旧キーや不正データを自動削除しない。
- Service WorkerはArrangement Lab自身のcache/scopeだけを管理。キャッシュ更新時はversionを上げる。
- 詳細検証記録: VERIFICATION_v0.2.1.md。
