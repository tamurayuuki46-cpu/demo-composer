# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。v0.1機能完成地点は復元可能だが、`main` へのstable統合は未実施。

現在実装済み:
- Android Chrome向けDemo Composer
- Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite
- schemaVersion 2準拠の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- schemaVersion 1 → 2 Migration / Migration前Project退避
- Undo / Redo: Project全体で1本、最大50操作、メモリのみ、画面上部 `↶` / `↷`
- Hub: Project名 / BPM / Key / Scale
- Hub Key変更: Chord root / Melody pitch / Bass pitchを最短半音幅でAtomicに自動移調、Drumsは変更しない
- Key移調でMIDI Note 0〜127を外れる場合は更新全体を中止
- Scale変更はChord / Melody / Bassがある場合は安全のため拒否
- Chord: ダイアトニック7候補 + 基準音C〜B + Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
- ダイアトニック7候補は五度圏の扇形UI。Major: 左 IV / ii、中央 I / vi、右 V / iii、下 vii°。Minor: 左 VI / iv、中央 III / i、右 VII / v、下 ii°
- Chord Preset: Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行
- Chord Backing Pattern: Block / 8分刻み / Arpeggio / Syncopation
- Backing Patternは `project.instruments[]` の `part: chord-backing` entryへ保存し、AutoSave / Undo / Redo対象
- Backing Pattern未設定ProjectはBlockへFallback
- Backing PatternはDemo Playerと `Chord.mid / Song.mid` のChord Track Note配置へ反映。Chord Data自体は変更しない
- Melody: 8分 / 16分切替、音の長さ指定（Bassも同様。`src/core/note-placement.js`）、Monophonic、Bar / Octave切替、Clear Bar、縦ピアノKeyboard
- Rhythm: Bass（音程選択: ルート / 3度 / 5度 / 7度 / オクターブ上 / ルート下、半音ずらし±6、長さ指定）/ Kick / Snare / Closed HH、16 step、Beat Copy、Bar Copy
- Rhythm Drum Preset: 8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH
- Chord 次のコード候補3つ（`chord-next.js`）/ Rhythm Bass候補3つ（`bass-candidates.js`）。どちらもタップで確定、Schema変更なし
- Melody Chord Tone強調（`chordTonePitchClasses`、見た目のみ）
- Melody Copy Bar / Copy 2小節（`copyMelodyBars`）、Rhythm Drum PresetのSection一括適用（`applyDrumPresetToBars`）、Arrange骨子の進み具合表示（`sectionProgress`、Schema変更なし）
- Arrange: Section Template / 小節増減 / 追加削除 / Sectionコピー / Section再生 / Melody・Rhythm見出し表示 / MIDI Marker
- Sound Sketch Lite: Chord / Melody / Bassの仮音色Preset + Toneタグ
- Chord Sound: Keys / Pad / Piano
- Melody Sound: Lead / Keys / Pluck
- Bass Sound: Soft Bass / Synth Bass / Deep Bass
- Sound Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive
- Sound選択は `project.instruments[]` の `part: chord / melody / bass` entryへ保存し、AutoSave / Undo / Redo対象
- Demo Player: Play / Stop / Loop / Position、パート聴き分け（Chord / Melody / Bass / DrumsのMute / Solo。画面のみ）
- Demo PlayerのChord / Melody / BassはSound Preset / Toneに応じてwaveform / low-pass filter / attack / release / gainを軽量変更
- Backing Patternで生成したChord音もChord busへ送り、Chord Mute / Soloに従う
- ArrangeのSection単体再生でもSound / Backing設定を保持
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- Sound Sketch LiteはMIDI Program Change / CCを出力しない
- Hub AI相談: 相談用テキストのコピー（`src/hub/consult-text.js`。API送信なし）
- project.json手動Backup Export / 読み込み（検証・Migration・確認・Undo可。`src/storage/project-import.js`）
- 静的Build（`npm run build`。Vercel設定は残すが自動配信は停止）
- GitHub Pages公開（developから公開。現在の公開確認先）
- Cloudflare Pages Fallback導入手順を `docs/CLOUDFLARE_PAGES.md` に追加済み。Dashboard接続は別途必要

