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
- shared Chord Backing Pattern definitions

### Project State

`src/core/project-state.js` が、Demo Composer内の共通Project Dataをメモリ上で管理する。

v0.2-dev時点:

- DATA_SCHEMA.mdのschemaVersion 2に沿ったDefault Project生成
- Project全体のValidation
- Snapshot取得
- State変更通知（subscribe）
- 責任Module別の更新API
- 更新ごとのrevision増加
- `updateInstruments()` によるSound / Backing設定更新

Project StateはModuleから直接オブジェクトを書き換えさせず、責任Module用の更新APIを通す。

### Edit History (Undo / Redo)

Project Store全体で1本の編集履歴を持つ。Moduleごとの履歴は持たない。

- 通常の更新API（`updateHub` / `updateChords` / `updateMelodyNotes` / `updateRhythmNotes` / `updateInstruments`）は、成功時だけ直前のProjectを履歴へ積む
- `undo()` / `redo()` / `getHistoryState()` を公開する
- 上限は `HISTORY_LIMIT`（50操作）。古い操作から捨てる
- 新しい編集をするとRedo履歴は捨てる
- 失敗した編集（Validation / 範囲外）は履歴に残さない
- Key変更（Global Key Change）は1回のAtomicな操作として、1回のUndoで元に戻る
- Sound Preset / Tone / Backing Pattern変更も通常編集として1回ずつUndo / Redoできる
- `revision` は戻しても増え続ける（保存の新旧判定のため）。Undo / Redoも通常の変更として通知され、AutoSaveされる
- 履歴はメモリ上だけで、`project.json` / IndexedDBへは保存しない。再読み込みで空になる。Schema変更なし
- ボタンUIは `src/core/edit-history-ui.js`。ModuleはUndoを意識せず、画面は `rerender` で最新Projectへ描き直すだけ

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

### Section（曲の構成）

`src/core/section-ops.js` が、Sectionの検証・小節計算・操作を純粋関数として持つ（UI / Audioに依存しない）。Store APIは `setSections` / `applySectionTemplate` / `resizeSection` / `removeSection` / `copySection`。いずれも通常の編集と同じくUndoできる。

- Chordは `chords[n] = Bar n+1` として先頭から隙間なく並べる前提（Melody / Rhythm / Playerが依存）。そのためSectionの小節数を変えるときは、コード・Melody・Bass・Drumsを一緒に前後へずらす
- 小節を増やす操作は、そのSectionより後ろにコードがある場合は拒否する（コードに隙間ができるため）。末尾のSectionか、後ろのコードを消してから増やす
- 小節を減らす / Sectionを削除する操作は、その範囲の内容を消して後ろを詰める
- Section間コピーは、短いほうの小節数まで、コード・Melody・Bass・Drumsをまとめて上書きコピーする。コピー先の手前にコードの空きがある場合は拒否する
- 複数Moduleのデータをまたぐため、Hub Key変更と同じくModule間の直接書き換えではなく、CoreのGlobal Operationとして扱う
- Melody / Rhythm画面は `sectionLabel` で「サビ 3/8小節」を見出しに表示し、`totalSectionBars` で小節数の下限を決める
- MIDI ExportはConductor Trackに各Sectionの先頭Markerを入れる（Cubasis / Cubaseで構成が見える）
- Demo Playerは `play(project, { lengthTick })` でSection範囲だけを再生できる。Loopも同じ範囲を繰り返す
- `sliceProject()` はProjectをcloneして範囲内Note / Chordだけを切り出すため、`instruments[]` のSound / Backing設定は保持される

### Schema / Migration

- `project-schema.js`: 現在のappVersion / schemaVersion
- `project-migration.js`: 旧Projectを現在Schemaへ変換
- `chord-qualities.js`: Chord Qualityと構成音の共通定義
- `backing-patterns.js`: Backing Pattern定義と発音Event展開
- `sound-presets.js`: Chord / Melody / BassのSound Preset、Tone方向タグ、Demo Player用Playback Profile定義
- `note-placement.js`: Melody / BassのNote配置・長さに関する共通処理

Chord / Audio / MIDIは同じChord Quality定義を参照し、表示・試聴・MIDIで構成音が食い違わないようにする。

Backing PatternはChord UI / Demo Player / MIDI Exportが同じ `core/backing-patterns.js` を参照する。UI・Audio・MIDIのどこにもPattern内容を重複定義しない。

