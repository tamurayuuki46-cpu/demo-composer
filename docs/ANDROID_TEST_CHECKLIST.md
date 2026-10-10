# ANDROID_TEST_CHECKLIST

Demo Composer v0.1-devのAndroid実機確認用チェックリスト。

対象:

- Android Chrome
- ホーム画面追加前 / 追加後
- 実際に使用予定のAndroidスマホ

結果は `OK / NG / 未確認` で記録する。

## 実機確認メモ

2026-10-10:

- Vercel PreviewをAndroid Chromeで開き、Hub表示を確認
- ChordへC（I）を追加してDemo Playerから実音が鳴ることを確認
- 初期音量は小さかったためAndroid向けに音量・音域を調整
- 単純な最終出力2倍ではクリップして音割れしたため不採用
- loudness gain + compressor + limiter方式へ変更し、ユーザー実機で「このくらい」で採用判断
- Demo Player Loopの固定4小節待ちを修正し、最後に使用しているBar終端で反復する方式を実機で採用判断
- Melodyを縦ピアノ + 1小節8 step同時表示へ変更。Androidでセル幅・横スクロールを追加確認する
- Rhythmを1小節16 step同時表示へ変更。Androidでセル幅・誤タップ・横スクロールを追加確認する
- Chord以外のMelody / Bass / Drums、Stop / Position等は引き続き確認する
- 回帰チェック1回目: Hub → Chord → Melody → Rhythm切替、Melody 8分/16分切替、16分の前半/後半切替、Rhythm 16 stepのタップ性、Demo PlayerのPlay → Stop → Loopはユーザー実機でOK

---

## 1. 起動

- [x] 初回起動でエラーなくHubが表示される
- [x] Hub / Chord / Melody / RhythmをBottom Navigationから切り替えられる
- [ ] 画面下部のDemo PlayerとNavigationが重ならない
- [ ] 縦画面で横スクロールを強制されない
- [ ] 主要ボタンを指で押しやすい

## 2. Hub / Project State

- [ ] Project名を変更できる
- [ ] BPMを40〜240で変更できる
- [ ] Keyを変更できる
- [ ] Major / Minorを変更できる
- [ ] Project名変更がTop Barへ反映される
- [ ] Revisionが編集ごとに増える
- [ ] Chord / Melody / Bassがある状態でKey / Scale変更が安全に拒否される

## 3. AutoSave / Restore

- [ ] 編集後約1.5秒でAutoSaveされる
- [ ] 編集後にChromeを別アプリへ切り替えても保存される
- [ ] Chromeを閉じて再度開くとProjectが復元される
- [ ] `Save Now`が正常に動く
- [ ] Save Now後も画面操作が止まらない
- [ ] ストレージ削除後は新規Projectとして安全に起動する

## 4. Chord

- [ ] C Majorで7つのダイアトニックコードが表示される
- [ ] Minor Keyでも候補が切り替わる
- [ ] コード名とDegreeが表示される
- [x] 候補Tapで1小節追加される
- [ ] 複数コードを連続追加できる
- [ ] ×で1コード削除できる
- [ ] 削除後の小節番号 / startTickが詰め直される
- [ ] Clearで全コードを削除できる
- [ ] Bassがある時のChord変更が拒否される
- [ ] RhythmでClear Bass後はChord変更できる

## 5. Melody

- [ ] 左端に縦ピアノKeyboardが表示される
- [ ] 白鍵 / 黒鍵が見分けやすい
- [ ] 縦ピアノのNote名が現在Octaveと一致する
- [ ] `1 & 2 & 3 & 4 &` の8マスが同時表示される
- [ ] Beat 1 / 2 / 3 / 4の頭が視覚的に区切られている
- [ ] 8 step表示でも横スクロールが発生しない
- [ ] 8 stepのNote cellを実用上タップできる
- [x] `8分音符` / `16分音符` ボタンで入力単位を切り替えられる
- [ ] 16分音符で `1 e & a 2 e & a` が8マス表示され、横スクロールしない
- [x] `前半 1–2拍` / `後半 3–4拍` を切り替えられ、`3 e & a 4 e & a` が表示される
- [ ] 16分音符のセルを実用上タップできる
- [ ] 8分と16分を混在して入力でき、音が重ならず再生される
- [ ] 8分表示に戻したとき、16分音符があるマスに太線が出る
- [ ] 16分音符を入れたMelody.midをBandLab / Cubase等へ取り込んでも位置がずれない
- [ ] Bar移動ができる
- [ ] Octaveを上下できる
- [ ] Note cellをTapして音符を追加できる
- [ ] 同じcellを再Tapして削除できる
- [ ] 同じstepの別PitchをTapすると置き換わる
- [ ] 現在BarのChord名 + Degreeが表示される
- [ ] Clear Barが動く

## 6. Rhythm

