# CHANGELOG

## v0.2-dev
更新日: 2026-10-10

### 追加
- Melody / Bassの音の長さ指定（16分〜2分・付点。長い音は途中のマスも表示。小節の終わり・次の音を超えない）。`durationTick` を使うためSchema変更なし
- 共通の `src/core/note-placement.js`（Melody / Rhythmから使う純粋関数）
- Note Length Smoke Test（`npm run test:melody` に含む、CI対象）
- 音の長さ追加前の復元ブランチ `restore/v0.2-before-note-length`
- Rhythm: Bassの半音ずらし（±6）と、主役（ルート系・5度）/ 飾り（3度・7度・ずらした音）の色分け表示（見た目のみ、Schema変更なし）
- Bass半音ずらし前の復元ブランチ `restore/v0.2-before-bass-shift`
- Rhythm: Bassの音程選択（ルート / 3度 / 5度 / 7度 / オクターブ上 / ルート下）。16マスはそのまま、ルート以外のベースラインを入力できる（Schema変更なし）
- Bass Pitch Smoke Test（`npm run test:rhythm` に含む、CI対象）
- Bass音程選択前の復元ブランチ `restore/v0.2-before-bass-pitch`
- project.json読み込み（Hub > Export > 読み込み。検証・schema v1移行・確認ダイアログ・Undo可）
- project.json Import Smoke Test（`npm run test:import`、CI対象）
- Import実装前の復元ブランチ `restore/v0.2-before-project-import`
- 曲の構成（Arrange / Section）: 叩き台3種類、小節数の増減、追加・削除、Section間コピー、Section単位の再生、Melody / Rhythm見出しへのSection表示、MIDI Section Marker（Schema変更なし）
- Section Smoke Test（`npm run test:section`、CI対象）
- Section実装前の復元ブランチ `restore/v0.2-before-arrange-sections`
- Undo / Redo（Project全体で1本の編集履歴、最大50操作、画面上部の `↶` `↷`）
- Edit History Smoke Test（`npm run test:history`、CI対象）
- Undo実装前の復元ブランチ `restore/v0.2-before-undo`
- Sound Sketch Lite: Chord / Melody / Bass の音色Preset変更
- Sound Preset: Chord `Keys / Pad / Piano`、Melody `Lead / Keys / Pluck`、Bass `Soft Bass / Synth Bass / Deep Bass`
- Sound Tone: `Natural / Bright / Soft / Warm / Dark / Airy / Aggressive`
- Sound Sketch Smoke Test（`npm run test:sound`、Undo / RedoもCI確認）
- Sound Sketch Lite追加前の復元ブランチ `restore/v0.2-before-sound-sketch-lite`
- Chordの基準音Select（C〜B）
- 基準音ごとの9種類のChord Quality: Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
- 共通Chord Quality定義 `src/core/chord-qualities.js`
- schemaVersion 2
- schemaVersion 1 → 2 Migration
- Migration前ProjectをIndexedDB `meta` storeへ退避する処理
- Chord Quality Smoke Test（`npm run test:chord`、CI対象）
- Chord Preset 6種類（Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行）
- Chord Preset Smoke Test（`npm run test:chord-presets`、CI対象）
- Rhythm Drum Preset 6種類（8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH）
- Rhythm Preset Smoke Test（`npm run test:rhythm-presets`、CI対象）
- Hub Key変更の回帰テスト（`npm run test:key-change`、CI対象）
- Diatonic Fan配置Smoke Test（`npm run test:diatonic-fan`、CI対象）
- v0.2統合前の復元ブランチ `restore/v0.1-before-v0.2-integration`
- Chord Preset追加前の復元ブランチ `restore/v0.2-before-chord-presets`
- Key変更修正前の復元ブランチ `restore/v0.2-before-key-change-fix`
- ダイアトニック扇形UI変更前の復元ブランチ `restore/v0.2-before-diatonic-fan-ui`

### 変更
- Rhythm Copy: 長いBassがコピー先の範囲からはみ出さないよう収め、コピー先に食い込む前の音を短くする
- BarをまたぐBass Copyを、全ノートをルートへそろえる動作から、音程関係を保ってコピー先のルートへ移す動作へ変更
- Bottom Navigationを Hub / Chord / Melody / Rhythm / Arrange / Sound の6 Module構成へ拡張
- Sound選択を既存 `project.instruments[]` に保存し、AutoSaveとProject全体Undo / Redoの対象にした
- Demo PlayerのChord / Melody / Bass仮音をSound Preset / Toneに応じてwaveform / low-pass filter / attack / release / gain変更する方式へ拡張
- ArrangeのSection単体再生でも同じSound設定を保持する
- Sound Sketch LiteはMIDI Note / Chord Data / Rhythm Dataを変更せず、MIDI Program Change / CCも出力しない
- Chord画面はダイアトニック7候補を残しつつ、任意の基準音から9種類のQualityを追加できる構成へ変更
- Chord画面のダイアトニック7候補を2列Gridから五度圏の扇形ビューへ変更
- Majorは `IV / ii ← I / vi → V / iii` + `vii°`、Minorは `VI / iv ← III / i → VII / v` + `ii°` として配置
- 扇形UIは既存 `data-add-chord` Buttonへ表示classだけを付与し、Chord追加ロジック / Project Data / MIDIは変更しない
- Chord画面に `Chord Preset` select + `適用` を追加し、現在Key / Scaleへ自動変換した進行を通常Chord Dataとして展開する方式にした
- Chord Preset適用後も個別コード追加 / 削除 / Clearで自由に修正できるようにした
- Chord QualityをDemo Player / Chord.mid / Song.midへ共通の構成音定義で反映
- Rhythmに `Drum Preset` select + `適用` を追加し、現在BarのKick / Snare / Closed HHだけを置換する方式にした
- Preset適用後も通常の16 stepをTapして自由に修正できるようにした
- HubのKey変更は、Chord root / Melody pitch / Bass pitchを同じ最短半音幅でAtomicに移調し、Drumsは変更しない方式へ変更
- Scale変更はChord / Melody / Bassが存在する場合は引き続き拒否し、意図しないMajor/Minor変換を行わない
- `VERSION` / 画面内Version / package versionをv0.2-devへ更新
- DATA_SCHEMAをschemaVersion 2へ更新
- CIでSyntax / MIDI / Rhythm Copy / Rhythm Preset / Melody / Chord / Chord Preset / Hub Key Change / Diatonic Fan / Undo / Arrange / Sound Sketch / Static Buildを確認する構成へ更新

