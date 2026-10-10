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
- Melody: 8分 / 16分切替、Monophonic、Bar / Octave切替、Clear Bar、縦ピアノKeyboard
- Rhythm: Bass（音程選択: ルート / 3度 / 5度 / 7度 / オクターブ上 / ルート下）/ Kick / Snare / Closed HH、16 step、Beat Copy、Bar Copy（Bassは音程関係を保ってコピー先ルートへ追従）
- Rhythm Drum Preset: 8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH
- Arrange: Section Template / 小節増減 / 追加削除 / Sectionコピー / Section再生 / Melody・Rhythm見出し表示 / MIDI Marker
- Sound Sketch Lite: Chord / Melody / Bassの仮音色Preset + Toneタグ
- Chord Sound: Keys / Pad / Piano
- Melody Sound: Lead / Keys / Pluck
- Bass Sound: Soft Bass / Synth Bass / Deep Bass
- Sound Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive
- Sound選択は `project.instruments[]` に保存し、AutoSave / Undo / Redo対象
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- Demo PlayerのChord / Melody / BassはSound Preset / Toneに応じてwaveform / low-pass filter / attack / release / gainを軽量変更
- ArrangeのSection単体再生でもSound設定を保持
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- Sound Sketch LiteはMIDI Program Change / CCを出力しない
- project.json手動Backup Export / 読み込み（検証・Migration・確認・Undo可。`src/storage/project-import.js`）
- Vercel静的Build
- GitHub Pages Fallback（developから公開）
- Cloudflare Pages Fallback導入手順を `docs/CLOUDFLARE_PAGES.md` に追加済み。Dashboard接続は別途必要

Repository統合状況:
- v0.2基礎機能統合commit: `c21bb9b0b343e8dc807c6fd884ceaf670c48cd43`
- Chord Preset統合commit: `5f0c6cb3d964ccd2d0ba93ed3bb43d81ecef6eb3`
- Hub Key変更修正統合commit: `5b7f43003a64281bef051d74590e7badb66f5fb7`
- Diatonic Fan UI統合commit: `77376bf75929618266171ea7da34628828b99ca4`
- PR #36 Undo / Redo: merged
- PR #37 Undo handoff docs: merged
- PR #38 Arrange / Section: merged
- PR #25 Cloudflare Pages fallback plan: merged（docs only）
- PR #39 Sound Sketch Lite旧実装: develop先行更新と競合したためclose。マージしていない。branchは履歴として保持
- PR #40 Sound Sketch Lite + Arrange / Undo安全統合: merged
- Sound Sketch Lite統合merge commit: `5f18167d9037f96490a4c929a56a0dbd5271da5d`
- GitHub Pages Sound Sketch Lite版 Build / Deploy: success
- GitHub Pages公開URL: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- v0.2統合前復元点: `restore/v0.1-before-v0.2-integration`
- Chord Preset追加前復元点: `restore/v0.2-before-chord-presets`
- Key変更修正前復元点: `restore/v0.2-before-key-change-fix`
- Diatonic Fan UI変更前復元点: `restore/v0.2-before-diatonic-fan-ui`
- Undo追加前復元点: `restore/v0.2-before-undo`
- Arrange Section追加前復元点: `restore/v0.2-before-arrange-sections`
- Sound Sketch Lite追加前復元点: `restore/v0.2-before-sound-sketch-lite`
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
- Melody grid smoke test: success
- Chord types smoke test: success
- Chord preset smoke test: success
- Hub key-change smoke test: success
- Diatonic fan smoke test: success
- History (Undo / Redo) smoke test: success
- Section (Arrange) smoke test: success
- Sound Sketch smoke test（Sound変更Undo / Redo含む）: success
- Static build: success
- GitHub Pages Build / Deploy: success

開発中:
- Sound Sketch Liteのdevelop統合 / GitHub Pages公開は完了
- Arrange / Undo / Soundを含む6 Module構成のAndroid実機回帰確認が次の作業
- Cloudflare Pagesは導入手順のみRepositoryへ追加済み。Cloudflare Dashboard側のGitHub接続・Pages Project作成は未実施