Sound UIとDemo Playerは同じ `core/sound-presets.js` を参照する。Sound ModuleがAudio Moduleを直接呼び出さず、共通定義をCoreへ置くことでModule間の直接依存を避ける。

schemaVersion 1 → 2ではProject構造自体は維持し、Chord Qualityの許可値を拡張する。旧major / minor / diminishedはそのまま有効。

Arrange Section / Sound Sketch Lite / Backing Pattern / Melody Candidateは既存Data領域を利用するためschemaVersion 2を維持し、追加Migrationは行わない。

## Chord Assistance

Chord Module内の補助ロジックは `src/chord/` と共通純粋定義 `src/core/backing-patterns.js` を利用する。

- `chord-theory.js`: Scale / Degree / Chord Symbol / Quality候補
- `chord-presets.js`: Degree配列で定義した100種類（7カテゴリ）のChord Presetを現在Key / Scaleの通常Chord Dataへ展開
- `diatonic-fan.js`: 既存のダイアトニック7候補ButtonをDegreeごとの五度圏スロットへ割り当てるUI enhancer
- `diatonic-fan.css`: Androidスマホ向け扇形レイアウト / タップ領域 / 色分け
- `chord-presets.css`: Chord Preset / Backing Patternのスマホ向けPanel表示
- `core/backing-patterns.js`: Block / 8分刻み / Arpeggio / Syncopationを共通Eventへ展開

Chord PresetはProject Schemaへ専用データを追加しない。Preset選択状態も保存せず、適用結果だけ `project.chords[]` として保持する。これによりAutoSave / Demo Player / MIDI Exportは既存Chord処理をそのまま利用する。

Diatonic FanもProject DataやChord追加ロジックを変更しない。`data-add-chord` を持つ既存7候補へ表示用classだけを付与し、Chord画面が再Renderされた場合は `MutationObserver` で再適用する。Major / MinorのDegree文字列からスロットを判定し、候補Button自体のclick処理は `main.js` に残す。

### Backing Pattern

Backing PatternはChordの責任機能とする。

- Chord画面に `Backing Pattern` Selectを置く
- 初期4種類: Block / 8分刻み / Arpeggio / Syncopation
- 選択は `project.instruments[]` の `part: chord-backing` entryへ保存
- `part: chord-backing` entryだけをChord責任とし、Soundの `chord / melody / bass` entryとは分離する
- 未設定ProjectはBlockへFallbackする
- 選択変更は `updateInstruments()` を通し、AutoSave / Undo / Redo対象にする
- Chord Dataそのものは書き換えない
- Demo PlayerとMIDI ExportはProject SnapshotからBacking設定を読み取る

これは「完成伴奏の自動生成」ではなく、コード進行のリズム方向を判断するための少数Presetである。DAW級のPattern Sequencer / Arpeggiatorは実装しない。

## Melody Assistance

Melody Moduleの候補生成ロジックは `src/melody/melody-candidates.js` に置き、UIは `melody-screen.js` が担当する。

- `melodyCandidatesForBar()`: 現在の Key / Scale / Chord / Bar / Octave から、安定 / キャッチー / 浮遊感の3候補を純粋計算する
- `melodyCandidateDots()`: Androidの候補Cardへ8分8マスの発音位置Previewを返す
- `applyMelodyCandidate()`: 現在BarのMelody Noteだけを候補Noteへ置き換え、他Barを保持する
- Chordがある場合、安定案はChord Toneを中心にする
- Chord未設定BarではKey / Scaleを基準に生成する
- 生成結果は通常の `tracks[role=melody].notes[]` として `updateMelodyNotes()` へ渡す
- 候補自体はProject Dataへ保存しない。適用結果だけを保存する
- 既存のUndo / AutoSave / Demo Player / MIDI Exportを再利用し、専用保存形式・専用MIDI形式は追加しない

候補生成は外部AI / APIを使わないルールベースとし、「曲全体を完成させる」機能にはしない。1小節の3候補 → 選択 → Piano Rollで修正、という人間主導の流れを維持する。

## Sound Sketch Lite

Sound Moduleの最小実装は `src/sound/` に置く。

- `sound-screen.js`: Chord / Melody / BassのPreset SelectとTone Buttonを描画・操作
- `sound.css`: Androidスマホ向けSound UIと6 Module Bottom Navigationの調整
- `README.md`: Sound Moduleの責務

