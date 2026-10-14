# Mobile-first Workflow

更新日: 2026-10-14

## 正式な初心者導線

`⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAWへ`

- ⓪ 作曲シート: 曲の場面、参考曲、Genre/Mood、BPM/Key候補など、音を鳴らす前に決められることを整理する。
- ① MIDI解析: 必須ではない。参考MIDIや素材を理解したい時だけMIDI Analyzerを使う。
- ② 作曲: Demo Composerでコード、メロディ、リズム等を作る。1小節のフレーズだけでも次へ進める。
- ③ 編曲: Arrangement Labで複数案を比較し、密度・楽器・裏メロ・リハモ等を試す。
- ④ DAWへ: Cubasis / Cubaseへ渡して本制作する。

## UI原則

- 初心者画面では「今やること」を1つだけ主操作として強調する。
- 次工程へ進むための操作が完了したら、主操作を次のボタンへ移す。
- 詳細操作は補助ボタンまたは詳細領域へ置き、主操作と同じ強さで表示しない。
- MIDI解析は常に任意と明示し、解析なしでも作曲へ進める。
- 自動反映は禁止し、受取側で明示的に反映する。

## 1小節スケッチからArrangement Labへ

SongProject v1の `composition.sections` が空でも、chords / melody / counterMelody / bass / drums のいずれかに音楽データがあれば、Arrangement Labへの変換時だけスケッチSectionを補完する。

- 1小節: `1小節スケッチ`
- 2小節以上: `スケッチ`
- barsは音楽データの終端から算出し、1〜32小節へ制限する。
- SongProject v1そのものへSectionを自動書き戻ししない。
- Demo Composer Project Schema 3 / SongProject v1 / Arrangement Plan Schema 4は変更しない。

## 保存と受け渡し

- SongProject v1 JSONを端末バックアップとして保存する。
- 同一Chromeでは `music-project-songproject-handoff-v1` を補助的に利用する。
- localStorage受け渡しが失敗しても保存済みJSONから復帰できる。