### 修正
- 旧schemaVersion 1の保存Projectをv0.2でそのまま破棄せず、自動Migrationして利用できるようにした
- PR #23 / #24がGitHub Pages統合後のdevelopと競合するため、現在developから統合branchを作って安全に再統合した
- Sound Sketch作業中にUndo / Arrangeがdevelopへ先行統合されたため、旧PR #39をマージせず最新developから統合branchを作り直し、Arrange / Undoを保持したままSoundを再統合した
- Chord / Melody / BassがあるとHubのKey Selectが元の値へ戻り、Keyを変更できなかった問題を修正
- Key移調でMIDI Note 0〜127を外れる場合は更新全体を中止し、元Projectを維持するようにした

### 未対応
- Chord並べ替え / 長さ変更
- 借用和音を目的別に整理した候補
- Chord Preset Libraryの追加分類（Scaler / Melody Sauce / Cubase / 書籍等）
- Chord Tone強調
- Melody Analyzer
- Snapshot履歴 / project.json Import
- Arrange / Song Structureの実制作検証・正式整理
- Drums音色変更
- 本格Sound Sketch整理（詳細Synth / FX / Mixerは原則追加しない）

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
- Melodyの入力単位切替（8分音符 / 16分音符）。16分は前半 / 後半に分けて表示
- Melody 16分切替前の復元ブランチ `restore/v0.1-before-melody-16th-toggle`
- Melody Grid Smoke Test（`npm run test:melody`、CI対象）
- Rhythm 16マスUI変更前の復元ブランチ `restore/v0.1-before-rhythm-16step-grid`
- feature-complete統合前の復元ブランチ `restore/v0.1-before-feature-complete-integration`
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
- GitHub Pages Fallback用Workflow `.github/workflows/pages.yml`（`develop` → `npm run build` → `dist/`）
- GitHub Pages運用資料 `docs/GITHUB_PAGES.md`
- GitHub Pages導入前の復元ブランチ `restore/v0.1-before-github-pages`

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
- Rhythmの1 Beat=4 step表示を廃止し、`1 e & a / 2 e & a / 3 e & a / 4 e & a` の16マスを1画面に同時表示する方式へ変更
- RhythmのBeat 1〜4ボタンを表示切替からCopy Beatのコピー元選択へ変更（セルTapでもBeatを選択）
- `milestone/v0.1-feature-complete`（655fc14）のコードを新しい統合branch経由で `develop` へ反映（PR #15 / #16を置き換え）
- Melodyで8分と16分を混在させても重ならないよう、既存Noteを短縮 / 新Noteの長さを制限するMonophonic処理へ拡張（8分のみの従来動作は変更なし）
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
- Vercelを削除せず、GitHub Pagesを第二公開先として追加する方針にした

### 修正
- Chord作成後のKey / Scale変更で表示とDegreeが不整合になる問題を予防
- ChordをClearした後も5小節目以降のMelody Noteへ移動できるようBar数をNote Dataから補完
- Bassが旧Chord Rootのまま見えなくなる問題を避けるため、Bass stepはstartTick単位で表示しTap時に現在Rootへ置換可能にした
- VercelでDeploymentがREADYでも公開ファイルが生成されず404になる配布設定を修正
- Android ChromeでAudioContextがsuspendedのまま無音になる可能性に対しresume処理とfallbackを追加
- 単純な後段2倍出力で発生したクリップ / 音割れを、前段loudness gain + compressor + limiter構成へ置き換えて改善
- Demo PlayerのLoop終端を常に4小節固定にせず、最後に使用しているBarの終端へ合わせるよう修正
- Rhythmの16分Grid見出しがBeat切替後も `1 e & a` 固定だった表示を、選択Beatへ追従するよう修正
- Melody 8マス化後にCSSが4列のまま残っていた不整合を修正
- Melody説明文内の未エスケープBacktickでJavaScript Module全体がParse ErrorになりHubから操作不能になった問題を修正

### 未対応
- Snapshot履歴
- project.json Import
- Chord並べ替え / 長さ変更 / 借用和音
- Melody Note Length / Velocity編集
- Scale表示 / Chord Tone強調 / Melody Analyzer
- Bass Pitch手動編集 / Velocity
- Open HH / Percussion / Tom
- WAV Export
- PWA Service Worker
- Android実機テストの残り項目
- Cubasis / CubaseでのMIDI Import実機確認
