# ARCHITECTURE

## Principle

依存方向は `core ← module` を基本とする。

Module同士は直接呼び合わない。

## Modules

- Hub
- Chord
- Melody
- Rhythm
- Arrange
- Sound

現在は Hub / Chord / Melody / Rhythm / Arrange（曲の構成）/ Sound Sketch Lite を実装済み。

## Core Responsibilities

`src/core/`

- project state
- schema / migration
- validation
- shared music constants / utilities
- shared sound preset / playback profile definitions
- shared Backing Pattern definitions

### Project State

`src/core/project-state.js` がDemo Composer内の共通Project Dataをメモリ上で管理する。

v0.2-dev時点:

- DATA_SCHEMA.mdのschemaVersion 2に沿ったDefault Project生成
- Project全体のValidation
- Snapshot取得
- State変更通知（subscribe）
- 責任Module別の更新API
- 更新ごとのrevision増加
- Sound / Backing設定に使う `updateInstruments()`
- Project全体を安全に置換する `replaceProject()`（project.json Import用）

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

### Edit History (Undo / Redo)

Project Store全体で1本の編集履歴を持つ。Moduleごとの履歴は持たない。

- 通常の更新APIは成功時だけ直前Projectを履歴へ積む
- `undo()` / `redo()` / `getHistoryState()` を公開する
- 上限は `HISTORY_LIMIT`（50操作）
- 新しい編集をするとRedo履歴は捨てる
- 失敗した編集は履歴に残さない
- Key変更、Section操作、Preset適用、Sound変更、Backing Pattern変更、project.json Importも1回の操作としてUndo可能
- `revision` はUndo / Redo後も増え続け、AutoSave対象になる
- 履歴はメモリ上だけで保存しない

### Global Key Change

Key変更はHubから開始するが、Chord / Melody / BassをまたぐためCoreのAtomic Operationとして扱う。

- 元Keyから新Keyへの最短半音差を計算
- `chords[].root` を同じ半音幅で移調
- Melody / Bassの `notes[].pitch` を同じ半音幅で移調
- Chord quality / degree / timing、Note timing / duration / velocityは維持
- Drumsは変更しない
- MIDI Note 0〜127を外れる場合は更新全体を中止
- Scale変更はHarmony依存データがある間は拒否

### Section（曲の構成）

`src/core/section-ops.js` がSectionの検証・小節計算・操作を純粋関数として持つ。Store APIは `setSections` / `applySectionTemplate` / `resizeSection` / `removeSection` / `copySection`。

- Chordは `chords[n] = Bar n+1` の前提を維持
- Sectionの小節増減ではChord / Melody / Bass / Drumsをまとめて前後へずらす
- コードに隙間ができる増加は拒否する
- Section削除は範囲の内容を消して後ろを詰める
- Sectionコピーは短い側の小節数までChord / Melody / Bass / Drumsを上書きコピー
- Melody / Rhythm画面はSection名を表示できる
- MIDI ExportはConductor TrackへSection Markerを出力する
- Demo PlayerはSection範囲だけ再生できる
- `sliceProject()` は `instruments[]` を保持するためSound / Backing設定もSection再生へ引き継ぐ

### Schema / Migration

- `project-schema.js`: appVersion / schemaVersion
- `project-migration.js`: 旧Projectを現在Schemaへ変換
- `chord-qualities.js`: Chord Qualityと構成音の共通定義
- `sound-presets.js`: Chord / Melody / BassのSound Preset、Tone、Playback Profile
- `backing-patterns.js`: Chord Backing Patternと、Playback / MIDIで共有するイベント定義

schemaVersion 1 → 2ではProject構造自体は維持し、Chord Qualityの許可値を拡張する。

Arrange Section / Sound Sketch Lite / Chord Backing Patternは既存の `structure.sections` / `instruments[]` を利用するためschemaVersion 2を維持し、追加Migrationは行わない。

## Chord Assistance

Chord Moduleの補助ロジック:

- `chord-theory.js`: Scale / Degree / Chord Symbol / Quality候補
- `chord-presets.js`: Degree配列のChord Presetを現在Key / Scaleへ展開
- `diatonic-fan.js`: ダイアトニック7候補を五度圏風の扇形へ割り当てる表示層
- `diatonic-fan.css`: Android向け扇形UI

Chord Presetは適用結果だけ `project.chords[]` として保持する。Diatonic FanはProject Dataを変えない。

### Backing Pattern

