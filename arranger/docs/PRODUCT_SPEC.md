# Arrangement Lab v0.3-dev

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

## v0.3: 理論を編曲判断に使う7機能
1. リハモ理論Lab。6手法の候補、成立条件、目的、注意、構成音差分、最寄り音対応。元/候補/特徴音/元Bassを最大16秒で比較する。
2. 裏メロのスケール案。Key / pentatonic / Lydian(major)・Dorian(minor) / 採用Chord Tone / 隙間応答。元リズムを保ち最寄り音へ移す。元CounterがないSectionは短い叩き台を生成。採用結果はcounterArrangement.notesへ保存。
3. Section別候補採用。現在案へ対象Sectionだけコピー。他Sectionを維持し採用元ラベルを保存。
4. サビだけ5案。chorus Section限定。壮大=sustain/full、疾走=pulse/full、浮遊=arpeggio/standard、静かな熱量=sustain/thin、踊れる=offbeat/standard。既存Bass/DrumsをON/OFFで利用し、自動ドラム生成はしない。
5. 引き算。3方向の候補を試聴し対象Sectionへ適用。
6. 主旋律との相性付きリハモ。構成音に重なる時間の割合を元/候補で表示。強拍(4/4の1・3拍)・1拍以上の非構成音を確認対象にする。点数/正誤判定ではない。元Bassの非構成音も表示。
7. 主役の受け渡し。melody-gapsでCounterの発音区間を主旋律の休みへ切り詰める。裏メロ主役時Harmony Velocityを75%へ。伴奏主役時CounterをOFF。主旋律Noteは保持。

各Sectionの「編曲ラボ」内に折りたたんで配置。候補の試聴は採用操作とは別で、元Project/採用案を変更しない。採用したら従来の「この案を採用」で保存。JSON/MIDIは表示中の案へ反映する。

### 理論の範囲
- 単一Keyを仮定する初期ルール。function/borrowedは長調のみ、Section外の解決先は使わない。
- 理論候補も元ChordのstartTick/durationTickを保持。挿入/転調の自動生成はしない。
- 代理機能はI↔vi、IV↔iiに限定。終止の最後のChordは機能代理で変更しない。
- 裏コードは解決するV7を対象。半音下dim7は導音型であり共通音dimとは別。
- 異名同音は#表記に統一。最寄り構成音の表示は音高クラスの対応で、実際の声部の独立性/平行進行/配置最適化を判定するものではない。
- 構成音重複時間はpolyphonic Melodyでは各Noteの重複時間合算。非構成音はアボイド断定ではなく、経過音/テンションになり得る。
- フィルタ時のCounter持続音はON/OFF境界や主旋律発音境界で切る。各パートMIDIも同じeventを出す。

### 理論の参考資料
- Berklee / Randy Felts, Chord Substitution and Reharmonization: https://online.berklee.edu/takenote/reharmonization-simple-substitution/
- Open Music Theory, Applied Chords: https://openmusictheory.github.io/appliedChords.html
- Open Music Theory, Embellishing Chords: https://viva.pressbooks.pub/openmusictheory/chapter/jazz-embellishing-chords/
教材の図や本文を転載せず、本アプリのルール・説明・コード実装は独自に作成。

### Arrangement Plan Schema 3
追加フィールド（いずれもSection内）：harmonyPattern、chorusDirection、counterArrangement:{id,label,notes,generated}、restPolicy、leadRole、reason、decisionNote、adoptedFrom。
旧Schema 1/2は受理し、元snapshotがあれば再開、なければ同じProject ID/revisionの元JSONを選択する。v0.3保存はdemo-composer-arranger-v0.3、v0.2/v0.1は起動時fallbackのみで自動削除しない。Demo Composer Schema 3とは別の形式。
