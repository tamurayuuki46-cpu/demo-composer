# AI_HANDOFF

現在Version:
v0.1-dev

最新安定版:
なし（初期開発段階）

現在実装済み:
- Repository初期構成
- 共通仕様書
- Claude / ChatGPT共同開発ルール
- Hub / Chord / Melody / Rhythm の実データ入力UI
- schemaVersion 1準拠の共通Project State
- Project Validation / Snapshot / Subscription / Revision更新
- HubからProject名 / BPM / Key / Scaleを編集
- Project名をTop Barへ同期
- IndexedDBへの保存 / Active Project起動時読込
- Project変更後1.5秒のAutoSave
- アプリがhiddenになる時の即時AutoSave
- Save Now時の即時保存 / Persistent Storage要求
- Chord Moduleのダイアトニックコード候補表示
- Chord候補タップによる1小節追加
- Chord削除 / Clear / startTick再配置
- スマホ向け簡易Melody Piano Roll
- Melody Bar / Octave / Beat範囲切替
- Melody 8分音符Tap入力 / Monophonic置換 / Clear Bar
- スマホ向けRhythm 16 Step Sequencer
- Bass / Kick / Snare / Closed HH同時表示
- BassのChord Root / Key Root入力
- Beat 1〜4切替 / Bar移動 / Clear Bar / Clear Bass
- Key/ScaleおよびChord変更時のHarmony整合性ガード
- 常設Demo Player
- Play / Stop / Loop / Position
- Chord / Melody / Bass / DrumsのWeb Audio軽量プレビュー
- Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid Export
- SMF Type 1 / Conductor Track / Tempo / 4/4 / Key Signature
- project.json手動Backup Export
- MIDI Smoke Test / Pull Request CI

開発中:
- v0.1仕上げ / 実機確認準備

次に実装:
- Android実機テスト用チェックリスト
- project.json Importは安全な復元設計を固めてから判断
- PWA Service Workerは開発中のstale cache対策を決めてから判断

既知の問題:
- Chordは現在1コード=1小節固定
- Chord並べ替え / 長さ変更 / 7th / 借用和音は未対応
- Key/Scale変更時の既存Chord/Melody/Bass自動移調は未対応。v0.1では関連データをClearしてから変更する
- Bass Noteがある間はChord変更を拒否する。RhythmのClear Bassで解除する
- Melodyは8分音符固定。16分音符 / Note Length / Velocity編集は未対応
- Melody Scale表示 / Chord Tone強調 / Analyzerは未対応
- Bass Pitch手動編集 / Velocity / Pattern Copyは未対応
- DrumsはKick / Snare / Closed HHのみ
- Demo Playerは仮音確認専用で、本格Synth / Mix / FXは未対応かつ原則追加しない
- Demo PlayerはPlay時点のProject Snapshotを再生し、再生中の編集は次回Playから反映
- All MIDIはブラウザの複数Download制限を受ける場合がある。その場合は個別Downloadを使う
- MIDIのCubasis / Cubase / BandLab実Import確認はAndroid/PC実機テストが必要
- AutoSaveはIndexedDB保存。Snapshot履歴は未実装
- project.json Import未実装
- Migration未実装
- Service Worker未実装のため完全なPWAオフライン対応ではない

触らない部分:
- docs/の基本思想
- PPQ=480の方針
- Module責務の分離
- 「DAWを再現しない」というプロダクト境界

最近の重要な設計判断:
- Android Chromeを主対象
- project.jsonをDemo Composer内の正本とする
- Module間は直接依存させない
- 共通Project Stateはsrc/core/project-state.jsで管理する
- ModuleはProjectオブジェクトを直接書き換えず、責務別の更新APIを通す
- State変更ごとにrevisionを増やす
- IndexedDB永続化はsrc/storageへ分離し、Project State自体は保存方式に依存させない
- AutoSaveはsrc/storage/autosave.jsへ分離し、Project Storeのsubscribe()を利用する
- AutoSaveは1.5秒Debounce + visibilitychange(hidden)即時保存
- AutoSave自体はProject Stateやrevisionを変更しない
- 手動SaveはSave Nowとして残し、Persistent Storage要求にも利用する
- 保存方式変更前の復元ポイントとして `restore/v0.1-before-indexeddb` / `restore/v0.1-before-autosave` を作成
- Chord候補計算はsrc/chord/chord-theory.jsへ分離
- Chord Moduleはproject.chords[]だけを書き換える
- v0.1のChordは4/4・PPQ480で1コード=1小節（1920 tick）
- Melody Grid処理はsrc/melody/melody-grid.js、画面制御はsrc/melody/melody-screen.jsへ分離
- v0.1 Melodyは1 Bar=8 step、1 step=240 tick、Default velocity=96
- スマホのTap領域確保のためMelodyは4 stepずつ表示する
- Melody UI変更前の復元ポイントとして `restore/v0.1-before-melody-roll` を作成
- Rhythm処理はsrc/rhythm/rhythm-grid.js、画面制御はsrc/rhythm/rhythm-screen.jsへ分離
- v0.1 Rhythmは1 Bar=16 step、1 step=120 tick
- スマホのTap領域確保のためRhythmは1 Beat=4 stepずつ表示する
- BassはChord Root優先、Chord未設定時はKey Rootを使う
- DrumsはGM準拠のKick36 / Snare38 / ClosedHH42、MIDI Channel 10
- Rhythm UI変更前の復元ポイントとして `restore/v0.1-before-rhythm-sequencer` を作成
- Demo Playerはsrc/audio/demo-player.jsへ分離しProject Stateを読み取り専用で使用
- Demo Playerは画面下部、Module Navigationの上に常設
- Demo Playerは作曲確認用の仮音のみ。高度な音作りはCubasis / Cubaseへ任せる
- Demo Player実装前の復元ポイントとして `restore/v0.1-before-demo-player` を作成
- MIDI writerはsrc/midi/midi-writer.js、Project変換/Downloadはsrc/midi/midi-export.jsへ分離
- Song.midはConductor + Chord + Melody + Bass + DrumsのSMF Type 1
- Part MIDIもConductor + 対象PartのType 1
- MIDI ChannelsはChord1 / Melody2 / Bass3 / Drums10
- Program Change / CCはv0.1では出力しない
- MIDI構造変更前の復元ポイントとして `restore/v0.1-before-midi-export` を作成
- Hub Exportからproject.jsonを手動Backupできる
- AIは完全自動作曲ではなく候補提示・先生役
- 将来のBass / Melody等の生成は「3候補 → 選択 → 修正」を基本とする
- 初期生成エンジンはAPI不要のルールベース方式を優先
- 重要仕様はCLAUDE.md / AGENTS.mdではなくdocsへ保存

現在のデータSchema:
schemaVersion 1 / PPQ 480 / 4/4固定。AutoSave追加によるschemaVersion変更なし。

最終更新:
2026-10-10
