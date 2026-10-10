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

## Navigation

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

v0.2の基本入力:

- Hubで設定したKey / Scaleを参照
- そのKey / Scaleのダイアトニックコード7つを従来どおり候補表示
- コード名 + Degreeを併記
- 「基準音」SelectでC〜Bの12音を選べる
- 選択した基準音に対して Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug の9種類を表示
- 候補を1回タップすると1小節追加
- 追加済みコードをカード表示
- 各カードの×で削除
- Clearで進行全削除
- 削除後はstartTickを1小節単位で詰め直す

ダイアトニック候補は初心者向けの基本導線として残し、基準音からの9種類は「少し色を変えたい」「7th / susを試したい」ときの追加導線にする。候補を大量に一画面へ並べず、基準音を1つ選んでからQualityを選ぶことでスマホ画面を複雑化しない。

Bass Noteが存在する間はChord変更を拒否し、Root不整合を防止する。Chordを変更するときはRhythmでClear Bassを行う。

v0.2でも並べ替え・コード長変更は後回し。

## Melody

スマホ向け簡易Piano Roll。

- 左端に1オクターブ分の縦ピアノKeyboardを表示
- 白鍵 / 黒鍵を視覚的に区別し、各鍵にNote名を表示
- 1 Barを8分音符8 stepとして扱う
- `8分音符` / `16分音符` ボタンで入力単位を切替（初期値は8分）
- 8分: Beat 1〜4を分割せず、`1 & 2 & 3 & 4 &` の8マスを同時表示
- 16分: タップ幅を確保するため半小節ずつ表示し、`前半 1–2拍` / `後半 3–4拍` ボタンで切替
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

8マス同時表示を優先しつつ、Android狭幅では鍵盤幅・余白・Gapを縮めて横スクロールを避ける。

後続:

- Note Length / Velocity
- Scale表示
- Chord Tone強調
- Melody Analyzer

## Rhythm

Bass / Kick / Snare / Closed Hi-Hatを同一画面に表示する。

- 1 Bar = 16 step（16分音符）
- 1 Barの16 stepを `1 e & a / 2 e & a / 3 e & a / 4 e & a` として1画面に同時表示
- Beat 1〜4ボタンは `Copy Beat` のコピー元Beatを選ぶ
- セルをTapすると、そのセルが属するBeatもコピー元として選択される
- `← Bar` / `Bar →` で小節移動
- Bassは現在BarのChord Rootを使用し、Chord未設定BarではKey Rootを使用
- Bass / Kickを同時に確認可能
- Kick / Snare / HHはGM準拠Noteを使用
- Tapでstep ON/OFF
- `Clear Bar` で現在BarのBass + Drumsを削除
- `Clear Bass` でBass全体を削除
- `Copy Beat` / `Copy Bar` でパターンを次位置へコピー
- コピー先にRhythmがある場合は上書き確認
- BarをまたぐBass Copyはコピー先のChord Root / Key Rootへ追従

### v0.2 Drum Preset

Presetは完成パターンを自動で作るためではなく、初心者が16 step編集を始めるための叩き台とする。

- 画面に多数のPreset Buttonを並べず、`Drum Preset` select + `適用` の2操作にする
- 初期Presetは `8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH`
- 選択中Presetの短い説明を表示する
- `適用` は現在BarのKick / Snare / Closed HHだけを置き換える
- Bassは変更しない
- 他BarのDrumは変更しない
- 現在Barに対象Drumがある場合は上書き確認を表示する
- 適用後は通常の16 stepセルをTapして自由に修正できる
- Preset選択状態自体はProject Dataへ保存しない
- Preset結果は通常のDrum Note Dataとして保存し、Drums.mid / Song.midへそのままExportする

1小節全体のリズム形状を一目で確認できることを優先し、16 stepを同時表示する。Android狭幅では誤タップが起きないか実機で確認する。

後続:

- Bass Pitch手動編集
- Root / 5th / Approach候補
- Velocity
- Open HH / Percussion / Tom
