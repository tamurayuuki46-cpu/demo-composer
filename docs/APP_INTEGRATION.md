# App Integration Contract

更新日: 2026-10-13

## 現在の配置

- Demo Composer: `demo-composer` repository root
- Arrangement Lab: `demo-composer/arranger/`
- MIDI Analyzer: separate `midi-analyzer` repository

Arrangement Labは独立Repositoryではありません。Demo Composerと同じRepositoryにありますが、将来別Originで配信されても壊れないよう共通交換形式はSongProject JSONを正本とします。

## 連携順序

1. Demo Composer internal Project ↔ SongProject v1
2. SongProject v1 → Arrangement Lab
3. Arrangement Lab → SongProject v1 (`arrangement` only)
4. MIDI Analyzer → SongProject v1 (`analysis` / `reference`)
5. SongProject v1 → Demo Composer (`basic` + required composition inputs)
6. Demo Composer → draft `Draft.mid`
7. Arrangement Lab → final `Song.mid`
8. Audio / Basic Pitch / Key / Stem

## Responsibility boundary

### Demo Composer

曲の作曲データを担当します。

- chords
- melody
- counter melody
- bass
- drums
- sections

既存IndexedDBを維持し、SongProjectを理由に既存Projectを破壊的Migrationしません。

全体MIDIは`Draft.mid`として出力します。これは作曲段階のドラフトであり、最終Song MIDIではありません。

### Arrangement Lab

編曲判断を担当します。

- reharmonization
- voicing
- density
- instruments
- alternatives
- decisions

Compositionは参照しますが、SongProjectへの書き戻し時に所有しません。

採用済み編曲結果の最終一括MIDIは`Song.mid`として出力します。

### MIDI Analyzer

解析・参照素材を担当します。

- imported MIDI derived analysis
- BPM / Key / Scale candidates
- chord / degree
- melody / bass / rhythm analysis
- reference metadata
- Audio→MIDI / Stem reference
- Key adaptation / 12 Key material generation

Analyzer接続時もComposition / Arrangementは保持します。Stem Audio BlobはSongProject JSONへ含めず、metadata参照だけを`reference`へ渡します。

## Storage boundary

異OriginではIndexedDBを共有しません。交換は`*_song_project_v1.json`を使用します。

同一Origin配下に将来統合できる場合も、共通IndexedDBはSongProject Adapterが安定してから検討します。

## Privacy / Copyright

Audio→MIDIはユーザーが明示選択したファイルだけを対象とし、端末内処理を優先します。Spotify等の配信Audioを取得・録音・リッピングする機能は本Integration Contractの対象外です。
