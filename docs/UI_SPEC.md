# UI_SPEC

## Target

Android Chrome / Android smartphone.

## Global Rules

- 片手操作を優先
- タップ領域は大きく
- 小さすぎる文字を使わない
- 横スクロールを減らす
- 長押し依存を避ける
- 重要操作を画面下部へ寄せる
- PC DAWを縮小したUIにしない

## v0.1 Navigation

Bottom Navigation:

- Hub
- Chord
- Melody
- Rhythm

## Demo Player

Module Navigationの上に常設。

最低限:

- Play
- Stop
- Loop
- Position progress
- 現在時間 / 全体時間

作曲確認用のため、Mix / FX / Track Mixer等はPlayerへ追加しない。

## Hub

表示:

- Project名
- BPM
- Key
- Scale
- AutoSave状態
- Save Now
- Export
- AI相談

通常のProject変更は1.5秒無操作後にIndexedDBへAutoSaveする。アプリがhiddenになる時も即時保存する。

`Save Now`は即時保存とPersistent Storage要求のために残す。

### Export Panel

Exportボタンで開閉する。

- All MIDI
- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- project.json

Androidブラウザが複数ダウンロードを制限した場合を想定し、All MIDIだけでなく個別ファイルボタンも常に用意する。

`project.json`は手動Backup用。Importは後続。

## Chord

v0.1の基本入力:

- Hubで設定したKey / Scaleを参照
- そのKey / Scaleのダイアトニックコード7つを候補表示
- コード名 + Degreeを併記
- 候補を1回タップすると1小節追加
- 追加済みコードをカード表示
- 各カードの×で削除
- Clearで進行全削除
- 削除後はstartTickを1小節単位で詰め直す

Bass Noteが存在する間はChord変更を拒否し、Root不整合を防止する。Chordを変更するときはRhythmでClear Bassを行う。

v0.1では並べ替え・コード長変更・借用和音・高度なコード編集は後回し。

## Melody

スマホ向け簡易Piano Roll。

- 左端に1オクターブ分の縦ピアノKeyboardを表示
- 白鍵 / 黒鍵を視覚的に区別し、各鍵にNote名を表示
- 1 Barを8分音符8 stepとして扱う
- `8分音符` / `16分音符` ボタンで入力単位を切替（初期値は8分）
- 8分: Beat 1〜4を分割せず、`1 & 2 & 3 & 4 &` の8マスを同時表示
- 16分: タップ幅を確保するため半小節ずつ表示し、`前半 1–2拍`（`1 e & a 2 e & a`）/ `後半 3–4拍`（`3 e & a 4 e & a`）ボタンで切替
- 8分表示のマス下部の太線は、そのマスの後半に同じ高さの16分音符があることを示す
- 8分と16分は同じ小節内で混在できる
- Pitchは1 octaveずつ表示
- `Oct −` / `Oct +` でoctave切替
- `← Bar` / `Bar →` で小節移動
- Chordが存在するBarではChord名 + Degree表示
- Note cell Tapで入力 / 同じcell Tapで削除
- 同じstepの別PitchをTapすると置換
- `Clear Bar` で現在小節のMelodyを削除
- 1拍目 / 2拍目 / 3拍目 / 4拍目の先頭を視覚的に区切る

8マス同時表示を優先しつつ、Android狭幅では鍵盤幅・余白・Gapを縮めて横スクロールを避ける。セル幅が小さくなりすぎないか実機確認する。

後続:

- 16分音符
- Note Length / Velocity
- Scale表示
- Chord Tone強調
- Melody Analyzer

## Rhythm

Bass / Kick / Snare / Closed Hi-Hatを同一画面に表示する。

- 1 Bar = 16 step（16分音符）
- 1 Barの16 stepを `1 e & a / 2 e & a / 3 e & a / 4 e & a` として1画面に同時表示
- Beat 1 / 2 / 3 / 4の先頭を視覚的に区切る
- Beat 1〜4ボタンは表示切替ではなく、`Copy Beat` のコピー元Beatを選ぶ
- セルをTapすると、そのセルが属するBeatもコピー元として選択される
- 選択中のBeatは背景色で示す
- `← Bar` / `Bar →` で小節移動
- Bassは現在BarのChord Rootを使用
- Chord未設定BarではKey Rootを使用
- Bass / Kickを同時に確認可能
- Kick / Snare / HHはGM準拠Noteを使用
- Tapでstep ON/OFF
- `Clear Bar` で現在BarのBass + Drumsを削除
- `Clear Bass` でBass全体を削除し、Chord変更可能な状態へ戻す
- `Copy Beat → Beat N` で現在BeatのBass + Drumsパターンを次Beatへコピーし、そのBeatへ移動する
- Beat 4からのBeat Copyは次BarのBeat 1へコピーし、次Barへ移動する
- `Copy Bar → Bar N` で現在BarのBass + Drumsパターンを次Barへコピーし、そのBarへ移動する
- Beat / Barのコピー先にRhythmがある場合は上書き確認を表示する
- Bassはリズム位置だけをコピーし、Barをまたぐ場合はPitchをコピー先のChord Root（Chord未設定時はKey Root）へ追従させる

1小節全体のリズム形状を一目で確認できることを優先し、16 stepを同時表示する。Android狭幅ではラベル幅・余白・Gapを縮めて横スクロールを避ける。セル幅が狭くなるため、誤タップが起きないか実機で確認する。

後続:

- Bass Pitch手動編集
- Root / 5th / Approach候補
- Velocity
- Open HH / Percussion / Tom
