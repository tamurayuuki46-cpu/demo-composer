# DATA_SCHEMA

## Canonical Data

Demo Composer内の正本は `project.json`。

現在Schema:

```json
{
  "schemaVersion": 2,
  "appVersion": "v0.2-dev",
  "id": "uuid",
  "revision": 1,
  "metadata": {
    "title": "Untitled",
    "genre": "",
    "mood": [],
    "memo": ""
  },
  "basic": {
    "bpm": 120,
    "key": "C",
    "scale": "major",
    "timeSignature": "4/4",
    "ppq": 480
  },
  "structure": {
    "sections": []
  },
  "chords": [],
  "tracks": [],
  "instruments": [],
  "progress": {},
  "exportSettings": {}
}
```

## v0.2 Constraints

- BPM: 40〜240
- Key: 12音
- Scale: major / minor
- Time Signature: 4/4
- PPQ: 480

## Chord Data

`chords[]`:

- `root`: 0〜11
- `quality`: 下記9種類
- `degree`: Degree文字列
- `startTick`: 0以上の整数
- `durationTick`: 1以上の整数

対応する `quality`:

- `major`
- `minor`
- `dominant7`
- `major7`
- `minor7`
- `sus2`
- `sus4`
- `diminished`
- `augmented`

v0.2のUIでも1コード=1小節（1920 tick）を維持する。

Chord Moduleでは従来のダイアトニック7候補に加えて、任意の基準音から上記9種類を選べる。新しいQualityはDemo PlayerとMIDI Exportの両方で構成音を反映する。

## Track Data

`tracks[]` は役割ごとのMIDI Track情報を持つ。

Melody Track例:

```json
{
  "role": "melody",
  "name": "Melody",
  "midiChannel": 2,
  "instrumentId": null,
  "mute": false,
  "solo": false,
  "volume": 1,
  "pan": 0,
  "notes": []
}
```

Bass Track:

- role: `bass`
- name: `Bass`
- midiChannel: 3

Drums Track:

- role: `drums`
- name: `Drums`
- midiChannel: 10
- drumMap: `kick:36`, `snare:38`, `closedHH:42`

## Note Data

`tracks[].notes[]`:

- `id`: 一意な文字列
- `pitch`: MIDI Note 0〜127
- `startTick`: 0以上の整数
- `durationTick`: 1以上の整数
- `velocity`: 1〜127

Melody UIは8分音符Grid（1 step = 240 tick）と16分音符Grid（1 step = 120 tick）を切り替えて入力できる。どちらもNoteは `startTick` / `durationTick` で保持する。

Rhythm UIでは16分音符Gridを使用するため、1 step = 120 tick。

MelodyとBassはUI上同一stepに1音だけ入力するMonophonic方式。Drumsは同一stepにKick / Snare / HHなど複数Noteを保持できる。

## Ownership

- metadata/basic → Hub
- chords → Chord
- melody track → Melody
- bass/drums → Rhythm
- structure/counterMelody → Arrange
- instruments → Sound

## Schema v1 → v2 Migration

v2ではProjectの基本構造は変更せず、`chords[].quality` の許可値を拡張する。

旧v1 Projectは以下の手順で自動移行する。

1. IndexedDBの `meta` storeへ移行前Projectを退避
2. `schemaVersion: 1` を `2` へ更新
3. `appVersion` を `v0.2-dev` へ更新
4. Chord / Melody / Rhythm等の既存データはそのまま保持
5. 移行後ProjectをActive Projectとして保存

v1で使用していた `major / minor / diminished` はv2でも有効なため、Chordデータ自体の変換は不要。

## Migration Rule

Schema変更時は必ず:

1. schemaVersionを上げる
2. DATA_SCHEMA.md更新
3. Migration関数を追加
4. 変換前データを退避
5. AI_HANDOFF.mdへ設計判断を記録
