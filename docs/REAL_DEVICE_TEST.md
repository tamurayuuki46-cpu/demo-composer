# REAL DEVICE TEST

Android実機で1曲を最後まで通し、詰まりを記録するためのチェックリストです。
Android Chrome / PWAインストール版の両方で確認します。
テスト曲は新規の1曲を使い、題材はユーザーが決めます。
途中で止まったら、その場でログに書いて次へ進みます。
「直す」より「記録する」ことを優先します。

## A. 起動・PWA

- [ ] Pages URLを開ける / ホーム画面に追加できる / standaloneで起動する
- [ ] 機内モードで起動する（offline）
- [ ] 更新後に新Versionへ切り替わる

## B. 作曲シート → Home

- [ ] 3項目（場面・参考曲・BPM/Key）だけで次へ進める
- [ ] handoff JSONをHomeで読み込める
- [ ] Homeに「次にできること」が表示され、迷わず次のアプリを開ける

## C. Demo Composer

- [ ] Title/BPM/Key/Scaleが反映される
- [ ] Chord→Melody→Bass→Drumsを入力・試聴できる
- [ ] Seed→Lock→Branch→試聴→Keep→Freezeを縦画面で通せる
- [ ] Snapshot保存→Restoreで元に戻る
- [ ] 保存→アプリ再起動→復元できる（IndexedDB）

## D. Arrangement Lab

- [ ] SongProjectを受け取れる（初期化待ちで固まらない）
- [ ] 編曲案A/Bを比較して1つ採用できる
- [ ] Song.mid / DAW Handoff Packageを出力できる

## E. DAW受け渡し

- [ ] Cubasisでdemo MIDIが開く（Track数・Tempo・Keyが一致）
- [ ] Cubaseで同じZIP/MIDIが開く
- [ ] 音域・タイミング・Channelが崩れていない

## F. 完成判定

- [ ] 最後まで1曲をExportできた（はい/いいえ）
- [ ] 所要時間: __分 / 詰まった回数: __回

## 詰まりログ

| # | 画面/アプリ | やろうとしたこと | 起きたこと | 重大度（止まった/迷った/気になった） | 再現手順 | 推測原因 | 対応（P0/P1/P2/見送り） |
|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |

## 判定基準

- 「止まった」が0件、かつExport完了でstable候補
- 「止まった」が1件以上の場合はstable認定しない
- 「迷った」は上位3件だけをP1に昇格
