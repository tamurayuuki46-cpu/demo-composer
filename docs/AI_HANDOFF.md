# AI_HANDOFF

現在Version:
v0.2-dev

最新安定版:
なし。`main` はstable専用。v0.1機能完成地点は復元可能。

現在実装済み:
- Android Chrome向け作曲支援PWA。Hub / Chord / Melody / Rhythm / Arrange / Sound Sketch Lite / 裏メロタブ
- 共通Project State: schemaVersion 2 / PPQ 480 / 4/4固定 / project.json正本
- IndexedDB保存、起動時Restore、1.5秒AutoSave、hidden時即時Save、Save Now、Persistent Storage要求
- Hub `＋ 新規Project`: 現在Projectを保存してから別IDの空ProjectをActiveにする。旧Projectは端末内に保持
- Hub `📂 Project一覧`: IndexedDBに残っているProjectを一覧表示し、`開く / 複製 / 削除`。現在Projectは削除不可。詳細 `docs/PROJECT_LIBRARY.md`
- Hub `🧹 パートを消去`: コード / メロディ / 裏メロ / ベース / ドラムを1パートずつ消去。確認あり、他パートを保持、↶で1手で戻せる。詳細 `docs/HUB_PART_CLEAR.md`
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
- `chatgpt/v0.2-project-list-counter-clear`: Project一覧 / 過去Project管理と、Hub個別消去への裏メロ追加。develop統合前は `restore/v0.2-before-project-list` へ復元可能

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
- schemaVersion 2 / PPQ 480 / 4/4固定を、明確なSchema変更手順なしに変えない
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

現在のデータSchema:
schemaVersion 2。PPQ 480、4/4固定。`metadata / basic / structure.sections / chords / tracks / instruments / progress / exportSettings`。Counter Melodyは任意の `tracks[role=counter]`。Project一覧はproject.json内に追加フィールドを持たず、IndexedDB `projects` storeの複数recordと `meta.activeProjectId` で管理する。

最終更新:
2026-10-12
