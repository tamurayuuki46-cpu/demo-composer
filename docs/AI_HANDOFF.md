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
- Melody: 8分 / 16分音符の入力単位切替（16分は前半・後半表示）、Monophonic、Bar / Octave切替、Clear Bar
- Rhythm: Bass / Kick / Snare / Closed HH、16分音符、Clear、Beat Copy、Bar Copy
- Rhythm CopyでBarをまたぐBassをコピー先Chord Root / Key Rootへ追従
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- Android向けAudioContext resume / fallback
- Demo Player出力: loudness gain → compressor → limiter。単純な後段2倍ブーストは音割れのため不採用
- Loopは最後に使用しているBar終端で反復
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json手動Backup Export
- MIDI Smoke Test / Rhythm Copy Smoke Test / Melody Smoke Test / PR CI

重要: 「機能完成スナップショット」の復元点は以下。PR #18 merge時点の `develop`（de51bc0）のJS / CSS / HTMLはこれと完全一致していた。その後PR #20でMelody 16分入力切替が追加され、現在のdevelopはこのmilestoneより新しい。
- branch: `milestone/v0.1-feature-complete`
- commit: `655fc1419340c313ed2f6f727c057db35b8ae6f5`
- このスナップショットには、Melodyの縦ピアノ + 1小節8マス同時表示（`1 & 2 & 3 & 4 &`）と、Rhythmの1小節16マス同時表示（`1 e & a / 2 e & a / 3 e & a / 4 e & a`）まで含む。
- ユーザーはこの状態を「ひとまずこれで完成でいい」と承認済み。

Repository統合状況:
- PR #13 Demo Player Loop timing: merged。
- PR #14 Rhythm Beat / Bar Copy: merged。
- PR #18 feature-complete integration: merged（develop: de51bc0）。
- PR #19 AI_HANDOFF integration status update: merged（5176ab9）。
- PR #20 Melody 8分 / 16分音符入力切替: merged（develop: 6638eea）。
- PR #15 / #16 / #12は「#18で置換済み」とコメントしてclose済み（branchは残している）。
- 統合前の復元点: `restore/v0.1-before-feature-complete-integration`（= 統合前develop 2af9bda）。
- Melody 16分音符切替前の復元点: `restore/v0.1-before-melody-16th-toggle`（= PR #18 merge後develop de51bc0）。
- 現在の `develop` HEADは `6638eea1dc39dd5382d2272fa7491b80ba513ea2`。`milestone/v0.1-feature-complete` より新しい。
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
- repo統合は完了。残作業はstable前のAndroid実機回帰確認とstable条件の確定。
- Feature-complete snapshotとMelody 16分切替前の復元点を壊さないことを最優先する。

次に実装:
- まず新機能を追加しない。
- AndroidでHub → Chord → Melody → Rhythmを回帰確認する。
- Melodyは8分 / 16分切替、16分の前半・後半表示、8分/16分混在、Clear Bar、Bar / Octave切替を確認する。
- Rhythmは16マスの誤タップ有無、Beat Copy / Bar Copyを重点確認する。
- Play / Stop / Loop / Position、AutoSave / Restoreも確認する。
- 結果を `docs/ANDROID_TEST_CHECKLIST.md` に記録する。
- stable条件のMIDI確認はユーザー判断待ち。A: PC Cubaseで確認後stable / B: 条件を「BandLab・Cubasis・Cubaseのどれか」に変更。AIが勝手に決めない。
- stable条件を満たした場合のみ `v0.1-stable` 候補を作成し、その後に `main` へ入れる。
- v0.1-stable後、v0.2のChord Tone表示は実装前に1枚の仕様案を作り、ユーザー確認後に着手する。Schema変更なし。UI変更前に復元点を作る。

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
- Melodyは音符の長さが入力単位（8分=240tick / 16分=120tick）固定。Note Length（伸ばす）/ Velocity編集は未対応
- Melodyの入力単位切替はUI状態のみで保存されない（再起動すると8分に戻る。Noteは保存される）
- Melody縦ピアノは表示専用で、鍵盤Tap試聴は未対応
- Rhythm 16 step同時表示は、幅360px級の端末で1セル約17〜18px幅になり44pxの推奨Tap幅を下回る。実機回帰確認で誤タップを重点確認する（stable前にUIを変える場合は復元点を作ってから）
- Melody Gridのスタイルが `src/core/app.css` と `src/melody/melody.css` に二重定義されている。現状は正しく動くが、stable後に整理候補
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
- schemaVersion 1 / PPQ=480 / 4/4固定
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なMix / Mastering / Audio Editing / Plugin HostingはCubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- Melodyは初期状態で1 Bar=8 step、1 step=240 tick、8マス同時表示。16分切替時は1 step=120 tickで、タップ幅確保のため半小節ずつ表示（Schema変更なし）
- Melody 8分 / 16分混在時もMonophonicを維持し、Note重なりを避ける
- Melody入力単位はUI状態のみで保存しない
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
