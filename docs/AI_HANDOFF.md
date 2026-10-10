# AI_HANDOFF

現在Version:
v0.1-dev（develop正本）。v0.2-dev機能はPR #23 / #24で開発中。

最新安定版:
なし。v0.1機能完成地点は復元可能だが、stable条件は最終確定前。

現在実装済み:
- Android Chrome向けDemo Composer
- Hub / Chord / Melody / Rhythm
- schemaVersion 1準拠の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now
- Hub: Project名 / BPM / Key / Scale
- Chord: ダイアトニック候補、1コード=1小節、追加 / 削除 / Clear
- Melody: 8分 / 16分入力切替、Monophonic、Bar / Octave切替、Clear Bar、縦ピアノKeyboard
- Rhythm: Bass / Kick / Snare / Closed HH、16分Grid、Beat Copy、Bar Copy
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums軽量再生
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid
- project.json手動Backup Export
- MIDI / Rhythm Copy / Melody Smoke TestとPR CI
- Vercel用静的Build: `npm run build` → `dist/`

Repository統合状況:
- `develop` HEAD: `12835c9cf2412a28a133984922816367817cf53f`
- `main`: stable専用。まだ触らない
- `milestone/v0.1-feature-complete`: `655fc1419340c313ed2f6f727c057db35b8ae6f5`
- PR #23 `v0.2-dev: add root-based chord qualities`: open。Chord quality拡張とschemaVersion 2 migrationを含む
- PR #24 `v0.2: add editable drum pattern presets`: open。Drum Preset 6種類。Schema変更なし。#23とは別branchなので統合順序確認が必要
- PR #25 `docs: add Cloudflare Pages fallback deployment plan`: open。Cloudflare認証フローで停止したため現時点では採用保留
- PR #26 `infra: add GitHub Pages fallback deployment`: open。Vercel代替の第二公開先候補

開発中:
- GitHub Pages Fallback導入
- branch: `chatgpt/github-pages-fallback`
- restore: `restore/v0.1-before-github-pages`
- Workflow: `.github/workflows/pages.yml`
- 公開元: `develop`
- Build: `npm run build` → `dist/`
- `main` / Schema / MIDI / Project Dataは変更しない
- 初回作業branch試験 run `38046796252` ではBuildと `dist/index.html` 検証は成功
- Pages初回作成だけ `Resource not accessible by integration` で失敗。Repository `Settings → Pages → Source: GitHub Actions` の一度だけの有効化が必要
- Private RepositoryのPages利用可否はGitHub契約プラン条件にも依存する

次に実装:
- まずPR #26のPR CI結果を確認
- GitHub Repository `Settings → Pages` でSourceを `GitHub Actions` にできるか確認
- 有効化できた場合、PR #26をdevelopへ統合してPages Deployを確認
- 公開URLでAndroid ChromeのHub / Chord / Melody / Rhythm / Play / Stop / Loopを確認
- GitHub PagesがPrivate Repoのプラン条件で利用不可なら、PR #26を無理に統合せずNetlify等のFallbackへ切り替える
- v0.2機能統合はHosting作業と分離し、#23 → #24の順を基本に競合解消して進める

Android実機で確認済み / ユーザー受入済み:
- Vercel Preview起動
- Hub / Chord / Melody / Rhythm Navigation
- Melody 8分 / 16分切替
- Melody 16分の前半 / 後半切替
- Rhythm 16 stepの基本Tap操作
- Demo Player Play / Stop / Loop
- Chordを使ったDemo Player実音再生
- Demo Player音量 / 音割れ改善後のバランス
- AutoSave / Restore
- BandLab Androidへ個別MIDIをImportして再生

既知の問題:
- Chordはdevelop正本では1コード=1小節、qualityはmajor / minor / diminishedのみ。拡張はPR #23
- Key / Scale変更時の既存Chord / Melody / Bass自動移調は未対応
- Bass Noteがある間はChord変更を拒否する
- Melody Note Length / Velocity編集は未対応
- Melody入力単位はUI状態のみで保存されない
- Melody Scale表示 / Chord Tone強調 / Melody Analyzerは未対応
- Rhythm 16 stepは狭い端末でセル幅が小さい
- Drumsはdevelop正本ではKick / Snare / Closed HHのみ。PresetはPR #24
- Demo Playerは仮音確認専用
- Snapshot履歴 / project.json Import / Service Workerは未実装
- Cubasis実機確認 / PC Cubase Importは未実施
- GitHub Pagesは初回有効化前。Private Repoのプラン条件によっては利用不可

触らない部分:
- `main`（stable条件を満たすまで）
- `milestone/v0.1-feature-complete`
- docs/に記載したDemo Composerの基本思想
- develop正本のschemaVersion 1（PR #23統合時だけMigration込みで2へ変更）
- PPQ=480 / 4/4固定
- Module責務の分離
- `project.json`をDemo Composer内の正本とする方針
- 「スマホ版DAWを作らない」というプロダクト境界
- 高度なMix / Mastering / Audio Editing / Plugin HostingはCubase等へ任せる方針

最近の重要な設計判断:
- Android Chromeを主対象とする
- Melodyは8分 / 16分を切替可能。16分はタップ幅確保のため半小節表示
- Rhythmは1 Bar=16 step
- Beat Copy / Bar Copyは「コピー後に編集」を重視
- Demo Playerは作曲判断用の軽量再生に限定
- MIDI ChannelsはChord1 / Melody2 / Bass3 / Drums10
- AIは完全自動作曲ではなく候補提示・分析・先生役
- Vercelを削除せず、第二公開先を用意する
- Cloudflare Pagesは認証フローの負担が大きかったため採用保留
- GitHub PagesはGitHub内で完結するFallback候補としてPR #26で導入中
- Hosting都合でProject SchemaやModule構造は変更しない

現在のデータSchema:
develop正本はschemaVersion 1 / PPQ 480 / 4/4固定。変更なし。PR #23を統合する場合のみschemaVersion 2へMigrationする。

最終更新:
2026-10-10
