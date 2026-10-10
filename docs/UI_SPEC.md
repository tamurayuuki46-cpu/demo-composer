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
- 画面上部に「骨子の進み具合」、各Sectionカードにも同じ表示を出す。コード / メロ / ベース / ドラム それぞれ「入力のある小節 / 小節数」を ✓（全部）/ △（一部）/ －（なし）で示す。入力は評価せず、抜けを見つけるためだけの表示
- 上部の「盛り上がり設計」: 各Sectionを、幅 = 小節数・高さ = Energy（Low / Mid / High）の棒で並べ、下に「イントロ Low → Aメロ Low → Bメロ Mid → サビ High」を表示する。気づきのヒント（💡）は最大3つ
- 各Sectionカードの `少し違う版にする ▼`（Sectionが空のときは押せない）: 3つの候補を開く。「Aメロ2 = Aメロ1のコピー」で終わらせないための機能で、完全自動ではなく、候補から選んで当てる
  - `ドラムを少し増やす`: 2・4…小節目にキック1つ、1・3…小節目の終わりにハイハット2つを足す。最後の小節はフィル用にそのまま。同じ位置に既にあれば足さない
  - `ベースを少し動かす`: ベースがある小節のうち2・4…小節目の終わり近くに5度を足し、最後の小節はオクターブ上を足す。既存の音と重なる所には足さない
  - `メロディの終わりを変える`: 4小節ごと・最後の小節の「最後の音」だけを、近いコードの音に差し替える。コードが無い小節は触らない
  - 押したSectionだけが変わる。変更が無いときは理由を表示する。`↶` で1回で戻せる
  - Backing Patternは曲全体で1つの設定のため、Section単位の候補には含めない
- 各Sectionカードに `盛り上がり` の `Low / Mid / High` と、最後以外には `次へのつなぎ` の `Keep / Fill / Stop / Build / Drop`（選んだものの一言説明つき）。押すとSectionの設定だけが変わり、音符・コードは動かない。`↶` で戻せる
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

### 曲の特徴カード

- Hubの `曲の特徴カード ▼` で開く。曲名 / Key・Scale・BPM / 構成 / コード進行（度数）/ 音域 / 跳躍 / モチーフ反復 / 入力済みパート（✓ / －）を一枚で見せる
- 作った曲を振り返るための表示。Projectを読むだけで、保存や書き換えはしない（Analyzerと同じ計算を使う）

### 文字の大きさ

- Hubの下部に `標準 / 大 / 特大` の3ボタン（倍率 1.0 / 1.15 / 1.3）。選んだ段階は反転表示
- 拡大するのは画面本体（`#screen`）だけ。上部バー・Demo Player・下部ナビは常に同じ大きさ
- 端末ごとの表示設定として、この端末のlocalStorageにだけ保存する。project.json・Export・Undoの対象外
- 特大では横幅が実質狭くなるため、Melodyのマスは小さくなる（360pxで約30px幅）。入力しにくいときは「大」を使う
- 属性名の注意: `document.querySelectorAll` は `<html>` 自身にも一致するため、ボタンの属性は `data-text-size-option` とし、`<html data-text-size>` と分けている

### AI相談

`AI相談` ボタンで開閉する。APIは使わず、ChatGPT / Claudeへ貼り付ける相談用テキストをコピーするだけ（送信はしない）。

- `相談したいこと`（任意）を書いて `相談用テキストをコピー` を押す
- コピーされる内容: 基本情報 / 曲の構成 / コード進行（コード名 + ディグリー）/ メロディ・ベース（拍位置:音名/長さ）/ ドラム（16マス。同じ小節はまとめる）/ 相談したいこと
- 先頭に「完全に作り直さず、候補を3つ挙げて理由を添える」依頼文を入れる（AIに全自動で作らせず、自分で選んで直すため）
- `コピーされる内容を見る` で、コピーされる全文を確認できる
- クリップボードが使えない環境では、全文を選択してコピーするよう案内する
- 相談したいことは画面の状態のみで、project.jsonには保存しない
- `相談したいこと` の上に、悩みのテンプレート（丸いボタン）を並べる。タップで相談欄に文が入る。既に書いてあるときは消さず、改行して続けて足す。あとから自由に書き換えられる

### Cubaseでやることメモ

- Hubの `Cubaseでやることメモ ▼` で開く。いまの曲から自動で作り、`メモをコピー` でコピーできる
- 内容: プロジェクト設定（BPM / 拍子）/ 取り込むMIDI（中身が無いものは明記）/ 使ったコード（登場順・度数）/ 音色の方向性（Chord / Melody / Bassの音源の目安 + Toneタグの音作りヒント）/ 曲の構成 / 次にやること（チェックリスト）
- 音色は「どんな方向にするか」の目安で、Demo Composerの音を再現するものではない（メモ内にも明記）
- 開閉は画面の状態のみ。Projectを読むだけで書き換えない

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

### コードの役割ラベル

- 進行カードに、度数の下へ一言ラベルを青字で表示する。Melodyの見出しにも `C (I・安定)` の形で出す
- Major: I 安定 / ii つなぎ / iii 浮遊 / IV ひらける / V 緊張 / vi 切ない / vii° 不安定。Minorは i 安定 / ii° 不安定 / III 明るい / iv しっとり / v やや緊張 / VI ひらける / VII 前へ
- ダイアトニック外のコードは「借用」と表示する。評価ではなく、進行の中での働きを知るための表示

### v0.2 次のコード候補（3つ）

