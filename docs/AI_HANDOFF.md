# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。v0.1機能完成地点は復元可能だが、`main` へのstable統合は未実施。

現在実装済み:
- Android Chrome向けDemo Composer
- Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite の6 Module（＋ 裏メロタブ）
- schemaVersion 2 / PPQ 480 / 4/4固定の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- Hub `＋ 新規Project`: 現在Projectを保存してから別IDの空ProjectをActiveにする。旧Projectは端末内に保持。`src/hub/app-entry.js` / `new-project.js` / `new-project-ui.js`
- schemaVersion 1 → 2 Migration / Migration前Project退避
- Project全体Undo / Redo（最大50操作、メモリのみ）
- Hub: Project名 / BPM / Key / Scale、Key変更時のChord / Melody / Bass Atomic移調、文字サイズ3段階、曲の特徴カード、AI相談テキスト / 相談テンプレート、Cubaseでやることメモ
- Chord: ダイアトニック7候補の五度圏扇形UI、基準音C〜B、Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug、コード役割ラベル
- Chord Preset 100種類（7カテゴリ。既存6種: Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行）
- Chord 次のコード候補3つ / ひとスパイス（借用和音3候補）
- Chord Backing Pattern: Block / 8分刻み / Arpeggio / Syncopation。Demo PlayerとChord.mid / Song.midへ反映
- Melody: 縦ピアノKeyboard、8分 / 16分切替、音の長さ指定、Bar / Octave切替、音の役割の色分け（青=コード構成音 / 緑=テンション / 黄=スケール外 / 赤=アボイド。`src/melody/pitch-roles.js`）、度数表示、Copy Bar / Copy 2小節、Melody Analyzer
- Melody Analyzer音程分析: `Keyからの度数` / `Chordからの度数` / `Scale内率` を表示。既存のコードトーン率と併用し、Projectを読むだけの派生分析として実装（Schema変更なし）
- Melody Analyzer `旋律の3つの見方`: `歌心・浮遊型（草野マサムネ参考） / 輪郭・違和感型（米津玄師参考） / 推進・高密度型（Ayase / YOASOBI参考）`。既存の跳躍 / Chord度数 / Scale外 / 密度 / モチーフ反復を束ねた読み取り専用ガイドで、類似度採点・候補自動変更・Schema変更なし
- Melody Analyzer `メロディの働き`: 和声役割を `Guide / Chord / Tension / Other` で表示し、経過音 / 刺繍音 / Approach / 倚音 / 逸音 / 先取音 / 係留音候補を前後関係が明確な場合だけ派生分析する。GuideはChord Toneの3rd / 7th系の内数、Tensionは初期版では9th / 11th / 13th相当。`src/core/melodic-functions.js` / `docs/MELODY_FUNCTIONS.md`（Schema変更なし）
- Melody Analyzer フレーズ語彙ガイド: モチーフ / リック / リフ / シーケンスの違いを表示。リック / リフは文脈依存のため自動判定せず、既存モチーフ反復も自動でリック / リフと断定しない
- Melody候補3つ: 安定 / キャッチー / 浮遊感。`src/melody/melody-candidates.js` で現在のKey / Scale / Chord / Bar / 表示Octaveからルールベース生成。外部AI / APIなし
- Melody候補は `↻ 候補を更新` で4つのVariation Setを循環。安定案はChord Tone中心、キャッチー / 浮遊感もKey / Scale内のルールを維持
- Melody候補のVariation番号はUI状態のみでProject Dataへ保存しない。Bar移動時は初期Setへ戻る
- Melody候補は現在Barだけを置き換え、他Barを保持。適用結果は通常のMelody Noteになり、Piano Rollで修正可能
- Melody候補適用後は既存のAutoSave / Undo / Redo / Demo Player / Melody.mid / Song.midをそのまま利用
- Rhythm: Bass音程（Root / 3rd / 5th / 7th / Octave等）/ 半音ずらし±6 / 長さ指定 / Kick / Snare / Closed HH、16 step、Beat Copy / Bar Copy
- Rhythm Bass候補5タイプ: `ルート型 / リフ型 / ファンク型 / シンセウェーブ型 / 裏メロ型`。現在Barだけを通常Bass Noteへ置き換え、16 stepで修正可能。ファンク型はKick位置がある場合それをAnchorに短い返しを追加。詳細は `docs/BASS_STYLES.md`（Schema変更なし）
- Rhythm Drum Preset 6種類 / Drum PresetのSection一括適用
- Rhythm ドラムフィル: スネア8分 / スネアロール / ブレイク。Section終端の後半を変える。全Section終端への一括適用にも対応
- Arrange: Section Template / 小節増減 / 追加削除 / Sectionコピー / Section再生 / 骨子の進み具合 / MIDI Marker
- Sound Sketch Lite: Chord Keys / Pad / Piano、Melody Lead / Keys / Pluck、Bass Soft Bass / Synth Bass / Deep Bass、Tone Natural / Bright / Soft / Warm / Dark / Airy / Aggressive
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drumsの軽量再生、Mute / Solo、Sound / Backing反映
- Chord 好きな進行ライブラリ（度数で保存、端末のlocalStorageのみ。`src/chord/progression-library.js`）
- Hub 出発点の質問ウィザード（`suggestByAnswers`）/ Arrange 感情曲線（`src/core/energy-curve.js`）/ 構成ライブラリ（`src/arrange/structure-library.js`、端末のlocalStorageのみ）/ Melody 山の位置（`src/melody/peak-guide.js`）
- Arrange ループから曲にする案内（`src/core/loop-guide.js`、Core `appendSectionCopy`。#60の上に積んでいる）
- Section Variation（`少し違う版にする`: ドラム / ベース / メロディ3種（終わり・音程だけ・リズムだけ）の5候補。`src/core/section-variation.js`）
- Section Energy（Low/Mid/High）/ Transition（Keep/Fill/Stop/Build/Drop）: `structure.sections[]` の任意項目（schemaVersion 2のまま追記）。`src/core/section-ops.js`
- Counter Melody（裏メロ）: Arrangeの各Sectionで4候補 `Sparse（隙間型） / Active（動く型） / Hook（フック型） / Answer（応答型）` を聴いて当てる。候補説明の小さな補足で `Sparse=米津系 / Active=YOASOBI系 / Hook=Oasis系 / Answer=Mr.Children系` を参考イメージとして示し、特定曲のコピーではないことを明記。`tracks[role=counter]`（Schema追記のみ）、`src/core/counter-melody.js`、MIDI `CounterMelody.mid`。詳細は `docs/COUNTER_MELODY_STYLES.md`
- MIDI読み込み（Hub Export内。提案 → 確かめる → 取り込む。`src/midi/midi-reader.js` / `midi-import.js`、Schema変更なし）
- Hub 作編曲の手引き（16手順のチェックリスト。✓は端末のlocalStorageのみ。`src/hub/guide.js`）
- Hub 骨子完成チェック（✓ / △ / －、`src/core/skeleton-check.js`、読むだけ）
- Chord メロディからコード候補3つ（`src/chord/chord-for-melody.js`、小節ごと・まとめ付け）
- Hub 出発点（ジャンル×ムード→3候補、`src/hub/starting-point.js`、Store `applyStartingPoint`）
- Melody Analyzer Sectionごとの比べ（`src/core/section-compare.js`、サビと前Sectionの差）
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
- PR #73 Melody候補Refresh: merged
- PR #71 Melody Variation（音程だけ / リズムだけ）: merged。PR #73の後にdevelopへ統合され、Refreshを含む親commitを保持
- PR #91 Melody Analyzer 旋律の3つの見方: merged / CI success
- PR #93 Rhythm Bass候補5タイプ: CI success。`ルート / リフ / ファンク / シンセウェーブ / 裏メロ` を1 Bar候補として提示（Schema変更なし）
- PR #95 Counter Melody Answer（応答型）: merged。現行developへ載せ直し、4候補化。Schema / MIDI形式は変更なし
- PR #97 Melody Analyzer `メロディの働き`: merged / CI success。Guide / Chord / Tension / Other、非和声音の働き、フレーズ語彙ガイドを追加（Schema変更なし）
- 旧PR #90 Counter Melody Answer初期版: PR #95で置き換えたためclosed（履歴保持）
- 旧PR #94 Melody Analyzer Melodic Function初期版: develop先行更新と競合したため、最新developから作り直したPR #97で置き換えてclosed（履歴保持）
- Melody候補統合merge commit: `6a7f1ce482af9a21eaa30fd6e3b91fd896b4f821`
- Melody候補Refresh merge commit: `9891c2208287289e13feed4a71b1f8d6aa36bb74`
- Melody候補Refresh PR CI: success
- Melody候補追加前復元点: `restore/v0.2-before-melody-candidates-final`
- Melody候補Refresh前復元点: `restore/v0.2-before-melody-candidate-refresh`
- Melody度数分析追加前復元点: `restore/v0.2-before-melody-degree-analysis`
- Melody 旋律3視点追加前復元点: `restore/v0.2-before-melody-perspectives`
- Melodyの働き追加前復元点: `restore/v0.2-before-melodic-functions`
- Backing Pattern追加前復元点: `restore/v0.2-before-backing-pattern-final`
- Drum Fill追加前復元点: `restore/v0.2-before-drum-fill`
- 新規Project追加前復元点: `restore/v0.2-before-new-project-final`
- Counter Melody 3系統整理前復元点: `restore/v0.2-before-counter-style-3ways`
- Counter Melody Answer追加前復元点: `restore/v0.2-before-counter-answer-style-merge`
- Bass候補5タイプ追加前復元点: `restore/v0.2-before-bass-style-5ways`
- `main` はstable専用で変更しない
- `milestone/v0.1-feature-complete` は復元点として保持

