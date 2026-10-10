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
- Clear / Preset適用 / Copy / Sound変更 / Backing Pattern変更など、まとめて変わる操作も1回で戻る

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

作曲確認用のため、Mix / FX / 音量調整を持つTrack Mixer等はPlayerへ追加しない。

### パート聴き分け（ミュート / ソロ）

Playerの `パート` ボタンで、Player下部に聴き分けパネルを開閉する。音量ではなく「何を鳴らすか」だけを切り替える。

- `Chord` / `Melody` / `Bass` / `Drums` を押すと、そのパートを消す / 戻す（消えているパートは暗く表示し、取り消し線を付ける）
- `ソロ` を押すとソロモード。押したパートだけが鳴り、もう一度押すと全部に戻る
- 再生中でもすぐ反映され、再生位置は止まらない
- どれかを消している間は `パート` ボタンが白くなる
- 画面だけの状態で、project.json / MIDI Exportには影響しない。アプリを開き直すと全部鳴る状態に戻る
- Backing Patternで複数回発音するChordもChordパートとして一緒にMute / Soloされる

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
- AI相談（相談用テキストのコピー）

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

### AI相談

`AI相談` ボタンで開閉する。APIは使わず、ChatGPT / Claudeへ貼り付ける相談用テキストをコピーするだけ（送信はしない）。

- `相談したいこと`（任意）を書いて `相談用テキストをコピー` を押す
- コピーされる内容: 基本情報 / 曲の構成 / コード進行（コード名 + ディグリー）/ メロディ・ベース（拍位置:音名/長さ）/ ドラム（16マス。同じ小節はまとめる）/ 相談したいこと
- 先頭に「完全に作り直さず、候補を3つ挙げて理由を添える」依頼文を入れる（AIに全自動で作らせず、自分で選んで直すため）
- `コピーされる内容を見る` で、コピーされる全文を確認できる
- クリップボードが使えない環境では、全文を選択してコピーするよう案内する
- 相談したいことは画面の状態のみで、project.jsonには保存しない

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

`project.json`は手動Backup用。

### project.json 読み込み

Export Panel内の `project.jsonを読み込む` から、書き出したファイルを選んで曲を戻す。

- 読み込み前にファイルを検証する（JSONとして読めるか / Demo Composerのファイルか / 現行Schemaで正しいか）。不正なら理由を表示し、いまの曲は変えない
- 古いschemaVersion 1は現行へ移行して読み込む
- 読み込み前に確認を出し、いまの曲を置き換える。画面上部の `↶` で元に戻せる
- 読み込んでもProject IDは変えない（AutoSave先が変わらない）
- 5MBを超えるファイルは拒否する

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

### v0.2 Backing Pattern

Chord Presetの直下に、コード進行を変えず伴奏の鳴らし方だけを選ぶ `Backing Pattern` Selectを置く。

初期Pattern:

- `Block`: 1小節を伸ばして鳴らす
- `8分刻み`: 8分音符でコードを刻む
- `Arpeggio`: コード構成音を8分で順に鳴らす
- `Syncopation`: 1拍目と裏拍を中心に鳴らす

UI / 動作ルール:

- Select 1つ + 選択中Patternの短い説明だけにし、Pattern Buttonを大量に並べない
- AndroidでSelectは最低44px以上のTap領域を維持する
- 選択すると即時保存し、Demo Playerで確認できる
- `↶ / ↷` でBacking Pattern変更をUndo / Redoできる
- コード進行の `root / quality / degree / startTick / durationTick` は変更しない
- `Chord.mid / Song.mid` のChord Trackには選択したPatternのNote配置を反映する
- `Block` 未設定Projectは自動でBlockとして扱う
- Section単体再生でも同じBacking Patternを使う
- Backing Patternの発音はChordパート扱いなので、PlayerのChord Mute / Soloに従う
- 詳細なStep編集やDAW級Arpeggiatorは追加しない

Bass Noteが存在する間はChord変更を拒否し、Root不整合を防止する。Backing Pattern変更はChord Data自体を変えないためBassが存在していても変更可能。

