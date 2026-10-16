# Branch Inventory demo-composer (2026-10-17)

作成目的: ブランチ整理前の記録。ブランチ名とコミットIDから、削除後も同じ時点を再作成できるようにする。
このファイルを作成した時点では、ブランチの削除・変更は行っていない。

総数: 470本 / main取り込み済み: 401 / develop取り込み済み(mainは未): 2 / 未取り込み: 67

判定: 「取り込み済み」はブランチ先頭のコミットがmain(またはdevelop)の履歴に含まれる場合。Squash mergeされたブランチは「未取り込み」と表示される。

## 接頭辞別の集計

| 接頭辞 | 本数 | main取り込み済み | develop取り込み済み | 未取り込み |
|---|---|---|---|---|
| (root) | 6 | 5 | 1 | 0 |
| backup | 13 | 12 | 0 | 1 |
| chatgpt | 118 | 77 | 0 | 41 |
| chore | 5 | 4 | 0 | 1 |
| claude | 96 | 90 | 1 | 5 |
| docs | 2 | 2 | 0 | 0 |
| feature | 25 | 18 | 0 | 7 |
| fix | 4 | 4 | 0 | 0 |
| integration | 1 | 1 | 0 | 0 |
| milestone | 4 | 3 | 0 | 1 |
| release | 29 | 24 | 0 | 5 |
| restore | 165 | 159 | 0 | 6 |
| test | 2 | 2 | 0 | 0 |

## 全ブランチ一覧

