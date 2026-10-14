# Arrangement Lab VERSION_HISTORY

| Version | 復元先/commit | 状態 |
|---|---|---|
| v0.1.1-dev | restore/arranger-v0.1.1-before-v0.2 / c941a4f | 旧版保持 |
| v0.2-dev | restore/arranger-v0.2-before-work-review / 4313a42 | レビュー前保持 |
| v0.2.1-dev | restore/arranger-v0.2.1-before-seven-features / b70a1f5 | 7機能追加・Schema3前保持 |
| v0.3-dev | chatgpt/arranger-v0.3-theory / 857c01a / PR #170 | 7機能・理論Lab完成地点 |
| v0.4-dev | restore/arranger-v0.4-before-cache-update / c29cfc0 / PR #171 | 50音楽手法完成地点を保持 |
| v0.4.1-dev | restore/arranger-v0.4.1-before-v0.5 / 44025d9 / PR #172 | PWA更新修正・Schema4維持。v0.5前復元点 |
| v0.5-dev | chatgpt/arranger-v0.5 / PR #173 | 6部屋整理、比較試聴、判断履歴、DAW引き継ぎ、実Note生成 |
| v0.6-dev | restore/develop-before-arranger-beginner-flow-20261013 / feature/arranger-beginner-flow-v0.6 | 初心者一本道フロー、もっと試す、④空状態、固定ナビ |
| v0.7-dev | restore/develop-before-mobile-first-flow-20261014 / feature/mobile-first-flow-v0.11 | スマホ5段階Workflow、主操作1つ、1小節スケッチから編曲開始 |
| v0.8-dev | restore/develop-before-song-data-menu-20261014 / feature/song-data-menu-v0.12 | 右上「📦 曲データ」常設、SongProject読込/保存/DAW入口統一 |
| v0.9-dev | restore/develop-before-onebar-reharm-20261014 / feature/onebar-reharm-20261014 | コード0件の1小節メロディから仮コードを付け、既存リハモ3案を試聴・採用可能 |
| v0.10-dev | restore/develop-before-onebar-chordonly-20261014 / feature/onebar-chordonly-reharm-20261014 | 1小節コードだけのhandoffを正式対応。A/B/C準備完了を待ってから反映済みにし、固定ナビに隠れる通知も修正 |
| v0.11-dev | restore/develop-before-arranger-preview-fix-20261014 / fix/arranger-preview-v0.11 | 1小節コードの絶対tick補正、選択案簡易試聴の実発音回帰、Harmony音量/音域調整、Bass無音fallback |
| v0.12-dev | restore/develop-before-section-audition-v0.12-20261014 / feature/section-audition-v0.12 / PR #221 | ④Section全体試聴、リハモ3案の採用前個別試聴、試聴/採用分離 |
| v0.13-dev | restore/develop-before-sound-preserve-v0.13-20261014 / feature/arranger-preserve-sound-v0.13 / PR #226 | Demo ComposerのSound Preset/ToneとDrums音色をArrangement Lab試聴へ保持 |

最新は `arranger/VERSION`。本体mainは自動テスト・build・回帰CI合格版。Arrangement LabのAndroid/Cubasis/Cubase実機DAW確認済みstableは未認定。
各過去版のbranch/archiveを削除・上書きしない。

補助復元点: `restore/arranger-v0.3-before-music-labs` / 3d92f60。v0.3とその過去版も保持。

2026-10-13: v0.5-dev / SongProject v1はPR #177でmain統合済み。Pagesはmainから公開（PR #180）。stable tag未作成。
2026-10-13: v0.6-devは初心者導線だけを追加し、Arrangement Plan Schema 4と既存保存キーを維持。復元点 `restore/develop-before-arranger-beginner-flow-20261013`。
2026-10-14: v0.7-devはSection未作成でも音符/コードがあればArrangement入力時だけスケッチSectionを補完する。SongProject v1 / Arrangement Plan Schema 4は変更しない。
2026-10-14: v0.8-devは画面右上に共通「📦 曲データ」を常設し、SongProject v1の入口をスクロール位置に依存しない共通操作へ整理。Schemaは変更しない。
2026-10-14: v0.9-devはコードを持たない1小節SongProjectに限り、Arrangement Labの入力変換内でKeyと主旋律から2つの仮コードを補完する。元SongProjectのcompositionは変更せず、既存コードがある曲・2小節以上には自動補完しない。
2026-10-14: v0.10-devは1小節コードだけのSongProjectをDemo Composer handoff経由で360/390/430px回帰し、A/B/C候補が準備できるまでhandoffを完了扱いにしない。SongProject v1 / Arrangement Plan Schema 4は変更しない。
2026-10-14: v0.11-devは曲中絶対tickを持つ1小節抜粋をArrangement Lab入力時だけ0基準へ補正し、「選択案を簡易試聴」押下で実際のAudioイベントが生成されることをMobile Chromiumで確認する。元SongProject compositionと各Schemaは変更しない。
2026-10-14: v0.12-devは④Sectionの現在調整を対象Sectionだけ試聴でき、リハモ「自然 / 色付け / 大胆」も採用前に個別試聴できる。試聴は候補を変更・保存せず、採用操作だけがstateへ反映する。各Schemaは変更しない。
2026-10-14: v0.13-devはDemo ComposerのSound Preset/ToneをSongProject v1内の既存legacyProjectから再利用し、Arrangement LabのChord/Harmony・Melody/Counter・Bass・Drums試聴で同じ音源方向を維持する。音色情報が無い旧JSONやMIDI Analyzer起点は従来簡易音へfallbackし、SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4は変更しない。
