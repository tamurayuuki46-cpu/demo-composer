# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。v0.1機能完成地点は復元可能だが、`main` へのstable統合は未実施。

現在実装済み:
- Android Chrome向けDemo Composer
- Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite の6 Module
- schemaVersion 2 / PPQ 480 / 4/4固定の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- schemaVersion 1 → 2 Migration / Migration前Project退避
- Project全体Undo / Redo（最大50操作、メモリのみ）
- Hub: Project名 / BPM / Key / Scale、Key変更時のChord / Melody / Bass Atomic移調、文字サイズ3段階、曲の特徴カード、AI相談テキスト / 相談テンプレート、Cubaseでやることメモ
- Chord: ダイアトニック7候補の五度圏扇形UI、基準音C〜B、Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug、コード役割ラベル
- Chord Preset: Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行
- Chord 次のコード候補3つ / ひとスパイス（借用和音3候補）
- Chord Backing Pattern: Block / 8分刻み / Arpeggio / Syncopation。Demo PlayerとChord.mid / Song.midへ反映
- Melody: 縦ピアノKeyboard、8分 / 16分切替、音の長さ指定、Bar / Octave切替、Chord Tone強調、度数表示、Copy Bar / Copy 2小節、Melody Analyzer
- Melody候補3つ: 安定 / キャッチー / 浮遊感。`src/melody/melody-candidates.js` で現在のKey / Scale / Chord / Bar / 表示Octaveからルールベース生成。外部AI / APIなし
- Melody候補は現在Barだけを置き換え、他Barを保持。適用結果は通常のMelody Noteになり、Piano Rollで修正可能
- Melody候補適用後は既存のAutoSave / Undo / Redo / Demo Player / Melody.mid / Song.midをそのまま利用
- Rhythm: Bass音程（Root / 3rd / 5th / 7th / Octave等）/ 半音ずらし±6 / 長さ指定 / Kick / Snare / Closed HH、16 step、Beat Copy / Bar Copy
- Rhythm Bass候補3つ / Drum Preset 6種類 / Drum PresetのSection一括適用
- Rhythm ドラムフィル: スネア8分 / スネアロール / ブレイク。Section終端の後半を変える。全Section終端への一括適用にも対応
- Arrange: Section Template / 小節増減 / 追加削除 / Sectionコピー / Section再生 / 骨子の進み具合 / MIDI Marker
- Sound Sketch Lite: Chord Keys / Pad / Piano、Melody Lead / Keys / Pluck、Bass Soft Bass / Synth Bass / Deep Bass、Tone Natural / Bright / Soft / Warm / Dark / Airy / Aggressive
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drumsの軽量再生、Mute / Solo、Sound / Backing反映
- Chord 好きな進行ライブラリ（度数で保存、端末のlocalStorageのみ。`src/chord/progression-library.js`）
- Hub Cubaseでやることメモ（`src/hub/cubase-memo.js`）/ AI相談テンプレート
- Melody Analyzer（Melody内パネル、`src/core/melody-analysis.js`）/ Hub曲の特徴カード（`src/hub/song-card.js`）
- Chord役割ラベル（`chord-role.js`）/ Melody度数表示（画面のみ）
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json Backup Export / Import（検証・Migration・確認・Undo可）
- GitHub Pages公開: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- Cloudflare Pages Fallback手順あり（Dashboard接続は未実施）
- PR #57 ドラムフィル: merged
- PR #61 Melody候補初期実装: develop先行更新と競合したため未mergeでclose
- PR #66 Melody候補最終統合: merged
- Melody候補統合merge commit: `6a7f1ce482af9a21eaa30fd6e3b91fd896b4f821`
- Melody候補版 GitHub Pages Build / Deploy: success
- Melody候補追加前復元点: `restore/v0.2-before-melody-candidates-final`
- Backing Pattern追加前復元点: `restore/v0.2-before-backing-pattern-final`
- Drum Fill追加前復元点: `restore/v0.2-before-drum-fill`
- `main` はstable専用で変更しない
- `milestone/v0.1-feature-complete` は復元点として保持

開発中:
- Melody候補のdevelop統合とGitHub Pages公開は完了
- Android実機でMelody候補3種の表示・試聴・編集・Undo / Restoreを確認する段階
- v0.2は機能が増えてきたため、追加機能より実制作での使いやすさ確認を優先する