v0.2でもコード並べ替え・コード長変更は後回し。

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
- `音の長さ` ボタン（1段に6つ）で、次に置く音の長さを選ぶ（入力単位のマス数: 1 / 2 / 3 / 4 / 6 / 8マス）
  - 8分入力: 8分 / 4分 / 付点4分 / 2分 / 付点2分 / 全音符。16分入力: 16分 / 8分 / 付点8分 / 4分 / 付点4分 / 2分
  - 長い音は、開始マスを白、伸びている部分のマスを薄いグレーで表示する
  - 音は小節の終わりを超えない。次の音がある場合は、その手前までに収まる（次の音は消えない）
  - 長い音の途中に別の音を置くと、前の音がそこまでに短くなる
  - 長さの選択は画面の状態のみで、project.jsonには保存しない（音の長さ自体は `durationTick` として保存・MIDI出力される）
- Note cell Tapで入力 / 同じcell Tapで削除
  - 長さが「最初の1マス」のときは、同じ音のマスをタップすると長さに関係なく削除
  - 長さを2マス以上にしているときは、別の長さを選んで同じ音のマスをタップすると長さが変わり、同じ長さなら削除
- 同じstepの別PitchをTapすると置換
- `Clear Bar` で現在小節のMelodyを削除
- 1拍目 / 2拍目 / 3拍目 / 4拍目の先頭を視覚的に区切る

8マス同時表示を優先しつつ、Android狭幅では鍵盤幅・余白・Gapを縮めて横スクロールを避ける。

後続:

- Velocity
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
- Bassは16マスの上にある `Bassの音程` ボタンで、マスをタップしたときに置く音の高さを選ぶ
  - ルート / 3度 / 5度 / 7度（コードの構成音に合わせる。sus2 / sus4は2度 / 4度）/ オクターブ上 / ルート下
  - 基準は現在BarのChord Root（Chord未設定BarではKey Root）。選んだ音程がそのBarのコードから見てどの音かをセルに `R` `3` `5` `7` `8` `R↓` で表示する
  - 同じマスで別の音程を選んでタップすると置き換わり、同じ音程をもう一度タップすると消える
  - 初期値は「ルート」。従来のルートだけのBassデータはそのまま使える
  - `Bassの長さ` ボタンで、次に置くBassの長さを選ぶ（16分のマス数: 1 / 2 / 3 / 4 / 6 / 8マス = 16分 / 8分 / 付点8分 / 4分 / 付点4分 / 2分）。ルールはMelodyと同じ（小節の終わりと次の音の手前まで。長さ違いの同じ音は長さ変更、同じ長さは削除）。KickなどDrumsは1マス固定
  - 長いBassは、伸びている部分のマスを薄く表示する（主役は薄いグレー、飾りは暗い黄色）
  - Bar Copy / Beat Copyは、長いBassをコピー先の範囲の外へはみ出さないように収める
  - `半音ずらし` の − / ＋ で、選んだ音程を半音単位（±6）でずらせる。ルートの半音下のようなつなぎ音を入れられる。音程ボタンを押し直すと「なし」に戻る
  - セルは「主役」（ルート系とコードの5度）を白、「飾り」（3度・7度・ずらした音など）を黄色で表示する。色だけに頼らず、`R` `5` `-1` などの文字も出す。見た目だけの区別で、データには保存しない
- Bass / Kickを同時に確認可能
- Kick / Snare / HHはGM準拠Noteを使用
- Tapでstep ON/OFF
- `Clear Bar` で現在BarのBass + Drumsを削除
- `Clear Bass` でBass全体を削除
- `Copy Beat` / `Copy Bar` でパターンを次位置へコピー
- コピー先にRhythmがある場合は上書き確認
- BarをまたぐBass Copyは、音程関係（ルート / 5度など）を保ったままコピー先のChord Root / Key Rootへ追従

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
- Sound選択は `project.instruments[]` のSound用entryへ保存する
- Backing Patternの `part: chord-backing` entryはSound変更で消さない
- Chord / Melody / BassのMIDI Note、Chord Data、Rhythm Dataは変更しない
- Demo PlayerのWeb Audio仮音色だけを変更する
- Section単体再生でも同じSound設定を使う
- MIDI Program Change / CCは出力しない
- 最終音色の作り込みはCubasis / Cubase / Plugin側へ任せる
