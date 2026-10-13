# Demo Composer

Androidスマホ中心で使う作曲支援PWAです。

## コンセプト

Demo Composerは「スマホ版DAW」を目指しません。

目的は、PCを起動する前に以下の作曲判断をスマホで進めることです。

- コード進行
- メロディ
- ベース
- ドラム / リズム
- 曲構成
- 裏メロ
- 音色の方向性
- Demo v1

本制作は `Demo Composer → Cubasis / BandLab → Cubase → 各種プラグイン` へ引き継ぎます。

## Current Version

`v0.7-dev`

## Status

現在は、Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite、Undo / Redo、project.json読み込み、schemaVersion 3準拠の共通Project State、IndexedDB保存、AutoSave、常設Demo Player、MIDI / project.json Export、Song Project v1、Project Home、Root PWA / Service Workerを実装しています。

HubではProject名 / BPM / Key / Scaleを編集できます。Key変更時はChord / Melody / Bassを同じ最短半音幅で自動移調し、Drumsは変更しません。Scale変更はChord / Melody / Bassがある場合は安全のため拒否します。通常の変更は1.5秒後にAutoSaveされ、アプリがバックグラウンドへ移る時にも保存します。`Save Now`は即時保存とPersistent Storage要求に使います。Hubの `＋ 新規Project` では現在のProjectを保存してから、別IDの空ProjectをActiveにして新しい曲を始められます。旧Project自体は端末内に残します。

Chordでは、HubのKey / Scaleに合うダイアトニックコード7つを五度圏の関係が見やすい扇形ビューで表示します。Majorは `IV / ii ← I / vi → V / iii` と `vii°`、Minorは `VI / iv ← III / i → VII / v` と `ii°` の配置で、各コードをタップすると従来どおり1小節ずつ進行へ追加できます。さらに基準音をC〜Bから選び、`Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug` の9種類を1小節ずつ進行へ追加できます。加えて100種類のChord Preset（王道・明るい / J-POP・切ない / ロック・力強い / バラード・やさしい / ダンス・ループ / ジャズ・おしゃれ / マイナー・暗めの7カテゴリ）を現在のKey / Scaleへ自動変換して適用できます。Preset適用後も個別追加・削除で修正できます。

Chord画面の `Backing Pattern` では、コード進行自体を変えずに `Block / 8分刻み / Arpeggio / Syncopation` の4種類から伴奏の鳴らし方を選べます。選択はAutoSave / Undo / Redo対象で、Demo Playerと `Chord.mid / Draft.mid` のChord Trackへ反映されます。既存ProjectはBacking未設定時にBlockへFallbackします。

Melodyでは、Androidスマホ向けの簡易Piano Rollを実装しています。左端に白鍵 / 黒鍵が分かる縦ピアノKeyboardを表示し、8分音符 / 16分音符を切り替えてタップ入力できます。16分音符はタップ幅を保つため半小節ずつ表示します。Bar / Octave切替、音の長さ指定、音の役割の色分け（コード構成音=青 / テンション=緑 / スケール外=黄 / アボイド=赤）、度数表示、Copy Bar / Copy 2小節、Melody Analyzerに対応しています。さらに現在Barの `安定 / キャッチー / 浮遊感` の3つのルールベース候補を表示し、1つ選ぶと通常のMelody Noteとして展開します。候補適用後はPiano Rollで1音ずつ修正でき、Undo / AutoSave / Demo Player / MIDI Exportも通常のMelodyと同じ処理を使います。

Rhythmでは、Bass / Kick / Snare / Closed Hi-Hatを同じ画面で入力できます。1小節16 stepを `1 e & a / 2 e & a / 3 e & a / 4 e & a` として1画面に同時表示し、Bassは現在Chordを基準にルート / 3度 / 5度 / 7度 / オクターブ上 / ルート下などを選択できます。現在Beatを次Beatへ、現在Barを次BarへコピーするRhythm Copyにも対応しています。さらに `8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH` の6種類のDrum Presetを現在Barへ適用し、適用後に16 stepを手動修正できます。

Arrangeでは、イントロ / Aメロ / Bメロ / サビ / 間奏 / Cメロ / アウトロをSectionとして並べ、構成Template、小節増減、Sectionコピー / 削除、Section単体再生に対応しています。Section操作はChord / Melody / Bass / DrumsをCoreのGlobal Operationでまとめて扱い、Undo / Redoできます。Draft.midのConductor TrackにはSection Markerを書き出します。

Sound Sketch Liteでは、Chord / Melody / Bassの仮音色方向をスマホで決められます。Chordは `Keys / Pad / Piano`、Melodyは `Lead / Keys / Pluck`、Bassは `Soft Bass / Synth Bass / Deep Bass` から選択でき、さらに `Natural / Bright / Soft / Warm / Dark / Airy / Aggressive` のToneタグを組み合わせられます。選択は `project.instruments[]` に保存され、AutoSaveとUndo / Redoの対象です。Demo PlayerのWeb Audio仮音色へ反映しますが、MIDI Note / Chord Data / Rhythm Dataは変更しません。最終音色はCubasis / Cubase / Plugin側で差し替えます。