次に実装:
1. Android公開版で Melody → 安定 / キャッチー / 浮遊感 の3候補が表示されることを確認
2. C MajorなどでChordを入力し、安定案がChord Tone中心に生成されることを確認
3. 3候補を切り替えてDemo Playerで違いを聴き比べる
4. 候補適用後、Piano Rollで1音ずつ修正できることを確認
5. 既存MelodyがあるBarで上書き確認が出て、`↶ / ↷` で戻る / 進むことを確認
6. 再読み込み後にAutoSave / Restoreされることを確認
7. Melody.mid / Song.midをExportして通常Noteとして出力されることを確認
8. ドラムフィル / Backing / Bass候補 / Chord候補 / Arrange / Sound / Import等のAndroid回帰確認
9. 問題なければSection Energy（Low / Mid / High）の仕様を検討
10. その後Counter Melodyを検討

既知の問題:
- Melody候補は初期版では1小節単位。Section単位 / 複数小節一括生成は未対応
- Melody候補はルールベースの叩き台で、歌詞のアクセント / フレーズ文脈 / 前後小節の自然な接続まではまだ評価しない
- Melody Velocity編集 / Scale表示は未対応
- Chordは1コード=1小節固定。並べ替え / 長さ変更は未対応
- Chord Preset Libraryは初期6種類のみ
- Backing Patternは曲全体で1種類。Section別 / Bar別指定、詳細Step編集は未対応
- Backing Patternは4種類の叩き台のみ。DAW級Pattern Sequencer / Arpeggiatorは作らない方針
- Scale変更時の既存Chord / Melody / Bass自動変換は未対応。Harmony依存データがある場合は変更を拒否
- Bass Noteがある間はChord Data変更を拒否（Backing Pattern変更は可能）
- Rhythm 16 stepは狭い端末でセル幅が小さい
- Drum Preset / Drum FillはKick / Snare / Closed HH中心。Open HH / Percussion / Tomは未対応
- Arrange Sectionは名前変更UIなし。後ろにコードがある場合、小節増加を安全のため拒否することがある
- Undo履歴は保存されず、再読み込みで空になる
- Sound Sketch LiteはWeb Audio oscillatorベースの方向性確認用。最終音色ではない
- Drums音色変更は未対応
- Snapshot履歴 / PWA Service Workerは未実装
- Cubasis実機確認 / PC Cubase Importの全回帰確認は未完了

触らない部分:
- `main`
- `milestone/v0.1-feature-complete`
- PPQ=480 / 4/4固定
- `project.json`をDemo Composer内の正本とする方針
- Module責務の分離
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なSynth / Mix / Mastering / Audio Editing / Vocal Editing / Plugin HostingはCubasis / Cubase側へ任せる方針

最近の重要な設計判断:
- Melody自動生成は「完成させる」機能ではなく、1小節につき3候補 → ユーザーが選ぶ → Piano Rollで修正する方式にする
- Melody候補は外部AI / APIを使わず、説明可能なルールベースから開始する
- `安定` はChord Tone中心、`キャッチー` は8分中心 + 短い反復、`浮遊感` は2度 / 6度等のScale Tone + 長めの音を使う
- Melody候補自体はProject Dataへ保存せず、適用結果だけ通常の `tracks[role=melody].notes[]` へ保存する
- Melody候補専用Schema / MIDI形式を作らず、既存のNote処理・Undo・AutoSave・Player・MIDI Exportを再利用する
- Melody候補の実装中にPR #57のDrum Fillがdevelopへ先行統合されたため、旧PR #61を無理にマージせず、最新developからPR #66を作り直して統合した
- Backing PatternはChord Module内、Melody候補はMelody Module内に置き、新Moduleを増やさない
- 生成・候補機能はDemo Composer共通思想の「3候補 → 選択 → 修正」を優先する
- v0.2のSchemaは2のまま維持し、今回Migrationは追加しない
- GitHub Pagesを現在の公開確認先とし、Vercel自動配信は停止状態を維持する

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは `major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented`。Arrangeは既存 `structure.sections[]`、Sound / Backingは既存 `instruments[]` を利用。Melody候補そのものは保存せず、適用結果を通常の `tracks[role=melody].notes[]`（`id / pitch / startTick / durationTick / velocity`）として保存する。今回のMelody候補 / Drum Fillとも専用Schema追加なし。

最終更新:
2026-10-10
