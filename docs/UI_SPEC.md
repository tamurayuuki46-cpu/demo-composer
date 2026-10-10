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

## Undo / Redo

画面上部のバー右側に `↶`（元に戻す）/ `↷`（やり直す）を常設する。どの画面でも使える。

- 対象はHub / Chord / Melody / Rhythm / Arrange / Soundの編集（Project全体で1本の履歴）
- 戻せる操作がないときはボタンを無効表示にする
- 最大50操作まで。アプリを開き直すと履歴は空になる（データ自体は保存されている）
- Key変更は1回で元のKey・コード・メロディ・ベースへ戻る
- Clear / Preset適用 / Copy / Sound変更など、まとめて変わる操作も1回で戻る

## Navigation

Bottom Navigation:

- Hub
- Chord
- Melody
- Rhythm
- Arrange
- Sound

6 Moduleは1行を維持し、横スクロールを使わない。短いLabelと小さめのGapを使うが、Button自体の縦Tap領域は維持する。

## Demo Player

Module Navigationの上に常設。

最低限:

- Play
- Stop
- Loop
- Position progress
- 現在時間 / 全体時間

作曲確認用のため、Mix / FX / Track Mixer等はPlayerへ追加しない。

## Arrange（曲の構成）

曲を「イントロ / Aメロ / Bメロ / サビ / 間奏 / Cメロ / アウトロ」の並びで決める画面。縦1列のカードで、横スクロールなし。

- 最初は叩き台3種類から選ぶ: 1コーラス（32小節）/ フル尺（60小節）/ 8小節ループ
- 各Sectionカード: 名前 / Bar範囲 / 入力あり・空 / `▶ 再生` / `−` `＋`（小節数）/ `コピー元にする` → 別Sectionで `ここへコピー` / `削除`
- 小節の増減・削除・上書きコピーは、入力済みの内容があるときだけ確認を出す。すべて `↶` で戻せる
- 小節を増やせないとき（後ろにコードがあるとき）は理由をメッセージで表示する
- 下部の `末尾に追加` で種類を選んでSectionを足す。`構成をやり直す` は区切りだけ消し、音符・コードは残す
- `▶ 全体` は曲全体、`▶ 再生` はそのSectionだけを再生する。Loopを押すと同じ範囲を繰り返す
- Melody / Rhythmの見出しに「サビ 3/8小節」を表示する
- 下部ナビは6ボタン（Hub / Chord / Melody / Rhythm / Arrange / Sound）

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

### Key / Scale Change

- HubでKeyを変更した場合、現在のChord / Melody / Bassを新しいKeyへ同じ半音幅で自動移調する
- Key移調は元Keyから新Keyへの最短半音幅を使用し、極端な1オクターブ移動を避ける
- Chordはrootだけを移調し、quality / degree / startTick / durationTickは維持する
- Melody / Bassはpitchだけを同じ半音幅で移調し、リズム / duration / velocityは維持する
- DrumsはKeyに依存しないため変更しない
- 移調結果がMIDI Note 0〜127を外れる場合はKey変更全体を中止し、元Projectを維持する
- Scale変更は音の意味が変わるため、Chord / Melody / Bassがある場合は引き続き拒否する

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
- そのKey / Scaleのダイアトニックコード7つを五度圏の関係が見やすい扇形で候補表示
- コード名 + Degreeを併記
- 「基準音」SelectでC〜Bの12音を選べる
- 選択した基準音に対して Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug の9種類を表示
- 候補を1回タップすると1小節追加
- 追加済みコードをカード表示
- 各カードの×で削除
- Clearで進行全削除
- 削除後はstartTickを1小節単位で詰め直す

ダイアトニック候補は初心者向けの基本導線として残し、基準音からの9種類は「少し色を変えたい」「7th / susを試したい」ときの追加導線にする。候補を大量に一画面へ並べず、基準音を1つ選んでからQualityを選ぶことでスマホ画面を複雑化しない。

### v0.2 Diatonic Fan

ダイアトニック7候補は、単純な2列Gridではなく、五度圏上の近い関係を目で追いやすい扇形にする。

Major:

- 左上: IV
- 左下: ii
- 中央上: I
- 中央下: vi
- 右上: V
- 右下: iii
- 下中央: vii°

Minor:

- 左上: VI
- 左下: iv
- 中央上: III
- 中央下: i
- 右上: VII
- 右下: v
- 下中央: ii°

UIルール:

- 左 / 中央 / 右の3系統を色で弱く区別する
- 減七系候補は下中央に独立表示する
- 背景に2本の弧を置き、五度圏の扇形であることを視覚的に示す
- 各Chord ButtonはAndroidで最低44px以上のTap領域を維持する
- 横スクロールは使わない
- Chord Buttonのclick処理は従来と同じ `data-add-chord` を使い、見た目だけを変更する
- Project Data / Chord Schema / MIDI出力は変更しない

### v0.2 Chord Preset

Presetは完成曲を自動生成する機能ではなく、コード進行の叩き台をすぐ作ってから手動修正するために使う。

- `Chord Preset` select + `適用` の2操作にする
- 初期Presetは `Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行`
- 選択中Presetの短い説明と、現在Key / Scaleでの実コードPreviewを表示する
- PresetはHubの現在Key / Scaleのダイアトニックコードへ自動変換する
- `適用` は現在のコード進行全体を置き換える
- 既存進行がある場合は上書き確認を表示する
- Preset適用後は従来どおり個別コード追加 / 削除 / Clearで修正できる
- Bass Noteが存在する場合は従来の安全ルールどおりChord変更を拒否する
- Preset選択状態自体はProject Dataへ保存しない
- 適用結果は通常の `project.chords[]` としてAutoSave / Demo Player / MIDI Exportへそのまま利用する

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

## Sound Sketch Lite

本来v0.4予定のSound Moduleから、スマホで「音色の方向性」を決める最小機能だけをv0.2-devへ先行実装する。

対象Part:

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass

Tone方向タグ:

- Natural
- Bright
- Soft
- Warm
- Dark
- Airy
- Aggressive

UIルール:

- Bottom Navigationに `Sound` を追加し、Arrangeを含む6 Moduleを1行表示する
- PartごとにPreset Selectを1つ置く
- Toneは44px以上のButtonで選ぶ
- 選択中Toneを明確にActive表示する
- 変更後は常設Demo PlayerのPlayで確認する
- Sound画面にSynth Parameter / Mixer / FX Rackは追加しない
- Drums音色変更はLiteでは対象外

動作ルール:

- Sound選択はAutoSave対象
- Sound選択はProject全体のUndo / Redo対象
- Sound選択は `project.instruments[]` に保存する
- Chord / Melody / BassのMIDI Note、Chord Data、Rhythm Dataは変更しない
- Demo PlayerのWeb Audio仮音色だけを変更する
- Section単体再生でも同じSound設定を使う
- MIDI Program Change / CCは出力しない
- 最終音色の作り込みはCubasis / Cubase / Plugin側へ任せる