次に実装 / 確認:
1. GitHub Pages公開版で下部ナビが Hub / Chord / Melody / Rhythm / Arrange / Sound の6つ表示され、Androidで横スクロールや文字切れがないことを確認
2. Sound画面が開き、Chordで Keys / Pad / Piano を切り替えるとDemo Playerの音が変わることを確認
3. Melodyで Lead / Keys / Pluck の差を確認
4. Bassで Soft Bass / Synth Bass / Deep Bass の差を確認
5. Natural / Bright / Soft / Warm / Dark / Airy / Aggressive のTone差を確認
6. Sound変更後に `↶` / `↷` でPreset / Toneが戻る・進むことを確認
7. Sound変更後に再読み込みしてAutoSave / Restoreされることを確認
8. ArrangeからSection単体再生してもSound設定が反映されることを確認
9. Hub / Chord / Melody / Rhythm / Arrange / Undo / Demo Playerの回帰確認
10. Song.mid / Part MIDIが従来どおり出力でき、Sound選択でNote内容が変わらないことを確認
11. 問題なければChord Tone表示の仕様案を作る
12. その後Melody Analyzerを検討

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更は未対応
- 借用和音を目的別に整理した支援UIは未対応
- Chord Presetは初期6種類のみ。Scaler / Melody Sauce / Cubase / 書籍等からの分類拡張は未対応
- Scale変更時の既存Chord / Melody / Bass自動変換は未対応。Harmony依存データがある場合は変更を拒否
- Key移調でMIDI Note範囲外になる場合はKey変更を拒否
- Bass Noteがある間はChord変更を拒否
- Melody Note Length / Velocity編集は未対応
- Melody入力単位はUI状態のみで保存されない
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Rhythm 16 stepは狭い端末でセル幅が小さい
- Drum PresetはKick / Snare / Closed HHのみ
- Arrange Sectionは名前変更UIなし。後ろにコードがある場合、小節増加を安全のため拒否することがある
- Undo履歴は保存されない。再読み込みで空になる
- Sound Sketch LiteはWeb Audio oscillatorベースの方向性確認用。最終音色ではない
- SoundはChord / Melody / Bassのみ。Drums音色変更は未対応
- Soundを単独で鳴らす専用Preview Buttonは未実装。曲データをDemo Playerで再生して確認する
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
- Diatonic FanはProject Dataを変更せず表示レイヤーとして実装する
- Key変更はCore Project StateのGlobal OperationとしてChord / Melody / BassをAtomicに移調する
- Arrange Sectionの増減 / コピーもCore Global OperationとしてChord / Melody / Bass / Drumsをまとめて扱う
- Undo / RedoはModule別にせずProject全体で1本にする
- Sound Sketch Liteは本来v0.4予定のうち「音色の方向性を決める」最小部分だけv0.2へ先行導入する
- Sound Moduleだけが `project.instruments[]` を更新し、Audio ModuleはSnapshotを読み取る。Module同士は直接依存しない
- Sound Preset定義は `src/core/sound-presets.js` に集約し、Sound UIとDemo Playerで共有する
- Sound選択は既存 `instruments[]` を使うためschemaVersion 2を維持し、追加Migrationを行わない
- Sound変更は通常編集としてUndo / Redo / AutoSave対象にする
- SoundはDemo Playerのwaveform / filter / envelope / gainだけを軽量変更し、MIDI Note / Chord / Rhythm Dataを変更しない
- MIDI Program Change / CCは現時点では出力しない。最終音源はCubasis / Cubase / Plugin側で差し替える
- Drums音色変更、本格Synth Parameter、FX Rack、MixerはSound Sketch Liteに入れない
- Vercelを残し、GitHub Pagesを公開Fallbackとして運用する。Cloudflare Pagesは追加Fallback候補として手順のみ用意

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented。Arrangeは既存 `structure.sections[]`、Sound Sketch Liteは既存 `instruments[]` を利用する。Sound entryは `{ part, preset, tone }`。Chord Preset / Drum Preset / Key移調 / Diatonic Fan / Undo履歴は専用Schemaを追加しない。

最終更新:
2026-10-10