開発中:
- Chord品質を9→44種類に拡張（6 / add9 / 9・11・13 / m7♭5 / dim7 / mMaj7 / 変化音 / 4度堆積・So What・神秘和音）。Chord画面に「スケール系のコード」を追加（スケールをセレクトで選択: ダイアトニック・ハーモニック/メロディックマイナー系・チャーチ・各モード・スパニッシュ・全音・ディミニッシュ・ペンタ・ブルース・都節など約40種 × 3和音/7th/テンション/特殊和音）。`chord-qualities.js` / `chord-theory.js` / 新規 `chord-scale-sets*.js` / `main.js` のChord部分。schemaVersionは2のまま（許可値の追記のみ。旧アプリは新Qualityを含むproject.jsonを拒否）。4度堆積などの特殊和音も追加済み。復元点: `restore/v0.2-before-chord-quality-ext`
- Melody候補の4 Variation Set / Refreshはdevelop統合済み
- Rhythm Bass候補5タイプはPR #93でCI success。Android実機で候補の差・縦スクロール量・Kick有無のファンク型を確認する段階
- Counter Melody 4候補はPR #95でdevelop統合済み。Android実機でSparse / Active / Hook / Answerの差、特にSparseとAnswerの聞き分けを確認する段階
- Melody Analyzer `メロディの働き` はPR #97でdevelop統合済み。Android実機で表示量・読みやすさと代表的な判定例を確認する段階
- Android実機で `↻ 候補を更新` と3候補の差・試聴・編集を確認する段階
- v0.2は機能が増えてきたため、追加機能より実制作での使いやすさ確認を優先する

