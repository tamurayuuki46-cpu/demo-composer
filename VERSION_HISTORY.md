# VERSION_HISTORY

## 2026-10-15 — v0.15-dev reconciliation candidate

- Development candidate: `integration/main-develop-reconcile-20261015`。公開済みmainへは未統合。
- Published main: `v0.15-dev` / `28f85e64adeed26da1d40fc491723438ffecd2f9`。同じVersion名でも候補側には未公開のdevelop変更を含むため、commit / branchも併記する。
- Stable: 未認定。Android、Cubasis、Cubaseの実機gateが未完了。
- PR #252（SongProject v1 cross-app boundary）、#253（実MIDI書き出しに基づくHome DAW-ready）、#254（Song.mid exact regression）をdevelopから統合。
- Demo Composer `v0.15-dev` / package `0.15.0-dev` / Project Schema 3。
- Arrangement Lab `v0.13-dev` / Arrangement Plan Schema 4。
- Music Project Home `v0.18-dev`。
- Composition Sheet latest `v0.9.1-dev` / SongProject v1。
- 統合時に静的178件、ブラウザ17件、公開済みversion資産38件、保護対象remote refs 162件を確認。過去versionファイルとrestore / backup / tagは変更していない。

## v0.13-dev
更新日: 2026-10-14

【追加】
・右上「📦 曲データ」を `全アプリ遷移 / MIDI保存 / JSON保存 / 作曲シート成果物` の4大操作へ統一。
・全アプリ遷移から Music Project Home / 作曲シート / MIDI Analyzer / Demo Composer / Arrangement Lab を開けるようにした。
・Demo Composer / Music Project Home / Arrangement Lab / 作曲シートから既存MIDI書き出しへ直接到達できる導線を追加。
・4操作の配線を確認する回帰テストを追加。

【変更】
・従来のJSON読込と次工程ボタンは補助操作へ縮小し、モバイルで4つの主要操作を優先表示。
・Demo Composer Versionを v0.13-dev へ更新。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・既存IndexedDB / localStorage / JSON形式は変更なし。
・31枚の作曲シート本体は非公開Siteのまま維持し、公開側では成果物の読み取り専用表示のみ扱う。

【復元ポイント】
・`restore/develop-before-song-data-four-actions-v0.13-20261014`

【未対応】
・Android実機で4操作、複数MIDIダウンロード、JSON保存、作曲シート成果物表示の確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。

## v0.11-dev
更新日: 2026-10-14

【追加】
・スマホ向けの全体導線を `⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAW` の5段階へ整理。
・各工程で「今やること」を1つだけ主ボタンとして強調する方式へ統一。
・Arrangement Labで、Section未作成でもメロディ/コード等があれば1〜32小節のスケッチSectionを補完して編曲を開始できるAdapterを追加。1小節なら「1小節スケッチ」と表示。
・1小節SongProjectからArrangement Labへ進める回帰テストを追加。

【変更】
・Music Project Homeの旧6段階表示を5段階へ簡略化し、MIDI Analyzerを明確に任意工程として表示。
・Demo ComposerのSongProject受け渡しカードは、状態に応じて `受け取った曲を反映` → `Arrangement Labへ渡す` → `Arrangement Labを開く` のいずれか1つだけを主操作として強調。
・Arrangement Lab v0.7-devへ更新し、モバイル画面に全体Workflowと「1小節だけでもOK」を表示。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・Arrangement Plan Schema 4据え置き。
・1小節対応は変換Adapter内だけで行い、SongProjectのcomposition自体にはSectionを自動書き戻ししない。

【復元ポイント】
・`restore/develop-before-mobile-first-flow-20261014`

【未対応】
・Android実機で5段階Workflowの表示・操作確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。

## v0.10-dev
更新日: 2026-10-14

【追加】
・MIDI Analyzer → Demo Composer → Arrangement Lab のSongProject受け渡しを「保存 → 開く → 反映」の一本道へ整理。
・同じChromeでは `music-project-songproject-handoff-v1` を補助導線として使用し、JSONファイル選択の手間を減らした。
・JSONファイルは毎回バックアップとして保存し、一時受け渡しに失敗した場合はファイル選択へフォールバック。
・Demo Composerで受け取ったSongProjectのanalysis / arrangement / intentを保持したままcompositionを書き戻す導線を追加。

【変更】
・初心者向けの主表示を「前のアプリから受け取る」「Arrangement Labへ渡す」に変更。SongProject / Schema等の詳細操作は補助扱い。
・Arrangement LabはDemo Composerからの受け渡しを検知すると「Demo Composerから続ける」を表示。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・Arrangement Plan Schema 4据え置き。
・旧project.json / SongProject JSON読込を維持。

【復元ポイント】
・`restore/develop-before-json-handoff-guide-20261014`

【未対応】
・Android実機でMIDI Analyzer → Demo Composer → Arrangement Labの通し確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。

## v0.9-dev
更新日: 2026-10-13

【追加】
・Demo Composerの作曲判断へLyrics / Vocal情報を実装。歌詞テーマ、Vocal音域、Phrase歌詞・音節メモ、歌詞/Vocal方針を保存できる。
・Claude Artifact作曲シートのVocal/Lyrics初期設計と参考曲情報を、完成歌詞やVocal Noteを自動生成せず明示反映できる。
・Arrangement LabのDemo Composer Forkへ `metadata.lineage` を直接付与し、root / parent / sourceApp / createdFrom / forkReason / revisionを追跡できる。
・Vocal/Lyrics workflow smoke testを追加。

