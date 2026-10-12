# Arrangement Lab v0.1-dev

## 目的
Demo Composerで作った曲の骨格を、Cubasis / Cubaseへ渡す前に「どのSectionで、どの楽器を、どの密度で参加させるか」をAndroidスマホで比較・決定する。

## 位置づけ
Demo Composer → Arrangement Lab → Cubasis → Cubase

Demo Composerの既存Arrangeは曲構成（Section順・小節数・Energy・Transition）を担当する。Arrangement Labは同じ構成を前提に、楽器参加と役割の配置を担当する。

## v0.1 Scope
- Demo Composer project.json読み込み
- J-POP Band / Modern Synth Pop / Piano Balladの3スタイル
- A: 余白重視 / B: 標準 / C: 展開強め の3案生成
- SectionごとのDrums / Bass / Harmony / 裏メロ / 色付け / Transition案
- 採用案を端末localStorageへ保存
- Arrangement Plan JSON書き出し
- PWA Service Worker

## Non-goals
- Audio/MIDIの完成自動生成
- Mixing / Mastering
- Plugin Hosting
- DAW級Piano Roll
- 元のDemo Composer project.jsonの破壊的変更

## 次Version候補
- Sectionごとの手動ON/OFF編集
- 2周目Verseだけ追加するVariation
- Chord Voicing / Bass / Drum / Counter Melodyを実Noteへ展開
- Arrangement PlanからSong.mid生成
- Demo Composerへの戻し書き（互換性を確認してから）