- [ ] Bass / Kick / Snare / HHが同一画面に表示される
- [ ] `1 e & a / 2 e & a / 3 e & a / 4 e & a` の16マスが同時表示される
- [ ] Beat 1 / 2 / 3 / 4の頭が視覚的に区切られている
- [ ] 16 step表示でも横スクロールが発生しない
- [ ] Beat 1〜4ボタンでCopy元Beatを選べ、選択中Beatが背景色で分かる
- [ ] セルTap後、そのセルのBeatがCopy元として選択される
- [ ] BassとKickを同時に確認しやすい
- [ ] Bass Tapで現在Chord Rootが入力される
- [ ] Chord未設定BarではKey Rootが入力される
- [ ] Kick / Snare / HHを同じstepに重ねられる
- [ ] `Copy Beat → Beat N` で現在BeatのBass / Drumsが次Beatへコピーされる
- [ ] Beat Copy後に自動でコピー先Beatへ移動する
- [ ] Beat 4のCopyが次Bar Beat 1へコピーされる
- [ ] Beat 4から次BarへコピーしたBassがコピー先Chord Rootへ追従する
- [ ] `Copy Bar → Bar N` で現在BarのBass / Drumsが次Barへコピーされる
- [ ] Bar Copy後に自動でコピー先Barへ移動する
- [ ] 異なるChordのBarへコピーしたBassがコピー先Chord Rootへ追従する
- [ ] Beat / Barのコピー先に既存Rhythmがある場合は上書き確認が表示される
- [ ] Clear Barが動く
- [ ] Clear Bassが動く
- [x] 16 step表示でも隣のセルを誤タップしにくい（狭幅端末で特に確認）

## 7. Demo Player

- [x] 初回Play Tapで音が有効になる
- [ ] PlayでChord / Melody / Bass / Drumsが再生される
- [x] Stopで停止する
- [x] Loop ON/OFFが動く
- [ ] Positionが再生に合わせて進む
- [ ] BPM変更後の再生速度が変わる
- [ ] 再生中に画面を切り替えてもPlayerが残る
- [x] 音割れが目立たない
- [ ] タップから音までの遅れが作曲確認を妨げるほど大きくない

## 8. MIDI Export

Hub → Exportで確認する。

- [ ] Song.midをダウンロードできる
- [ ] Chord.midをダウンロードできる
- [ ] Melody.midをダウンロードできる
- [ ] Bass.midをダウンロードできる
- [ ] Drums.midをダウンロードできる
- [ ] All MIDIが動く
- [ ] Android Chromeが複数Downloadを止める場合、個別Downloadで回避できる
- [ ] project.jsonをダウンロードできる

## 9. Cubasis Import

- [ ] Chord.midをCubasisへ取り込める
- [ ] Melody.midをCubasisへ取り込める
- [ ] Bass.midをCubasisへ取り込める
- [ ] Drums.midをCubasisへ取り込める
- [ ] BPMが意図通りになる
- [ ] Note位置がずれない
- [ ] DrumsがChannel 10 / GM Noteとして扱える
- [ ] Song.midのTrack構成を確認する

## 10. Cubase Import

PCで確認する。

- [ ] Song.midをCubaseへ読み込める
- [ ] Chord / Melody / Bass / Drumsが別Trackとして扱える
- [ ] BPM / 4/4 / Key Signatureを確認する
- [ ] Melody / BassのNote位置を確認する
- [ ] DrumsのNote番号を確認する
- [ ] Part MIDIも個別Importできる

## 11. BandLab Android（使用する場合）

- [ ] Chord.midをImportできる
- [ ] Melody.midをImportできる
- [ ] Bass.midをImportできる
- [ ] Drums.midをImportできる
- [ ] Song.midの扱われ方を確認する
- [ ] Song.midが期待通り分割されない場合、Part MIDI運用で問題ないか確認する

## 12. 長時間 / 復帰

- [ ] 10分以上編集しても操作が重くならない
- [ ] 何度もModule切替してもエラーが出ない
- [ ] バックグラウンド復帰後に編集を継続できる
- [ ] 保存済みデータが消えていない
- [ ] Demo Playerを複数回Play / Stopしても音が残り続けない

## 13. v0.1 Stable判定

以下を満たすまで `main` へStableとして統合しない。

- [ ] Hub基本編集 OK
- [ ] AutoSave / Restore OK
- [ ] Chord基本入力 OK
- [ ] Melody基本入力 OK
- [ ] Rhythm基本入力 OK
- [ ] Demo Player基本再生 OK
- [ ] MIDI個別Export OK
- [ ] CubasisまたはCubaseでMIDI Import確認 OK
- [ ] データ消失につながる既知の重大問題なし

Stable判定後:

1. `v0.1-stable`候補を作る
2. CHANGELOG / AI_HANDOFF / VERSIONを更新
3. `develop` → `main`
4. Git tag `v0.1`
5. Google Driveへ完成版Backup
