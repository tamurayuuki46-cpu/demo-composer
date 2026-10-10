# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。v0.1機能完成地点は復元可能だが、`main` へのstable統合は未実施。

現在実装済み:
- Android Chrome向けDemo Composer
- Hub / Chord / Melody / Rhythm
- schemaVersion 2準拠の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- schemaVersion 1 → 2 Migration
- Migration前ProjectをIndexedDB `meta` storeへ退避
- Hub: Project名 / BPM / Key / Scale
- Hub Key変更: Chord root / Melody pitch / Bass pitchを元Key→新Keyの最短半音幅でAtomicに自動移調し、Drumsは変更しない
- Key移調でMIDI Note 0〜127を外れる場合は更新全体を中止して元Projectを維持
- Scale変更はChord / Melody / Bassがある場合は安全のため拒否
- Chord: ダイアトニック7候補 + 基準音C〜B + Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
- Chord Preset: Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行
- Chord Presetは現在Key / Scaleへ自動変換し、通常の `project.chords[]` として適用
- Chord Preset適用後は個別追加 / 削除 / Clearで修正可能
- Chord Quality共通定義をChord / Demo Player / MIDI Exportで共有
- Melody: 8分 / 16分切替、Monophonic、Bar / Octave切替、Clear Bar、縦ピアノKeyboard
- Rhythm: Bass / Kick / Snare / Closed HH、16 step、Beat Copy、Bar Copy
- Rhythm Drum Preset: 8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH
- Drum Presetは現在BarのKick / Snare / Closed HHだけを置換し、Bass / 他Barは変更しない
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json手動Backup Export
- Vercel静的Build
- GitHub Pages Fallback（developから公開）
- MIDI / Rhythm Copy / Rhythm Preset / Melody / Chord / Chord Preset / Hub Key Change Smoke Test、Syntax Check、Static BuildのCI

Repository統合状況:
- v0.2基礎機能統合commit: `c21bb9b0b343e8dc807c6fd884ceaf670c48cd43`
- Chord Preset統合commit: `5f0c6cb3d964ccd2d0ba93ed3bb43d81ecef6eb3`
- Hub Key変更修正統合commit: `5b7f43003a64281bef051d74590e7badb66f5fb7`
- PR #26 GitHub Pages Fallback: merged
- PR #27 v0.2 Chord Quality + Schema v2 + Rhythm Preset統合: merged
- PR #30 Chord Preset 6種類: merged
- PR #32 Hub Key変更時のHarmony自動移調: merged
- PR #23 Chord Quality + Schema v2: #27で置換済みとしてclose。branchは保持
- PR #24 Rhythm Preset: #27で置換済みとしてclose。branchは保持
- GitHub Pages Key修正版 Deploy: success
- GitHub Pages公開URL: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- v0.2統合前復元点: `restore/v0.1-before-v0.2-integration`
- Chord Preset追加前復元点: `restore/v0.2-before-chord-presets`
- Key変更修正前復元点: `restore/v0.2-before-key-change-fix`
- 作業branchは履歴として保持
- `main` はstable専用。変更しない
- `milestone/v0.1-feature-complete` は復元点として保持

Android実機で確認済み / ユーザー受入済み:
- Hub / Chord / Melody / Rhythm Navigation
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
- Static build: success
- GitHub Pages Deploy: success

開発中:
- Hub Key変更修正のdevelop統合 / GitHub Pages公開は完了
- 次はAndroid実機でKey変更とPreset機能の回帰確認

次に実装 / 確認:
1. GitHub Pages公開版でHubのKeyを変更し、選択値が元へ戻らないことを確認
2. Chordがある状態でKey変更し、コード進行が同じDegree関係のまま移調されることを確認
3. Melody / Bassがある状態でKey変更し、同じ半音幅で移調されることを確認
4. Key変更でDrumsが変わらないことを確認
5. Chord / Melody / Bassがある状態のScale変更は安全に拒否されることを確認
6. Chord Preset 6種類のSelect / Preview / 適用 / 個別修正を確認
7. Rhythm Drum Preset 6種類のSelect / 適用 / 上書き確認 / 手動修正を確認
8. Demo Player / Chord.mid / Melody.mid / Bass.mid / Song.midへKey変更後の結果が反映されることを確認
9. 問題なければChord Tone表示の仕様案を作る
10. その後Melody Analyzerを検討

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更は未対応
- 借用和音を目的別に整理した支援UIは未対応
- Chord Presetは初期6種類のみ。Scaler / Melody Sauce / Cubase / 書籍等からの分類拡張は未対応
- Scale変更時の既存Chord / Melody / Bass自動変換は未対応。Harmony依存データがある場合は変更を拒否する
- Key移調でMIDI Note範囲外になる場合はKey変更を拒否する
- Bass Noteがある間はChord変更を拒否する
- Melody Note Length / Velocity編集は未対応
- Melody入力単位はUI状態のみで保存されない
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Rhythm 16 stepは狭い端末でセル幅が小さい
- Drum PresetはKick / Snare / Closed HHのみ
- Demo Playerは仮音確認専用
- Snapshot履歴 / project.json Import / Service Workerは未実装
- Cubasis実機確認 / PC Cubase Importは未実施

触らない部分:
- `main`
- `milestone/v0.1-feature-complete`
- PPQ=480 / 4/4固定
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なMix / Mastering / Audio Editing / Plugin HostingはCubasis / Cubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- Key変更はHubが他Moduleを直接書き換えず、Core Project StateのGlobal OperationとしてChord / Melody / Bassを1回でAtomicに移調する
- Key移調は最短半音幅を使用し、不要な1オクターブ移動を避ける
- Key移調はChord quality / degree、Note timing / duration / velocityを維持し、Drumsは変更しない
- Key移調でMIDI範囲外が発生する場合はProjectを部分更新せず全体を元のまま維持する
- Scale変更はKey移調と分離し、Harmony依存データがある場合は拒否する
- v0.2 Chord Qualityは「基準音を1つ選ぶ → 9種類から選ぶ」として候補を大量表示しない
- ダイアトニック7候補は初心者導線として残す
- Chord Quality定義はcoreへ集約し、Chord / Demo Player / MIDIで共有する
- schemaVersion 1 → 2はProject構造を変えずChord Quality許可値を拡張する
- Migration前ProjectはIndexedDBへ退避してから変換する
- Chord PresetはDegree配列として定義し、現在Key / Scaleの通常Chord Dataへ展開する
- Chord Preset選択状態は保存せず、適用結果だけ `project.chords[]` として保存するためSchemaは変更しない
- Chord Presetは完成進行を固定する機能ではなく、適用後に個別修正する叩き台とする
- Drum Presetは完成形の自動生成ではなく、叩き台を選んで16 stepを手動修正する機能とする
- Drum Preset選択状態は保存せず、結果だけ通常のDrum Note Dataとして保存する
- Vercelを残し、GitHub Pagesを第二公開先として運用する

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented。Chord Preset / Drum Preset / Key移調は専用Schemaを追加せず、既存Project Dataを利用する。

最終更新:
2026-10-10
