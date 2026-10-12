# DATA_SCHEMA

## Canonical Data

Demo Composer内の正本は `project.json`。

現在Schema: **3（v0.3-dev）**。PPQ 480 / 4/4 / project.json正本は維持。以下のv0.2導入機能にある「schemaVersion 2」は導入当時の説明で、現行の音楽フィールドも同じ形を維持してSchema 3へ含めます。

```json
{
  "schemaVersion": 3,
  "appVersion": "v0.3-dev",
  "id": "uuid",
  "revision": 1,
  "metadata": {
    "title": "Untitled",
    "genre": "",
    "mood": [],
    "memo": "",
    "composition": {
      "hook": "", "highlight": "", "tension": "", "chorus": "", "reference": "",
      "axes": {"melody":"", "counter":"", "harmony":"", "rhythm":"", "sound":""},
      "tags": {"melody":[], "counter":[]},
      "checks": {"counter":"undecided", "sound":"undecided", "contrast":"undecided"},
      "decisions": []
    }
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
- `energy`（任意）: `low` / `mid` / `high`。曲の盛り上がり設計。無いときはSectionの種類ごとの初期値（intro=low / verse=low / prechorus=mid / chorus=high / interlude=mid / bridge=mid / outro=low）として扱う。新しく作るSectionには初期値を保存する
- `transition`（任意）: `keep` / `fill` / `stop` / `build` / `drop`。このSectionから「次のSection」へのつなぎ方のタグ。無いときは `keep`。最後のSectionでは使わない（保存されていても無視）
- `energy` / `transition` は設計のラベルで、音符やコードを自動では変えない。古いアプリ・古いProjectとの互換のため任意項目とし、schemaVersionは2のまま（追記のみ）
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
- `quality`: 下記44種類（基本9種類 + 拡張35種類）
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

拡張Quality（v0.2-dev で追加。許可値の追記のみで、schemaVersionは2のまま）:

- 6th系: `major6` / `minor6`
- add系: `add9` / `minorAdd9`
- 7th系: `minor7flat5` / `diminished7` / `minorMajor7` / `major7sharp5` / `dominant7sus4`
- 9th・11th・13th系: `major9` / `dominant9` / `minor9` / `minor11` / `minor7add11` / `dominant13` / `major13` / `minorMajor9` / `major9sharp5` / `minor9flat5` / `minor7flat5add11`
- 変化音系: `dominant7flat9` / `dominant7sharp9` / `dominant7flat13` / `dominant7sharp11` / `major7sharp11` / `minor7flat9` / `dominant9flat5` / `dominant9sharp5`
- 7th追加（全音音階向け）: `dominant7flat5` / `dominant7sharp5`
- 4度堆積・特殊和音: `quartal3` / `quartal4` / `quintal3` / `soWhat` / `mystic`

構成音は rootからの半音数で、9th以上は1オクターブ上（例: 9th=14、11th=17、13th=21、♭9=13、♯9=15、♯11=18、♭13=20）で保存する。ピッチクラスが必要な処理は `% 12` で扱う。

互換性: 拡張Qualityを含む project.json を、拡張前のアプリで読み込むと検証で拒否される（前方互換なし）。後ろ向き（旧Project → 新アプリ）は問題なし。MIDI読み込みのコード判定は基本9種類のみを使い、特殊な名前を推測しない。

v0.2のUIでも1コード=1小節（1920 tick）を維持する。

Chord Moduleでは従来のダイアトニック7候補に加えて、任意の基準音から上記44種類を選べる。さらに「スケール系のコード」（ダイアトニック / ハーモニックマイナー系 / メロディックマイナー系 × 3和音 / 7th / テンション）から1タップで追加できる。新しいQualityはDemo PlayerとMIDI Exportの両方で構成音を反映する。

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

Counter Melody Track（任意。裏メロを入れたときだけ追加される）:

- role: `counter`
- name: `Counter Melody`
- midiChannel: 4
- 他の項目はMelody Trackと同じ

Counter Melody Trackが無いProject（旧Project）は、そのまま有効。schemaVersionは2のまま（追記のみ）。裏メロの候補 `Sparse（隙間型） / Active（動く型） / Hook（フック型）` はUIで毎回計算し、候補名や候補IDはProject Dataへ保存しない。選んで当てた結果だけが通常のNoteとして `tracks[role=counter].notes[]` に入る。Section切り出し / コピー / 小節増減 / Key変更では、Melody / Bassと同じようにtickや音高が追従する。Scale変更は、コード・メロディ・ベースと同じく、裏メロがある間は拒否する。3系統の役割定義は `docs/COUNTER_MELODY_STYLES.md` を参照。

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

### Melody Candidate Generation

Melody候補（安定 / キャッチー / 浮遊感）は専用Schemaを追加しない。

- 候補一覧そのものはUIで毎回計算し、Project Dataへ保存しない
- 候補適用時は現在BarのMelody Noteだけを通常の `tracks[role=melody].notes[]` へ置き換える
- 他BarのMelody Noteは保持する
- 生成Noteも通常Noteと同じ `id / pitch / startTick / durationTick / velocity` を持つ
- AutoSave / Undo / Redo / Demo Player / Melody.mid / Song.midは既存Note処理をそのまま利用する
- Chord未設定BarではHubのKey / Scaleを基準に候補を生成する
- 追加Migrationは不要で、schemaVersion 2を維持する

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

- Chord: `keys / pad / piano`、追加: `strings / organ / choir`
- Melody: `lead / keys / pluck`、追加: `vocal / vocal-soft / vocal-bright / pad-lead / flute / strings-lead / bell`
- Bass: `soft-bass / synth-bass / deep-bass`、追加: `sub-bass / pluck-bass / growl-bass`

Presetは文字列なので、Preset追加でSchemaは変わらない。知らないPreset idを持つProject（将来のアプリで保存したもの）は、そのPartの初期Presetに戻るだけで壊れない。
初期Presetは Chord=`pad` / Melody=`strings-lead` / Bass=`deep-bass`、Toneは `natural`。`instruments[]` にそのPartのentryが無いProjectは、これで鳴る（以前は keys / vocal / soft-bass）。保存済みの選択は変わらない。

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
- structure → Arrange
- `tracks[role=counter]`（裏メロ） → Arrange（候補の生成と適用はCoreのGlobal Operation）
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

Arrange Section / Sound Sketch Lite / Backing Pattern / Melody Candidateはいずれもv2の既存領域を利用するため、追加のschemaVersion変更は行わない。

## Migration Rule

Schema変更時は必ず:

1. schemaVersionを上げる
2. DATA_SCHEMA.md更新
3. Migration関数を追加
4. 変換前データを退避
5. AI_HANDOFF.mdへ設計判断を記録

## Schema 3: 作曲判断の保存

- `metadata.composition`: 必須。`decision-design.js`のdefaultDesign / validateDesignが契約の正本。
- hook / highlight / tension / chorus / reference: 各400文字以内の文字列。
- axes: melody / counter / harmony / rhythm / sound、各200文字以内。
- tags: melody / counterそれぞれ、MELODY_TAGS内の重複なし配列。人の分析タグで、自動分析結果は保存しない。
- checks: counter / sound / contrast。それぞれ undecided / decided / unnecessary。音符の有無だけで決定済みにしない。
- decisions: 採用履歴。id / date（ISO日時）/ kind / label / startBar / endBar / summary / reason。labelは160文字、summary400文字、reason200文字まで。小節範囲は当時の記録で、Section移動に追従させない。最大1000件。超過は操作全体を拒否し、古い履歴を勝手に削除しない。UIは最新30件、JSONは全件保存。
- `structure.sections[].purpose`: 任意の100文字以内の編集可能な役割。未設定は未決定。プレースホルダーの例を自動採用しない。
- `chords[].purposes`: 任意。安定 / 緊張 / 浮遊 / 切なさ / 明るさ / 意外性 / 転調感 / 解決感。音楽データとは独立しBassがあっても注釈だけ変更できる。
- `instruments[part=chord-voicing]`: preset=lower / center / upper、tone=natural。欠損はcenter。コードの仮再生とChord/Song MIDIを±12半音の音域で鳴らす。コードのroot/quality/tickは変えない。
- 未採用候補と比較セッションは保存しない。

## 明示的Migration: v1 / v2 → v3

1. 起動時、Storageが元Projectをmetaへ退避。キーは `migrationBackup:<id>:schema<version>:revision<revision>`。既存同一キーは上書きしない。以前のbackupキーも削除しない。
2. migrateProjectは元オブジェクトをcloneし、schemaVersion=3 / appVersion=v0.3-devとcomposition既定値を追加する。既存の自由メモ、音楽情報、Section、ID、revisionを保持。
3. validateProjectで全体検証してからActiveへ保存。IndexedDB DB_VERSION=1、Object Store追加なし。
4. 旧Projectの複製・一覧はそのまま。初めて開いた時だけ退避・移行する。
5. project.json Importも同じMigrationで変換する。読み込んだ元ファイルは上書きしない。現行Projectとの置換はUndo可。
6. Schema 3は旧アプリでは拒否される。ロールバックは旧コード＋退避した旧schemaのJSONを使う。新しいJSONのschema番号だけを書き換えない。
7. MIDIは言葉の意図を運ばない。MIDI Importでは現行のcompositionとmetadata.memoを保持する。新しいコードやSectionに旧目的タグを自動対応させない。JSON Importは読み込んだファイルの意図を使用。