- 「進行」の下に、次のコード候補を3つ出す。進行が空のときは「最初のコード候補」
- 候補はKey / Scaleのダイアトニックコードから、直前のコードに応じて選ぶ。各候補に「王道。前へ進む」のようなひとこと理由を付ける
- 直前がダイアトニック外のコードのときは、始まりの候補を出す
- タップで進行の末尾に追加するだけ。置き換えや自動確定はしない（`↶` で戻せる）。AIに作曲させず、人間が選ぶための叩き台

### v0.2 ループから曲にする（Arrange）
- Arrange上部に `🔁 ループから曲にする（いま: N. 〇〇）` ボタン（開閉・複製する種類は画面の状態のみ）。開くと3ステップのチップと、いま必要な操作を1つだけ表示
- ループ = 最初のSection。判定: 構成なし → `8小節ループから始める` / コードが全小節に無い、またはメロ・ベース・ドラムが空 → Chord・Melody・Rhythmへのボタン / Sectionが1つ → `ループを複製して追加`（種類はおすすめ初期値: サビ → Bメロ → Aメロ） / ループと同じ中身のSectionが残っている → `〇〇を違う版に`（そのSectionの `少し違う版にする` を開く） / すべて違いが出た → 盛り上がり設計と「Sectionごとの比べ」の案内
- `ループを複製して追加` は1回の編集（↶1回で戻る）。コードに空きがあるときは既存のコピーのルールどおりエラーメッセージ

### v0.2 ひとスパイス（借用和音）

- 次のコード候補の下に `✨ ひとスパイス（借用和音）` ボタン。押すと3候補が開く（開閉は画面の状態のみ）
- Majorの曲は同主調Minorから（iv / ♭VII / ♭VI）、Minorの曲は同主調Majorから（IV / V / I）借りる
- タップで進行の末尾に追加するだけ。入れすぎない「1つだけ」の使い方を説明文で促す。`↶` で戻せる

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
- `度数 OFF / ON` ボタン（Chord Tone凡例の右）: ONにすると鍵盤の文字が音名から度数（R / ♭3 / 3 / 4 / 5 / ♭7 など）に変わる。基準は現在小節のコードのルート。コードが無い小節はKeyの主音。画面の状態のみで保存しない
- Chord Tone強調: 現在Barにコードがあるとき、その構成音の行（鍵盤の左端と空マス）を青く色付けし、見出し下に凡例を1行出す。コードが無いBarでは出さない。入力できる音は制限しない（外れた音も置ける）
- Note cell Tapで入力 / 同じcell Tapで削除
  - 長さが「最初の1マス」のときは、同じ音のマスをタップすると長さに関係なく削除
  - 長さを2マス以上にしているときは、別の長さを選んで同じ音のマスをタップすると長さが変わり、同じ長さなら削除
- 同じstepの別PitchをTapすると置換
- `Clear Bar` で現在小節のMelodyを削除
- `Copy Bar → Bar N+1` / `Copy 2小節 → Bar N+2–N+3`: モチーフを次へ繰り返すための複製
  - コピー元が空、または総小節数を超える場合は押せない
  - コピー先に音があるときだけ上書き確認。複製後はコピー先の小節へ移動する。`↶` で戻せる
- 1拍目 / 2拍目 / 3拍目 / 4拍目の先頭を視覚的に区切る

8マス同時表示を優先しつつ、Android狭幅では鍵盤幅・余白・Gapを縮めて横スクロールを避ける。

### Melody Analyzer（メロディの特徴）

- Melody画面の `メロディの特徴 ▼` ボタンで、パネルを開閉する（開閉は画面の状態のみ）。独立アプリにはしない
- 6項目: 音域 / 跳躍（4度=5半音以上）/ コードトーン率 / リズム密度（1小節あたりの音数）/ 同音連打 / モチーフ反復（同じ音・位置・長さの小節）
- それぞれ数字と一言で表示する。「良い・悪い」は言わず、「せまめ」「なめらか」のように特徴を伝える
- 曲全体のMelodyを対象にする。コードが無い小節の音はコードトーン率に数えない
- 計算は `src/core/melody-analysis.js` の純粋関数で、Projectを書き換えない

後続:

- Velocity
- Scale表示

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

### v0.2 Bass候補（3つ）

- Drum Presetの下に、現在の小節に置くBassの候補を3つ出す。16マスの見た目（● = 音あり）と一言説明を表示
- 候補: Kickがある小節は「Kickに合わせる」、ないときは「どっしり」/ 「ルート + 5度」/ 「はずむ（オクターブ）」
- タップで現在の小節のBassだけを置き換える。既にBassがあるときは確認。他の小節・Drumsは変えない。`↶` で戻せる
- 5度はコードの種類に合わせる（dimは6半音など）。置いたあとは16マスで1音ずつ直せる

### v0.2 Drum Preset

Presetは完成パターンを自動で作るためではなく、初心者が16 step編集を始めるための叩き台とする。

- 画面に多数のPreset Buttonを並べず、`Drum Preset` select + `適用` の2操作にする
- 初期Presetは `8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH`
- 選択中Presetの短い説明を表示する
- `適用` は現在BarのKick / Snare / Closed HHだけを置き換える
- Bassは変更しない
- 他BarのDrumは変更しない
- 現在Barに対象Drumがある場合は上書き確認を表示する
- Sectionがある場合は `{Section名}（Bar a–b）全体に適用` も出す。Section内の全小節のKick / Snare / Closed HHを置き換え、対象Drumがあれば確認する。Bassは変更しない。`↶` 1回で戻る
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