Repository統合状況:
- v0.2基礎機能統合commit: `c21bb9b0b343e8dc807c6fd884ceaf670c48cd43`
- Chord Preset統合commit: `5f0c6cb3d964ccd2d0ba93ed3bb43d81ecef6eb3`
- Hub Key変更修正統合commit: `5b7f43003a64281bef051d74590e7badb66f5fb7`
- Diatonic Fan UI統合commit: `77376bf75929618266171ea7da34628828b99ca4`
- PR #36 Undo / Redo: merged
- PR #38 Arrange / Section: merged
- PR #40 Sound Sketch Lite + Arrange / Undo安全統合: merged
- PR #45 Backing Pattern旧統合: develop先行更新と競合したため未mergeでclose。branchは履歴として保持
- PR #50 Backing Pattern最終統合: merged
- Backing Pattern統合merge commit: `0f1b4fd20b0fd5795fa0ae55174639fc24e4dad1`
- GitHub Pages Backing Pattern版 Build / Deploy: success
- GitHub Pages公開URL: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- v0.2統合前復元点: `restore/v0.1-before-v0.2-integration`
- Chord Preset追加前復元点: `restore/v0.2-before-chord-presets`
- Key変更修正前復元点: `restore/v0.2-before-key-change-fix`
- Diatonic Fan UI変更前復元点: `restore/v0.2-before-diatonic-fan-ui`
- Undo追加前復元点: `restore/v0.2-before-undo`
- Arrange Section追加前復元点: `restore/v0.2-before-arrange-sections`
- Sound Sketch Lite追加前復元点: `restore/v0.2-before-sound-sketch-lite`
- Backing Pattern最終統合前復元点: `restore/v0.2-before-backing-pattern-final`
- `main` はstable専用。変更しない
- `milestone/v0.1-feature-complete` は復元点として保持

Android実機で確認済み / ユーザー受入済み:
- Hub / Chord / Melody / Rhythm Navigation（Sound / Arrange追加前）
- Melody 8分 / 16分切替
- Melody 16分の前半 / 後半切替
- Rhythm 16 stepの基本Tap操作
- Demo Player Play / Stop / Loop
- Chordを使ったDemo Player実音再生
- Demo Player音量 / 音割れ改善後のバランス
- AutoSave / Restore
- BandLab Androidへ個別MIDIをImportして再生
- GitHub Pages公開URLがAndroidで表示できること

v0.2 CI確認済み:
- JavaScript syntax check: success
- MIDI smoke test: success
- Rhythm copy smoke test: success
- Rhythm preset smoke test: success
- Melody grid / Note Length smoke test: success
- Chord types smoke test: success
- Chord preset smoke test: success
- Backing Pattern smoke test（Pattern生成 / Undo / Redo / MIDI反映）: success
- Hub key-change smoke test: success
- Diatonic fan smoke test: success
- History (Undo / Redo) smoke test: success
- Section (Arrange) smoke test: success
- Sound Sketch smoke test: success
- Part Switch (Mute / Solo) smoke test: success
- AI Consult Text smoke test: success
- project.json Import smoke test: success
- Static build: success
- PR #50 CI: success
- GitHub Pages Backing Pattern版 Build / Deploy: success

開発中:
- Backing Patternのdevelop統合 / GitHub Pages公開は完了
- Arrange / Undo / Sound / Backingを含むAndroid実機回帰確認が次の作業
- Cloudflare Pagesは導入手順のみRepositoryへ追加済み。Cloudflare Dashboard側のGitHub接続・Pages Project作成は未実施

