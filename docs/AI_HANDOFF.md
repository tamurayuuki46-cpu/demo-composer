# AI_HANDOFF

現在Version: `v0.9-dev`

公開中Version: `v0.6-dev`

最新安定版: 未認定。`main`はCI合格版かつGitHub Pages公開元。stable tagはAndroid実機 + 必要なCubasis/Cubase実機確認後のみ作成する。

最終更新: 2026-10-13

## 最重要Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須） → 完成`

- 作曲シート = 決める
- Moises = 分ける
- MIDI Analyzer = 集める・理解する
- Demo Composer = 作る
- Arrangement Lab = 育てる
- Music Project Home = 案内する・つなぐ
- PC DAW = 完成させる

正本:
- `docs/WORKFLOW_PRINCIPLES.md`
- `docs/APP_INTEGRATION.md`
- `docs/SONG_PROJECT.md`
- `docs/VOCAL_LYRICS_BOUNDARY.md`
- `arranger/docs/WORKFLOW_BOUNDARY.md`

機能数よりWorkflowの直感性、次の一手の分かりやすさ、再入力の少なさを優先する。

## v0.8-devで完成した基盤

### Music Project Home = Workflow Hub
- SongProject v1読込
- Analysis / Composition / Arrangement状態
- Workflow工程表示
- 次の一手
- MIDI Analyzerを任意レーンとして表示
- Claude Artifact作曲シート入口
- Claude handoff JSON取込
- Demo Composer / Arrangement Lab入口
- SongProject Backup
- Project Lineage表示

Project HomeにEditor機能を重複させない。

### Claude Artifact作曲シート

作曲シート本体はClaude Artifact所有。GitHubへArtifact本体を複製しない。
正本Prompt: `docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`

Handoff:
- kind: `composition-sheet-handoff`
- schemaVersion: 1
- scene / purpose / references
- genre / mood
- BPM / Key / Scale候補
- constraints / experiments
- optional Vocal / Lyrics初期情報
- notes

Project HomeでJSONを読み込み、同一Origin localStorageへ保存。
Demo Composerで確認後に明示適用する。
Chord / Melody / Bass / Drum / CounterをClaude JSONから自動生成しない。

### SongProject v1 Lineage

SongProject Schemaは1のまま。lineageはoptional追加で旧v1互換。

- rootProjectId
- parentProjectId
- sourceApp
- createdFrom
- forkReason
- revision

`src/shared/song-project.js`:
- createEmptySongProject
- demoProjectToSongProject
- songProjectToDemoProject
- mergeDemoChangesIntoSongProject
- forkSongProject
- serializeSongProject
- parseSongProjectJson

旧v1のlineage欠落を受理する。

## v0.9-devで完成した残りの責務

### Lyrics / Vocalを作曲情報として実装

Demo Composerの既存「作曲の判断」へ追加:
- `lyricsTheme`: 歌詞テーマ / 言葉の芯
- `vocalRange`: Vocal音域 / 歌いやすさ
- `lyricPhrases`: Phrase歌詞 / 音節メモ
- `axes.vocal`: 歌詞 / Vocal方針

保存先は既存`metadata.composition`。Project Schema 3は据え置き。
旧Schema 3 Projectで新fieldが欠けていても、読み取り時に空値を補完して受理する。
Vocal/Lyricsはoptionalで、インスト曲に入力を強制しない。

Claude handoffのVocal情報は、完成歌詞やVocal Noteを生成せず、テーマ・想定音域・情景・Vocal方向だけを作曲設計へ反映する。
参考曲情報も既存の「参考曲から借りる考え方」へ初期値として渡せる。

Phraseメモ例:
`Aメロ1｜雨上がりの道｜8音節`

本歌 / SynthV本制作 / Phoneme / 詳細Vocal編集 / Vocal FX / MixはPC DAW工程。

### Arrangement Lab Fork Lineage

旧「Demo Composer戻し」は通常往復ではなく、明示的な**新しい作曲ProjectとしてFork**。

v0.9ではUIだけでなく、出力するDemo Composer `project.json`の`metadata.lineage`にも直接記録する。

- rootProjectId: 親のrootを継承。無ければ元Project ID
- parentProjectId: 元Project ID
- sourceApp: `arrangement-lab`
- createdFrom: `fork`
- forkReason
- revision: 1