【変更】
・Demo Composerをv0.9-devへ更新。
・Arrangement LabからDemo Composerへ戻す操作を、元Projectを上書きしない明示的なForkとしてデータ上も固定。
・Lyrics / Vocalはoptionalな作曲情報として既存 `metadata.composition` に保存し、インスト曲には入力を強制しない。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject v1据え置き。
・Arrangement Plan Schema据え置き。
・旧Schema 3で新Vocal fieldが無いProjectも読み取り時に空値補完して受理する。

【統合】
・PR #189をdevelopへ統合。
・merge commit: `d8c04a9163e0228db746f6abbd7806c85da25af3`
・復元点: `restore/v0.9-vocal-workflow-feature-complete`

【未対応】
・Android実機でClaude Sheet → Vocal設計反映 → 保存 / reloadの通し確認。
・Cubasis / Cubase実機取込。
・stable tag作成（実機確認後のみ）。

## v0.8-dev
更新日: 2026-10-13

【追加】
・Music Project Homeを全体Workflow Hubへ拡張。現在工程、次の一手、任意のMIDI Analyzerレーン、Backup / Recoveryを表示。
・正式Workflowを `作曲シート → 必要なら Moises / MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）` に固定。
・Claude Artifact作曲シートの `composition-sheet-handoff` Schema 1をProject Homeで受け入れ、Demo Composerへ再入力せず渡せる導線を追加。
・SongProject v1へ後方互換のoptional Lineageを追加。
・明示Forkでroot / parent / sourceApp / createdFrom / forkReason / revisionを追跡。
・Arrangement LabのDAW Handoff PackageをPC DAWへ渡す正式出口として位置付け。

【変更】
・作曲シート=決める、MIDI Analyzer=集める・理解する、Demo Composer=作る、Arrangement Lab=育てる、Project Home=案内する・つなぐ、PC DAW=完成させる、と責務を固定。
・同じ機能を複数アプリで所有せず、他アプリにはPreview / 軽量表示 / 受け渡しだけ残す方針を正本化。
・Arrangement Labの旧「Demo Composer戻し」を「新しい作曲ProjectとしてFork」に変更。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。lineage欠落旧v1も受理。
・IndexedDB Schema / MIDI形式変更なし。

【統合】
・PR #188をdevelopへ統合。
・復元点: `restore/before-workflow-boundary-2026-10-13`
・完成復元点: `restore/v0.8-workflow-boundary-feature-complete`

【未対応】
・Android実機でProject Home → Sheet JSON → Demo → Arrangement → DAW Handoffの通し確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。

## v0.6-dev
更新日: 2026-10-13

【追加】
・Project Homeに「Claude Artifact / 作曲シート」を追加。claude.aiリンクを端末内に保存し、1タップで新しいタブに開ける。
・Project Home用のClaudeリンク回帰テストを追加。

【変更】
・Demo Composer HubとProject Homeで同じ `demo-composer.sheetLink` を共有。リンクはlocalStorageのみで保持し、Song Project JSON・MIDI・公開コードには保存しない。
・Project HomeのModule依存にもBuild IDを付与し、更新時の新旧Module混在を防止。

【修正】
・なし。

【未対応】
・mainへの統合／GitHub Pages公開は本番反映のため未実施。
・Android実機とCubasis/Cubase実機確認は引き続き未完了。

## v0.5-dev
更新日: 2026-10-13

【追加】
・390px幅で保存・再読込・主要画面・Draft.midダウンロードを確認するブラウザ回帰テスト。

【変更】
・Demo ComposerのMIDI出力ボタン、Drive共有、制作ガイドをDraft.midへ統一。Arrangement Labのfinal Song.midとは役割を分離。
・Legacy Schema 3 / Song Project v1と保存データは維持。

【修正】
・Song.midボタンが存在しない出力キーを参照して「生成できませんでした」となる不具合を修正。

【未対応】
・Android実機とCubasis/Cubase実機確認。
・Cloud Browserはviewport変更APIがないためスマホ幅の直接確認は未実施（390pxはCIで確認）。

## 2026-10-13 — main統合・公開後の整合性修正

- Demo Composer v0.4-dev / Arrangement Lab v0.5-dev / SongProject v1はPR #177でmain統合済み。
- PR #178でCI gate、PR #179/#180でPages公開元をmainへ変更。main CI / Deploy成功。
- README / AI_HANDOFF / Arrangement VERSION_HISTORYの旧運用記載と、画面Version表示を修正。Version番号・Schema・音楽処理は維持。
- Android/Cubasis/Cubase実機確認は未完了、stable tag未作成。


## 2026-10-13 — main運用変更

Git運用を以下へ変更。

- `develop`: 開発統合用
- `main`: 自動テスト・build・回帰CI合格版
- `stable tag`: Android実機および必要なCubasis / Cubase実機確認済み版

現在のmain統合候補:
- Demo Composer `v0.4-dev`
- Arrangement Lab `v0.5-dev`
- Song Project schema `v1`

統合前develop:
- `0f67fb8713a457bb55ac3bad8b3d6e74d2c52c44`

既存復元点:
- 統合前: `backup/v0.3-dev_v0.4.1-dev_before_songproject`
- SongProject統合後: `backup/v0.4-dev_v0.5-dev_songproject-integrated`

実機確認が終わるまでstable tagは作成しない。

## 作曲シート v0.6-dev — 2026-10-14
記入用を先頭へ。保存・Drive共有と各アプリ簡易表示。旧v0.1〜v0.5保持。stable未認定。
