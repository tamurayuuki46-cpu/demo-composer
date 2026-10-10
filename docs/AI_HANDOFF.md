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
- Chord: ダイアトニック7候補 + 基準音C〜B + Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
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
- MIDI / Rhythm Copy / Rhythm Preset / Melody / Chord Smoke Test、Syntax Check、Static BuildのCI

Repository統合状況:
- `develop` HEAD: `c21bb9b0b343e8dc807c6fd884ceaf670c48cd43`
- PR #26 GitHub Pages Fallback: merged
- PR #27 v0.2 Chord Quality + Schema v2 + Rhythm Preset統合: merged
- PR #23 Chord Quality + Schema v2: #27で置換済みとしてclose。branchは保持
- PR #24 Rhythm Preset: #27で置換済みとしてclose。branchは保持
- GitHub Pages v0.2 Deploy: success
- GitHub Pages公開URL: `https://tamurayuuki46-cpu.github.io/demo-composer/`
- v0.2統合前復元点: `restore/v0.1-before-v0.2-integration`
- 元の機能別復元点 / branchも削除せず保持
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

v0.2統合CI確認済み:
- JavaScript syntax check: success
- MIDI smoke test: success
- Rhythm copy smoke test: success
- Rhythm preset smoke test: success
- Melody grid smoke test: success
- Chord types smoke test: success
- Static build: success
- GitHub Pages Deploy: success

開発中:
- v0.2統合自体は完了
- 次はAndroid実機でv0.2追加機能の回帰確認

次に実装 / 確認:
1. GitHub Pages公開版でVersion表示がv0.2-devになっていることを確認
2. Chordの基準音C〜B切替と9種類のQuality追加を確認
3. Demo Playerで新しいChord Qualityが鳴ることを確認
4. Rhythm Drum Preset 6種類の適用 / 上書き確認 / 手動修正を確認
5. Bass / 他BarがPreset適用で変わらないことを確認
6. AutoSave / RestoreとschemaVersion 1 → 2 Migrationを確認
7. Chord.mid / Song.mid / Drums.midを確認
8. 問題なければChord Tone表示の仕様案を作る
9. その後Melody Analyzerを検討

既知の問題:
- Chordは1コード=1小節固定
- Chord並べ替え / 長さ変更は未対応
- 借用和音を目的別に整理した支援UIは未対応
- Key / Scale変更時の既存Chord / Melody / Bass自動移調は未対応
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
- v0.2 Chord Qualityは「基準音を1つ選ぶ → 9種類から選ぶ」として候補を大量表示しない
- ダイアトニック7候補は初心者導線として残す
- Chord Quality定義はcoreへ集約し、Chord / Demo Player / MIDIで共有する
- schemaVersion 1 → 2はProject構造を変えずChord Quality許可値を拡張する
- Migration前ProjectはIndexedDBへ退避してから変換する
- Drum Presetは完成形の自動生成ではなく、叩き台を選んで16 stepを手動修正する機能とする
- Drum Preset選択状態は保存せず、結果だけ通常のDrum Note Dataとして保存する
- Vercelを残し、GitHub Pagesを第二公開先として運用する
- PR #23 / #24は過去branchを上書きせず、最新developから作ったPR #27で安全に統合した

現在のデータSchema:
schemaVersion 2 / PPQ 480 / 4/4固定。Chord Qualityは major / minor / dominant7 / major7 / minor7 / sus2 / sus4 / diminished / augmented。

最終更新:
2026-10-10
