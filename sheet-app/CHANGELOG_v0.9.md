Version: v0.9-dev
更新日: 2026-10-15

【追加】
・初心者向け「かんたん入力」を標準導線として追加。
・必須入力を「場面・気持ち」「参考曲1曲」の2項目に明確化。
・BPM / Keyは未定のまま進められることを明示。
・ジャンル / 気分 / 歌もの・インスト / 自由メモの簡単入力を追加。
・「かんたん入力 / 31シート詳細」のモード切替を追加。
・`sheet-app/latest/manifest.json` を追加し、最新版VersionとEntryを機械的に取得できるようにした。

【変更】
・`sheet-app/latest/composition_sheet_latest.html` をv0.9へ更新。
・JSONバックアップ名を`composition_sheet_v0.9`へ更新。
・初心者導線から保存→Demo Composer受け渡しまで一画面で進められるようにした。

【互換性】
・SongProject v1 (`schemaVersion: 1`)を維持。
・localStorage key `composition-sheet-full-library-v0.4`を維持。
・v0.8までの31シート、手動アイデア、保存済み曲、Drive共有を保持。
・過去Versionは削除・上書きしない。

【復元ポイント】
・`restore/develop-before-sheet-beginner-latest-home-v0.9-20261015`

【未対応】
・Android実機での最終タッチ操作確認。
・stable tagは実機確認後のみ。
