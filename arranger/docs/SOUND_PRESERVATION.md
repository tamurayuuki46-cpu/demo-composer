# Demo Composer → Arrangement Lab 音色保持

更新日: 2026-10-14
対象: Arrangement Lab v0.13-dev

## 目的

Demo Composerで選んだSound SketchのPreset / Toneを、SongProject v1でArrangement Labへ渡した後の簡易試聴でも同じ音色方向で再生する。

## データ互換

SongProject v1のSchemaは変更しない。
Demo ComposerのProjectは既存の `compatibility.demoComposer.legacyProject` に保持されており、`instruments` のPreset / Toneもここから復元される。

Arrangement Labは受け取ったDemo Project snapshotの `instruments` を試聴時に参照する。
音色情報が無い古いJSONやMIDI Analyzer起点のSongProjectでは、Demo Composerと同じ既定Presetへフォールバックする。

## 試聴時の対応

- Harmony / Chord → Demo ComposerのChord Preset + Tone
- Melody → Demo ComposerのMelody Preset + Tone
- Counter Melody → Melody Preset + Tone（Demo Composerと同様に少し控えめなGain）
- Bass → Demo ComposerのBass Preset + Tone
- Drums → Demo Composerと同じKick / Snare / Closed Hi-HatのWeb Audio生成

Preset/Toneから以下を同じ定義で解決する。

- waveform
- filter
- attack / release
- gain
- layers
- vibrato
- formants

Arrangement Lab固有の編曲ではNote / Voicing / Rhythmが変わることはあるが、音色選択そのものは勝手に変更しない。

## 比較試聴

Arrangement Labのラウドネス正規化は比較しやすさのため維持する。
これは音量補正であり、Preset/Toneの音色設定は変更しない。

## PWA / Offline

Arrangement LabのService Workerは `src/core/sound-presets.js` を外部共有Moduleとしてcacheする。
オフライン再読み込みでもDemo Composer由来の音色解決を維持する。

## Regression

Mobile Chromium 360 / 390 / 430pxで以下を検証する。

1. Demo Composer ProjectにChord=`Organ + Warm`、Melody=`Vocal Bright + Bright`、Bass=`Pluck Bass + Dark`を設定
2. SongProject v1へ変換
3. Arrangement Labへhandoff
4. A/B/C候補を生成
5. 簡易試聴を開始
6. AudioContext probeで、選択Preset/Toneに対応するwaveform / filter値が使われていることを確認
7. Console error / 横overflowが無いことを確認

SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4は変更しない。