次に実装:
000. Android実機で、`裏メロ` タブ（7ボタンの収まり）と新2タイプ（Arpeggio / Riff）の聞こえ方を確認。裏メロのPiano Rollでの手入力（Melody画面のPiano Rollを役割ごとに使い回す）は未実装
00. Android実機で、Melodyの新しい初期音色（Vocal）と音量（-2dB）が合うか聴く。気になる音色は Sound画面で `Vocal Soft / Pad Lead` などに変えて比べる。音量が合わなければ `src/audio/demo-player.js` の `PART_LEVEL` を調整
0. 4小節メロディ生成（Chord画面）をAndroid実機で確認し、拡張（B 味付け: 2度・6度 / YOASOBI風、C 裏メロの分散和音・ギターリフ、D スケール色違い）を `docs/MELODY_PHRASE_PLAN.md` の順で進める
1. Android公開版で Melody → 安定 / キャッチー / 浮遊感 の3候補と `↻ 候補を更新` が表示されることを確認
2. `候補を更新` を押すたびに 1/4 → 2/4 → 3/4 → 4/4 → 1/4 と切り替わり、3候補の音型が変わることを確認
3. C MajorなどでChordを入力し、どのSetでも安定案がChord Tone中心であることを確認
4. 3候補を切り替えてDemo Playerで違いを聴き比べる
5. 候補適用後、Piano Rollで1音ずつ修正できることを確認
6. 既存MelodyがあるBarで上書き確認が出て、`↶ / ↷` で戻る / 進むことを確認
7. 再読み込み後に適用結果がAutoSave / Restoreされることを確認（候補Set番号自体は保存しない）
8. Melody.mid / Song.midをExportして通常Noteとして出力されることを確認
9. Melody Variation（終わり / 音程だけ / リズムだけ）・ドラムフィル / Backing / Bass候補 / Chord候補 / Arrange / Sound / Import等のAndroid回帰確認
10. Rhythm Bass候補5タイプを同じChordで順に試聴し、`ルート / リフ / ファンク / シンセウェーブ / 裏メロ` の差が分かること、Kick有無でファンク型が破綻しないこと、適用後に16 step編集・↶が使えることを確認
11. 裏メロ: Sectionごとに `Sparse / Active / Hook / Answer` を試聴 → 適用 → ↶ / 消す。説明の `※` 補足が小さく表示されること、SparseとAnswerの差が分かること、パートパネルの `裏メロ` ミュート、`CounterMelody.mid` のExport、Cubase / Cubasisでの読み込みを確認
12. Hubの `骨子チェック` の ✓ / △ / － と、「次に決めること」のボタン遷移を確認
13. 新機能の追加はいったん止めて、`docs/REAL_SONG_TEST.md` の手順で実制作テスト（1曲を通して作り、MIDIをCubasis / Cubaseへ渡す）を優先
14. v0.3「骨子作り支援」の計画は `docs/V0_3_SKELETON_PLAN.md`（計画のみ・コード未変更）。ChatGPT案23件 + Claude案のレビュー結果と、骨子レシピ8案、3段階の優先順位、未決事項を記載。実装前にユーザーと未決事項を決める
15. MIDI読み込み: アプリで書き出したSong.midと、DAWで作ったMIDIを読み込み、役割の提案・BPM・Key・コード判定が妥当か、取り込み後に↶で戻せることを確認
16. Hubの `作編曲の手引き` を開き、✓が再読み込み後も残ること、移動ボタンが働くことを確認
17. Melody Analyzerで3つの参考モデルが表示され、Chord未設定時の2(9th)/6thが `—`、Chord設定時は割合表示になることをAndroid実機で確認
18. Melody Analyzerで `メロディの働き` が表示され、C Major等でGuide / Chord / Tension / Otherと、経過 / 刺繍 / Approach / 倚音 / 逸音 / 先取の代表例が想定どおり読めることをAndroid実機で確認。係留は「候補」として過剰断定しないこと、リック / リフが自動判定されないことも確認

