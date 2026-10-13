# Arrangement Lab Workflow Boundary

更新日: 2026-10-13

## 一言定義

Arrangement Lab = **Demo Composerで作った曲を育て、PC DAWへ渡す**。

Composition OwnerではなくArrangement Owner。

## 正式な入口

Demo Composer / SongProject v1からCompositionを受け取る。

読み取る:
- Chord
- Melody
- Counter Melody
- Bass
- Drums
- Sections
- BPM / Key / Scale

通常操作で元Compositionを上書きしない。

## 担当

- Reharmonization
- Voicing
- Counter interaction
- Density
- Instrument participation
- Development
- A/B/C alternatives
- Before / After
- Decision Journal
- DAW Handoff
- final Song.mid

## 通常の出口

**DAW Handoff Package**を正式出口とする。

PC DAWは最終制作の必須工程。

Handoff packageの既存内容:
- `01_compare/Before_Source_Song.mid`
- `01_compare/After_Arrangement_Song.mid`
- `02_plan/Arrangement_Plan.json`
- `02_plan/Demo_Composer_Project.json`
- `03_notes/TRACK_INSTRUCTIONS.md`
- `03_notes/SECTION_INSTRUCTIONS.md`
- `03_notes/DAW_CHECKLIST.md`
- `03_notes/DECISIONS.json`
- `03_notes/COMPARE_MANIFEST.json`
- `04_parts/*.mid`

目的はCubase等を開いた直後に「どういう曲にするか」ではなく、本制作・音色・録音・Automation・Mixへ進める状態を作ること。

## Demo Composer側へ進み直す場合

旧称「Demo Composer戻し」は使わない。

編曲結果をCompositionとしてさらに作り直したい場合だけ、**新しい作曲ProjectとしてFork**する。

Fork原則:
- 元Projectを上書きしない
- 新しいProject ID
- revision=1
- 同じ曲のroot lineageを維持
- parentProjectIdに元Projectを記録
- sourceApp=`arrangement-lab`
- forkReasonを記録可能

通常WorkflowではForkを使わずDAW Handoffへ進む。

### SongProject v1を入口にした場合

`新しい作曲ProjectとしてFork`は**Lineage付きSongProject v1**を書き出す。

- 新しいSongProject `projectId`
- `rootProjectId`を維持
- `parentProjectId`に元SongProject ID
- `sourceApp = arrangement-lab`
- `createdFrom = arrangement-fork`
- `revision = 1`
- 採用した編曲結果を新ForkのCompositionへ反映
- Arrangement evidenceも保持
- 元SongProjectは変更しない

共通処理:
- `arranger/src/song-project-sync.js` → `createArrangementForkSongProject()`
- `arranger/src/song-project-ui.js` → SongProject入力時のFork Download

### legacy Demo Composer project.jsonを入口にした場合

従来どおりDemo Composer `project.json` Forkを出力する。
`metadata.lineage`にroot / parent / sourceApp / createdFrom / forkReason / revisionを保持する。

この分岐により旧Workflow互換を壊さず、SongProject Workflowでは共通Project系譜を維持する。

## Vocal / Lyrics

Arrangement Labは歌詞本文を所有しない。

扱うのは編曲上の関係だけ:
- Vocalの休み
- Counter Melodyとの応答
- Vocal帯域を邪魔しない密度
- Sectionごとの主役交代
- サビ前後の落差

主旋律は原則保持する。

## Non-goals

- Compositionの通常上書き
- 歌詞Editor
- Vocal本制作
- Mixing / Mastering
- Plugin Hosting
- 完成Audio renderer

## 関連正本

- `../../docs/WORKFLOW_PRINCIPLES.md`
- `../../docs/APP_INTEGRATION.md`
- `../../docs/SONG_PROJECT.md`
- `PRODUCT_SPEC.md`

矛盾した場合、Workflow責務についてはこのファイルとrootのWorkflow文書を優先する。
