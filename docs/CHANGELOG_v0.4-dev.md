Version: v0.4-dev
更新日: 2026-10-13

【追加】
・3アプリ共通交換形式 Song Project v1 を追加
・Demo Composer ↔ SongProject Adapterを追加
・Demo Composer HubへSong Project v1 JSON Export / Import入口を追加
・Arrangement LabへSong Project v1 Import / arrangement書き戻し / Exportを追加
・SongProject往復・Legacy互換・所有領域保護の自動テストを追加
・専用GitHub Actions CIを追加

【変更】
・既存Demo Composer Schema 3は維持し、共通ProjectはAdapter層として追加
・Arrangement Labは既存Demo project.json入力を残したままSongProject v1も受理
・異Origin連携の初期正本をJSONファイル交換とした

【修正】
・SongProject往復時にTrack固有設定・未知Legacyフィールドが落ちないよう互換Snapshot方式へ修正
・Arrangement書き戻しでcompositionを上書きしないOwnershipチェックを追加

【未対応】
・MIDI AnalyzerのSongProject v1直接接続
・Arrangement Lab最終Song.mid一括Export
・Basic Pitch Audio→MIDI
・Key変更 / 12 Key生成
・Stem / Reference
・Project Home
