# AI_HANDOFF

現在Version:
v0.1-dev

最新安定版:
なし。ユーザーは現状を「v0.1機能完成地点」として一旦完成扱いしたが、stable条件の実機チェックは未完了。

現在実装済み:
- Android Chrome向けPWAベースのDemo Composer
- Hub / Chord / Melody / Rhythm
- schemaVersion 1準拠の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- Hub: Project名 / BPM / Key / Scale
- Chord: ダイアトニック候補、1コード=1小節、追加 / 削除 / Clear
- Melody: 8分音符入力、Monophonic、Bar / Octave切替、Clear Bar
- Rhythm: Bass / Kick / Snare / Closed HH、16分音符、Clear、Beat Copy、Bar Copy
- Rhythm CopyでBarをまたぐBassをコピー先Chord Root / Key Rootへ追従
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- Android向けAudioContext resume / fallback
- Demo Player出力: loudness gain → compressor → limiter。単純な後段2倍ブーストは音割れのため不採用
- Loopは最後に使用しているBar終端で反復
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json手動Backup Export
- MIDI Smoke Test / Rhythm Copy Smoke Test / PR CI

重要: 「機能完成スナップショット」の復元点は以下。PR #18のmergeにより、`develop`（de51bc0）のJS / CSS / HTMLはこれと完全一致している。
- branch: `milestone/v0.1-feature-complete`
- commit: `655fc1419340c313ed2f6f727c057db35b8ae6f5`
- このスナップショットには、Melodyの縦ピアノ + 1小節8マス同時表示（`1 & 2 & 3 & 4 &`）と、Rhythmの1小節16マス同時表示（`1 e & a / 2 e & a / 3 e & a / 4 e & a`）まで含む。
- ユーザーはこの状態を「ひとまずこれで完成でいい」と承認済み。

Repository統合状況:
- PR #13 Demo Player Loop timing: merged。
- PR #14 Rhythm Beat / Bar Copy: merged。
- 統合前の `develop`（2af9bda）のコードは、milestone内の `72c5bb1`（Beat Copy完了時点）と完全一致していた。差分はPR #15 / #16のUI変更のみ。
- PR #15 / #16のconflictは内容の衝突ではなく、Rhythm CopyがdevelopではSquash、milestoneでは個別commitで入ったことによる履歴の不一致。
- そのため既存PRはrebaseせず、Claudeが `claude/v0.1-integrate-feature-complete` を最新developから作成し、`655fc14` の `index.html` / `src/` をそのまま適用した（JS / CSS / HTMLはmilestoneと完全一致。`src/rhythm/README.md` のみ16 step表示に合わせて文言更新）。
- docsはdevelopのAI_HANDOFFを土台に、milestone側のMelody 8 step記述と、未反映だったRhythm 16 step記述を統合。
- 統合前の復元点: `restore/v0.1-before-feature-complete-integration`（= 統合前develop 2af9bda）。
- 統合PR #18はmerge済み（develop: de51bc0）。PR #15 / #16 / #12は「#18で置換済み」とコメントしてclose済み（branchは残している）。
- `main` は実機確認済みstableだけを置く方針なので、まだ触らない。

Android実機で確認済み / ユーザー受入済み:
- Vercel Preview起動
- Hub / Module Navigation復旧後の基本操作
- Chordを使ったDemo Player実音再生
- Demo Player音量 / 音割れ改善後のバランス
- Loop終端を最後の使用Barへ合わせる修正
- AutoSave / Restoreテストを実施
- BandLab Androidへ個別MIDI（Chord / Melody / Bass / Drums）をImportし、再生できることを確認
- ユーザーはCubasisを所持していないため、当面の実運用は `Demo Composer → BandLab Android → 後でCubase` を暫定ルートとする

Google Drive Backup:
- `Demo Composer/latest/demo_composer_latest.zip`
- `Demo Composer/versions/v0.1-feature-complete/demo_composer_v0.1-feature-complete.zip`
- `Demo Composer/versions/v0.1-feature-complete/【ChatGPT作成】Demo_Composer_v0.1-feature-complete_RESTORE.md`
- `Demo Composer/VERSION_HISTORY.md`
- ZIPはGitHub milestone commitから作成し、Drive保存後の再取得も確認済み。

開発中:
- v0.1の機能追加は一旦停止。
- 残作業は「repo統合」と「stable前の実機確認」が中心。
- Feature-complete snapshotを壊さないことを最優先する。