既知の問題:
- 裏メロは8タイプ（Sparse / Active / Hook / Answer / Arpeggio / Riff / Minor Penta Hook / Major Penta Hook）。ペンタの音とメロディの衝突回避はまだ行っていない（耳で確認して調整）
- Demo Playerが実機で見えない / 鳴らない報告（2026-10-12）に対し、ナビ高さ追従（--nav-h）とビブラートLFO共有で対策済み。ヘッドレスChromeでは再現しなかったため、実機で再確認が必要。続く場合は端末名・Chromeの版・どの画面かを確認する
- 新規Projectで旧Projectデータは端末内に残るが、保存済みProject一覧 / 過去Projectを選んで再度開くUIは未実装。現時点の復元手段はproject.json Backup / Importを優先する
- Melody候補は1小節単位。Section単位 / 複数小節一括生成は未対応
- Melody候補の別案は有限4Set。無制限ランダム生成はしない
- Melody候補はルールベースの叩き台で、歌詞のアクセント / フレーズ文脈 / 前後小節の自然な接続まではまだ評価しない
- Melody Analyzerの3参考モデルは「似ている度」を判定しない。歌詞アクセント・フレーズ輪郭・シンコペーション等まで含む作家分析ではなく、現状の数値の見方を補助するだけ
- Melody AnalyzerのMelodic Function判定は初心者向けの保守的なルール。経過 / 刺繍 / 倚音 / 逸音 / Approachは原則同一Chord内の前後3音を見ており、複雑な和声文脈・装飾音・フレーズ境界までは断定しない。係留は保持関係だけを見た「候補」で、リック / リフは自動判定しない
- Melody Velocity編集 / Scale表示は未対応
- Chordは1コード=1小節固定。並べ替え / 長さ変更は未対応
- Chord Presetは度数配列のみの100種類。借用和音 / 7th入りPresetは未対応
- Backing Patternは曲全体で1種類。Section別 / Bar別指定、詳細Step編集は未対応
- Backing Patternは4種類の叩き台のみ。DAW級Pattern Sequencer / Arpeggiatorは作らない方針
- Scale変更時の既存Chord / Melody / Bass自動変換は未対応。Harmony依存データがある場合は変更を拒否
- Bass Noteがある間はChord Data変更を拒否（Backing Pattern変更は可能）
- Rhythm Bass候補は1 Bar単位の有限5タイプ。前後小節のVoice Leadingや曲全体のBassモチーフまでは自動評価しない
- Rhythm 16 stepは狭い端末でセル幅が小さい。Bass候補が5タイプになったため、縦スクロール量はAndroid実機で要確認
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
- Melody Piano Rollの色分けは、現在Barのコードと選択Key / Scaleから毎回計算するだけで保存しない（Schema変更なし）。Tensionの定義はMelody Analyzerと同じ自然9 / 11 / 13（ルートから2 / 5 / 9半音）。アボイドは「構成音でなく、構成音の半音上にあるScale内の音」という初心者向けの簡易定義で、厳密なジャズ理論の全ケースは網羅しない。優先は 赤 > 青 > 緑 > 黄
- `＋ 新規Project` は現在Projectの中身をClearするのではなく、新しいProject IDを作る。旧Projectを上書き・削除しない
- reload時のvisibility AutoSaveとの競合を避けるため、新規Project要求はsessionStorageでreload境界へ渡し、`app-entry.js` が `main.js` のboot前にActive Projectを確定する。schemaVersionは変更しない
- Melody AnalyzerのKey度数 / Chord度数 / Scale内率は保存データを増やさず、現在のProjectから毎回計算する読み取り専用分析とする。コードトーン率は別指標として残す
- Melody Analyzerの3参考モデルも既存の分析値を束ねるだけとし、アーティスト類似度の点数化、特定曲の再現、Melody候補への自動反映はしない。Schema変更なし
- Melody AnalyzerのMelodic FunctionもProjectへ保存せず、Chord / Melody Noteから毎回派生計算する。GuideはChord Toneの内数、Tensionは初期版では自然9th / 11th / 13th相当。複雑な文脈を無理に断定せず、係留は候補、リック / リフは学習ガイドのみとする。Melody候補生成には自動反映しない
- Melody自動生成は「完成させる」機能ではなく、1小節につき3候補 → ユーザーが選ぶ → Piano Rollで修正する方式にする
- Melody候補は外部AI / APIを使わず、説明可能なルールベースから開始する
- `安定` はChord Tone中心、`キャッチー` は8分中心 + 短い反復、`浮遊感` は2度 / 6度等のScale Tone + 長めの音を使う
- 同じ条件で候補が固定される問題への対応は、完全ランダムではなく4つの有限Variation Setを循環する方式にする
- Melody候補のVariation番号はUI状態だけに持ち、Project Data / MIDI / Schemaへ追加しない
- Melody候補自体はProject Dataへ保存せず、適用結果だけ通常の `tracks[role=melody].notes[]` へ保存する
- Melody候補専用Schema / MIDI形式を作らず、既存のNote処理・Undo・AutoSave・Player・MIDI Exportを再利用する
- Melody候補の実装中にPR #57のDrum Fillがdevelopへ先行統合されたため、旧PR #61を無理にマージせず、最新developからPR #66を作り直して統合した
- Backing PatternはChord Module内、Melody候補はMelody Module内に置き、新Moduleを増やさない
- 生成・候補機能はDemo Composer共通思想の「候補提示 → 選択 → 修正」を優先する
- Rhythm Bass候補は既存の3候補を無制限生成へ広げず、役割が明確な5タイプ `ルート / リフ / ファンク / シンセウェーブ / 裏メロ` に整理する。The Weeknd等は「短い低音リフをフック化する考え方」の参考に留め、特定曲コピーはしない
- Bass候補名 / 候補IDはProject Dataへ保存せず、適用結果だけ通常の `tracks[role=bass].notes[]` に保存する。既存のUndo / AutoSave / Demo Player / MIDI Exportを再利用し、schemaVersion 2を維持する
- Counter Melodyは `Sparse / Active / Hook / Answer` の4役割に整理する。Answerは主旋律の語尾・後半へ少し長めに返し、3度・7度などコード色を優先する。アーティスト名は小さな参考イメージに限定し、特定曲の旋律再現・コピーはしない
- Counter Melody候補名 / 候補IDはProject Dataへ保存しない。適用結果だけ `tracks[role=counter].notes[]` に保存するため、候補方式を変えてもschemaVersion 2を維持できる
- v0.2のSchemaは2のまま維持し、今回Migrationは追加しない
- GitHub Pagesを現在の公開確認先とし、Vercel自動配信は停止状態を維持する

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは `major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented`。Arrangeは既存 `structure.sections[]`、Sound / Backingは既存 `instruments[]` を利用。Melody候補そのものとVariation番号は保存せず、適用結果だけ通常の `tracks[role=melody].notes[]`（`id / pitch / startTick / durationTick / velocity`）として保存する。Bass候補名 / 候補IDも保存せず、適用結果だけ既存 `tracks[role=bass].notes[]` として保存する。Counter Melody候補名 / 候補IDも保存せず、選んだ結果だけ `tracks[role=counter].notes[]` として保存する。Melody AnalyzerのKey度数 / Chord度数 / Scale内率 / 3参考モデル / Melodic Functionも保存せずProjectから派生計算するため、schemaVersion 2のまま。

最終更新:
2026-10-11