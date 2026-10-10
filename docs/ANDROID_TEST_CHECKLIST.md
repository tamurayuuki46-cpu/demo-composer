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
- Chord以外のMelody / Bass / Drums、Stop / Loop / Position等は引き続き未確認

---

## 1. 起動

- [x] 初回起動でエラーなくHubが表示される
- [ ] Hub / Chord / Melody / RhythmをBottom Navigationから切り替えられる
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

- [ ] Bar移動ができる
- [ ] Beat 1–2 / Beat 3–4を切り替えられる
- [ ] Octaveを上下できる
- [ ] Note cellをTapして音符を追加できる
- [ ] 同じcellを再Tapして削除できる
- [ ] 同じstepの別PitchをTapすると置き換わる
- [ ] 現在BarのChord名 + Degreeが表示される
- [ ] Clear Barが動く
- [ ] 4 step表示でセルが小さすぎない

## 6. Rhythm

- [ ] Bass / Kick / Snare / HHが同一画面に表示される
- [ ] Beat 1〜4を切り替えられる
- [ ] BassとKickを同時に確認しやすい
- [ ] Bass Tapで現在Chord Rootが入力される
- [ ] Chord未設定BarではKey Rootが入力される
- [ ] Kick / Snare / HHを同じstepに重ねられる
- [ ] Clear Barが動く
- [ ] Clear Bassが動く
- [ ] 4 step表示でタップ領域が十分ある

## 7. Demo Player

- [x] 初回Play Tapで音が有効になる
- [ ] PlayでChord / Melody / Bass / Drumsが再生される
- [ ] Stopで停止する
- [ ] Loop ON/OFFが動く
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