元Projectを変更しない。
通常のArrangement Lab出口はDAW Handoff Package。

## Arrangement Labの正式出口

DAW Handoff Package:
- Before_Source_Song.mid
- After_Arrangement_Song.mid
- Part別MIDI
- Arrangement Plan
- Demo Composer Project snapshot
- TRACK_INSTRUCTIONS.md
- SECTION_INSTRUCTIONS.md
- DAW_CHECKLIST.md
- DECISIONS.json
- COMPARE_MANIFEST.json

PC DAWは最終制作の必須工程。

## Demo Composer Owner

Composition Owner:
- Chord
- Melody
- Bass
- Drums
- Counter Melody
- Sections
- BPM / Key / Scale
- 作曲案A/B
- 作曲判断
- Lyrics / Vocalの作曲段階メモ
- Draft.mid

深い参考曲分析 / Personal Trend → MIDI Analyzer。
高度Reharm / Voicing / Density / Development → Arrangement Lab。
Mix / Mastering / Plugin Hosting / Vocal本制作 → PC DAW。

## Data Contract

### Demo Composer Project
- schemaVersion 3
- APP_VERSION v0.9-dev
- PPQ 480
- timeSignature 4/4固定
- `project.json`をDemo Composer内部正本とする

### SongProject
- schemaVersion 1
- MIDI Analyzer owner: analysis / reference
- Demo Composer owner: composition
- Arrangement Lab owner: arrangement
- common: basic / lineage

### Storage
- Project Library: IndexedDB `projects` + `meta.activeProjectId`
- Project Home / Sheet handoff軽量state: localStorage
- 別OriginのIndexedDBを直接共有しない
- 保存済み旧Projectを自動破壊しない

## v0.9-dev追加テスト

- `test:vocal-workflow`
  - 旧Schema 3 ProjectでVocal field欠落を受理
  - Claude Vocal planning → 作曲設計 mapping
  - Phrase歌詞 / 音節メモ保存
  - Undo
- Arrangement v0.5 regression
  - lineage-aware Fork
  - legacy Project without lineage fallback
  - 元Project不変

既存のSheet Handoff / Project Home / SongProject / Static Build / PWA / Arrangement Mobile回帰も継続する。

## 現在の開発状態

開発統合Branch: `develop`

統合済み:
- PR #188: Workflow boundary / Music Project Home / Claude sheet handoff / SongProject Lineage（v0.8-dev）
- PR #189: Lyrics/Vocal workflow / lineage-aware Arrangement Fork（v0.9-dev）
- PR #190: v0.8-v0.9 VERSION_HISTORY同期

現在のdevelop headはv0.9-dev。main/publicはv0.6-devのままで未変更。

復元点:
- `restore/before-workflow-boundary-2026-10-13`
- `restore/v0.8-workflow-boundary-feature-complete`
- `restore/v0.9-vocal-workflow-feature-complete`
- `restore/v0.9-workflow-docs-synced`

v0.9-devのコード・自動テスト・正本docsの開発統合は完了。次の必須確認はAndroid / Cubasis / Cubase等の実機工程。

## Git運用

- `develop` = 開発統合
- `main` = CI合格版 + GitHub Pages公開元
- developへのpushでは公開しない
- mainへの統合 / 公開は明示承認後
- stable tag = Android実機 + 必要なCubasis/Cubase実機確認後のみ
- 過去Version / Branch / Tagを削除・上書きしない

## 触らない部分

- Schema 3をMigrationなしに上げない
- SongProject Schemaを互換検討なしに上げない
- PPQ 480 / 4/4固定を無断変更しない
- Arrangement Labから元Compositionを破壊的更新しない
- Analyzer都合でCompositionを変更しない
- Demo ComposerへMixing / Mastering / Plugin Hostingを追加しない
- Root PWAがArrangement Cacheを削除しない

## 実機継続課題

- Android実機: Project Home → Claude handoff JSON → Demo Composer Vocal設計 → Arrangement Lab → DAW Handoff
- Android実機PWA install / standalone / offline / update
- Cubasis / CubaseでMIDI / DAW ZIP取込
- SynthV / 本歌はPC DAW工程として別確認

stable tagは実機確認前に作成しない。