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

v0.1では Hub / Chord / Melody / Rhythm を優先。

## Core Responsibilities

`src/core/`

- project state
- event bus
- validation
- shared utilities

### Project State

`src/core/project-state.js` が、Demo Composer内の共通Project Dataをメモリ上で管理する。

v0.1-dev時点では以下を実装済み。

- DATA_SCHEMA.mdのschemaVersion 1に沿ったDefault Project生成
- Project全体のValidation
- Snapshot取得
- State変更通知（subscribe）
- 責任Module別の更新API
- 更新ごとのrevision増加

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

## Storage

Storageは `src/storage/` に分離し、coreはIndexedDBへ直接依存しない。

`indexeddb-storage.js`:

- IndexedDB database: `demo-composer`
- `projects` storeへProject Snapshotを保存
- `meta` storeへactiveProjectIdを保存
- 起動時にActive Projectを読み込む
- Save Nowから手動保存
- Save Now時に `navigator.storage.persist()` が利用可能なら永続ストレージ保護を要求

`autosave.js`:

- Project Storeの`subscribe()`を利用
- 変更後1.5秒無操作で保存
- 連続変更時は最新Snapshotを保存
- 保存処理をQueueし、同時書き込みを避ける
- `visibilitychange`でhiddenになる時は即時保存
- Project Stateやrevision自体は変更しない

Hub Exportから`project.json`を手動Backupとしてダウンロードできる。Importは未実装。

現時点ではSnapshot履歴 / Migrationは未実装。

保存済みProjectが読み込めない、または現在のSchema Validationに通らない場合は、新規Default Projectへフォールバックする。

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

Android Chromeでは、ユーザー操作後に`AudioContext.resume()`を行い、必要時はsilent bufferを経由してAudioContextをrunningへ復帰させる。

スマホ本体スピーカーで作曲判断しやすくするため、Demo Playerの仮音だけ以下を適用する。

- Chord previewはProject/MIDI本体を変更せず、再生時だけ1オクターブ上のvoicingを使用
- Bass previewは低域の聞き取りを補うためtriangle波を使用
- 出力は `master → loudness gain → compressor → limiter → output gain → destination`
- 単純な後段2倍ブーストはAndroid実機でクリップが目立ったため不採用

これらはDemo Player専用の再生処理であり、Project DataやMIDI ExportのNote/Pitchには影響させない。

Playbackは作曲判断の確認用途だけを担当し、高度なSynth / Mixing / Mastering機能は持たない。

## Export

MIDI出力は `src/midi/` に集約する。

- `midi-writer.js`: SMFの低レベルbyte生成
- `midi-export.js`: Project DataからTrack/Eventへ変換し、Downloadを担当

Project Stateや各ModuleはMIDI byte構造を知らない。

v0.1 Export:

- Song.mid
- Chord.mid
- Melody.mid
- Bass.mid
- Drums.mid
- project.json

MIDIはSMF Type 1 / PPQ 480。Song.midはConductor + Chord + Melody + Bass + Drums、Part MIDIはConductor + 対象Partで生成する。

Program ChangeとCCはv0.1では出力しない。最終音源はCubasis / Cubase側で差し替える。
