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
- Melody左端の縦ピアノKeyboard（白鍵 / 黒鍵 + Note名表示）
- Melody縦ピアノUI変更前の復元ブランチ `restore/v0.1-before-melody-vertical-piano`
- Melody 8マスUI変更前の復元ブランチ `restore/v0.1-before-melody-8step-grid`
- Monophonicな8分音符Tap入力 / Clear Bar
- Melody UI大幅変更前の復元ブランチ `restore/v0.1-before-melody-roll`
- Bass / Drums Track更新API
- スマホ向けRhythm 16 Step Sequencer
- Beat 1〜4切替 / Bar移動 / Clear Bar / Clear Bass
- BassをChord RootまたはKey Rootから入力する方式
- GM準拠Kick 36 / Snare 38 / Closed HH 42
- Rhythm Beat Copy（現在BeatのBass / Drumsを次Beatへコピー。Beat 4は次BarのBeat 1へコピー）
- Rhythm Bar Copy（現在BarのBass / Drumsを次Barへコピー。Bassはコピー先Rootへ追従）
- Rhythm UI変更前の復元ブランチ `restore/v0.1-before-rhythm-sequencer`
- Web Audio APIベースの常設Demo Player
- Demo Player Play / Stop / Loop / Position表示
- Chord / Melody / Bass / Drumsの軽量プレビュー音
- Demo Player実装前の復元ブランチ `restore/v0.1-before-demo-player`
- 外部ライブラリ不要のStandard MIDI File writer
- Song.mid（Conductor + Chord + Melody + Bass + Drums）
- Chord.mid / Melody.mid / Bass.mid / Drums.mid
- SMF Type 1 / PPQ 480 / Tempo / 4/4 / Key Signature
- Hub Export PanelとAll MIDI / 個別MIDI Download
- project.json手動Backup Download
- MIDI構造変更前の復元ブランチ `restore/v0.1-before-midi-export`
- Project State変更後1.5秒のDebounced AutoSave
- アプリがhiddenになる時の即時AutoSave
- AutoSaveの保存Queueによる同時書き込み防止
- AutoSave実装前の復元ブランチ `restore/v0.1-before-autosave`
- Vercel Preview用の静的build処理 `scripts/build-static.mjs`
- Vercel設定 `vercel.json`（`npm run build` → `dist/`）
- Vercel設定変更前の復元ブランチ `restore/v0.1-before-vercel-build-config`

### 変更
- Hub表示を固定値からProject State参照へ変更
- Project名変更時にTop Barへ即時反映するよう変更
- Saveボタンを有効化
- Project Stateと永続化処理を分離
- Chord画面を固定サンプルからProject Data連動UIへ変更
- Chord進行が存在する間はKey / Scale変更を拒否し、Degree不整合を防止
- Melody画面をPlaceholderからProject Data連動の簡易Piano Rollへ変更
- MelodyのPitch表示を文字列だけの列から、白鍵 / 黒鍵が分かる縦ピアノ表示へ変更
- MelodyのBeat 1–2 / Beat 3–4切替を廃止し、`1 & 2 & 3 & 4 &` の8分音符8マスを1画面に同時表示する方式へ変更
- Melody Noteが存在する間もKey / Scale変更を拒否して整合性を保護
- Rhythm画面をPlaceholderからBass / Drums同時入力UIへ変更
- Bass Noteが存在する間はChord変更を拒否してRoot不整合を防止
- 画面下部にDemo Playerを常設し、その下にModule Navigationを維持
- HubのExportを有効化し、DAW受け渡しとProject Backupを同じPanelに集約
- 通常編集の保存を手動中心からAutoSave中心へ変更
- 手動Saveを`Save Now`として即時保存・Persistent Storage要求用途に整理
- Vercel配布時のみ静的buildを行い、ローカル開発は引き続きビルド不要とした
- Android実機向けにDemo PlayerのChord previewを1オクターブ上の仮voicingへ変更し、Bass previewをtriangle波へ変更
- Demo Playerの出力をloudness gain + compressor + limiter方式へ変更し、スマホ本体スピーカーでの聞き取りやすさを優先

### 修正
- Chord作成後のKey / Scale変更で表示とDegreeが不整合になる問題を予防
- ChordをClearした後も5小節目以降のMelody Noteへ移動できるようBar数をNote Dataから補完
- Bassが旧Chord Rootのまま見えなくなる問題を避けるため、Bass stepはstartTick単位で表示しTap時に現在Rootへ置換可能にした
- VercelでDeploymentがREADYでも公開ファイルが生成されず404になる配布設定を修正
- Android ChromeでAudioContextがsuspendedのまま無音になる可能性に対しresume処理とfallbackを追加
- 単純な後段2倍出力で発生したクリップ / 音割れを、前段loudness gain + compressor + limiter構成へ置き換えて改善
- Demo PlayerのLoop終端を常に4小節固定にせず、最後に使用している小節の終端へ合わせるよう修正
- Rhythmの16分Grid見出しがBeat切替後も `1 e & a` 固定だった表示を、選択Beatへ追従するよう修正
- Melodyを8マス化した際にJavaScriptは8列なのにCSSが4列のまま残り、Androidでレイアウトが崩れて操作不能に見える問題を8列Gridへ統一して修正

### 未対応
- Snapshot履歴
- project.json Import
- Migration
- Chord並べ替え / 長さ変更 / 7th / 借用和音
- Melody 16分音符 / Note Length / Velocity編集
- Scale表示 / Chord Tone強調 / Melody Analyzer
- Bass Pitch手動編集 / Velocity
- Open HH / Percussion / Tom
- WAV Export
- PWA Service Worker
- Android実機テストの残り項目
- Cubasis / CubaseでのMIDI Import実機確認