Backing PatternはChord Moduleの「コードをどう鳴らすか」という作曲判断を担当する。

共通定義は `src/core/backing-patterns.js` に置き、UI / Audio / MIDIが同じ定義を利用する。

初期Pattern:

- Block
- 8分刻み
- Arpeggio
- Syncopation

設計ルール:

- `project.chords[]` は書き換えない
- 選択は `project.instruments[]` の `part: chord-backing` entryへ保存する
- `part: chord / melody / bass` のSound entryとは分離し、音色と奏法を独立して変更できる
- 未設定時はBlockへFallbackする
- `updateInstruments()` を通すためAutoSave / Undo / Redo対象になる
- Demo PlayerはPatternをChord playback eventへ展開する
- MIDI Exportも同じ `buildBackingEvents()` を使い `Chord.mid / Song.mid` のChord Trackへ展開する
- PlaybackとMIDIで異なるPattern解釈を持たない
- 本格Strumming / Voicing / DAW伴奏Editorには拡張しない

Chord画面へのBacking UIは現状 `sound-screen.js` が共通View integrationとして注入するが、`part: chord-backing` の意味上の責任ModuleはChordである。Sound ModuleがBacking内容を決定する設計にはしない。

## Sound Sketch Lite

Sound Moduleの最小実装は `src/sound/` に置く。

- `sound-screen.js`: Chord / Melody / BassのPreset SelectとTone Button
- `sound.css`: Sound UI / Backing panel共通Mobile style / 6 Module Bottom Navigation

Sound entryは `project.instruments[]` の `part: chord / melody / bass` で管理する。

Sound Sketch Lite:

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass
- Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive

Preset / Toneはwaveform、low-pass filter、attack、release、gainの軽量Profileへ変換し、Demo Playerの仮音色だけへ反映する。高度なSynth Parameter、FX、Mix、Plugin Hostingは追加しない。

## Rhythm

RhythmはBass / Drumsを担当する。

- 16 step入力
- Drum Preset
- Beat / Bar Copy
- Bass音程選択（Root / chord tone / octave等）
- Bass半音ずらし

Bassの音程選択はUI上の入力支援であり、保存結果は従来どおり通常のMIDI Note Dataとする。

## Storage

Storageは `src/storage/` に分離し、coreはIndexedDBへ直接依存しない。

`indexeddb-storage.js`:

- IndexedDB database: `demo-composer`
- Active Project保存 / Restore
- Migration前Project退避
- Persistent Storage要求

`autosave.js`:

- Store subscribeを利用
- 変更後1.5秒でDebounced AutoSave
- hidden時即時保存
- 保存Queueで同時書き込みを避ける

`project-import.js`:

- JSON Parse
- Demo Composer Project検証
- schemaVersion 1 → 2 Migration
- 不正ファイルは現Projectを変更せず拒否

## Module Ownership

- Hub: metadata / basic
- Chord: chords / `instruments[part=chord-backing]`
- Melody: melody notes
- Rhythm: bass / drums
- Arrange: structure / counterMelody
- Sound: `instruments[part=chord|melody|bass]`

同じデータを複数Moduleが勝手に書き換えない。`instruments[]` は共通Containerだが、`part` ごとの責任Moduleを固定する。

## Playback

Demo Playerは共通UIとして画面下部、Module Navigationの上に常設する。

- `src/audio/demo-player.js`
- Web Audio API
- Play / Stop / Loop / Position
- Play時のProject Snapshotを読み取り専用で再生
- Project Stateを書き換えない

ChordはChord Quality共通定義 + Backing Pattern共通定義 + Chord Sound Profileを組み合わせて再生する。Melody / BassはSound Profileを使用し、Drumsは軽量Preview音を使用する。

Android Chromeではユーザー操作後に`AudioContext.resume()`し、スマホ本体スピーカー向けにloudness gain / compressor / limiterを使う。

Playbackは作曲判断の確認用途だけを担当し、高度なSynth / Mixing / Mastering機能は持たない。

## Export

MIDI出力は `src/midi/` に集約する。

Export:

- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- project.json

MIDIはSMF Type 1 / PPQ 480。Song.midはConductor + Chord + Melody + Bass + Drums。Conductor TrackにはArrange Section Markerを入れる。

Chord Trackは `chord-qualities.js` の構成音と `backing-patterns.js` のPattern Eventを共有利用する。Sound Sketch Liteの音色はProgram Change / CCとしては出力せず、最終音源はBandLab / Cubasis / Cubase側で差し替える。
