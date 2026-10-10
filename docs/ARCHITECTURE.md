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

現在は Hub / Chord / Melody / Rhythm を実装済み。

## Core Responsibilities

`src/core/`

- project state
- schema / migration
- validation
- shared music constants / utilities

### Project State

`src/core/project-state.js` が、Demo Composer内の共通Project Dataをメモリ上で管理する。

v0.2-dev時点:

- DATA_SCHEMA.mdのschemaVersion 2に沿ったDefault Project生成
- Project全体のValidation
- Snapshot取得
- State変更通知（subscribe）
- 責任Module別の更新API
- 更新ごとのrevision増加

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

### Global Key Change

Key変更はHubから開始するが、Chord / Melody / Bassをまたぐため、各Moduleを直接操作せず `src/core/project-state.js` が1回のAtomicなProject更新として処理する。

- 元Keyから新Keyへの最短半音差を計算
- `chords[].root` を同じ半音幅で移調
- Melody / Bassの `notes[].pitch` を同じ半音幅で移調
- Chord quality / degree / timing、Note timing / duration / velocityは維持
- Drumsは変更しない
- MIDI Note 0〜127を外れるNoteが1つでもある場合は更新全体を中止し、元Stateを維持
- Scale変更は別処理とし、Harmony依存データがある間は引き続き拒否する

この処理はModule Ownershipの例外としてHubが他Moduleを直接書き換えるのではなく、CoreがProject全体の整合性を保つために行うGlobal Operationとして扱う。

### Schema / Migration

- `project-schema.js`: 現在のappVersion / schemaVersion
- `project-migration.js`: 旧Projectを現在Schemaへ変換
- `chord-qualities.js`: Chord Qualityと構成音の共通定義

Chord / Audio / MIDIは同じChord Quality定義を参照し、表示・試聴・MIDIで構成音が食い違わないようにする。

schemaVersion 1 → 2ではProject構造自体は維持し、Chord Qualityの許可値を拡張する。旧major / minor / diminishedはそのまま有効。

## Chord Assistance

Chord Module内の補助ロジックは `src/chord/` に置く。

- `chord-theory.js`: Scale / Degree / Chord Symbol / Quality候補
- `chord-presets.js`: Degree配列で定義したChord Presetを現在Key / Scaleの通常Chord Dataへ展開
- `diatonic-fan.js`: 既存のダイアトニック7候補ButtonをDegreeごとの五度圏スロットへ割り当てるUI enhancer
- `diatonic-fan.css`: Androidスマホ向け扇形レイアウト / タップ領域 / 色分け

Chord PresetはProject Schemaへ専用データを追加しない。Preset選択状態も保存せず、適用結果だけ `project.chords[]` として保持する。これによりAutoSave / Demo Player / MIDI Exportは既存Chord処理をそのまま利用する。

Diatonic FanもProject DataやChord追加ロジックを変更しない。`data-add-chord` を持つ既存7候補へ表示用classだけを付与し、Chord画面が再Renderされた場合は `MutationObserver` で再適用する。Major / MinorのDegree文字列からスロットを判定し、候補Button自体のclick処理は従来の `main.js` に残す。

## Storage

Storageは `src/storage/` に分離し、coreはIndexedDBへ直接依存しない。

`indexeddb-storage.js`:

- IndexedDB database: `demo-composer`
- `projects` storeへProject Snapshotを保存
- `meta` storeへactiveProjectIdを保存
- 起動時にActive Projectを読み込む
- Save Nowから手動保存
- Schema Migration前のProjectを`meta` storeへ退避
- Save Now時に `navigator.storage.persist()` が利用可能なら永続ストレージ保護を要求

`autosave.js`:

- Project Storeの`subscribe()`を利用
- 変更後1.5秒無操作で保存
- 連続変更時は最新Snapshotを保存
- 保存処理をQueueし、同時書き込みを避ける
- `visibilitychange`でhiddenになる時は即時保存
- Project Stateやrevision自体は変更しない

Hub Exportから`project.json`を手動Backupとしてダウンロードできる。Import / Snapshot履歴は未実装。

保存済みschemaVersion 1 Projectは、移行前データを退避してからschemaVersion 2へMigrationし、Active Projectとして保存する。未対応Schemaや不正データは安全側へ倒して新規Default Projectへフォールバックする。

## Module Ownership

- Hub: metadata / basic
- Chord: chords
- Melody: melody notes
- Rhythm: bass / drums
- Arrange: structure / counterMelody
- Sound: instruments

同じデータを複数Moduleが直接書き換えない。

## Playback

Demo Playerは共通UIとして画面下部、Module Navigationの上に常設する。

実装:

- `src/audio/demo-player.js`
- Web Audio API
- Play / Stop / Loop / Position
- Play時点のProject Snapshotを読み取り専用で再生
- Project Stateを書き換えない

Chord / Melody / Bass / Drumsを軽量な仮音で再生する。

Chordは`src/core/chord-qualities.js`の構成音を使うため、Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / augを試聴できる。

Android Chromeでは、ユーザー操作後に`AudioContext.resume()`を行い、必要時はsilent bufferを経由してAudioContextをrunningへ復帰させる。

スマホ本体スピーカーで作曲判断しやすくするため、Demo Playerの仮音だけ以下を適用する。

- Chord previewはProject/MIDI本体を変更せず、再生時だけ聞き取りやすい音域を使用
- Bass previewは低域の聞き取りを補うためtriangle波を使用
- 出力は `master → loudness gain → compressor → limiter → output gain → destination`

Playbackは作曲判断の確認用途だけを担当し、高度なSynth / Mixing / Mastering機能は持たない。

## Export

MIDI出力は `src/midi/` に集約する。

- `midi-writer.js`: SMFの低レベルbyte生成
- `midi-export.js`: Project DataからTrack/Eventへ変換し、Downloadを担当

Project Stateや各ModuleはMIDI byte構造を知らない。

Export:

- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- project.json

MIDIはSMF Type 1 / PPQ 480。Song.midはConductor + Chord + Melody + Bass + Drums、Part MIDIはConductor + 対象Partで生成する。

Chord MIDIも`chord-qualities.js`の共通構成音定義を利用する。

Program ChangeとCCは現時点では出力しない。最終音源はBandLab / Cubasis / Cubase側で差し替える。
