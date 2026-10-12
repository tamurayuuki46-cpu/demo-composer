# AI_HANDOFF

現在Version:
v0.3-dev

最新安定版:
なし。`main` はstable専用。v0.1機能完成地点は復元可能。

現在実装済み:
- v0.3作曲判断: 設計メモ5項目、個性の5軸、編集可能なSection役割、コード目的タグ、主旋律/裏メロ分析と手動タグ、未決定項目、採用理由ログ。
- 各画面の折りたたみから1要素候補（末尾2音/リズム/音高/コード1個/裏メロ/コード音域/音色）→A/B比較→採用。Chord Preset進行全体も比較可。Bass保護あり。理由も同時にUndo1手。
- Schema 1/2→3は明示Migration。起動前に元ProjectをIndexedDB metaへrevision別に退避して上書きしない。PPQ/拍子/音楽データは保持。詳細 docs/DECISION_SUPPORT.md / DATA_SCHEMA.md。
- 主旋律1小節A/B比較: 既存候補と現在案を仮Projectで比較、差分表示、B採用はUndo1手。候補はメモリのみ、Project編集で破棄。詳細 `docs/MELODY_AB_COMPARE.md`。Android実機確認は未実施。
- Android Chrome向け作曲支援PWA。Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite / 裏メロタブ
- 共通Project State: schemaVersion 3 / PPQ 480 / 4/4固定 / project.json正本
- IndexedDB保存、起動時Restore、1.5秒AutoSave、hidden時即時Save、Save Now、Persistent Storage要求
- Hub `＋ 新規Project`: 現在Projectを保存してから別IDの空ProjectをActiveにする。旧Projectは端末内に保持
- Hub `📂 Project一覧`: IndexedDBに残っているProjectを一覧表示し、`開く / 複製 / 削除`。現在Projectは削除不可。PR #155でdevelop統合済み。詳細 `docs/PROJECT_LIBRARY.md`
- Hub `🧹 パートを消去`: コード / メロディ / 裏メロ / ベース / ドラムを1パートずつ消去。確認あり、他パートを保持、↶で1手で戻せる。PR #155で裏メロ対応まで統合済み。詳細 `docs/HUB_PART_CLEAR.md`
- Project全体Undo / Redo（最大50操作、メモリのみ）
- Hub: Project名 / BPM / Key / Scale、Key変更時のChord / Melody / Bass / Counter Melody Atomic移調、文字サイズ、出発点、骨子チェック、作編曲の手引き、曲の特徴カード、AI相談、Cubaseメモ
- Chord: ダイアトニック扇形、44 Quality、100 Preset、次コード候補、借用和音、曲想タグ、Backing Pattern、好きな進行ライブラリ、メロディからコード候補、2/4/8小節メロディ候補
- Melody: Android向けPiano Roll、8/16分、Note長さ、コード/Key度数、役割色分け、候補3種、コピー、Melody Analyzer、Section比較、主旋律/裏メロ編集切替
- Rhythm: Bass / Kick / Snare / HH、16 step、Bass候補5タイプ、Drum Preset、Section一括Preset、Drum Fill、Copy
- Arrange: Section Template、小節増減/追加/削除/コピー、Energy、Transition、Section Variation、感情曲線、構成ライブラリ、骨子レシピ、Section再生
- Counter Melody: Sparse / Active / Hook / Answer / Arpeggio / Riff等の候補、範囲指定、別案、Penta/Character/Motion、通常Noteとして保存、CounterMelody.mid
- Sound Sketch Lite: Chord / Melody / Bass Preset + Tone方向タグ。Demo Player仮音色だけに反映
- Demo Player: Play / Stop / Loop / Position、Chord / Melody / Bass / Drums / Counter Melody、パートON/OFF / Solo
- MIDI Export: Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid / CounterMelody.mid（存在時）
- MIDI Import: Track役割を確認してからProjectへ取り込み
- project.json Export / Import、Drive共有補助
- GitHub Pages公開: `https://tamurayuuki46-cpu.github.io/demo-composer/`

開発中:
- v0.3の8項目は実装済み。Android実機の表示・音の主観確認、Cubasis/Cubase実機確認は継続課題。
- Project一覧 / 過去Project管理はdevelopへ統合済み。次はAndroid実機で `開く / 複製 / 削除 / reload切替` を確認する段階
- v0.2は追加機能より実制作と保存・Exportの回帰確認を優先する

次に実装:
- PWA Service Worker
- 保存ProjectのSnapshot / 世代履歴は必要性を再評価してから検討
- Android実機でProject切替 / 複製 / 削除の操作確認
- Cubasis / CubaseへのMIDI実機取り込み回帰確認

