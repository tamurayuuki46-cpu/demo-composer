# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。`main` はstable専用。v0.1機能完成地点は復元可能だが、正式stable統合は未実施。

現在実装済み:
- Android Chrome向け作曲支援PWA。目的はスマホDAW化ではなく、PCを起動する前の作曲判断を済ませること
- Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite + 裏メロタブ
- schemaVersion 2 / PPQ 480 / 4/4固定の共通Project State
- IndexedDB保存 / 起動時Restore / 1.5秒AutoSave / hidden時即時Save / Save Now / Persistent Storage要求
- Project全体Undo / Redo（最大50操作、メモリのみ）
- Hub: Project名 / BPM / Key / Scale。Key変更時はChord / Melody / Bass / Counter MelodyをAtomic移調、Drumsは変更しない
- Hub `＋ 新規Project`: 現在Projectを保存後、別IDの空ProjectをActiveにする。旧Projectは端末内へ保持
- Hub `📁 Project一覧`: IndexedDBに保存済みの曲を一覧表示し、`開く / 複製 / 削除`。現在開いているProjectは削除不可。切替前にSave Nowし、reload境界のAutoSave競合を避けるためsessionStorage経由でActive Project IDを確定する。詳細 `docs/PROJECT_LIBRARY.md`
- Hub `🧹 パートを消去`: Chord / Melody / Bass / Drums / Counter Melody（裏メロ）を個別消去。選んだパート以外、Key / BPM / Scale / Structure / Soundは保持。1回のUndoで戻せる。詳細 `docs/HUB_PART_CLEAR.md`
- Hub: 出発点、骨子チェック、16手順の作編曲ガイド、曲の特徴カード、AI相談テキスト、Cubaseでやることメモ、作曲シートリンク
- Chord: ダイアトニック候補、44 Chord Quality、100 Preset、次コード候補、借用和音、曲想/質感/場面タグ、Backing Pattern、好きな進行ライブラリ、メロディからコード、2/4/8小節メロディ生成
- Melody: Android向けPiano Roll、8/16分Grid、Note長、Key基準の音域表示、コード/Key度数、役割色分け、候補3種 + 4 Variation、Melody Analyzer、Section比較、Peak Guide
- Melody Analyzer: 音域 / 跳躍 / コードトーン率 / リズム密度 / 同音連打 / モチーフ反復、Key/Chord度数、Scale内率、Guide/Chord/Tension/Other、非和声音候補、旋律の3視点
- Rhythm: Bass / Kick / Snare / HH、Bass音程・長さ・半音ずらし、Bass候補5タイプ、Drum Preset 6種、Section一括、Fill
- Arrange: Section Template / 小節増減 / 追加削除 / コピー / Section再生 / Energy / Transition / Loop Guide / Section Variation / 骨子レシピ
- Counter Melody: 専用タブ + Arrange連携。Sparse / Active / Hook / Answer / Arpeggio / Riff等の候補、Character Scale / Motion / 別案。保存先 `tracks[role=counter]`
- Sound Sketch Lite: Chord / Melody / Bass Preset + Tone方向タグ。最終音色作成やMixer/FXは行わない
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums / 裏メロの聴き分け、Mute/Solo
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid / CounterMelody.mid（存在時）。Section Marker、Backing Pattern反映
- MIDI Import: 役割提案 → 確認 → Projectへ取り込み
- project.json Export / Import。Demo Composer内の正本はproject.json
- GitHub Pages公開: `https://tamurayuuki46-cpu.github.io/demo-composer/`

開発中:
- PR #154 `v0.2-dev: Project一覧と裏メロ個別消去`
- branch: `chatgpt/v0.2-project-library-counter-clear`
- 復元点: `restore/v0.2-before-project-library`
- Project一覧のAndroid実機UI確認（開く / 複製 / 削除 / reload切替）

次に実装:
- PR #154をCI / Android実機で確認してdevelopへ統合
- PWA Service Worker / オフライン対応
- Cubasis / Cubase実機でMIDI受け渡し回帰確認
- Export導線の整理（Drive専用ではなく共有/保存の実態に沿うUIを検討）
- v0.3骨格設計は、追加機能を増やす前に実制作テスト結果を優先

既知の問題:
- Google Drive連携はDrive API/OAuthではなくAndroid Web Share。ブラウザや共有対象によって動作差がある
- Android Chromeは `.mid` / `.json` のWeb Share制約があり、Drive共有では `.txt` 名を使う回避処理がある
- PWA Service Workerは未実装
- Cubasis / Cubaseへの実機MIDI Import回帰テストが未完了
- Project削除はUndo不可。安全のためActive Projectは削除不可
- Snapshot履歴は未実装（通常のUndo/Redoはメモリのみ）

触らない部分:
- `main` branchは動作確認済みstable専用。開発機能を直接入れない
- `milestone/v0.1-feature-complete` および各 `restore/*` 復元点を上書きしない
- schemaVersion 2を理由なく変更しない
- MIDI PPQ 480 / 4/4固定の前提を無断変更しない
- project.jsonの既存フィールドをModule間で勝手に書き換えない
- Chord / Melody / Rhythm / Arrange / Soundの責任分離を壊さない
- PC DAW級のMixing / Mastering / Plugin Hosting / 高度Audio Editingを追加しない

最近の重要な設計判断:
- Project一覧は新しいCloud DBを導入せず、既存IndexedDB `projects` storeをそのまま一覧化する
- Project切替は、旧画面のvisibility AutoSaveがActive IDを戻す競合を避けるため、sessionStorageに切替要求を置き、reload後 `main.js` より先にActive IDを確定する
- 複製は元Projectを変更せず、別ID・revision 1・`元タイトル のコピー` として保存する。複製しても自動では開かない
- 削除は誤操作防止のため確認必須・Undo不可・Active Project削除不可
- Hubのパート個別消去は専用Schemaを追加せず、通常のProject Snapshotを1回置き換えることでUndo/AutoSaveを再利用する
- Counter Melodyも個別消去対象に含める
- Project Library / パート消去の追加でもProject Data Schema・MIDI形式・Versionは変更しない
- Drive機能はGoogle DriveアカウントやURLを保持しない。Web Shareで端末側の共有先を選ぶ方式

現在のデータSchema:
- `schemaVersion: 2`
- `appVersion: v0.2-dev`
- `project.json` が正本
- `basic.ppq: 480` / `timeSignature: 4/4`
- `chords[]`: root / quality / degree / startTick / durationTick
- `tracks[]`: melody / bass / drums / counter（counterは任意）
- `tracks[].notes[]`: id / pitch / startTick / durationTick / velocity
- `structure.sections[]`: id / kind / name / bars + 任意 energy / transition
- `instruments[]`: chord / melody / bass / chord-backing
- IndexedDB DB `demo-composer`: `projects` storeにProject Snapshot、`meta.activeProjectId` に起動対象ID
- Project Library追加によるDB version変更なし / Migrationなし

最終更新:
2026-10-12
