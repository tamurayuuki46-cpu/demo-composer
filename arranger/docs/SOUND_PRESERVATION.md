# Arrangement Lab Sound Preservation

## Purpose

Demo Composerで選んだSound Sketchの音色方向を、SongProject v1でArrangement Labへ渡した後の簡易試聴でも維持する。

## Data source

SongProject v1のSchemaは変更しない。
Demo Composer由来のSongProjectは既存の `compatibility.demoComposer.legacyProject` に元Demo Projectを保持している。
`legacyProject.instruments` を `songProjectToDemoProject()` が復元し、Arrangement Labの `normalizeSourceProject()` が `sourceSnapshot` として保持するため、この既存情報を試聴時に利用する。

## Preview mapping

- Arrangement `harmony` → Demo Composer `chord` Sound
- Arrangement `melody` → Demo Composer `melody` Sound
- Arrangement `counter` → Demo Composer `melody` Sound（Demo Playerと同様に少し控えめ）
- Arrangement `bass` → Demo Composer `bass` Sound
- Drums → Demo Composerと同じKick / Snare / Closed Hi-HatのWeb Audio発音方式

Chord / Melody / Bassでは、Demo Composerの `resolveSoundProfile()` で解決した以下を利用する。

- waveform
- filter
- attack / release
- gain
- layers
- vibrato
- formants

## Compatibility

- SongProject v1: 変更なし
- Demo Project Schema 3: 変更なし
- Arrangement Plan Schema 4: 変更なし
- 元SongProject / 元Demo Projectの音色情報は書き換えない
- Sound選択情報が無い古いJSON、MIDI Analyzer起点などは従来の軽量簡易音へfallbackする

## PWA / offline

Arrangement LabのService Workerは `src/core/sound-presets.js` を共有外部Moduleとしてcacheする。v0.13-devではcache versionも更新し、新旧音源処理が混在しないようにする。

## Regression

Mobile Chromium 360 / 390 / 430pxでDemo Composer由来のSongProjectをhandoffし、Arrangement Labの試聴で以下を確認する。

- Chord Pad + Dark: sine系Profile / filter 912Hz相当
- Melody Pluck + Bright: square / filter 3720Hz相当
- Bass Synth Bass + Warm: sawtooth / filter 639.6Hz相当
- Snare: Demo Composer同等のnoise生成
- 既存のA/B/C、Section試聴、リハモ試聴、停止操作を維持
- Console errorなし

## Remaining real-device check

Android実機スピーカーで、Demo Composer → Arrangement Lab間の聴感が十分一致するかを最終確認する。Cubasis / Cubase実機確認が完了するまでstable tagは作成しない。