次に実装:
- まず新機能を追加しない。
- Claudeが引き継ぐ場合は、最初に `README.md` / `VERSION` / `docs/AI_HANDOFF.md` / `docs/PRODUCT_SPEC.md` / `docs/ARCHITECTURE.md` / `docs/DATA_SCHEMA.md` / `CHANGELOG.md` を読む。
- AndroidでHub → Chord → Melody → Rhythm、Melody 8マス、Rhythm 16マス、Beat Copy / Bar Copy、Play / Stop / Loop / Position、AutoSaveを回帰確認する。
- PC CubaseへのMIDI Importは未確認。stable化判定に含めるなら最後に確認する。
- stable条件を満たした場合のみ `v0.1-stable` 候補を作成し、その後に `main` へ入れる。

将来候補（v0.1 stable前には実装しない）:
- Rhythm Preset
- Backing Pattern
- Melody候補生成 / Arpeggiator
- 優先順位案: `Rhythm Preset → Backing Pattern → Arpeggiator / Melody候補生成`
- 自動生成は必ず `3候補 → ユーザー選択 → 手動修正` を基本とする。

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更 / 7th / 借用和音は未対応
- Key / Scale変更時の既存Chord / Melody / Bass自動移調は未対応
- Bass Noteがある間はChord変更を拒否する
- Melodyは8分音符固定。16分音符 / Note Length / Velocity編集は未対応
- Melody縦ピアノは表示専用で、鍵盤Tap試聴は未対応
- Rhythm 16 step同時表示は、幅360px級の端末で1セル約18px幅になり44pxの推奨Tap幅を下回る。見出し文字も7px。実機回帰確認で誤タップを重点確認する（stable前にUIを変える場合は復元点を作ってから）
- Melody Gridのスタイルが `src/core/app.css` と `src/melody/melody.css` に二重定義されている（後読みのmelody.cssが優先。例: 列幅54px vs 50px）。現状は正しく動くが、stable後に整理候補
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Bass Pitch手動編集 / Velocityは未対応
- DrumsはKick / Snare / Closed HHのみ
- Demo Playerは仮音確認専用。本格Synth / Mix / FXは原則追加しない
- Demo PlayerはPlay時点のProject Snapshotを再生し、再生中編集は次回Playから反映
- All MIDIはブラウザの複数Download制限を受ける場合があるため、Androidでは個別Downloadを優先
- Song.midのBandLab Android挙動は個別MIDIほど確実ではない
- Cubasis実機確認は未実施
- PC Cubase Importは未実施
- Snapshot履歴 / project.json Import / Migration / Service Workerは未実装
- 完全オフラインPWA対応ではない

触らない部分:
- `main`（stable条件を満たすまで）
- `milestone/v0.1-feature-complete`（復元点として保持）
- docs/に記載したDemo Composerの基本思想
- PPQ=480 / 4/4固定のv0.1 Schema
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なMix / Mastering / Audio Editing / Plugin HostingはCubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- Melodyは1 Bar=8 step、1 step=240 tick、8マス同時表示
- Melody Pitch目印は縦ピアノKeyboard（白鍵 / 黒鍵 + Note名）
- Rhythmは1 Bar=16 step、1 step=120 tick、16マス同時表示
- Beat Copy / Bar Copyは残し、コピー後に編集するUXを重視する
- Rhythm cellを押して所属Beatをコピー元として扱う設計
- Chord previewはDemo Player再生時のみ1オクターブ上へ寄せ、Project/MIDI Pitchは変えない
- Bass previewはスマホスピーカーで聞き取りやすいtriangle波
- Demo Playerはloudness gain → compressor → limiter方式
- MIDI ChannelsはChord1 / Melody2 / Bass3 / Drums10
- Program Change / CCはv0.1では出力しない
- AIは完全自動作曲ではなく候補提示・分析・先生役
- 初期生成はAPI不要のルールベースを優先する
- BandLab AndroidはCubasis未所持時の暫定受け渡し先として実用確認済み
- v0.1機能完成の復元点は `milestone/v0.1-feature-complete` / `655fc1419340c313ed2f6f727c057db35b8ae6f5`

現在のデータSchema:
schemaVersion 1 / PPQ 480 / 4/4固定。変更なし。

最終更新:
2026-10-10
