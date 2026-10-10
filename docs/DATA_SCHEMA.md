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

## structure.sections（曲の構成）

schemaVersion 2のまま、既存の `structure.sections` に次の形で入れる（Schema変更なし。`undefined` / `[]` の古いProjectもそのまま有効）。

```json
{ "id": "section-xxxx", "kind": "verse", "name": "Aメロ", "bars": 8 }
```

- `kind`: `intro` / `verse` / `prechorus` / `chorus` / `interlude` / `bridge` / `outro`
- `name`: 1〜20文字。同じ種類が複数あるときは `サビ2` のように番号を付ける
- `bars`: 1〜32の整数。Sectionは Bar 1 から順に隙間なく並ぶ（開始Barは保存せず、並び順と `bars` の合計から計算する）
- 上限: 24 Section / 合計128小節
- 音符・コードはSectionの中に持たず、従来どおりtickで保持する。Sectionは区切りの名前だけ
- 責任Module: Arrange（ただし小節数の増減・コピーはCoreのGlobal Operation。ARCHITECTURE.md参照）

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

## Instrument / Sound Sketch Data

Sound Sketch Liteは既存の `instruments[]` を利用する。schemaVersionは2のまま維持する。

Sound entry例:

```json
{
  "part": "melody",
  "preset": "lead",
  "tone": "bright"
}
```

対応Sound Part:

- `chord`
- `melody`
- `bass`

初期Preset:

- Chord: `keys / pad / piano`
- Melody: `lead / keys / pluck`
- Bass: `soft-bass / synth-bass / deep-bass`

Tone:

- `natural`
- `bright`
- `soft`
- `warm`
- `dark`
- `airy`
- `aggressive`

## Chord Backing Pattern Data

Backing Patternも既存の `instruments[]` 内に専用entryを1件だけ持つ。schemaVersionは2のまま維持する。

```json
{
  "part": "chord-backing",
  "preset": "eighth",
  "tone": "natural"
}
```

対応 `preset`:

- `block`
- `eighth`
- `arpeggio`
- `syncopation`

ルール:

- `part: chord-backing` が無いProjectは `block` として扱う
- Backing Pattern選択はAutoSave / Undo / Redo対象
- Chord Dataそのもの（root / quality / degree / timing）は変更しない
- Demo Playerでは選択Patternに応じてChordの発音タイミングを展開する
- `Chord.mid / Song.mid` ではChord Track Note配置へPatternを反映する
- Sound Preset / Toneとは別entryなので、Sound変更でBacking Patternを消さず、Backing変更でSoundを消さない
- 既存 `instruments[]` を使うため追加Migrationは不要

互換性ルール:

- `instruments: []` は有効で、Sound各Partは既定Preset + `natural`、Backingは `block` へFallbackする
- Sound / Backing未設定の旧ProjectもMigration不要
- Section再生はProjectをsliceしても `instruments` を保持するため同じSound / Backing設定で鳴る
- MIDI Program Change / CCは現時点では出力しない

## Ownership

- metadata/basic → Hub
- chords → Chord
- melody track → Melody
- bass/drums → Rhythm
- structure/counterMelody → Arrange
- `instruments[]` の `chord / melody / bass` entry → Sound
- `instruments[]` の `chord-backing` entry → Chord

同じentryを複数Moduleが書き換えない。`instruments[]` は共通Containerだが、`part` ごとに責任Moduleを分ける。

## Schema v1 → v2 Migration

v2ではProjectの基本構造は変更せず、`chords[].quality` の許可値を拡張する。

旧v1 Projectは以下の手順で自動移行する。

1. IndexedDBの `meta` storeへ移行前Projectを退避
2. `schemaVersion: 1` を `2` へ更新
3. `appVersion` を `v0.2-dev` へ更新
4. Chord / Melody / Rhythm等の既存データはそのまま保持
5. 移行後ProjectをActive Projectとして保存

v1で使用していた `major / minor / diminished` はv2でも有効なため、Chordデータ自体の変換は不要。

Arrange Section / Sound Sketch Lite / Backing Patternはいずれもv2に既に存在する `structure.sections` / `instruments` を利用するため、追加のschemaVersion変更は行わない。

## Migration Rule

Schema変更時は必ず:

1. schemaVersionを上げる
2. DATA_SCHEMA.md更新
3. Migration関数を追加
4. 変換前データを退避
5. AI_HANDOFF.mdへ設計判断を記録