| ブランチ | コミットID | 最終更新 | 状態 | 最終コミットの件名 |
|---|---|---|---|---|
| `develop` | `77cbe06` | 2026-10-17 | develop取り込み済み | Sync final published status back to develop |
| `main` | `2d9ced3` | 2026-10-17 | main取り込み済み | Publish 2026-10-17 release status record |
| `noop` | `b2e30b9` | 2026-10-14 | main取り込み済み | Merge PR #236: public song data four-action menu v0.9 |
| `noop-do-not-use` | `61915ad` | 2026-10-12 | main取り込み済み | Merge pull request #112 from tamurayuuki46-cpu/claude/v0.2-counter-cha |
| `noop2` | `b2e30b9` | 2026-10-14 | main取り込み済み | Merge PR #236: public song data four-action menu v0.9 |
| `noop3` | `b2e30b9` | 2026-10-14 | main取り込み済み | Merge PR #236: public song data four-action menu v0.9 |
| `backup/main_before_release_docs_sync_2026-10-13` | `7751b27` | 2026-10-13 | main取り込み済み | Publish Demo Composer and Arrangement Lab from main |
| `backup/main_before_v0.4-v0.5_autotest_integration_2026-10-13` | `7930d58` | 2026-10-10 | main取り込み済み | Initial commit |
| `backup/main_before_v0.5_draft_export_fix_2026-10-13` | `c42c43d` | 2026-10-13 | main取り込み済み | Merge pull request #182 from tamurayuuki46-cpu/develop |
| `backup/main_before_v0.6_project_home_claude_link_2026-10-13` | `2cd4edf` | 2026-10-13 | main取り込み済み | Merge pull request #184 from tamurayuuki46-cpu/develop |
| `backup/main_v0.4-v0.5_before_pages-main_2026-10-13` | `44db0f6` | 2026-10-13 | main取り込み済み | Release Demo Composer v0.4-dev and Arrangement Lab v0.5-dev to main |
| `backup/sheet-home-before-inner-songdata-beginner-fix-20261015` | `605e4f4` | 2026-10-15 | main取り込み済み | ci(sheet): trigger when shared song-data browser regression changes |
| `backup/v0.13-song-data-four-actions-feature-complete` | `61b5c91` | 2026-10-14 | main取り込み済み | docs: record v0.13 song data menu release history |
| `backup/v0.13-song-data-four-actions-ready` | `ba8eef5` | 2026-10-14 | main取り込み済み | docs: add v0.13 verification checklist |
| `backup/v0.13-song-data-four-actions-ready2` | `ba8eef5` | 2026-10-14 | main取り込み済み | docs: add v0.13 verification checklist |
| `backup/v0.3-dev_v0.4.1-dev_before_songproject` | `44025d9` | 2026-10-13 | main取り込み済み | Merge PR #172: Arrangement Lab v0.4.1 PWA update fix |
| `backup/v0.4-dev_v0.4.1-dev_songproject-integrated` | `0f67fb8` | 2026-10-13 | main取り込み済み | Merge SongProject v1 integration into develop |
| `backup/v0.4-dev_v0.5-dev_songproject-integrated` | `0f67fb8` | 2026-10-13 | main取り込み済み | Merge SongProject v1 integration into develop |
| `backup/v0.9-song-data-four-actions-public-ready` | `4735a49` | 2026-10-14 | 未取り込み | chore: align public package version with v0.9-dev |
| `chatgpt/arranger-pages-fix` | `deb8a12` | 2026-10-13 | main取り込み済み | docs: record Arrangement Lab Pages fix |
| `chatgpt/arranger-v0.1` | `8c0f797` | 2026-10-13 | main取り込み済み | test(arranger): add core regression coverage |
| `chatgpt/arranger-v0.2` | `8ff7174` | 2026-10-13 | main取り込み済み | docs: record successful mobile and regression verification |
| `chatgpt/arranger-v0.3-theory` | `ab68761` | 2026-10-13 | main取り込み済み | docs: record seven-feature mobile CI and version history |
| `chatgpt/arranger-v0.4-cache-update` | `7874614` | 2026-10-13 | main取り込み済み | docs: record passing v0.4.1 PWA migration regression |
| `chatgpt/arranger-v0.4-music-labs` | `499a877` | 2026-10-13 | main取り込み済み | fix: use actual seventh tones for extended counter sustain chords |
| `chatgpt/arranger-v0.5` | `1990e01` | 2026-10-13 | main取り込み済み | docs(arranger): record passing v0.5 CI verification |
| `chatgpt/cloudflare-pages-fallback` | `861c4c8` | 2026-10-10 | main取り込み済み | docs: add Cloudflare Pages fallback deployment guide |
| `chatgpt/convergence-integration` | `8a8f957` | 2026-10-17 | main取り込み済み | Merge pull request #274 from tamurayuuki46-cpu/claude/convergence-v0.1 |
| `chatgpt/decision-progress-home-v0.16` | `aeabed1` | 2026-10-15 | main取り込み済み | fix: sync public Demo Composer version label |
| `chatgpt/divergence-mode-v0.17` | `0489b7c` | 2026-10-15 | main取り込み済み | test(arranger): update v0.5 browser version guard for v0.14-dev |
| `chatgpt/drive-backup-v0.1-feature-complete` | `ea9b8a2` | 2026-10-10 | 未取り込み | chore: remove temporary Drive backup workflow |
| `chatgpt/github-pages-fallback` | `9a56ebd` | 2026-10-10 | 未取り込み | docs: sync handoff with hosting fallback status |
| `chatgpt/public-sheet-v0.7-cardigans-weeknd` | `89c88f0` | 2026-10-14 | main取り込み済み | ci(sheet): verify public v0.7 build |
| `chatgpt/real-device-test-checklist` | `fa90471` | 2026-10-16 | 未取り込み | docs: add Arrangement Lab convergence checks |
| `chatgpt/release-docs-sync-20261013` | `2ad399b` | 2026-10-13 | main取り込み済み | docs: synchronize released versions and main publication policy |
| `chatgpt/rename-home-midi-archive-analyzer-20261015` | `fbd639d` | 2026-10-15 | main取り込み済み | test: expect MIDI Archive/Analyzer Home label |
| `chatgpt/sheet-beginner-latest-home-v0.9-20261015` | `7abcdc9` | 2026-10-15 | main取り込み済み | test(menu): identify app links by stable app ids |
| `chatgpt/sheet-beginner-latest-home-v0.9-20261015-work` | `4191a4a` | 2026-10-15 | main取り込み済み | Merge PR #245: Music Project Home decision navigator v0.16-dev |
| `chatgpt/stabilization-songproject-contracts-20261015` | `3cef3c0` | 2026-10-15 | 未取り込み | docs: align Demo Composer README with v0.15-dev |
| `chatgpt/v0.1-android-audio-fix` | `243c983` | 2026-10-10 | 未取り込み | docs: update handoff for Android audio verification |
| `chatgpt/v0.1-android-regression-check-1` | `f945c66` | 2026-10-10 | main取り込み済み | docs: record first Android regression pass |
| `chatgpt/v0.1-android-test-checklist` | `63f68af` | 2026-10-10 | 未取り込み | docs(handoff): move v0.1 to real-device test phase |
| `chatgpt/v0.1-autosave` | `5324e03` | 2026-10-10 | 未取り込み | docs(handoff): record autosave implementation |
| `chatgpt/v0.1-chord-emotion-tags` | `5c0489c` | 2026-10-12 | 未取り込み | docs: expand README for v0.1-dev |
| `chatgpt/v0.1-chord-input` | `2f23550` | 2026-10-10 | 未取り込み | docs: update current chord capabilities |
| `chatgpt/v0.1-claude-handoff` | `7368a05` | 2026-10-10 | 未取り込み | docs: update AI handoff for Claude transfer |
| `chatgpt/v0.1-demo-player` | `0820460` | 2026-10-10 | 未取り込み | docs(handoff): record Demo Player implementation |
| `chatgpt/v0.1-feature-complete` | `ce621b8` | 2026-10-10 | main取り込み済み | feat(rhythm): add beat and bar copy |
| `chatgpt/v0.1-handoff-after-pr20` | `a53c2ad` | 2026-10-10 | main取り込み済み | docs: sync handoff after PR #19 and #20 merges |
| `chatgpt/v0.1-indexeddb-save` | `24c277c` | 2026-10-10 | 未取り込み | docs(storage): document IndexedDB responsibilities |
| `chatgpt/v0.1-indexeddb-save-working` | `25dd5da` | 2026-10-10 | main取り込み済み | feat: add shared Project State foundation |
| `chatgpt/v0.1-loop-timing` | `cf63c8a` | 2026-10-10 | 未取り込み | docs: record Demo Player loop timing fix |
| `chatgpt/v0.1-melody-piano-roll` | `b19f6ff` | 2026-10-10 | 未取り込み | docs(handoff): record melody piano roll implementation |
| `chatgpt/v0.1-melody-vertical-piano` | `c01d113` | 2026-10-10 | 未取り込み | docs: record app freeze root cause and fix |
| `chatgpt/v0.1-midi-export` | `3195692` | 2026-10-10 | 未取り込み | docs(dev): require MIDI smoke test for export changes |
| `chatgpt/v0.1-project-state` | `7e9d41d` | 2026-10-10 | 未取り込み | docs: refresh README status for project state |
| `chatgpt/v0.1-rhythm-16step-grid` | `655fc14` | 2026-10-10 | 未取り込み | style(rhythm): fit 16-step grid on Android |
| `chatgpt/v0.1-rhythm-bar-copy` | `72c5bb1` | 2026-10-10 | 未取り込み | test(docs): add Rhythm beat copy checks |
| `chatgpt/v0.1-rhythm-beat-label` | `9b76fb7` | 2026-10-10 | 未取り込み | docs: record rhythm beat label fix |
| `chatgpt/v0.1-rhythm-sequencer` | `9cdaaaf` | 2026-10-10 | 未取り込み | docs(handoff): record rhythm sequencer implementation |
| `chatgpt/v0.2-backing-pattern` | `efee0b1` | 2026-10-10 | 未取り込み | feat: export chord backing patterns to MIDI |
| `chatgpt/v0.2-backing-pattern-final` | `ea5a65a` | 2026-10-10 | main取り込み済み | docs: record Backing Pattern implementation |
| `chatgpt/v0.2-backing-pattern-handoff` | `984373d` | 2026-10-10 | main取り込み済み | docs: mark Backing Pattern deploy complete |
| `chatgpt/v0.2-backing-pattern-integration` | `8b2c710` | 2026-10-10 | 未取り込み | docs: define Backing Pattern architecture |
| `chatgpt/v0.2-bass-style-5ways` | `636d73b` | 2026-10-11 | main取り込み済み | Update handoff for five bass candidate styles |
| `chatgpt/v0.2-chord-mood-tags` | `10fae1d` | 2026-10-12 | 未取り込み | docs: add chord mood tag design note |
| `chatgpt/v0.2-chord-mood-ui` | `27c9cfe` | 2026-10-12 | 未取り込み | docs(chord): mark mood tag UI implemented |
| `chatgpt/v0.2-chord-presets` | `c1b8c17` | 2026-10-10 | main取り込み済み | docs: update handoff for chord preset work |
| `chatgpt/v0.2-chord-presets-handoff` | `5cdee7b` | 2026-10-10 | main取り込み済み | docs: finalize handoff after chord preset merge |
| `chatgpt/v0.2-chord-song-examples` | `76a5460` | 2026-10-12 | main取り込み済み | Document chord preset song reference policy |
| `chatgpt/v0.2-chord-types` | `cce7565` | 2026-10-10 | 未取り込み | docs: update handoff for v0.2 chord quality work |
| `chatgpt/v0.2-composition-intent-core` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `chatgpt/v0.2-composition-intent-handoff` | `b1344b0` | 2026-10-12 | 未取り込み | docs: hand off Hub to Chord composition intent |
| `chatgpt/v0.2-counter-active-harmony` | `d2d5891` | 2026-10-11 | main取り込み済み | docs: describe Ayase active harmony colors |
| `chatgpt/v0.2-counter-answer-style` | `d9f18ac` | 2026-10-11 | 未取り込み | docs: add counter Answer style changelog |
| `chatgpt/v0.2-counter-answer-style-rebase` | `d1730bc` | 2026-10-11 | main取り込み済み | feat: rebase Answer counter melody style onto current develop |
| `chatgpt/v0.2-counter-style-3ways` | `2617330` | 2026-10-11 | main取り込み済み | docs: update counter melody schema notes |
| `chatgpt/v0.2-counter-style-changelog` | `ed4d828` | 2026-10-11 | main取り込み済み | docs: sync changelog with counter melody styles |
| `chatgpt/v0.2-diatonic-fan-handoff` | `26cb24c` | 2026-10-10 | main取り込み済み | docs: finalize handoff after diatonic fan UI |
| `chatgpt/v0.2-diatonic-fan-ui` | `e427901` | 2026-10-10 | main取り込み済み | docs: record diatonic fan UI change |
| `chatgpt/v0.2-drive-share-button-fix` | `47c438a` | 2026-10-12 | 未取り込み | Docs: Drive export button feedback behavior |
| `chatgpt/v0.2-drive-share-button-fix-v2` | `758cd4b` | 2026-10-12 | main取り込み済み | Docs: Drive export button feedback behavior |
| `chatgpt/v0.2-drive-share-export` | `5dea70c` | 2026-10-12 | 未取り込み | Fix: avoid Drive export sync observer loop |
| `chatgpt/v0.2-drive-share-export-v2` | `3f0a297` | 2026-10-12 | main取り込み済み | Docs: record Drive export design |
| `chatgpt/v0.2-handoff-after-integration` | `29bb3fe` | 2026-10-10 | main取り込み済み | docs: sync handoff after v0.2 integration |
| `chatgpt/v0.2-handoff-stable-reference` | `c48aab4` | 2026-10-10 | main取り込み済み | docs: record v0.2 integration commit without moving HEAD reference |
| `chatgpt/v0.2-handoff-sync-answer` | `74677e6` | 2026-10-11 | main取り込み済み | docs: sync AI handoff with Answer counter melody style |
| `chatgpt/v0.2-hub-chord-intent` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `chatgpt/v0.2-hub-chord-intent-final` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `chatgpt/v0.2-hub-chord-intent-impl` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `chatgpt/v0.2-hub-chord-intent-link` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `chatgpt/v0.2-hub-chord-intent-work` | `469de24` | 2026-10-12 | 未取り込み | docs: mark Hub mood inheritance implemented |
| `chatgpt/v0.2-hub-part-clear` | `ba10d83` | 2026-10-12 | main取り込み済み | Document Hub per-part clear |
| `chatgpt/v0.2-integrate-chord-rhythm` | `4cf345f` | 2026-10-10 | main取り込み済み | v0.2: integrate chord qualities and rhythm presets |
| `chatgpt/v0.2-key-change-fix` | `d6ba365` | 2026-10-10 | main取り込み済み | docs: explain Hub key transposition |
| `chatgpt/v0.2-key-change-handoff` | `695a1d2` | 2026-10-10 | main取り込み済み | docs: finalize handoff after Hub key-change fix |
| `chatgpt/v0.2-melodic-functions` | `1fe8733` | 2026-10-11 | 未取り込み | Update AI handoff for melodic function analysis |
| `chatgpt/v0.2-melodic-functions-docs` | `7d9eb22` | 2026-10-11 | main取り込み済み | Record melodic function analysis in changelog |
| `chatgpt/v0.2-melodic-functions-rebase` | `06a1368` | 2026-10-11 | main取り込み済み | Rebase melodic function analysis onto latest develop |
| `chatgpt/v0.2-melody-ab-20261012` | `09dd81e` | 2026-10-12 | main取り込み済み | feat: compare one-bar melody candidates before adoption |
| `chatgpt/v0.2-melody-candidate-refresh` | `5989ff8` | 2026-10-11 | main取り込み済み | test: cover melody candidate refresh variants |
| `chatgpt/v0.2-melody-candidate-refresh-handoff` | `f03da6b` | 2026-10-11 | 未取り込み | docs: record Melody candidate refresh |
| `chatgpt/v0.2-melody-candidate-refresh-handoff-final` | `2bd81a1` | 2026-10-11 | main取り込み済み | docs: record Melody candidate refresh |
| `chatgpt/v0.2-melody-candidates` | `3ebbef3` | 2026-10-10 | 未取り込み | docs: update changelog for Melody candidates |
| `chatgpt/v0.2-melody-candidates-final` | `ed4aa40` | 2026-10-10 | main取り込み済み | docs: integrate Melody candidates with drum fill changelog |
| `chatgpt/v0.2-melody-candidates-handoff` | `35f1205` | 2026-10-10 | main取り込み済み | docs: finalize Melody candidate handoff |
| `chatgpt/v0.2-melody-degree-analysis` | `4a25728` | 2026-10-11 | 未取り込み | docs: record melody degree analysis handoff |
| `chatgpt/v0.2-melody-degree-analysis-changelog` | `3998ce4` | 2026-10-11 | main取り込み済み | docs: add melody degree analysis changelog |
| `chatgpt/v0.2-melody-degree-analysis-v2` | `7d8022d` | 2026-10-11 | main取り込み済み | docs: record melody degree analysis handoff |
| `chatgpt/v0.2-melody-perspectives` | `f0933ac` | 2026-10-11 | main取り込み済み | Record melody perspective guide |
| `chatgpt/v0.2-melody-perspectives-handoff` | `113dc20` | 2026-10-11 | main取り込み済み | Mark Melody perspective guide merged |
| `chatgpt/v0.2-new-project` | `4500374` | 2026-10-11 | 未取り込み | Add Hub new-project action |
| `chatgpt/v0.2-new-project-final` | `5001c1d` | 2026-10-11 | main取り込み済み | [skip ci] Remove one-time docs updater |
| `chatgpt/v0.2-project-library-counter-clear` | `0115eed` | 2026-10-12 | 未取り込み | Refresh AI handoff for Project library work |
| `chatgpt/v0.2-project-list-counter-clear` | `e9e8c67` | 2026-10-12 | main取り込み済み | AI引き継ぎをProject一覧と裏メロ消去へ更新 |
| `chatgpt/v0.2-project-list-handoff` | `e8b0179` | 2026-10-12 | main取り込み済み | Mark Project list as integrated in AI handoff |
| `chatgpt/v0.2-rhythm-presets` | `532db60` | 2026-10-10 | 未取り込み | docs: add rhythm presets to v0.2 roadmap |
| `chatgpt/v0.2-sound-sketch-handoff` | `75a0d64` | 2026-10-10 | main取り込み済み | docs: finalize handoff after Sound Sketch Lite integration |
| `chatgpt/v0.2-sound-sketch-integration` | `402946c` | 2026-10-10 | main取り込み済み | docs: record Sound integration without losing Arrange and Undo history |
| `chatgpt/v0.2-sound-sketch-lite` | `38d19a8` | 2026-10-10 | 未取り込み | docs: reflect early Sound Sketch Lite in roadmap |
| `chatgpt/v0.3-audio-loop-seam-20261013` | `3bbf912` | 2026-10-13 | main取り込み済み | docs: document seamless loop scheduling |
| `chatgpt/v0.3-audio-pop-fix-20261013` | `ffb03db` | 2026-10-13 | main取り込み済み | docs: record Android playback pop fix |
| `chatgpt/v0.3-decision-support-20261012` | `eb6ea91` | 2026-10-12 | main取り込み済み | feat: add v0.3 songwriting decisions and safe A/B workflow |
| `chatgpt/v0.3-midi-interop-regression-20261012` | `c75616a` | 2026-10-12 | main取り込み済み | test: strengthen MIDI DAW interoperability checks |
| `chatgpt/v0.3-pages-redeploy-20261012` | `7d28188` | 2026-10-12 | main取り込み済み | docs: record Pages redeploy for v0.3 touch UI |
| `chatgpt/v0.3-verified-ui-20261012` | `371672d` | 2026-10-12 | main取り込み済み | Improve decision controls touch targets and record v0.3 verification |
| `chatgpt/v0.3-versioned-assets-20261012` | `8eeb9f9` | 2026-10-12 | main取り込み済み | fix: load all deployed modules from the same build |
| `chatgpt/v0.5-cloud-browser-fix` | `decbb68` | 2026-10-13 | main取り込み済み | fix: align Demo export controls with Draft.mid (v0.5-dev) |
| `chatgpt/v0.6-project-home-claude-link` | `64bfa40` | 2026-10-13 | main取り込み済み | chore: align package version with v0.6-dev |
| `chatgpt/v0.6-release-docs` | `365b577` | 2026-10-13 | main取り込み済み | Merge Project Home Claude Artifact link v0.6-dev |
| `chatgpt/v0.7-root-pwa` | `4cba87b` | 2026-10-13 | main取り込み済み | docs: sync README with v0.7 root PWA |
| `chatgpt/v0.9-arrangement-lineage-fork` | `eda2ece` | 2026-10-13 | 未取り込み | docs: record lineage-aware SongProject fork |
| `chatgpt/v0.9-docs-sync` | `9980752` | 2026-10-13 | main取り込み済み | docs: sync v0.8-v0.9 version history |
| `chatgpt/v0.9-handoff-finalize` | `bca4b54` | 2026-10-13 | main取り込み済み | docs: finalize v0.9 handoff after integration |
| `chatgpt/v0.9-vocal-workflow-completion` | `ac33051` | 2026-10-13 | main取り込み済み | docs: align README with v0.9 workflow |
| `chatgpt/workflow-boundary-cleanup` | `a1b2671` | 2026-10-13 | main取り込み済み | docs: define Arrangement Lab workflow boundary |
| `chatgpt/workflow-boundary-phase2` | `ffedad8` | 2026-10-13 | 未取り込み | docs: mark lineage-aware arrangement fork implemented |
| `chore/arranger-v0.13-metadata` | `c347957` | 2026-10-14 | main取り込み済み | fix(arranger): finalize v0.13 export metadata and timbre regressions |
| `chore/main-autotest-stabletag-policy` | `fcc9803` | 2026-10-13 | main取り込み済み | docs: record main and stable-tag policy |
| `chore/main-ci-gates` | `cd453b8` | 2026-10-13 | main取り込み済み | ci: add post-merge main release check |
| `chore/pages-from-main` | `9c943a4` | 2026-10-13 | main取り込み済み | docs: define main as Pages deployment source |
| `chore/post-integration-verification` | `cccb2c0` | 2026-10-13 | 未取り込み | docs: record post-integration regression verification |
| `claude/ci-build-check-develop` | `7417125` | 2026-10-17 | main取り込み済み | ci: run build check on PRs to develop |
| `claude/convergence-contract-usage` | `62e9466` | 2026-10-17 | main取り込み済み | docs: add call order, usage and error behavior to convergence contract |
| `claude/convergence-core` | `fab3a6c` | 2026-10-17 | 未取り込み | feat(arranger): dirty tracking via fingerprint diff at the edit entry  |
| `claude/convergence-core-followup` | `a2cf687` | 2026-10-17 | main取り込み済み | Merge develop into claude/convergence-core-followup (pick up build che |
| `claude/convergence-v0.15-review` | `0ac9f27` | 2026-10-17 | main取り込み済み | fix(arranger): keep dirty marks on Undo and surface rollback failure ( |
| `claude/handoff-sync-20261017` | `2c16478` | 2026-10-17 | main取り込み済み | docs: AI_HANDOFF.mdを現状(v0.17-dev / Lab v0.15-dev)に同期し、標準書式の先頭セクションを追加 |
| `claude/real-device-one-song` | `047914b` | 2026-10-17 | main取り込み済み | docs: add Keep persistence and Analyzer/Archive checks to the real-son |
| `claude/real-device-test-g` | `73836ef` | 2026-10-17 | main取り込み済み | docs: add convergence real-device G chapter addendum with steps and re |
| `claude/real-device-verification-20261017` | `77cbe06` | 2026-10-17 | develop取り込み済み | Sync final published status back to develop |
| `claude/sheet-markdown-export` | `c43d248` | 2026-10-13 | 未取り込み | docs: 作曲シートをMarkdownで docs/sheet/ に移行 |
| `claude/v0.1-handoff-after-integration` | `7debc91` | 2026-10-10 | main取り込み済み | docs: mark feature-complete integration done in handoff |
| `claude/v0.1-integrate-feature-complete` | `880a16d` | 2026-10-10 | main取り込み済み | feat: integrate v0.1 feature-complete UI into develop |
| `claude/v0.1-melody-16th-toggle` | `86ad69d` | 2026-10-10 | main取り込み済み | feat(melody): switch between 8th and 16th note input |
| `claude/v0.1-review` | `27dc317` | 2026-10-10 | main取り込み済み | chore: initialize Demo Composer v0.1-dev foundation |
| `claude/v0.18-divergence-keep-persist` | `094584b` | 2026-10-17 | main取り込み済み | feat(divergence): persist sessions in IndexedDB and add Keep library |
| `claude/v0.2-analyzer` | `02cd6ad` | 2026-10-10 | main取り込み済み | Docs: Melody Analyzer and song card spec, checklist, handoff |
| `claude/v0.2-arrange-sections` | `c82c11d` | 2026-10-10 | 未取り込み | Arrange画面(曲の構成)・Section再生・MIDIマーカー・ドキュメントを追加 |
| `claude/v0.2-arrange-sections-2` | `03f71f1` | 2026-10-10 | main取り込み済み | Arrange画面(曲の構成)・Section再生・MIDIマーカー・ドキュメントを追加 |
| `claude/v0.2-audio-smooth` | `b8869e6` | 2026-10-12 | main取り込み済み | Audio: 出力バッファをplaybackにして音切れ・ざらつきを出にくくする |
| `claude/v0.2-audition` | `959dc65` | 2026-10-12 | main取り込み済み | 候補の▶聴く（曲想一覧・Chord Preset・Melody候補） |
| `claude/v0.2-bass-pitch` | `83ff055` | 2026-10-10 | main取り込み済み | Rhythm: Bassの音程選択(ルート/3度/5度/7度/オクターブ)を追加 |
| `claude/v0.2-bass-shift` | `23880e9` | 2026-10-10 | main取り込み済み | Rhythm: Bassの半音ずらしと主役/飾りの色分けを追加 |
| `claude/v0.2-candidates` | `839d393` | 2026-10-10 | main取り込み済み | Add borrowed-chord spice candidates to Chord screen |
| `claude/v0.2-character-idioms` | `8401d74` | 2026-10-12 | main取り込み済み | Counter melody: scale-specific character idioms |
| `claude/v0.2-chord-extended` | `3cdd15d` | 2026-10-12 | main取り込み済み | Chord: 35 qualities + scale-family chord sets (diatonic / harmonic min |
| `claude/v0.2-chord-mood-collapse` | `d08ceaf` | 2026-10-12 | main取り込み済み | Chord曲想: 感情/質感/場面を閉じたタブにして未選択を追加 |
| `claude/v0.2-chord-mood-multi` | `dce1b88` | 2026-10-12 | main取り込み済み | Chord曲想: 3案絞り込みをタブ選択へ統合、複数選択・選択中の常時表示・タグデザイン刷新 |
| `claude/v0.2-chord-mood-tabs` | `0a9c2fe` | 2026-10-12 | main取り込み済み | Chord曲想: 曲想/質感/場面の3タブ、各1タグで一覧 |
| `claude/v0.2-chord-presets-100` | `1306c16` | 2026-10-11 | 未取り込み | feat: add 7th and borrowed-chord presets (126 total) |
| `claude/v0.2-chord-quality-notice` | `290e1e4` | 2026-10-12 | main取り込み済み | docs: note Claude is extending Chord qualities (avoid conflicts) |
| `claude/v0.2-chord-root-degree` | `ab36f60` | 2026-10-12 | main取り込み済み | feat: show key degree name next to each root note in Chord root select |
| `claude/v0.2-clear-all` | `6af8cf8` | 2026-10-12 | main取り込み済み | Chord: 全てのMIDIをクリアするボタン |
| `claude/v0.2-copy-progress` | `cac0526` | 2026-10-10 | main取り込み済み | Add chord tone highlight to Melody grid |
| `claude/v0.2-counter-character` | `378d5c5` | 2026-10-12 | main取り込み済み | Counter melody: scale character-tone phrase with scale picker |
| `claude/v0.2-counter-character-first` | `3d781d3` | 2026-10-12 | main取り込み済み | 裏メロ: Characterを候補の先頭に表示 |
| `claude/v0.2-counter-melody` | `487c42f` | 2026-10-11 | main取り込み済み | Merge develop into claude/v0.2-counter-melody |
| `claude/v0.2-counter-motion` | `65c5d5c` | 2026-10-12 | main取り込み済み | Counter melody: Motion (contrary/parallel/pedal) |
| `claude/v0.2-counter-penta` | `261560d` | 2026-10-12 | main取り込み済み | Counter melody: Minor/Major Pentatonic hook styles |
| `claude/v0.2-counter-penta-key` | `5d3cd5d` | 2026-10-12 | main取り込み済み | 裏メロ: 他のKeyのペンタ生成と別案(音域/間引き/後ノリ) |
| `claude/v0.2-counter-pianoroll` | `fa84f7e` | 2026-10-12 | main取り込み済み | Melody Piano Roll: 裏メロを手直しできるメイン/裏メロ切替 |
| `claude/v0.2-counter-tab` | `ad2b19b` | 2026-10-12 | main取り込み済み | Counter melody tab + Arpeggio and Riff styles |
| `claude/v0.2-degree-colors-sections` | `0b9ef88` | 2026-10-12 | main取り込み済み | Analyzer: 度数バーの役割色分けとSection別コード度数比較 |
| `claude/v0.2-drive-feedback` | `c8f7569` | 2026-10-12 | main取り込み済み | Hub: Drive共有ボタンの結果をボタン直下に表示し、保存確認を直接読むよう修正 |
| `claude/v0.2-drive-share-types` | `c13e84b` | 2026-10-12 | main取り込み済み | Hub Drive: 共有不可の拡張子に対応（project.json.txtで共有、MIDIは保存→Driveアプリ案内） |
| `claude/v0.2-drive-sync-share` | `50e392d` | 2026-10-12 | main取り込み済み | Hub: Drive共有をタップ直後に同期的に開始（NotAllowedError対策） |
| `claude/v0.2-drum-fill` | `78aad3d` | 2026-10-10 | main取り込み済み | Add drum fill for section ends |
| `claude/v0.2-export-individual` | `36d7323` | 2026-10-12 | main取り込み済み | Hub Export: CounterMelody.mid個別ボタン・結果表示・Drive個別共有 |
| `claude/v0.2-export-toggle-state` | `da006d5` | 2026-10-12 | main取り込み済み | Hub Export/AI相談: 開いている間の押下状態を分かりやすく |
| `claude/v0.2-fix-player` | `01d1c42` | 2026-10-12 | main取り込み済み | Keep Demo Player above bottom nav; share vibrato LFO per note |
| `claude/v0.2-floating-candidate` | `2fd4bb1` | 2026-10-12 | main取り込み済み | Melody候補 浮遊感: 長い音の余白をなくし、切れ目なく動く形にする |
| `claude/v0.2-font-size` | `c656e89` | 2026-10-10 | main取り込み済み | Add 3-level text size setting in Hub |
| `claude/v0.2-handoff-next` | `7384b1e` | 2026-10-12 | main取り込み済み | Docs: refresh next steps in handoff |
| `claude/v0.2-hub-memo` | `28b3509` | 2026-10-10 | main取り込み済み | Add Cubase to-do memo and consult templates to Hub |
| `claude/v0.2-integration` | `7398293` | 2026-10-11 | main取り込み済み | Merge #65 section compare into integration |
| `claude/v0.2-learning-labels` | `080d374` | 2026-10-10 | main取り込み済み | Add chord role labels and melody degree display |
| `claude/v0.2-loop-live-update` | `95a3624` | 2026-10-11 | main取り込み済み | Fix Demo Player loop to reload latest project each cycle |
| `claude/v0.2-loop-to-song` | `b2745f5` | 2026-10-11 | main取り込み済み | Add loop-to-song guide to Arrange |
| `claude/v0.2-melody-degrees` | `86bd1bf` | 2026-10-12 | main取り込み済み | Melody鍵盤にコード度数とKey度数を表示 |
| `claude/v0.2-melody-pitch-colors` | `34a5ce8` | 2026-10-12 | main取り込み済み | feat: color Melody Piano Roll by pitch role (chord/tension/outside/avo |
| `claude/v0.2-melody-to-chords` | `7e7b28f` | 2026-10-10 | main取り込み済み | Add melody-to-chord candidates (3 per bar) to Chord screen |
| `claude/v0.2-melody-tonic-bottom` | `b5c39f5` | 2026-10-12 | main取り込み済み | Melody Piano Roll: Keyの主音を一番下に |
| `claude/v0.2-melody-variation` | `d8c2b47` | 2026-10-11 | main取り込み済み | Merge develop into melody-variation |
| `claude/v0.2-melody-voice` | `0949f64` | 2026-10-12 | main取り込み済み | Sound: vocaloid-style melody voice, more presets, softer melody level |
| `claude/v0.2-midi-share-txt` | `f293d77` | 2026-10-12 | main取り込み済み | Hub Drive: MIDIを .mid.txt として共有画面から送れるようにする |
| `claude/v0.2-mood-favorites` | `4d7a5a6` | 2026-10-12 | main取り込み済み | Chord曲想: タグ組み合わせのお気に入り（端末保存） |
| `claude/v0.2-mood-list` | `f447777` | 2026-10-12 | main取り込み済み | Chord: 曲想を1つ選んで進行を一覧にする |
| `claude/v0.2-more-scales` | `7678d5a` | 2026-10-12 | main取り込み済み | Chord: many more scales (modes, spanish, whole tone, pentatonic, blues |
| `claude/v0.2-note-degrees` | `1897b94` | 2026-10-12 | main取り込み済み | Melody: 置いた音に度数表示、Analyzerに度数使用率バー |
| `claude/v0.2-note-length` | `637820a` | 2026-10-10 | main取り込み済み | 音の長さボタンを1段に収め、鍵盤グリッドが下がりすぎないようにする |
| `claude/v0.2-part-select` | `18de034` | 2026-10-12 | main取り込み済み | Demo Player: パートを個別に選んで鳴らせるよう整理（✓表示・全部OFF・全部鳴らす） |
| `claude/v0.2-parts-consult` | `82b9c05` | 2026-10-10 | main取り込み済み | Demo Playerのパート聴き分け(ミュート/ソロ)とHubのAI相談用テキストコピーを追加 |
| `claude/v0.2-penta-docs` | `a80e28b` | 2026-10-12 | main取り込み済み | Docs: pentatonic hook styles |
| `claude/v0.2-phrase-energy` | `f21c697` | 2026-10-12 | main取り込み済み | Phrase melody: energy link (Low/Mid/High, auto from Section) |
| `claude/v0.2-phrase-flavor` | `520a3f2` | 2026-10-12 | main取り込み済み | Phrase melody: flavors (2nd/6th, dense) and scale colour |
| `claude/v0.2-phrase-melody` | `dc2199d` | 2026-10-12 | main取り込み済み | Melody: 4-bar phrase generator on the Chord screen (3 forms, contour c |
| `claude/v0.2-preset-chordnames` | `f196f26` | 2026-10-12 | main取り込み済み | Chord Preset: 選択肢にいまのKeyでのコード名を表示 |
| `claude/v0.2-preset-moodtags` | `e35112d` | 2026-10-12 | main取り込み済み | Chord Preset: 選択肢に曲想・質感・場面のタグを表示 |
| `claude/v0.2-progression-library` | `2d07ced` | 2026-10-10 | main取り込み済み | Docs: progression library checklist and handoff |
| `claude/v0.2-project-import` | `4244be0` | 2026-10-10 | main取り込み済み | project.json読み込みを追加(検証・Migration・確認・Undo可) |
| `claude/v0.2-scale-tension-filter` | `d5ebf21` | 2026-10-12 | main取り込み済み | Chord: tension level lists every in-scale tension chord per degree |
| `claude/v0.2-section-compare` | `ecb008d` | 2026-10-10 | main取り込み済み | Add per-section melody comparison to Melody Analyzer |
| `claude/v0.2-section-energy` | `c413a57` | 2026-10-10 | main取り込み済み | Add Section Energy and Transition tags to Arrange |
| `claude/v0.2-section-tone-jump` | `ebadace` | 2026-10-12 | main取り込み済み | Analyzer: Section別の構成音率/スケール外率、度数バーから小節へジャンプ |
| `claude/v0.2-section-variation` | `7834711` | 2026-10-10 | main取り込み済み | Add Section Variation candidates to Arrange |
| `claude/v0.2-sheet-link` | `011e417` | 2026-10-12 | main取り込み済み | Hub: 作曲シートへのリンクを端末だけに保存して開けるようにする |
| `claude/v0.2-skeleton-entries` | `a8909ac` | 2026-10-11 | main取り込み済み | Docs for skeleton entry points |
| `claude/v0.2-sound-defaults` | `2939913` | 2026-10-12 | main取り込み済み | Sound初期設定を Pad / Deep Bass / Strings Lead(Natural) に変更 |
| `claude/v0.2-starting-point` | `0c9cd7e` | 2026-10-11 | main取り込み済み | Merge pull request #64 from tamurayuuki46-cpu/claude/v0.2-starting-poi |
| `claude/v0.2-starting-point-preview` | `fa8a8ee` | 2026-10-10 | main取り込み済み | Docs for starting point audition |
| `claude/v0.2-undo` | `2b13cbf` | 2026-10-10 | 未取り込み | Merge pull request #37 from tamurayuuki46-cpu/claude/v0.2-arrange-sect |
| `claude/v0.2-update-notice` | `0e22e57` | 2026-10-12 | main取り込み済み | 更新通知: ビルドID表示と新しい版バナー |
| `claude/v0.2-vercel-off` | `7908b55` | 2026-10-10 | main取り込み済み | Vercelの自動配信を停止(vercel.jsonのgit.deploymentEnabled=false)。公開確認はGitHub Pa |
| `claude/v0.3-skeleton-plan` | `67d988f` | 2026-10-11 | main取り込み済み | docs: add v0.3 skeleton-building plan (recipes) and roadmap entry |
| `claude/v0.3-skeleton-plan-2` | `c04f5be` | 2026-10-11 | main取り込み済み | docs: extend v0.3 skeleton plan to 23 ideas |
| `claude/v0.3-skeleton-plan-3` | `2788b85` | 2026-10-11 | main取り込み済み | docs: answer ChatGPT's 15-point design review in v0.3 skeleton plan |
| `claude/v0.3-skeleton-recipes` | `359021e` | 2026-10-12 | main取り込み済み | v0.3 skeleton support (A+B): recipes, later/next, why, empty-section a |
| `docs/published-reconciliation-sync-20261015` | `54a702c` | 2026-10-15 | main取り込み済み | docs: record published reconciliation state |
| `docs/published-status-20261017` | `da9871f` | 2026-10-17 | main取り込み済み | docs: record 2026-10-17 public release status |
| `feature/ai-monitoring-v0.15-20261014` | `ce2036e` | 2026-10-14 | main取り込み済み | test: make PWA version check follow VERSION |
| `feature/arranger-beginner-flow-v0.6` | `af219ce` | 2026-10-14 | 未取り込み | test(arranger): wait for guided smooth navigation to settle |
| `feature/arranger-preserve-demo-sound-v0.13` | `08c7d26` | 2026-10-14 | main取り込み済み | docs(arranger): document Demo Composer timbre preservation |
| `feature/arranger-preserve-sound-v0.13` | `588fe3a` | 2026-10-14 | 未取り込み | ci(arranger): verify v0.13 sound preservation |
| `feature/beginner-guided-flow` | `7e057a3` | 2026-10-13 | main取り込み済み | test: open more-to-try before advanced navigation |
| `feature/composition-sheet-full-v0.4` | `4324b2d` | 2026-10-14 | main取り込み済み | feat(sheet): build complete v0.4 workbook from all 31 source sheets |
| `feature/composition-sheet-json-v0.1` | `5625762` | 2026-10-13 | 未取り込み | ci(sheet): verify mobile sheet and static build output |
| `feature/json-handoff-guide-v0.1` | `66c924a` | 2026-10-14 | 未取り込み | test: align PWA version check with v0.10 |
| `feature/mobile-first-flow-v0.11` | `475a631` | 2026-10-14 | main取り込み済み | docs: define mobile-first workflow and one-bar arrangement rule |
| `feature/onebar-chordonly-reharm-20261014` | `385e017` | 2026-10-14 | main取り込み済み | test(arranger): sync beginner browser regression with v0.10 |
| `feature/onebar-reharm-20261014` | `a5db6c5` | 2026-10-14 | main取り込み済み | test(arranger): align legacy browser regression with v0.9 UI |
| `feature/preserve-source-timbre-v0.13` | `d9bce3d` | 2026-10-14 | 未取り込み | test(arranger): emulate rich Sound Sketch Web Audio in mobile regressi |
| `feature/project-home-decision-navigator-v0.16` | `d76b2c1` | 2026-10-15 | main取り込み済み | test(project-home): follow current-stage decision priority |
| `feature/project-home-quick-flow` | `eed0b3d` | 2026-10-13 | main取り込み済み | fix(project-home): preserve final DAW workflow note |
| `feature/project-home-sheet-top` | `0fecee1` | 2026-10-13 | main取り込み済み | test(project-home): verify top Composition Sheet entry |
| `feature/section-audition-v0.12` | `ee8dbf4` | 2026-10-14 | 未取り込み | docs: fold regression details into sound preservation spec |
| `feature/shared-song-project` | `9127429` | 2026-10-13 | main取り込み済み | test: ignore expected network error during offline PWA check |
| `feature/sheet-first-summary-v0.6` | `5d3ff61` | 2026-10-14 | main取り込み済み | fix: accept Drive-shared JSON text backups in Project Home |
| `feature/sheet-manual-ideas-v0.8-20261014` | `9dea8f2` | 2026-10-15 | main取り込み済み | docs(sheet): record v0.8 CI fixes |
| `feature/sheet-tabs-v0.5` | `ab915af` | 2026-10-14 | main取り込み済み | feat(sheet): use visible grouped tabs for all 31 sheets in v0.5 |
| `feature/song-data-four-actions-v0.13` | `bcf6ade` | 2026-10-14 | main取り込み済み | test: update browser coverage for four-action song data menu |
| `feature/song-data-menu-v0.12` | `48ad11e` | 2026-10-14 | main取り込み済み | test: align PWA cache smoke test with v0.12 song data menu |
| `feature/song-memo-v0.13` | `95a6498` | 2026-10-14 | 未取り込み | chore: sync v0.13 package and syntax checks |
| `feature/song-memo-v0.14` | `aaf2a69` | 2026-10-14 | main取り込み済み | docs: add v0.14 song memo changelog |
| `feature/songproject-unification` | `8ab5051` | 2026-10-13 | main取り込み済み | fix: preserve legacy Demo project input while linking canonical SongPr |
| `fix/arranger-preview-v0.11` | `3072165` | 2026-10-14 | main取り込み済み | test(arranger): align core version expectation to v0.11-dev |
| `fix/beginner-extra-navigation` | `da7fb43` | 2026-10-13 | main取り込み済み | test: cover optional detour return flow |
| `fix/home-private-sheet-link` | `697c3ab` | 2026-10-14 | main取り込み済み | fix(home): connect private full workbook and explicit JSON handoff |
| `fix/project-home-daw-ready-export-tracking-20261015` | `63bc5c2` | 2026-10-15 | main取り込み済み | test(home): distinguish arrangement adoption from MIDI export readines |
| `integration/main-develop-reconcile-20261015` | `8a73fcb` | 2026-10-15 | main取り込み済み | docs: record Project Home final verification |
| `milestone/v0.1-core-complete` | `9392010` | 2026-10-10 | main取り込み済み | feat: add autosave |
| `milestone/v0.1-feature-complete` | `655fc14` | 2026-10-10 | 未取り込み | style(rhythm): fit 16-step grid on Android |
| `milestone/v0.17-divergence-ci-green-2026-10-15` | `0489b7c` | 2026-10-15 | main取り込み済み | test(arranger): update v0.5 browser version guard for v0.14-dev |
| `milestone/v0.3-decision-support` | `bc53dbd` | 2026-10-12 | main取り込み済み | Merge pull request #160 from tamurayuuki46-cpu/chatgpt/v0.3-decision-s |
| `release/arranger-beginner-flow-v0.6` | `efe3d03` | 2026-10-14 | 未取り込み | release: prepare Arrangement Lab v0.6 beginner flow |
| `release/arranger-v0.10-20261014` | `272513a` | 2026-10-14 | main取り込み済み | release(arranger): publish v0.10 chord-only handoff fix |
| `release/arranger-v0.11-preview-20261014` | `07fada5` | 2026-10-14 | main取り込み済み | release(arranger): publish v0.11 audible chord preview fix |
| `release/arranger-v0.12-section-audition-20261014` | `b9c2738` | 2026-10-14 | main取り込み済み | release(arranger): publish v0.12 Section audition candidate |
| `release/arranger-v0.6-beginner-flow` | `a818b29` | 2026-10-14 | 未取り込み | test: align v0.5 browser regression with v0.6 UI version |
| `release/arranger-v0.9-20261014` | `a18a1e0` | 2026-10-14 | main取り込み済み | ci: remove unrelated song data menu test from v0.9 release |
| `release/arranger-v0.9-20261014-duplicate-check` | `d0b4fb5` | 2026-10-14 | main取り込み済み | release: publish Arrangement Lab v0.9 one-bar reharm |
| `release/beginner-guided-flow` | `7c115c3` | 2026-10-13 | main取り込み済み | ci: test beginner guided flow |
| `release/demo-v0.15-arranger-v0.13-public-20261015` | `21b3cf2` | 2026-10-15 | main取り込み済み | ci: align AI monitoring release check with public main |
| `release/docs-sync-v0.7-20261014` | `8266ed6` | 2026-10-14 | main取り込み済み | docs: record current v0.7 public release |
| `release/handoff-bootstrap-v0.16.1` | `33e1521` | 2026-10-16 | main取り込み済み | fix: initialize receiver before handoff and retain release build label |
| `release/handoff-integrity-20261016` | `3ce1057` | 2026-10-16 | main取り込み済み | test: validate release version consistency without hardcoded number |
| `release/home-private-sheet-link` | `1a5fc2f` | 2026-10-14 | main取り込み済み | fix(home): connect private full workbook and explicit JSON handoff |
| `release/json-handoff-guide-v0.10` | `79710df` | 2026-10-14 | 未取り込み | docs: add public v0.7 handoff changelog |
| `release/mobile-first-flow-v0.8` | `6935755` | 2026-10-14 | main取り込み済み | docs: define public mobile-first workflow |
| `release/project-home-quick-flow` | `1ce823c` | 2026-10-13 | main取り込み済み | test(project-home): cover compact workflow links |
| `release/project-home-sheet-top` | `6350ca9` | 2026-10-13 | main取り込み済み | test(project-home): verify Composition Sheet top link |
| `release/project-home-v0.16-public-20261015` | `45e0d8b` | 2026-10-15 | main取り込み済み | Document Project Home decision navigator |
| `release/sheet-app-v0.1` | `c5cca00` | 2026-10-13 | 未取り込み | feat: add Composition Sheet v0.1 release files |
| `release/sheet-summary-v0.6` | `be2e0da` | 2026-10-14 | main取り込み済み | fix: accept Drive-shared JSON text backups in Project Home |
| `release/sheet-v0.8-20261015` | `1ed02c4` | 2026-10-15 | main取り込み済み | docs(sheet): mark v0.8 public release candidate |
| `release/sheet-v0.9-home-latest-public-20261015` | `673687f` | 2026-10-15 | main取り込み済み | build(sheet): stamp latest sheet modules with release build id |
| `release/song-data-four-actions-public-v0.9` | `10cf615` | 2026-10-14 | main取り込み済み | release: prepare public four-action song data menu v0.9 |
| `release/song-data-four-actions-v0.9` | `4735a49` | 2026-10-14 | 未取り込み | chore: align public package version with v0.9-dev |
| `release/song-data-menu-public-20261014` | `15f380f` | 2026-10-14 | main取り込み済み | ci: validate public song data menu release patch |
| `release/song-memo-public-v0.10-20261014` | `621bd8b` | 2026-10-14 | main取り込み済み | docs: document public song memo behavior |
| `release/songproject-unification` | `72311b3` | 2026-10-13 | main取り込み済み | release: backport canonical SongProject v1 exchange |
| `release/v0.17-arranger-v0.15-publish-20261017` | `9124d41` | 2026-10-17 | main取り込み済み | Merge pull request #276 from tamurayuuki46-cpu/claude/handoff-sync-202 |
| `release/v0.17-publish-20261016` | `7eb7050` | 2026-10-16 | main取り込み済み | test: make handoff regression compatible with decision progress UI |
| `restore/arranger-v0.1.1-before-v0.2` | `c941a4f` | 2026-10-13 | main取り込み済み | fix: publish Arrangement Lab on GitHub Pages |
| `restore/arranger-v0.13-ci-verified-20261014` | `4bbe8a0` | 2026-10-14 | main取り込み済み | Merge PR #228: finalize Arrangement Lab v0.13 metadata and regression |
| `restore/arranger-v0.13-metadata-before-finalize-20261014` | `a28288a` | 2026-10-14 | main取り込み済み | test(arranger): update PWA expectation to v0.13 |
| `restore/arranger-v0.2-before-work-review` | `4313a42` | 2026-10-13 | main取り込み済み | feat: expand Arrangement Lab v0.2-dev |
| `restore/arranger-v0.2.1-before-seven-features` | `b70a1f5` | 2026-10-13 | main取り込み済み | Merge pull request #169 from tamurayuuki46-cpu/chatgpt/arranger-v0.2 |
| `restore/arranger-v0.3-before-music-labs` | `3d92f60` | 2026-10-13 | main取り込み済み | Merge pull request #170 from tamurayuuki46-cpu/chatgpt/arranger-v0.3-t |
| `restore/arranger-v0.4-before-cache-update` | `c29cfc0` | 2026-10-13 | main取り込み済み | Merge pull request #171 from tamurayuuki46-cpu/chatgpt/arranger-v0.4-m |
| `restore/arranger-v0.4.1-before-v0.5` | `44025d9` | 2026-10-13 | main取り込み済み | Merge PR #172: Arrangement Lab v0.4.1 PWA update fix |
| `restore/before-workflow-boundary-2026-10-13` | `434e2cb` | 2026-10-13 | main取り込み済み | Merge Demo Composer v0.7-dev root PWA into develop |
| `restore/composition-sheet-full-v0.4-ci-verified-20261014` | `c567a37` | 2026-10-14 | main取り込み済み | Merge PR #229: complete 31-sheet songwriting workbook v0.4 |
| `restore/convergence-final-pre-divergence-20261015` | `4734870` | 2026-10-15 | main取り込み済み | Merge pull request #258 from tamurayuuki46-cpu/chatgpt/decision-progre |
| `restore/convergence-integration-before-implementation-20261017` | `55e363d` | 2026-10-17 | main取り込み済み | Merge pull request #269 from tamurayuuki46-cpu/develop |
| `restore/convergence-integration-before-ui-wiring-20261017` | `7238547` | 2026-10-17 | main取り込み済み | test(arranger): cover convergence integration persistence |
| `restore/convergence-review-before-fix-20261017` | `6c0a38b` | 2026-10-17 | main取り込み済み | docs(arranger): finalize passing v0.15 convergence CI evidence |
| `restore/develop-before-arranger-beginner-flow-20261013` | `4cd0627` | 2026-10-13 | main取り込み済み | feat: unify app exchange JSON on SongProject v1 |
| `restore/develop-before-arranger-preview-fix-20261014` | `471b030` | 2026-10-14 | main取り込み済み | Merge PR #217: Arrangement Lab v0.10 chord-only handoff |
| `restore/develop-before-arranger-v0.15-publish-20261017` | `9124d41` | 2026-10-17 | main取り込み済み | Merge pull request #276 from tamurayuuki46-cpu/claude/handoff-sync-202 |
| `restore/develop-before-beginner-mode-20261013` | `0db519b` | 2026-10-13 | main取り込み済み | feat: add compact clickable app flow to Music Project Home |
| `restore/develop-before-convergence-20261017` | `703c9e6` | 2026-10-16 | main取り込み済み | Sync published v0.17 main back to develop |
| `restore/develop-before-convergence-integration-20261017` | `02aefff` | 2026-10-17 | main取り込み済み | Merge pull request #265 from tamurayuuki46-cpu/claude/convergence-core |
| `restore/develop-before-daw-handoff-verification-20261015` | `8cb42f0` | 2026-10-15 | main取り込み済み | Merge PR #251: Composition Sheet v0.9.1 beginner-first Home embed fix |
| `restore/develop-before-decision-progress-home-20261015` | `66d2bac` | 2026-10-15 | main取り込み済み | Merge PR #257: sync published main into develop |
| `restore/develop-before-json-handoff-guide-20261014` | `72ec328` | 2026-10-14 | main取り込み済み | feat: add Arrangement Lab beginner guided flow v0.6 |
| `restore/develop-before-midi-archive-analyzer-label-20261015` | `6b12169` | 2026-10-15 | main取り込み済み | Merge PR #247: beginner-first Composition Sheet v0.9 and always-latest |
| `restore/develop-before-mobile-first-flow-20261014` | `00c3fc9` | 2026-10-14 | main取り込み済み | feat: guide SongProject handoff between music apps |
| `restore/develop-before-onebar-chordonly-20261014` | `c627ecc` | 2026-10-14 | main取り込み済み | Merge PR #215: one-bar melody reharmonization |
| `restore/develop-before-onebar-reharm-20261014` | `acb1cf5` | 2026-10-14 | main取り込み済み | Merge PR #213: top-right song data menu v0.12 |
| `restore/develop-before-preserve-demo-sound-v0.13-20261014` | `4fc4a59` | 2026-10-14 | main取り込み済み | Merge PR #221: Arrangement Lab v0.12 Section audition |
| `restore/develop-before-project-home-daw-ready-20261015` | `1aeb728` | 2026-10-15 | main取り込み済み | Merge PR #252: strengthen SongProject v1 cross-app boundaries |
| `restore/develop-before-project-home-flow-20261013` | `71f9ee4` | 2026-10-13 | main取り込み済み | feat: put Composition Sheet first in Music Project Home |
| `restore/develop-before-project-home-navigator-20261015` | `5c38771` | 2026-10-15 | main取り込み済み | Merge PR #242: composition sheet manual ideas v0.8-dev |
| `restore/develop-before-published-main-catchup-20261015` | `b322cb4` | 2026-10-15 | main取り込み済み | Merge PR #254: strengthen Android to Cubasis/Cubase DAW handoff gate |
| `restore/develop-before-section-audition-v0.12-20261014` | `199c4a9` | 2026-10-14 | main取り込み済み | Merge PR #219: fix Arrangement Lab v0.11 chord audition |
| `restore/develop-before-sheet-app-20261013` | `36e91ee` | 2026-10-13 | main取り込み済み | Merge finalized v0.9 AI handoff into develop |
| `restore/develop-before-sheet-beginner-latest-home-v0.9-20261015` | `4191a4a` | 2026-10-15 | main取り込み済み | Merge PR #245: Music Project Home decision navigator v0.16-dev |
| `restore/develop-before-sheet-beginner-latest-home-v0.9-20261015-copy` | `4191a4a` | 2026-10-15 | main取り込み済み | Merge PR #245: Music Project Home decision navigator v0.16-dev |
| `restore/develop-before-sheet-full-v0.4-20261014` | `4bbe8a0` | 2026-10-14 | main取り込み済み | Merge PR #228: finalize Arrangement Lab v0.13 metadata and regression |
| `restore/develop-before-sheet-manual-ideas-v0.8-20261014` | `41d9264` | 2026-10-14 | main取り込み済み | docs(sheet): record v0.7 in version history |
| `restore/develop-before-sheet-tabs-v0.5-20261014` | `c567a37` | 2026-10-14 | main取り込み済み | Merge PR #229: complete 31-sheet songwriting workbook v0.4 |
| `restore/develop-before-song-data-four-actions-v0.13-20261014` | `b11e1e0` | 2026-10-14 | main取り込み済み | Merge PR #233: composition sheet v0.6 |
| `restore/develop-before-song-data-menu-20261014` | `f8861f0` | 2026-10-14 | main取り込み済み | Merge PR #211: mobile-first app workflow v0.11 |
| `restore/develop-before-song-memo-v0.13-20261014` | `b11e1e0` | 2026-10-14 | main取り込み済み | Merge PR #233: composition sheet v0.6 |
| `restore/develop-before-song-memo-v0.14-20261014` | `95434de` | 2026-10-14 | main取り込み済み | Merge PR #235: song data four actions v0.13 |
| `restore/develop-before-songproject-branch-sync-20261015` | `20ba942` | 2026-10-15 | main取り込み済み | Merge PR #250: rename Home analyzer label |
| `restore/develop-before-songproject-unification-20261013` | `7d1a7e8` | 2026-10-13 | main取り込み済み | fix: keep beginner flow clear during optional detours |
| `restore/develop-before-sound-preserve-v0.13-20261014` | `4fc4a59` | 2026-10-14 | main取り込み済み | Merge PR #221: Arrangement Lab v0.12 Section audition |
| `restore/develop-before-source-timbre-v0.13-20261014` | `4fc4a59` | 2026-10-14 | main取り込み済み | Merge PR #221: Arrangement Lab v0.12 Section audition |
| `restore/develop-before-stabilization-20261015` | `5c38771` | 2026-10-15 | main取り込み済み | Merge PR #242: composition sheet manual ideas v0.8-dev |
| `restore/develop-before-v0.17-publish-20261016` | `511dda9` | 2026-10-15 | main取り込み済み | Merge PR #259: Seed/Lock/Branch divergence modes |
| `restore/feature-mobile-first-flow-v0.11-complete-20261014` | `475a631` | 2026-10-14 | main取り込み済み | docs: define mobile-first workflow and one-bar arrangement rule |
| `restore/main-before-arranger-beginner-flow-20261013` | `c59256d` | 2026-10-13 | main取り込み済み | release: publish canonical SongProject v1 exchange |
| `restore/main-before-arranger-v0.10-release-20261014` | `a74399f` | 2026-10-14 | main取り込み済み | Merge PR #216: publish Arrangement Lab v0.9 one-bar reharm |
| `restore/main-before-arranger-v0.11-release-20261014` | `5339374` | 2026-10-14 | main取り込み済み | Merge PR #218: publish Arrangement Lab v0.10 chord-only handoff |
| `restore/main-before-arranger-v0.12-release-20261014` | `5a48478` | 2026-10-14 | main取り込み済み | Merge PR #220: publish Arrangement Lab v0.11 audible audition fix |
| `restore/main-before-arranger-v0.15-publish-20261017` | `a92f351` | 2026-10-16 | main取り込み済み | Release Demo Composer v0.17-dev |
| `restore/main-before-arranger-v0.9-release-20261014` | `584d282` | 2026-10-14 | main取り込み済み | Merge PR #214: publish top-right song data menu |
| `restore/main-before-beginner-mode-20261013` | `34d74ee` | 2026-10-13 | main取り込み済み | release: add compact app flow to Music Project Home |
| `restore/main-before-demo-v0.15-arranger-v0.13-public-20261015` | `fcda0b0` | 2026-10-15 | main取り込み済み | Merge PR #248: publish Composition Sheet v0.9 and always-latest Home |
| `restore/main-before-handoff-bootstrap-20261016` | `54e8e79` | 2026-10-16 | main取り込み済み | Merge pull request #260: preserve SongProject handoff data (v0.16-dev) |
| `restore/main-before-handoff-integrity-20261016` | `8661c88` | 2026-10-15 | main取り込み済み | Merge pull request #256: sync published reconciliation docs |
| `restore/main-before-home-private-sheet-link-20261014` | `8cba3d7` | 2026-10-14 | main取り込み済み | Merge pull request #222 from tamurayuuki46-cpu/release/arranger-v0.12- |
| `restore/main-before-mobile-first-flow-20261014` | `dc9af1c` | 2026-10-14 | main取り込み済み | Merge PR #210: sync current public release docs v0.7 |
| `restore/main-before-project-home-flow-20261013` | `2931559` | 2026-10-13 | main取り込み済み | release: put Composition Sheet first in Music Project Home |
| `restore/main-before-project-home-public-20261015` | `cb5a7f0` | 2026-10-15 | main取り込み済み | Publish Composition Sheet v0.8 |
| `restore/main-before-sheet-summary-v0.6-20261014` | `20663fd` | 2026-10-14 | main取り込み済み | Merge PR #232: publish only Home private-sheet link and JSON handoff |
| `restore/main-before-sheet-v0.7-20261014` | `aa79cb0` | 2026-10-14 | main取り込み済み | Merge PR #239: public song memo v0.10 |
| `restore/main-before-sheet-v0.8-20261015` | `59c19ec` | 2026-10-14 | main取り込み済み | Publish Composition Sheet v0.7 |
| `restore/main-before-sheet-v0.9-public-20261015` | `c8586d0` | 2026-10-15 | main取り込み済み | Merge PR #246: publish Music Project Home v0.16-dev |
| `restore/main-before-song-data-four-actions-public-20261014` | `9a57556` | 2026-10-14 | main取り込み済み | Merge PR #234: composition sheet summary v0.6 |
| `restore/main-before-song-data-four-actions-v0.9-20261014` | `9a57556` | 2026-10-14 | main取り込み済み | Merge PR #234: composition sheet summary v0.6 |
| `restore/main-before-song-memo-public-v0.10-20261014` | `b2e30b9` | 2026-10-14 | main取り込み済み | Merge PR #236: public song data four-action menu v0.9 |
| `restore/main-before-songproject-branch-sync-20261015` | `28f85e6` | 2026-10-15 | main取り込み済み | Merge PR #249: publish Demo Composer v0.15 and Arrangement Lab v0.13 |
| `restore/main-before-songproject-unification-20261013` | `1e204b9` | 2026-10-13 | main取り込み済み | release: add beginner guided flow |
| `restore/main-before-stabilization-20261015` | `cb5a7f0` | 2026-10-15 | main取り込み済み | Publish Composition Sheet v0.8 |
| `restore/main-before-v0.17-publish-20261016` | `800cd72` | 2026-10-16 | main取り込み済み | Merge pull request #261: fix handoff bootstrap and build label (v0.16. |
| `restore/mobile-first-flow-v0.11-final-20261014` | `475a631` | 2026-10-14 | main取り込み済み | docs: define mobile-first workflow and one-bar arrangement rule |
| `restore/post-reconcile-drive-backup-20261015` | `66d2bac` | 2026-10-15 | main取り込み済み | Merge PR #257: sync published main into develop |
| `restore/v0.1-before-autosave` | `4229bda` | 2026-10-10 | main取り込み済み | feat: add MIDI and project export |
| `restore/v0.1-before-cloudflare-pages` | `12835c9` | 2026-10-10 | main取り込み済み | chore: remove accidental noop file |
| `restore/v0.1-before-demo-player` | `613a00e` | 2026-10-10 | main取り込み済み | feat: add mobile rhythm sequencer |
| `restore/v0.1-before-feature-complete-integration` | `2af9bda` | 2026-10-10 | main取り込み済み | docs: update Claude handoff for v0.1 feature-complete |
| `restore/v0.1-before-github-pages` | `12835c9` | 2026-10-10 | main取り込み済み | chore: remove accidental noop file |
| `restore/v0.1-before-indexeddb` | `25dd5da` | 2026-10-10 | main取り込み済み | feat: add shared Project State foundation |
| `restore/v0.1-before-melody-16th-toggle` | `de51bc0` | 2026-10-10 | main取り込み済み | Merge pull request #18 from tamurayuuki46-cpu/claude/v0.1-integrate-fe |
| `restore/v0.1-before-melody-8step-grid` | `1e5fa35` | 2026-10-10 | 未取り込み | docs: mention Melody vertical piano in README |
| `restore/v0.1-before-melody-roll` | `33d193b` | 2026-10-10 | main取り込み済み | feat: add basic chord input |
| `restore/v0.1-before-melody-vertical-piano` | `72c5bb1` | 2026-10-10 | 未取り込み | test(docs): add Rhythm beat copy checks |
| `restore/v0.1-before-midi-export` | `5bdb9ae` | 2026-10-10 | main取り込み済み | feat: add persistent Demo Player |
| `restore/v0.1-before-rhythm-16step-grid` | `c01d113` | 2026-10-10 | 未取り込み | docs: record app freeze root cause and fix |
| `restore/v0.1-before-rhythm-presets` | `12835c9` | 2026-10-10 | main取り込み済み | chore: remove accidental noop file |
| `restore/v0.1-before-rhythm-sequencer` | `0a8cd9d` | 2026-10-10 | main取り込み済み | feat: add mobile melody piano roll |
| `restore/v0.1-before-v0.2-chord-types` | `4e9ce36` | 2026-10-10 | main取り込み済み | Merge pull request #22 from tamurayuuki46-cpu/chatgpt/v0.1-android-reg |
| `restore/v0.1-before-v0.2-integration` | `81e1838` | 2026-10-10 | main取り込み済み | infra: add GitHub Pages fallback deployment (#26) |
| `restore/v0.1-before-vercel-build-config` | `2b4bae0` | 2026-10-10 | main取り込み済み | docs: add Android v0.1 stable test checklist |
| `restore/v0.1.1-before-pages-fix` | `b86fcf5` | 2026-10-13 | main取り込み済み | feat: add Arrangement Lab v0.1-dev |
| `restore/v0.11-mobile-first-integrated-20261014` | `f8861f0` | 2026-10-14 | main取り込み済み | Merge PR #211: mobile-first app workflow v0.11 |
| `restore/v0.14-before-ai-monitoring-20261014` | `510671d` | 2026-10-14 | main取り込み済み | Merge PR #238: song memo v0.14 |
| `restore/v0.16-before-divergence-2026-10-15` | `4734870` | 2026-10-15 | main取り込み済み | Merge pull request #258 from tamurayuuki46-cpu/chatgpt/decision-progre |
| `restore/v0.2-before-active-harmony` | `a096da4` | 2026-10-11 | main取り込み済み | Merge PR #86: CHANGELOGを裏メロ3系統へ同期 |
| `restore/v0.2-before-analyzer` | `1654277` | 2026-10-10 | main取り込み済み | Merge pull request #54 from tamurayuuki46-cpu/claude/v0.2-learning-lab |
| `restore/v0.2-before-arrange-sections` | `5235b72` | 2026-10-10 | main取り込み済み | feat(core): add Undo / Redo for the whole Project |
| `restore/v0.2-before-backing-pattern` | `1f130ef` | 2026-10-10 | main取り込み済み | Merge PR #42: finalize Sound Sketch handoff |
| `restore/v0.2-before-backing-pattern-final` | `1b4183f` | 2026-10-10 | main取り込み済み | Merge pull request #48 from tamurayuuki46-cpu/claude/v0.2-parts-consul |
| `restore/v0.2-before-backing-pattern-integration` | `2f30855` | 2026-10-10 | main取り込み済み | Merge pull request #43 from tamurayuuki46-cpu/claude/v0.2-bass-pitch |
| `restore/v0.2-before-bass-pitch` | `1f130ef` | 2026-10-10 | main取り込み済み | Merge PR #42: finalize Sound Sketch handoff |
| `restore/v0.2-before-bass-shift` | `2f30855` | 2026-10-10 | main取り込み済み | Merge pull request #43 from tamurayuuki46-cpu/claude/v0.2-bass-pitch |
| `restore/v0.2-before-bass-style-5ways` | `2f99f49` | 2026-10-11 | main取り込み済み | Merge PR #92: Update AI handoff |
| `restore/v0.2-before-candidates` | `b29dc4d` | 2026-10-10 | 未取り込み | Add chord tone highlight to Melody grid |
| `restore/v0.2-before-chord-mood-tags` | `6b43590` | 2026-10-12 | main取り込み済み | Merge pull request #121 from tamurayuuki46-cpu/claude/v0.3-skeleton-re |
| `restore/v0.2-before-chord-mood-ui` | `f44a7d7` | 2026-10-12 | main取り込み済み | Chord Presetに曲想・感情タグを紐付ける (#124) |
| `restore/v0.2-before-chord-presets` | `4e73be7` | 2026-10-10 | main取り込み済み | docs: stabilize v0.2 integration reference (#29) |
| `restore/v0.2-before-chord-quality-ext` | `29c083c` | 2026-10-12 | main取り込み済み | Merge pull request #101 from tamurayuuki46-cpu/claude/v0.2-chord-root- |
| `restore/v0.2-before-composition-intent-core` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `restore/v0.2-before-copy-progress` | `1b4183f` | 2026-10-10 | main取り込み済み | Merge pull request #48 from tamurayuuki46-cpu/claude/v0.2-parts-consul |
| `restore/v0.2-before-counter-answer-style` | `31a3e79` | 2026-10-11 | main取り込み済み | Merge PR #87: Active裏メロにAyase系ハーモニー色を追加 |
| `restore/v0.2-before-counter-answer-style-merge` | `aaab9f8` | 2026-10-11 | main取り込み済み | Merge PR #93: Add five bass candidate styles |
| `restore/v0.2-before-counter-melody` | `77c1397` | 2026-10-11 | main取り込み済み | Merge pull request #76 from tamurayuuki46-cpu/claude/v0.2-chord-preset |
| `restore/v0.2-before-counter-style-3ways` | `51b5575` | 2026-10-11 | main取り込み済み | Merge pull request #83 from tamurayuuki46-cpu/claude/v0.3-skeleton-pla |
| `restore/v0.2-before-diatonic-fan-ui` | `67e9b6e` | 2026-10-10 | main取り込み済み | Merge pull request #33 from tamurayuuki46-cpu/chatgpt/v0.2-key-change- |
| `restore/v0.2-before-drive-share-button-fix` | `c0531e1` | 2026-10-12 | main取り込み済み | Merge pull request #115 from tamurayuuki46-cpu/claude/v0.2-phrase-flav |
| `restore/v0.2-before-drive-share-export` | `a72e9c9` | 2026-10-12 | main取り込み済み | Merge pull request #109 from tamurayuuki46-cpu/claude/v0.2-fix-player |
| `restore/v0.2-before-drive-share-export-latest` | `61915ad` | 2026-10-12 | main取り込み済み | Merge pull request #112 from tamurayuuki46-cpu/claude/v0.2-counter-cha |
| `restore/v0.2-before-drum-fill` | `fef7b07` | 2026-10-10 | main取り込み済み | Merge pull request #56 from tamurayuuki46-cpu/claude/v0.2-hub-memo |
| `restore/v0.2-before-font-size` | `59fcff0` | 2026-10-10 | 未取り込み | Add borrowed-chord spice candidates to Chord screen |
| `restore/v0.2-before-hub-chord-intent-link` | `71866f5` | 2026-10-12 | main取り込み済み | Merge pull request #129 from tamurayuuki46-cpu/claude/v0.2-part-select |
| `restore/v0.2-before-hub-memo` | `09e3e84` | 2026-10-10 | main取り込み済み | Merge pull request #55 from tamurayuuki46-cpu/claude/v0.2-analyzer |
| `restore/v0.2-before-integration` | `c59cf5d` | 2026-10-11 | main取り込み済み | Merge PR #67: finalize Melody candidates handoff |
| `restore/v0.2-before-key-change-fix` | `4be8505` | 2026-10-10 | main取り込み済み | chore: remove temporary file |
| `restore/v0.2-before-learning-labels` | `bb52b07` | 2026-10-10 | main取り込み済み | Merge pull request #53 from tamurayuuki46-cpu/claude/v0.2-font-size |
| `restore/v0.2-before-loop-to-song` | `7834711` | 2026-10-10 | main取り込み済み | Add Section Variation candidates to Arrange |
| `restore/v0.2-before-melodic-functions` | `aaab9f8` | 2026-10-11 | main取り込み済み | Merge PR #93: Add five bass candidate styles |
| `restore/v0.2-before-melody-ab-20261012` | `24e4ffe` | 2026-10-12 | main取り込み済み | Merge pull request #158 from tamurayuuki46-cpu/claude/v0.2-audition |
| `restore/v0.2-before-melody-candidate-refresh` | `dc243b3` | 2026-10-11 | main取り込み済み | Merge pull request #70 from tamurayuuki46-cpu/claude/v0.2-skeleton-ent |
| `restore/v0.2-before-melody-candidates` | `fef7b07` | 2026-10-10 | main取り込み済み | Merge pull request #56 from tamurayuuki46-cpu/claude/v0.2-hub-memo |
| `restore/v0.2-before-melody-candidates-final` | `f834e3e` | 2026-10-10 | main取り込み済み | Merge pull request #57 from tamurayuuki46-cpu/claude/v0.2-drum-fill |
| `restore/v0.2-before-melody-degree-analysis` | `51b5575` | 2026-10-11 | main取り込み済み | Merge pull request #83 from tamurayuuki46-cpu/claude/v0.3-skeleton-pla |
| `restore/v0.2-before-melody-perspectives` | `64e3d84` | 2026-10-11 | main取り込み済み | Merge PR #89: Melody degree analysis changelog |
| `restore/v0.2-before-melody-to-chords` | `fef7b07` | 2026-10-10 | main取り込み済み | Merge pull request #56 from tamurayuuki46-cpu/claude/v0.2-hub-memo |
| `restore/v0.2-before-melody-variation` | `c9cf242` | 2026-10-11 | main取り込み済み | Merge pull request #69 from tamurayuuki46-cpu/claude/v0.2-integration |
| `restore/v0.2-before-new-project` | `77c1397` | 2026-10-11 | main取り込み済み | Merge pull request #76 from tamurayuuki46-cpu/claude/v0.2-chord-preset |
| `restore/v0.2-before-new-project-final` | `f169b77` | 2026-10-11 | main取り込み済み | Merge pull request #77 from tamurayuuki46-cpu/claude/v0.2-counter-melo |
| `restore/v0.2-before-note-length` | `f982f75` | 2026-10-10 | main取り込み済み | Merge pull request #44 from tamurayuuki46-cpu/claude/v0.2-bass-shift |
| `restore/v0.2-before-parts-consult` | `449e100` | 2026-10-10 | main取り込み済み | Merge pull request #47 from tamurayuuki46-cpu/claude/v0.2-vercel-off |
| `restore/v0.2-before-progression-library` | `fef7b07` | 2026-10-10 | main取り込み済み | Merge pull request #56 from tamurayuuki46-cpu/claude/v0.2-hub-memo |
| `restore/v0.2-before-project-import` | `99957e2` | 2026-10-10 | main取り込み済み | Merge pull request #38 from tamurayuuki46-cpu/claude/v0.2-arrange-sect |
| `restore/v0.2-before-project-library` | `6474e7d` | 2026-10-12 | main取り込み済み | Merge PR #153: Hub per-part clear |
| `restore/v0.2-before-project-list` | `6474e7d` | 2026-10-12 | main取り込み済み | Merge PR #153: Hub per-part clear |
| `restore/v0.2-before-section-compare` | `f834e3e` | 2026-10-10 | main取り込み済み | Merge pull request #57 from tamurayuuki46-cpu/claude/v0.2-drum-fill |
| `restore/v0.2-before-skeleton-entries` | `c9cf242` | 2026-10-11 | main取り込み済み | Merge pull request #69 from tamurayuuki46-cpu/claude/v0.2-integration |
| `restore/v0.2-before-sound-sketch-lite` | `b62c68b` | 2026-10-10 | main取り込み済み | Merge pull request #35 from tamurayuuki46-cpu/chatgpt/v0.2-diatonic-fa |
| `restore/v0.2-before-sp-preview` | `f834e3e` | 2026-10-10 | main取り込み済み | Merge pull request #57 from tamurayuuki46-cpu/claude/v0.2-drum-fill |
| `restore/v0.2-before-starting-point` | `fef7b07` | 2026-10-10 | main取り込み済み | Merge pull request #56 from tamurayuuki46-cpu/claude/v0.2-hub-memo |
| `restore/v0.2-before-undo` | `b62c68b` | 2026-10-10 | main取り込み済み | Merge pull request #35 from tamurayuuki46-cpu/chatgpt/v0.2-diatonic-fa |
| `restore/v0.2-before-vercel-off` | `8761bdf` | 2026-10-10 | main取り込み済み | Merge pull request #46 from tamurayuuki46-cpu/claude/v0.2-note-length |
| `restore/v0.2-project-library-codepoint` | `f42f2ad` | 2026-10-12 | 未取り込み | Document Project library product scope |
| `restore/v0.3-before-arranger-app` | `01288e2` | 2026-10-13 | main取り込み済み | Merge pull request #166 from chatgpt/v0.3-audio-loop-seam-20261013 |
| `restore/v0.3-before-decision-support` | `6e69333` | 2026-10-12 | main取り込み済み | Merge pull request #159 from tamurayuuki46-cpu/chatgpt/v0.2-melody-ab- |
| `restore/v0.6-before-root-pwa-service-worker` | `365b577` | 2026-10-13 | main取り込み済み | Merge Project Home Claude Artifact link v0.6-dev |
| `restore/v0.7-root-pwa-feature-complete` | `434e2cb` | 2026-10-13 | main取り込み済み | Merge Demo Composer v0.7-dev root PWA into develop |
| `restore/v0.8-workflow-boundary-feature-complete` | `23ac0c8` | 2026-10-13 | main取り込み済み | Merge Demo Composer v0.8-dev workflow boundary into develop |
| `restore/v0.8-workflow-boundary-phase1` | `90cd921` | 2026-10-13 | main取り込み済み | chore: remove temporary file |
| `restore/v0.9-before-arrangement-lineage-fork` | `36e91ee` | 2026-10-13 | main取り込み済み | Merge finalized v0.9 AI handoff into develop |
| `restore/v0.9-vocal-workflow-feature-complete` | `d8c04a9` | 2026-10-13 | main取り込み済み | Merge Demo Composer v0.9-dev vocal workflow into develop |
| `restore/v0.9-workflow-docs-synced` | `e6c8d5a` | 2026-10-13 | main取り込み済み | Merge v0.8-v0.9 version history sync into develop |
| `restore/v0.9-workflow-finalized` | `36e91ee` | 2026-10-13 | main取り込み済み | Merge finalized v0.9 AI handoff into develop |
| `test/daw-handoff-verification-20261015` | `58c828a` | 2026-10-15 | main取り込み済み | docs: align real-song test with Arrangement Lab final MIDI handoff |
| `test/songproject-v1-cross-app-boundary-20261015` | `897d2f7` | 2026-10-15 | main取り込み済み | ci: run SongProject cross-app boundary smoke test |
