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

## Hub

表示:

- Project名
- BPM
- Key
- Scale
- Save
- Export
- AI相談

現在のSaveは手動。IndexedDBへActive Projectを保存する。

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

v0.1では並べ替え・コード長変更・借用和音・高度なコード編集は後回し。

## Melody

スマホ向け簡易Piano Roll。

- 1 Barを8分音符8 stepとして扱う
- 横方向は4 stepずつ表示
- `Beat 1–2` / `Beat 3–4` で表示範囲切替
- Pitchは1 octaveずつ表示
- `Oct −` / `Oct +` でoctave切替
- `← Bar` / `Bar →` で小節移動
- Chordが存在するBarではChord名 + Degree表示
- Note cell Tapで入力 / 同じcell Tapで削除
- 同じstepの別PitchをTapすると置換
- `Clear Bar` で現在小節のMelodyを削除

タップ領域確保を優先し、PC DAWの16〜32列Piano Rollをそのまま縮小しない。

後続:

- 16分音符
- Note Length / Velocity
- Scale表示
- Chord Tone強調
- Melody Analyzer

## Rhythm

- Bass / Kick / Snare / Hi-Hat
- BassとKickを同時確認
- 16 Stepを基本
