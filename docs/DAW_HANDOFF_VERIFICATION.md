# Android → Song.mid → Cubasis / Cubase 検証ゲート

更新日: 2026-10-15

## 目的

正式Workflowの最後の境界、

`Android → Arrangement Lab → Song.mid → Cubasis → Cubase`

を「自動テストで保証できる部分」と「実機でしか保証できない部分」に分けて確認する。

この検証が完了するまでは `stable` tagを作成しない。

## 1. 自動テストで保証する範囲

Arrangement Labの `arranger/tests/song-midi.test.mjs` をCIで実行し、Final `Song.mid`について最低限以下を固定する。

- Standard MIDI File Format 1
- 5トラック
  - Chords
  - Melody
  - Counter Melody
  - Bass
  - Drums
- PPQ = 480
- Tempo meta eventの値
- Time Signature = 4/4
- Section Marker
- MIDI channel
  - Chords = ch.1
  - Melody = ch.2
  - Bass = ch.3
  - Counter Melody = ch.4
  - Drums = ch.10
- 各トラックにNote On / Note Offが存在する

SongProject v1については別のcross-app boundary testで、Demo Composer / Arrangement Lab / Composition Sheet / MIDI Analyzerの所有領域が相互に消えないことを確認する。

### 自動テストで保証できないもの

以下はブラウザ内テストだけでは合格扱いにしない。

- Android Chrome / PWAから実際に `.mid` を端末へ保存できること
- Android Files / 共有メニューでファイルを扱えること
- Cubasisが実際にファイルを読み込めること
- Cubaseが実際にファイルを読み込めること
- DAW上で音程・長さ・開始位置・テンポ・拍子が人間の目と耳で一致すること
- Android端末固有のDownload / Share / Storage挙動

## 2. Android実機ゲート

対象は公開中のGitHub Pages版を使う。検証時に以下を記録する。

- 日付
- Demo Composer Version
- Arrangement Lab Version
- Android端末名
- Android Version
- Chrome Version
- PWAとして起動したか / Chrome tabか

### 手順

- [ ] Music Project Homeから現在工程を確認する
- [ ] Demo Composerでテスト曲を開く、または新規に短い曲を作る
- [ ] SongProject v1でArrangement Labへ渡す
- [ ] Arrangement LabでA/B/Cを生成する
- [ ] 1案を採用する
- [ ] Section調整を最低1か所行う
- [ ] `Song.mid（採用案）` を押す
- [ ] Android側で `.mid` が保存されたことを確認する
- [ ] ファイル名とファイルサイズを記録する
- [ ] 0 byteではないことを確認する
- [ ] 同じSongProject v1もバックアップ保存する
- [ ] Chrome / PWAを閉じて開き直しても元曲が残ることを確認する

### Android合格条件

- Song.midをユーザー操作で保存できる
- 保存先から再度ファイルを選べる
- 曲Projectが消えない
- Export操作で画面が固まらない / 強制終了しない

## 3. Cubasis実機ゲート

Androidで保存した**同じSong.mid**をCubasisへ読み込む。

- [ ] ファイルをCubasisから選択できる
- [ ] Importがエラーなく完了する
- [ ] 5パートが分離している
- [ ] Chords / Melody / Counter Melody / Bass / Drumsを識別できる
- [ ] Tempoが元Projectと一致する
- [ ] 4/4で読み込まれる
- [ ] Melodyの開始位置がずれていない
- [ ] Bassの開始位置がずれていない
- [ ] Drumsがch.10として扱える
- [ ] Noteの長さが極端に短く/長くなっていない
- [ ] 曲末尾が欠けていない
- [ ] 全体再生してハングNoteや極端なタイミング崩れがない

Cubasis側で表示されないMIDIメタ情報があっても、それだけでは不合格にしない。音楽データ・Tempo・拍子・トラック分離を優先する。

## 4. Cubase実機ゲート

Cubasisで使ったものと同じSong.midをPC版Cubaseへ読み込む。

- [ ] Importがエラーなく完了する
- [ ] 5 MIDI Trackを確認する
- [ ] Track名を確認する
- [ ] MIDI channelが ch.1 / 2 / 4 / 3 / 10 の対応になっている
- [ ] Tempoが元Projectと一致する
- [ ] Time Signatureが4/4
- [ ] Section Markerが読み取れる、またはMIDI内に存在することを確認できる
- [ ] Melody / Counter / Bass / DrumsのNote開始位置・長さを確認する
- [ ] Chordsが想定位置にある
- [ ] 曲末尾が欠けていない
- [ ] 全体再生でハングNote・タイミング崩れがない

## 5. データ破損ゲート

DAW移行確認とは別に、元Projectを守る。

- [ ] Export前のSongProject v1を保存する
- [ ] Arrangement Lab採用後のSongProject v1を保存する
- [ ] Demo ComposerのcompositionがArrangement Lab書き戻しで消えていない
- [ ] MIDI Analyzer由来のanalysis / referenceが消えていない
- [ ] 作曲シート由来のintentが消えていない
- [ ] lineage / projectIdを確認する
- [ ] 元Projectを上書きせず、必要ならForkとして残す

## 6. 判定

### PASS

以下をすべて満たす。

1. 関連CIが全通過
2. Android実機からSong.midを正常保存
3. Cubasis実機でImport・再生確認
4. Cubase実機でImport・再生確認
5. SongProject v1に重大なデータ欠損なし

### CONDITIONAL PASS

曲は通るが、表示・文言・タップしづらさなど軽微なUX問題がある。

この場合、実機フロー自体は記録するが、UX問題は⑥の改善候補へ回す。

### FAIL

以下のいずれか。

- MIDIを保存できない
- Cubasis / CubaseでImportできない
- 必須パートが欠ける
- Note位置・長さ・Tempo・拍子が壊れる
- SongProjectの別アプリ所有データが消える
- 途中でProjectを失う

## 7. stable tag条件

`stable` tagは以下が揃うまで作らない。

- [ ] Android実機 PASS
- [ ] Cubasis実機 PASS
- [ ] Cubase実機 PASS
- [ ] SongProject v1 cross-app test PASS
- [ ] Demo Composer / Arrangement Lab / Project Home関連CI PASS
- [ ] 検証結果をRepositoryへ記録

## 8. 実機結果テンプレート

```text
検証日:
Demo Composer:
Arrangement Lab:
Android端末:
Android Version:
Chrome Version:
Cubasis Version:
Cubase Version:
テストProject ID:
Song.mid filename:
Song.mid size:

Android: PASS / CONDITIONAL / FAIL
Cubasis: PASS / CONDITIONAL / FAIL
Cubase: PASS / CONDITIONAL / FAIL
SongProject data: PASS / FAIL
総合: PASS / CONDITIONAL / FAIL

確認できたこと:
-

問題:
-

⑥ UX改善へ回す項目:
-
```
