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
