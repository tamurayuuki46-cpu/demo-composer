# MIDI Module

MIDI ModuleはDemo ComposerからCubasis / Cubaseへ渡すMIDIファイル生成を担当する。

## v0.1-dev implemented

外部ライブラリなしでStandard MIDI Fileを生成する。

出力:

- `Draft.mid`
- `Chord.mid`
- `Melody.mid`
- `Bass.mid`
- `Drums.mid`

HubのExport PanelからAll MIDIまたは個別ファイルをダウンロードできる。

## SMF

- Format: SMF Type 1
- PPQ: Projectの`basic.ppq`（v0.1は480固定）
- Program Change: 出力しない
- CC: v0.1では出力しない

### Draft.mid

Tracks:

1. Conductor
2. Chord
3. Melody
4. Bass
5. Drums

### Part MIDI

各パートファイルもType 1とし、

1. Conductor
2. 対象Part

の2 Trackで生成する。

## Conductor Track

- Tempo
- Time Signature 4/4
- Key Signature

## MIDI Channels

- Chord: 1
- Melody: 2
- Bass: 3
- Drums: 10

## Chord MIDI

Chordは簡易Triadとして書き出す。

- Major: Root / M3 / P5
- Minor: Root / m3 / P5
- Diminished: Root / m3 / dim5

v0.1 Chord base octaveはC4付近。

## Drums

GM準拠:

- Kick: 36
- Snare: 38
- Closed Hi-Hat: 42

## Android / BandLab

Android版BandLabでDraft.midのマルチTrack展開が期待通りにならない場合に備え、Part MIDIを常に生成できる設計にする。

All MIDIの複数ダウンロードをブラウザが制限する場合は、Hubから各Partを個別ダウンロードする。

## project.json

MIDIとは別にHubから`project.json`もダウンロード可能。

これはDemo Composerの正本データの手動Backupとして使用する。

Importは未実装。
