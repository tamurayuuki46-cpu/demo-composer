Version: v0.15-dev
更新日: 2026-10-15

【追加】
・Hubに「AIモニタリング」を追加
・主要32機能の使用済み率 / 未使用率を%で表示
・カテゴリ別の機能利用率を表示
・ポジティブフィードバックを自動生成
・ネガティブフィードバック（改善ポイント）を自動生成
・未使用機能から「次に試す使い方」を最大3件提案
・未使用機能の全一覧を表示
・利用履歴を端末内localStorageだけに保存
・既存の初心者モードと連動するAIモニタリング初心者表示を追加
・初心者表示では「できていること / 改善ポイント / 次はこれだけ」を優先表示
・AIモニタリング用smoke testをCIに追加
・SongProject v1の所有権境界とデータ保持を独立検証する `scripts/song-project-ownership-contract-test.mjs` を追加
・Song Project Integration CIに所有権契約テストを必須ステップとして追加

【変更】
・画面内Version表示をv0.15-devへ更新
・AIコーチという名称ではなく「AIモニタリング」に統一
・初心者モードON時はカテゴリ詳細を折りたたみ、次に試す機能を1件に絞る
・README / docs/AI_HANDOFF / VERSION / package.json の現在Version表記をv0.15-dev基準へ整合
・Git運用を develop=開発統合、main=CI/build/回帰合格の公開候補として再確認

【修正】
・AIモニタリング自身の再描画を監視してループする可能性を解消
・古いREADME / AI_HANDOFFのVersion・公開Version記載を現在状態へ整理

【復元ポイント】
・restore/develop-before-stabilization-20261015
・restore/main-before-stabilization-20261015
・Drive: 作曲支援アプリ安定化_backup_2026-10-15_demo-v0.15-dev_midi-v0.17-dev

【未対応】
・Android実機での最終表示確認
・Cubasis/Cubaseを含むstable判定は従来どおり実機確認後
・main/developは大きく分岐しているため、mainへのRelease統合は今回行わない