次に実装 / 確認:
1. GitHub Pages公開版で Chord → Backing Pattern が表示されることを確認
2. Block / 8分刻み / Arpeggio / Syncopation を切り替え、Demo Playerで違いが聞こえることを確認
3. Backing変更後に `↶ / ↷` で戻る / 進むことを確認
4. Backing変更後に再読み込みしAutoSave / Restoreされることを確認
5. Demo PlayerのChord Mute / SoloがBacking Patternにも効くことを確認
6. ArrangeからSection単体再生しても同じBacking Patternで鳴ることを確認
7. `Chord.mid / Song.mid` をBandLab / Cubasis等へImportし、8分刻み / Arpeggio等のNote配置が反映されることを確認
8. Hub / Chord / Melody / Rhythm / Arrange / Sound / Undo / Import / AI相談の回帰確認
9. 問題なければChord Tone表示の仕様案を作る
10. その後、Bass候補生成 → Section Energyの順で曲の骨子支援を検討

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更は未対応
- 借用和音を目的別に整理した支援UIは未対応
- Chord Presetは初期6種類のみ。Scaler / Melody Sauce / Cubase / 書籍等からの分類拡張は未対応
- Backing Patternは曲全体で1種類。Section別 / Bar別Pattern指定、詳細Step編集は未対応
- Backing Patternは4種類の叩き台のみ。DAW級Pattern Sequencer / Arpeggiatorは作らない方針
- Scale変更時の既存Chord / Melody / Bass自動変換は未対応。Harmony依存データがある場合は変更を拒否
- Key移調でMIDI Note範囲外になる場合はKey変更を拒否
- Bass Noteがある間はChord Data変更を拒否（Backing Pattern変更は可能）
- Melody Velocity編集は未対応。音の長さは指定できるが、長さを後から端をドラッグして変える操作は未対応
- Melody入力単位はUI状態のみで保存されない
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Rhythm 16 stepは狭い端末でセル幅が小さい
- Drum PresetはKick / Snare / Closed HHのみ
- Arrange Sectionは名前変更UIなし。後ろにコードがある場合、小節増加を安全のため拒否することがある
- Undo履歴は保存されない。再読み込みで空になる
- Sound Sketch LiteはWeb Audio oscillatorベースの方向性確認用。最終音色ではない
- SoundはChord / Melody / Bassのみ。Drums音色変更は未対応
- Soundを単独で鳴らす専用Preview Buttonは未実装
- 6 Module Bottom Navigationの実機可読性・誤タップは要確認
- Snapshot履歴 / Service Workerは未実装
- Cubasis実機確認 / PC Cubase Importは未実施

触らない部分:
- `main`
- `milestone/v0.1-feature-complete`
- PPQ=480 / 4/4固定
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なSynth / Mix / Mastering / Audio Editing / Plugin HostingはCubasis / Cubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- ダイアトニック7候補は五度圏の関係が見える扇形UIを優先する
- Key変更はCore Project StateのGlobal OperationとしてChord / Melody / BassをAtomicに移調する
- Arrange Sectionの増減 / コピーもCore Global OperationとしてChord / Melody / Bass / Drumsをまとめて扱う
- Undo / RedoはModule別にせずProject全体で1本にする
- Backing Patternは独立Moduleを増やさずChord Module内の補助機能にする
- Backing Pattern定義は `src/core/backing-patterns.js` に集約し、Chord UI / Demo Player / MIDI Exportで共有する
- Backing PatternはChord Dataを変更せず、`instruments[]` の `part: chord-backing` entryへ保存する
- `instruments[]` は共通Containerだが責任をpart単位で分ける。Soundは `chord / melody / bass`、Chordは `chord-backing` を更新し、互いのentryを消さない
- Backing Patternは曲の骨子を決める4Presetに限定し、詳細Pattern Sequencer / DAW級Arpeggiatorは追加しない
- Backing PatternはCubasis / Cubaseへ渡せるようChord MIDIのNote配置へ反映する
- Sound Sketch Liteは本来v0.4予定のうち「音色の方向性を決める」最小部分だけv0.2へ先行導入する
- Sound Preset定義は `src/core/sound-presets.js` に集約し、Sound UIとDemo Playerで共有する
- Sound / Backingは既存 `instruments[]` を使うためschemaVersion 2を維持し、追加Migrationを行わない
- MIDI Program Change / CCは現時点では出力しない。最終音源はCubasis / Cubase / Plugin側で差し替える
- Vercelの自動配信は停止。公開確認はGitHub Pagesを使う。Cloudflare Pagesは追加Fallback候補として手順のみ用意

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented。Arrangeは既存 `structure.sections[]` を利用。Sound entryは `{ part: "chord|melody|bass", preset, tone }`。Backing entryは `{ part: "chord-backing", preset: "block|eighth|arpeggio|syncopation", tone: "natural" }`。Chord Preset / Drum Preset / Key移調 / Diatonic Fan / Undo履歴は専用Schemaを追加しない。

最終更新:
2026-10-10
