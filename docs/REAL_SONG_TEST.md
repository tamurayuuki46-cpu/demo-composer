# Android実機 1曲通しテスト（実制作テスト）

目的: 「PCを起動する前に、スマホで曲の骨子を決め、Cubasis / Cubaseへ渡せるか」を、実際に1曲作って確かめる。機能を足す前の、最後の確認。

> 現在の正式Workflowは `作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → Cubasis / Cubase`。最終DAW用 `Song.mid` はArrangement Labの採用済み編曲案から書き出す。stable判定の詳細条件は `docs/DAW_HANDOFF_VERIFICATION.md` を正本とする。

アプリ内の案内とMusic Project Homeの「次にやること」を使いながら進める。

## 0. 準備（5分）

- [ ] 端末 / Androidのバージョン / Chromeのバージョンを記録する
- [ ] GitHub Pagesの最新版を開く（https://tamurayuuki46-cpu.github.io/demo-composer/）。表示が古いときはChromeで再読み込み
- [ ] 新しい空のProjectで始める。前の曲が残っているときは先にSongProject v1 / project.jsonを退避する
- [ ] メディア音量を上げ、サイレントモードでないことを確認する
- [ ] Hubの文字の大きさを、読みやすい段階にしておく
- [ ] 作る曲の「お題」を1行で決める（例: 夜のドライブで聴く、切ない8ビートのポップ）

## 1. 作る（目安 40〜60分）

手引きの順に進める。迷った場所と、止まった時間は、その場で記録する。

| 手順 | やること | 確認すること |
| --- | --- | --- |
| 1 出発点 | 作曲シート / Hubで方向性を決める | 場面・Genre/Mood・BPM/Key候補などを決められる |
| 2 BPM・Key | 曲名・BPM・Keyを決める | 変更が反映される。コード入力後にKeyを変えると一緒に移調される |
| 3 コード | Presetか候補で8小節作る | コード名とDegreeが見える / 片手で押しやすい / Presetの選択が探しやすい |
| 4 メロディ | 山の位置 or 3候補で作り、Piano Rollで直す | 候補の違いが聴き分けられる / Piano Rollで1音ずつ直せる / Analyzerの表示が理解できる |
| 5 ベース | Bass候補から選ぶ | キックと同時に確認できる / ルート中心で自然に聴こえる |
| 6 ドラム | Presetとフィル | フィルが次のSectionへのつなぎに聴こえる |
| 7 構成 | Arrangeで構成を決める | Sectionの追加・小節増減・コピーが迷わない / 画面が長すぎて迷子にならない |
| 8 Energy・つなぎ | 各SectionのEnergyとつなぎ方 | 盛り上がりの流れが一目で分かる |
| 9 少し違う版 | 2回目のSectionに使う | 元のSectionが変わらず、押したSectionだけ変わる |
| 10 裏メロ | サビなどに3候補を試す | メロディとぶつからない / 消せる / ↶で戻る |
| 11 音色 | Sound Sketchで方向性を選ぶ | Presetと方向性が選べる |
| 12 骨子チェック | Hubで抜けを確認 | ✓ / △ / － が実際の状態と合っている / ボタンで該当画面へ行ける |

## 2. 聴く（10分）

- [ ] 画面下の再生で、曲全体を通して聴く（イヤホン / スマホのスピーカー両方）
- [ ] Loopで、気になるSectionを繰り返し聴く。再生中に直した内容が次の周から聴こえる
- [ ] `パート` のミュート / ソロで、各パートの聴き分けができる（裏メロ含む）
- [ ] 途中で他のアプリへ切り替えて戻っても、再生と画面が壊れない
- [ ] Chromeを閉じて開き直しても、曲が残っている（AutoSave）

## 2.5 発散モードとKeep保存（Demo Composer v0.18 / 10分）

アイデアを増やす段階で、案がアプリを閉じても残るかを確かめる。`/divergence.html`（Music Project Homeの「曲のアイデアを増やす」）から開く。

- [ ] 発散モードを開き、Lock（固定する軸）とDistanceを決めて、派生案を3つ以上作る
- [ ] 良い案を2つ以上 `Keep` する。Keepライブラリに入り、件数が増える
- [ ] 画面に「タブを閉じると消える」という保存の警告が **出ていない**（出ている場合は端末のIndexedDBが使えていないので、不具合として記録）
- [ ] Chromeのタブを閉じる（アプリ一覧からも消す）→ 開き直す → 同じProjectの発散画面で、Branch TreeとKeepライブラリが残っている
- [ ] 他のアプリへ切り替えて数分後に戻る。案が残っている
- [ ] 1案を `Freeze` して通常画面へ戻る → 発散画面を開き直す → **Freezeしなかった他のKeep案がライブラリに残っている**
- [ ] ライブラリの案を `ツリーに呼び出す` → 試聴できる。もう一度押しても同じ案が重複しない
- [ ] `Keepを外す` / ライブラリからの削除（確認ダイアログあり）ができる
- [ ] Demo ComposerでProjectを編集して保存したあと、古い元案のKeepを `Freeze` しようとすると「置き換わります」の確認が出る。キャンセルすると曲が変わらない
- [ ] Keepが40案を超えそうな場合は、黙って捨てられず警告が出る（任意。多くのKeepを作った時だけ）