既知の問題:
- Project一覧はこのブラウザ/端末のIndexedDBだけ。Cloud同期・別端末同期はしない
- Project削除はIndexedDB record自体を消すためUndo不可。確認を出し、現在Projectは削除不可
- ブラウザデータ削除でIndexedDBのProjectが失われる可能性があるため、重要曲はproject.json Backupを併用
- Drive共有はAndroid/browserの共有制約を受ける
- Cubasis / Cubase実機取り込みの網羅的Regressionは継続課題

触らない部分:
- `main` は動作確認済みstable専用。開発機能はまず `develop` へ
- schemaVersion 3 / PPQ 480 / 4/4固定を、明確なSchema変更手順なしに変えない
- project.jsonをDemo Composer内の正本とする
- Module間を直接強依存させない。複数Moduleにまたがる変更はCore / Storageの責務として扱う
- Mixing / Mastering / Plugin Hosting等、Cubasis / Cubaseが担当すべきDAW機能を追加しない
- 過去Version / 復元Branchを上書きしない

最近の重要な設計判断:
- Project一覧は新しいDB/Object Storeを作らず、既存IndexedDB `projects` と `meta.activeProjectId` を利用する。DB_VERSIONは1のまま
- Project切替は現在Projectの保存完了後、対象IDをsessionStorageへ一時保持してreloadし、`src/hub/app-entry.js` が `main.js` boot前にActive IDを確定する。旧ページのvisibility AutoSave競合対策として短い待機を挟み2回確定する
- Project複製は元Projectをcloneし、新ID / revision=1 / `元タイトル コピー` として保存する。複製後に自動で開かない
- 現在開いているProjectは削除不可。削除はUndo対象外
- Hub個別消去は Chord / Melody / Counter / Bass / Drums を対象にし、選択パートだけを空にする。Schema / MIDI形式は変更しない
- Project一覧と個別消去のためのSchema Migrationは不要
- 大規模保存UI変更前の復元点は `restore/v0.2-before-project-list`。重複作業用の `restore/v0.2-before-project-library` も保持する

現在のデータSchema:
追加: metadata.composition / sections[].purpose / chords[].purposes / instruments[part=chord-voicing]。Schema 3のJSONはv0.2で読めない。復元は旧schemaバックアップを使用。
schemaVersion 3。PPQ 480、4/4固定。`metadata / basic / structure.sections / chords / tracks / instruments / progress / exportSettings`。Counter Melodyは任意の `tracks[role=counter]`。Project一覧はproject.json内に追加フィールドを持たず、IndexedDB `projects` storeの複数recordと `meta.activeProjectId` で管理する。

最終更新:
2026-10-12

大規模変更前の復元点: `restore/v0.3-before-decision-support` / Commit `6e6933329020d06d75fccadb8637bcc5b3392969`。mainへのstable統合は行っていない。

公開検証で旧JSキャッシュと新HTMLが混在する問題を発見。build-static.mjsで全JS/CSS入口と相対Module依存を同じBuild IDのURLへ固定する。test:build-cacheで94 Module / 221依存を検証。

## Arrangement Lab v0.2.1-dev (2026-10-13)
独立PWA arranger/を修正検証。Demo Composer本体Version/Schemaは変更なし。正本: arranger/docs/PRODUCT_SPEC.md / VERIFICATION_v0.2.1.md。復元点: restore/arranger-v0.1.1-before-v0.2, restore/arranger-v0.2-before-work-review。

## Arrangement Lab v0.3-dev — seven features
理論リハモ/相性分析、裏メロスケール案、Section採用、サビ5案、引き算、主役交代をarranger/へ追加。独立Plan Schema 3、旧1/2互換。正本 arranger/docs/PRODUCT_SPEC.md。restore/arranger-v0.2.1-before-seven-features を変更前復元点とする。

## Arrangement Lab v0.4-dev
50の音楽変換手法を実装。独立Plan Schema4/旧1〜3互換。正本 arranger/docs/AI_HANDOFF_v0.4-dev.md / PRODUCT_SPEC.md / MUSIC_LAB_METHODS_v0.4.md。本体Schema/Version変更なし。復元点 restore/arranger-v0.3-before-music-labs。

## Arrangement Lab v0.4.1-dev cache correction
50手法はv0.4としてPR #171統合済み。PWA更新修正はchatgpt/arranger-v0.4-cache-update。旧画面が残る場合の入口は /arranger/?v=0.4.1。Schema4/保存キーv0.4維持。正本 PRODUCT_SPEC / VERIFICATION_v0.4。復元点 restore/arranger-v0.4-before-cache-update。
