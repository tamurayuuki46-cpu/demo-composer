# CHANGELOG

## v0.1-dev
更新日: 2026-10-10

### 追加
- Demo Composer初期Repository構成
- Claude / ChatGPT共通開発ルール
- AI_HANDOFF
- PRODUCT_SPEC / ARCHITECTURE / DATA_SCHEMA / UI_SPEC / DEVELOPMENT_RULES / ROADMAP
- Hub / Chord / Melody / Rhythm の最小UIシェル
- Androidスマホ向けの基本レスポンシブUI
- 将来のMelody / Bass等の3候補生成方針を共通仕様へ追加
- schemaVersion 1に沿った共通Project Stateストア
- Project Snapshot / Validation / Subscription / Revision更新
- HubからProject名 / BPM / Key / Scaleを編集するUI
- IndexedDB Storage Module
- Active Projectの手動Saveと起動時自動読込
- Save時のPersistent Storage要求
- 保存方式変更前の復元ブランチ `restore/v0.1-before-indexeddb`
- Key / Scale連動のダイアトニックコード7候補
- Chord候補タップによる1小節追加
- Chord削除 / Clear / startTick再配置
- Chord State Validation / updateChords API
- Melody Track Validation / updateMelodyNotes API
- スマホ向け簡易Melody Piano Roll
- MelodyのBar / Octave / Beat表示切替
- Monophonicな8分音符Tap入力 / Clear Bar
- Melody UI大幅変更前の復元ブランチ `restore/v0.1-before-melody-roll`
- Bass / Drums Track更新API
- スマホ向けRhythm 16 Step Sequencer
- Beat 1〜4切替 / Bar移動 / Clear Bar / Clear Bass
- BassをChord RootまたはKey Rootから入力する方式
- GM準拠Kick 36 / Snare 38 / Closed HH 42
- Rhythm UI変更前の復元ブランチ `restore/v0.1-before-rhythm-sequencer`

### 変更
- Hub表示を固定値からProject State参照へ変更
- Project名変更時にTop Barへ即時反映するよう変更
- Saveボタンを有効化
- Project Stateと永続化処理を分離
- Chord画面を固定サンプルからProject Data連動UIへ変更
- Chord進行が存在する間はKey / Scale変更を拒否し、Degree不整合を防止
- Melody画面をPlaceholderからProject Data連動の簡易Piano Rollへ変更
- Melody Noteが存在する間もKey / Scale変更を拒否して整合性を保護
- Rhythm画面をPlaceholderからBass / Drums同時入力UIへ変更
- Bass Noteが存在する間はChord変更を拒否してRoot不整合を防止

### 修正
- Chord作成後のKey / Scale変更で表示とDegreeが不整合になる問題を予防
- ChordをClearした後も5小節目以降のMelody Noteへ移動できるようBar数をNote Dataから補完
- Bassが旧Chord Rootのまま見えなくなる問題を避けるため、Bass stepはstartTick単位で表示しTap時に現在Rootへ置換可能にした

### 未対応
- Autosave / Snapshot履歴
- project.json Backup / Import
- Migration
- Demo Player実装
- MIDI Export
- Chord並べ替え / 長さ変更 / 7th / 借用和音
- Melody 16分音符 / Note Length / Velocity編集
- Scale表示 / Chord Tone強調 / Melody Analyzer
- Bass Pitch手動編集 / Velocity / Pattern Copy
- Open HH / Percussion / Tom
- PWA Service Worker
