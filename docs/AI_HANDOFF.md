# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。v0.1は機能完成地点とAndroid回帰確認の一部まで実施したが、`main` へのstable統合は行っていない。ユーザー判断により復元点を残したままv0.2開発へ進んだ。

現在実装済み:
- Android Chrome向けPWAベースのDemo Composer
- Hub / Chord / Melody / Rhythm
- schemaVersion 2準拠の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- schemaVersion 1 → 2 Migration
- Migration前ProjectをIndexedDB `meta` storeへ退避
- Hub: Project名 / BPM / Key / Scale
- Chord: ダイアトニック7候補、基準音C〜B選択、Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug、1コード=1小節、追加 / 削除 / Clear
- Chord Qualityの共通構成音定義をDemo Player / MIDI Exportで共有
- Melody: 8分 / 16分音符の入力単位切替（16分は前半・後半表示）、Monophonic、Bar / Octave切替、Clear Bar
- Rhythm: Bass / Kick / Snare / Closed HH、16分音符、Clear、Beat Copy、Bar Copy
- Rhythm CopyでBarをまたぐBassをコピー先Chord Root / Key Rootへ追従
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json手動Backup Export
- MIDI / Rhythm / Melody / Chord Smoke Test
- JavaScript Syntax Check / Static BuildをPR CI対象化

v0.1復元点:
- `milestone/v0.1-feature-complete` / `655fc1419340c313ed2f6f727c057db35b8ae6f5`
- `restore/v0.1-before-feature-complete-integration`
- `restore/v0.1-before-melody-16th-toggle`
- `restore/v0.1-before-v0.2-chord-types` / v0.2 Schema変更前の復元点

Repository状況:
- PR #18 feature-complete integration: merged
- PR #19 AI_HANDOFF integration status update: merged
- PR #20 Melody 8分 / 16分音符入力切替: merged
- PR #21 ChatGPT引き継ぎ同期: merged
- PR #22 Android回帰確認1回目の記録: merged
- PR #23 `v0.2-dev: add root-based chord qualities`: open。ChatGPT作業branch `chatgpt/v0.2-chord-types` → `develop`
- `main` は変更しない
- `milestone/v0.1-feature-complete` は変更しない

Android実機で確認済み / ユーザー受入済み:
- Vercel Preview起動
- Hub / Chord / Melody / Rhythm切替
- Chordを使ったDemo Player実音再生
- Demo Player音量 / 音割れ改善後のバランス
- Play / Stop / Loop
- Loop終端を最後の使用Barへ合わせる修正
- AutoSave / Restoreテスト
- Melody 8分 / 16分切替
- Melody 16分の前半 / 後半切替
- Rhythm 16 stepのタップ性
- BandLab Androidへ個別MIDI（Chord / Melody / Bass / Drums）をImportして再生

v0.2 Chord QualityはPR #23のためAndroid実機確認前。merge後に以下を確認する:
- 基準音SelectがC〜Bで切替可能
- 9種類のQualityを追加可能
- Chord進行カードの表示
- Demo Playerで各Qualityが鳴る
- Chord.mid / Song.midへQuality構成音が反映される
- schemaVersion 1保存Projectが消えずにv2へMigrationされる

Google Drive Backup:
- `Demo Composer/latest/demo_composer_latest.zip`
- `Demo Composer/versions/v0.1-feature-complete/demo_composer_v0.1-feature-complete.zip`
- `Demo Composer/versions/v0.1-feature-complete/【ChatGPT作成】Demo_Composer_v0.1-feature-complete_RESTORE.md`
- `Demo Composer/VERSION_HISTORY.md`

開発中:
- v0.2 Chord Quality拡張（PR #23）
- Schema v2 MigrationのCI / Preview確認

次に実装:
1. PR #23のCIを通す
2. ユーザーがPR #23をmerge
3. Android実機でChord Quality 9種類とMigrationを回帰確認
4. 問題なければv0.2の次機能としてChord Tone表示の仕様案を1枚作る
5. Chord Tone表示はSchema変更なし。UI変更前に復元点を作る
6. その後Melody Analyzerを検討

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更は未対応
- 借用和音を「目的別候補」として整理する支援UIは未対応
- Key / Scale変更時の既存Chord / Melody / Bass自動移調は未対応
- Bass Noteがある間はChord変更を拒否する
- Melody Note Length / Velocity編集は未対応
- Melody入力単位切替はUI状態のみで保存されない
- Melody縦ピアノは表示専用で、鍵盤Tap試聴は未対応
- Melody Gridのスタイルが `src/core/app.css` と `src/melody/melody.css` に二重定義。stable後に整理候補
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Bass Pitch手動編集 / Velocityは未対応
- DrumsはKick / Snare / Closed HHのみ
- Demo Playerは仮音確認専用。本格Synth / Mix / FXは原則追加しない
- All MIDIはブラウザの複数Download制限を受ける場合があるため、Androidでは個別Downloadを優先
- Cubasis実機確認 / PC Cubase Importは未実施
- Snapshot履歴 / project.json Import / Service Workerは未実装
- 完全オフラインPWA対応ではない

触らない部分:
- `main`（stable方針が決まるまで）
- `milestone/v0.1-feature-complete`
- PPQ=480 / 4/4固定
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なMix / Mastering / Audio Editing / Plugin HostingはCubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- v0.2 Chord Qualityは候補を全音×全Qualityで一度に並べず、「基準音を1つ選ぶ → 9種類から選ぶ」としてスマホUIを単純化
- ダイアトニック7候補は初心者導線として残す
- Chord Quality定義はcoreへ集約し、Chord / Demo Player / MIDIで共有
- schemaVersion 1 → 2はProject構造を変えずQuality許可値のみ拡張
- Migration前ProjectはIndexedDBへ退避してから変換
- Melodyは8分 / 16分混在時もMonophonicを維持
- Rhythmは1 Bar=16 step、16マス同時表示
- Beat Copy / Bar Copyは残し、コピー後に編集するUXを重視
- AIは完全自動作曲ではなく候補提示・分析・先生役

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented。

最終更新:
2026-10-10
