Version: v0.4-dev
更新日: 2026-10-13

【追加】
・3アプリ共通交換形式 Song Project v1 を追加
・Demo Composer ↔ SongProject Adapterを追加
・Demo Composer HubへSong Project v1 JSON Export / Import入口を追加
・Arrangement LabへSong Project v1 Import / arrangement書き戻し / Exportを追加
・Arrangement Labへ5Track final Song.mid Exportを追加
・Song.midへTempo / Time Signature / Section Markerを追加
・SongProject往復・Legacy互換・所有領域保護の自動テストを追加
・Project Homeを追加（状態確認 / 3アプリ入口 / Project Backupのみ）
・専用GitHub Actions CIを追加

【変更】
・Demo Composerをv0.4-devへ更新。既存Project Schemaは3のまま維持
・既存Demo Composer Schema 3は維持し、共通ProjectはAdapter層として追加
・Arrangement Labは既存Demo project.json入力を残したままSongProject v1も受理
・異Origin連携の初期正本をJSONファイル交換とした
・Demo Composerの全体MIDI出口をDraft.midへ変更し、Arrangement Labの最終Song.midと役割を分離

【修正】
・SongProject往復時にTrack固有設定・未知Legacyフィールドが落ちないよう互換Snapshot方式へ修正
・Arrangement書き戻しでcompositionを上書きしないOwnershipチェックを追加
・Demo再編集後もArrangement領域を保持するMergeルールを固定

【未対応】
・Basic Pitch Web Worker化
・Android実機での長尺Basic Pitchメモリ検証
・本番Deploy / main merge（承認が必要なため未実施）
