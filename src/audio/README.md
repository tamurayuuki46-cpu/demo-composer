# Audio Module

Audio Moduleは作曲確認用のDemo Playerを担当する。

## v0.1-dev implemented

`demo-player.js`

- Web Audio APIを使用
- Play
- Stop
- Loop
- Position表示
- 画面下部に常設
- Play時点のProject Snapshotを再生

## Preview Sound

最終音色を作る目的ではなく、作曲判断の確認用。

- Chord: 簡易Triad / Triangle
- Melody: Triangle
- Bass: Sine
- Kick: Sine pitch envelope
- Snare: Noise
- Closed HH: High-pass Noise

音作り / Mixing / Mastering / Plugin HostingはDemo Composerの責務にしない。

### Android のクリックノイズ対策

- AudioContext は `latencyHint: "playback"` で余裕のある出力バッファを使う。
- Tone系は従来どおり Attack / Release のGain envelopeで波形の不連続を避ける。
- Kick / Snare / Closed HHも、開始時に約3msの短いGain rampを入れる。特にNoise系を任意のサンプル値から最大Gainで突然開始しないことで、スマートフォンの小型スピーカーで「プツッ」と聞こえるクリック成分を抑える。
- Loopは周回ごとに `stop() -> play()` をやり直さず、終端の約80ms前に次周を同じAudioContextの時刻へ先行予約する。周回境界の空白と再起動由来のクリックを避ける。
- Loop中の編集は従来どおり次周へ反映する。LoopをOFFにした場合は先行予約済みの次周Sourceをキャンセルし、現在周の終端で停止する。
- これらはPreview再生だけの処理で、Project/MIDI、BPM、ノート位置、保存形式には影響しない。

## Timing

ProjectのBPM / PPQを使ってtickを秒へ変換する。

再生長はChord / Noteの最終tickを基準にし、最低4小節とする。

## Later

- より軽いPreset選択
- Count-in
- Section再生
- WAV Demo Export

高度なSynthやMix機能は追加しない。