Sound選択データは `project.instruments[]` の `part: chord / melody / bass` entryに保存する。Sound Moduleはこの3 entryだけを更新し、`part: chord-backing` は更新しない。Demo PlayerはSnapshotを読み取り専用で参照する。

Sound Sketch Liteは以下だけを担当する。

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass
- Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive

Preset / Toneはoscillator waveform、low-pass filter、attack、release、gainの軽量Profileへ変換される。これはDemo Playerの仮音色だけに使い、ProjectのNote / Chord / Rhythm DataやMIDI出力は変更しない。

高度なSynth Parameter、FX、Mix、Plugin HostingはSound Moduleへ追加しない。

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

Hub Exportから`project.json`を手動Backupとしてダウンロードできる。`src/storage/project-import.js` の `parseProjectJson` が読み込み時の検証とMigrationを行い、Storeの `replaceProject` が中身を置き換える（Project IDは維持。通常の編集と同じくUndo可）。Snapshot履歴は未実装。

保存済みschemaVersion 1 Projectは、移行前データを退避してからschemaVersion 2へMigrationし、Active Projectとして保存する。未対応Schemaや不正データは安全側へ倒して新規Default Projectへフォールバックする。

## Module Ownership

- Hub: metadata / basic
- Chord: chords + `instruments[part=chord-backing]`
- Melody: melody notes（候補生成の適用結果も通常Melody Note）
- Rhythm: bass / drums
- Arrange: structure / counterMelody（`tracks[role=counter]`。生成は `src/core/counter-melody.js`、適用はStore `applyCounterMelody`）
- Hub: 骨子完成チェック（`src/core/skeleton-check.js` は読むだけの純粋関数。UIは `src/hub/skeleton-check-ui.js`）
- Sound: `instruments[part=chord|melody|bass]`

同じentryを複数Moduleが直接書き換えない。`instruments[]` は共通Containerだが `part` 単位で責任を分離する。

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

Chord / Melody / Bassは `src/core/sound-presets.js` のSound Profileを使い、Sound Sketch Liteの選択を再生時だけ反映する。

Chordはさらに `src/core/backing-patterns.js` のEvent定義を使い、選択中のBacking Patternに応じて同じChord構成音をBlock / 刻み / Arpeggio / Syncopationで発音する。ProjectのChord Data自体は変更しない。

Melody候補の適用結果は通常Melody Noteなので、Demo Playerに専用分岐を追加せずそのまま再生する。

Android Chromeでは、ユーザー操作後に`AudioContext.resume()`を行い、必要時はsilent bufferを経由してAudioContextをrunningへ復帰させる。

スマホ本体スピーカーで作曲判断しやすくするため、Demo Playerの仮音だけ以下を適用する。

- Chord previewはProject/MIDI本体を変更せず、再生時だけ聞き取りやすい音域を使用
- Sound Presetに応じてwaveform / filter / envelope / gainを軽量変更
- 出力は `part bus → master → loudness gain → compressor → limiter → output gain → destination`

Playbackは作曲判断の確認用途だけを担当し、高度なSynth / Mixing / Mastering機能は持たない。

## AI Consult / Part Switch

- AI相談: `src/hub/consult-text.js`（Projectを読むだけの純粋関数）と `src/hub/consult-ui.js`（Hub内のパネル / コピー）。外部サービスへは送信しない
- パート聴き分け: Demo Playerがパートごとの出力バス（`chord / melody / bass / drums`）を持ち、`setPartMuted(role, muted)` でgainを切り替える。UIは `src/audio/part-switch-ui.js`。状態は画面だけで、Project Data / MIDI Exportには触れない

Backing Patternで発音される複数Chord Noteも `chord` busへ送るため、既存のChord Mute / Soloがそのまま効く。

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

Chord MIDIは`chord-qualities.js`の共通構成音定義と `backing-patterns.js` の発音Event定義を利用する。Backing PatternはChord TrackのNote startTick / durationTick / velocity /発音数へ反映し、Chord Data自体は変更しない。Song.midのConductor TrackにはArrange SectionのMarkerを入れる。

Melody候補の適用結果は通常Melody Track Noteとして、既存のMelody.mid / Song.midへそのまま出力する。

Sound Sketch Liteの選択はDemo Player用であり、Program ChangeとCCは現時点では出力しない。最終音源はBandLab / Cubasis / Cubase側で差し替える。