## 2.6 MIDI Archive/Analyzer（任意 / v0.26 / 10分）

参考MIDIを調べる、または素材を残したい時だけ行う。 https://tamurayuuki46-cpu.github.io/midi-analyzer/

### Analyzer（曲を理解する）

- [ ] 画面上部に `Analyzer` / `Archive` の切替があり、初期はAnalyzer。ボタンが押しやすい（片手・44px以上）
- [ ] Analyzerでは「解析した曲を端末にも保存する」が **OFF** になっている
- [ ] MIDIを1つ読み込む → 「今見る3つ」が **最大3件** 表示され、Evidence / Meaning / Action が読める。点数や「良い / 悪い」の表現がない
- [ ] 「今回の目的」を切り替えると3つの内容・順番が変わる（3件を超えない）
- [ ] 「詳細分析を開く」でStructureタブへ移動し、詳細モードから全タブ（Library無し・12タブ）を使える
- [ ] 初心者モードに戻すと「今見る3つ」が再表示される

### Archive（素材を保存する）

- [ ] `Archive` に切り替えると、Audio→MIDI / Stem / 保存済みMIDI が見え、解析タブは出ない。保存チェックは **ON**
- [ ] 取り込んだ曲に対して、4小節Clipの保存・検索、Key変更MIDIの書き出し（Target Key MIDI）ができる
- [ ] ブラウザ / Androidの戻るボタンで、AnalyzerとArchiveを行き来できる
- [ ] 保存済みMIDIの `Analyzerで開く` を押すと、Analyzerで再解析される。Archiveの保存済み件数が **増えていない**
- [ ] Chromeを閉じて開き直しても、保存済みMIDIが残っている（最後に使った画面も復元される）
- [ ] 再生中にArchiveへ切り替えると、再生が止まる

## 3. 編曲してDAWへ渡す（20〜30分）

### Demo Composer → Arrangement Lab

- [ ] Demo ComposerでSongProject v1を保存する
- [ ] 「Arrangement Labへ渡す」導線、または保存したSongProject v1 JSONからArrangement Labを開く
- [ ] A/B/Cを聴き比べる
- [ ] 1案を採用する
- [ ] Sectionを最低1か所調整する

### Arrangement Lab → Android file

- [ ] `Song.mid（採用案）` を押す
- [ ] Android側に `.mid` が保存される
- [ ] ファイル名・サイズを確認し、0 byteでない
- [ ] 編曲結果を保持したSongProject v1もバックアップとして保存する

### Android → Cubasis / Cubase

- [ ] Cubasisで同じSong.midを読み込む
- [ ] 5パート（Chords / Melody / Counter Melody / Bass / Drums）を識別できる
- [ ] Tempo・4/4・Note開始位置/長さ・曲末尾が壊れていない
- [ ] DrumsをMIDI ch.10として扱える
- [ ] PCへ同じSong.midを渡し、Cubaseへ読み込む
- [ ] Cubaseで5 MIDI Track、channel、Tempo、4/4、Section Marker、Note位置/長さを確認する
- [ ] 全体再生でハングNote・極端なタイミング崩れがない
- [ ] 同じ曲をSongProject v1 / project.jsonのImportで読み直せる

詳細なPASS条件と結果記録は `docs/DAW_HANDOFF_VERIFICATION.md` を使う。

## 4. 判定

次の質問に答える。

1. PCを起動する前に、「何を作ろう」ではなく「どう仕上げよう」から始められる状態になったか
2. スマホ上で、作曲の判断（コード・メロディ・構成・盛り上がり）がしやすかったか
3. どこで手が止まったか（所要時間が長かった場所）
4. 初心者が自力で進められそうか
5. 次に直すべきもの（機能追加ではなく、減らす・まとめる・分かりやすくする）

判定:

- 合格: 1曲を最後まで作り、Android → Arrangement Lab → Song.mid → Cubasis → Cubaseを通せた。重大な不具合なし
- 条件付き: 通せたが、操作に迷う場所や軽い不具合がある（下の記録に書く）
- 不合格: 途中で進めなくなった / データが消えた / MIDIが読み込めない / MIDI内容が壊れた

## 5. 記録シート（コピーして使う）

```text
日付:
端末 / Android / Chrome:
Demo Composer Version:
Arrangement Lab Version:
Cubasis Version:
Cubase Version:
お題:
所要時間（作る / 聴く / 編曲 / 渡す）:
判定: 合格 / 条件付き / 不合格

迷った・止まった場所（画面 / 操作 / 何分）:
-

不具合（再現手順 / 画面 / 重さ: 大・中・小）:
-

分かりにくかった表示・文言:
-

多すぎる / 使わなかった機能:
-

足りなかったもの（本当に必要なものだけ）:
-

良かった点:
-
```

## 6. 結果の扱い

- 不具合は `docs/AI_HANDOFF.md` の「既知の問題」へ、重い順に書く
- 機能の追加は、まず「減らす / まとめる / 分かりやすくする」で解決できないかを考える
- 判断の基準: 「この変更で、スマホ上の作曲判断とDAWへの引き継ぎがしやすくなるか？」
- Android / Cubasis / Cubase実機PASS前にstable tagを作らない
- 軽微な表示・文言・タップしづらさは⑥ UX改善へ回す
