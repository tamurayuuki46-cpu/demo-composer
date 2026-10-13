# v0.3-dev 検証記録
更新日: 2026-10-12

## 自動検証
- 作曲判断追加時の既存+新規48テスト成功。GitHub CI成功。
- build-cacheテスト: 94 Module / 221依存を同一Build IDで読むことを確認。GitHub CI成功。
- IndexedDB模擬環境でSchema 2退避の非上書き、Schema 3保存→再読込、複製による設計メモ保持を確認。
- DOM操作検証で設計メモ・Section役割・候補生成・A/B・理由・Undo・古い採用拒否を確認。

## 公開Chromeでの操作
- 公開Build 453ac60でHubの設計メモ・5軸・未決定項目・採用ログを表示。
- 設計メモを保存し、未決定項目が8→3件に変化。
- 主旋律の末尾2音だけの候補を作成。A/Bとも4音、2音は同じ、2音だけ変わることを表示。
- A/B試聴が再生され、Undo履歴は増えない。
- Bと1行理由を採用し、Undo1手でログが1→0件、Redoで1件へ復元。
- Save Now→reload後に設計メモと採用理由が保持されることを確認。
- Chord / 裏メロ / Sound / Arrangeの判断パネルを確認。
- 公開確認で古いJSキャッシュの混在を発見し、Build ID付きの入口/依存URLで修正。
- 新しい保存/操作ボタンは高さ44px以上に統一。採用/キャンセル時に古い試聴通知を閉じる。

## GitHub Pages 再配信
- PR #162でタッチ操作改善をdevelopへ統合したが、マージ直後のGitHub Pages push runが作成されず、公開Buildは453ac60のままだった。
- 公開版へPR #162の変更を確実に反映するため、この記録更新をPages再配信トリガーとして使用する。
- 再配信後は `build.json` のBuild ID更新と、公開画面の44pxボタン・採用/キャンセル時の試聴通知終了を再確認する。

## 未確認
Android実機の描画・主観的な音質、Cubasis/Cubase実機への取込。
クラウドChromeの確認をAndroid実機確認として扱わない。

## 復元
- 変更前: restore/v0.3-before-decision-support（Schema 2）
- 機能統合: PR #160
- キャッシュ修正: PR #161
- タッチ操作改善: PR #162
- 過去復元点とmainは維持。