Demo Playerは画面下部に常設し、Chord / Melody / Bass / Drumsを軽量な仮音でPlay / Stop / Loop再生できます。パートごとのMute / Soloで聴き分けでき、ArrangeからSectionだけを再生する場合もSound / Backing設定を維持します。

Exportでは `Draft.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid` と `project.json` をダウンロードできます。Song / Part MIDIはSMF Type 1、PPQ 480です。Sound Sketch LiteはMIDI Program Change / CCを出力しませんが、Backing PatternはChord TrackのNote配置としてMIDIへ反映します。Hubからproject.jsonの読み込みもできます。

HubのAI相談は、現在のProject情報を相談用テキストへまとめてコピーする方式です。APIへ自動送信せず、ChatGPT / Claudeへユーザーが貼り付けて相談できます。

schemaVersion 1 / 2の保存Projectは、v0.3起動時に移行前データをIndexedDB内へ退避した上でschemaVersion 3へ自動Migrationします。音符・コード・Key・BPM・PPQ・拍子は変えず、作曲判断の保存領域だけを追加します。v0.3のproject.jsonはv0.2では読み込めないため、復元時は移行前バックアップを使います。詳細は docs/DECISION_SUPPORT.md。

Hubの Export から、`project.json` に加えて MIDI（.mid）も読み込めます（役割を確かめてから取り込みます）。

Hubの「作編曲の手引き」から、出発点からCubasis / Cubaseへ渡すまでの手順をスマホで確認できます。Android実機で1曲を通して作るテスト手順は `docs/REAL_SONG_TEST.md` にあります。

Root PWAはBuild ID単位のService Worker Cacheを使い、Demo Composer本体とProject Homeを初回オンライン読込後にオフラインでも開ける構成です。更新通知の「更新する」でwaiting workerを切り替えます。Arrangement Labは独自PWA Cacheを持つためroot Cacheから分離しています。詳細は `docs/PWA_SERVICE_WORKER.md`。

未実装の主要項目は、Snapshot履歴、Drums音色変更、本格Sound Sketch整理です。PWAのホーム画面追加・standalone・offline更新はAndroid実機確認が残っています。

## v0.3 作曲判断

Hub: 曲の設計メモ、主旋律・裏メロ・ハーモニー・リズム・音色の5軸、未決定項目、採用理由ログ。
Arrange: 編集可能なSection役割。Chord: 感情タグとは別の「コードを置く目的」。Melody / 裏メロ: 同じAnalyzerから分析・手動タグを表示。
各画面の「作曲の判断」は折りたたみ。現在案 → 1要素だけ変える候補 → A/B試聴 → 選択 → 修正を支援します。コード進行 / 主旋律 / 裏メロ / 音色の比較、最後の2音・リズム・音高・コード1個・裏メロ・コード音域の別案に対応。候補自体はメモリのみ。採用結果と任意の1行理由はUndo1手で戻せます。

## AI共同開発

- Claude: `CLAUDE.md`
- ChatGPT / Codex: `AGENTS.md`
- 共通の引き継ぎ正本: `docs/AI_HANDOFF.md`

重要な仕様はAI固有ファイルへ閉じ込めず、必ず `docs/` の共通仕様へ反映してください。

## 最初に読むファイル

1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DATA_SCHEMA.md`
7. `docs/PWA_SERVICE_WORKER.md`
8. `CHANGELOG.md`

## 開発原則

- Androidスマホ優先
- 初心者UX優先
- PC版DAWを再現しない
- Module間を直接依存させない
- `project.json` をDemo Composer内の正本とする
- MIDI Exportを重要機能として扱う
- 過去Versionを上書きしない
- 大規模変更前に復元ポイントを作る

## 起動

ローカル開発ではビルド不要です。

`index.html` をローカルサーバーで配信してください。

例:

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

## Vercel（現在は自動配信を停止中）

`vercel.json` の `git.deploymentEnabled: false` で、GitHubへのPush / PRでVercelが自動配信しないようにしています（PRのチェックにVercelが出ません）。公開確認はGitHub Pagesを使います。再開する場合は `vercel.json` からこの設定を消します。

以下は、Vercelへ手動で配信する場合の設定です。

Vercel配布時のみ `npm run build` を実行し、`dist/` を静的公開します。

- Build Command: `npm run build`
- Output Directory: `dist/`
- 設定ファイル: `vercel.json`
- 静的コピー処理: `scripts/build-static.mjs`

アプリ本体の構成は変更せず、`index.html` / `src/` / `public/` をそのまま `dist/` へコピーします。

## GitHub Pages

GitHub Pagesを公開先として利用します。

- Workflow: `.github/workflows/pages.yml`
- 公開元: `main`
- Build Command: `npm run build`
- Output Directory: `dist/`
- 詳細: `docs/GITHUB_PAGES.md`
- 公開URL: `https://tamurayuuki46-cpu.github.io/demo-composer/`

`develop`は未公開の開発統合、`main`は自動テスト・build・回帰CI合格版かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。mainへの変更はPR経由で行います。

## Song Project v1連携

共通SongProject JSONと既存project.jsonを併用。Arrangement Lab v0.5-devとの往復とarrangement書き戻しに対応。Demo ComposerのDraft.midとArrangement Labのfinal Song.midを分離します。詳細は `docs/SONG_PROJECT.md` と `docs/RELEASE_POLICY.md`。
