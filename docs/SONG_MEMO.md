# 曲データ共通メモ帳

Version: v0.13-dev
更新日: 2026-10-14

## 目的

画面右上の `📦 曲データ` から、現在の曲にひもづく簡単なメモをすぐ開けるようにする。

対象:
- 作曲シート
- Music Project Home
- Demo Composer
- Arrangement Lab

## 保存

メモは `projectId` ごとに端末の localStorage へ保存する。同じ曲名でも Project ID が違えば別メモとして扱う。

保存形式はアプリ本体の SongProject v1 / Demo Composer Project Schema を変更しない。既存曲との互換性を優先し、メモは補助データとして分離して保持する。

## 外部共有

メモ帳には次の操作を置く。

- `💾 端末に保存`: 現在の曲専用メモとして保存。入力中も短い遅延で自動保存する。
- `☁️ Drive / Notion`: Android / 対応ブラウザの共有画面を開き、Google Drive または Notion をユーザーが共有先として選択する。
- `🤖 ChatGPTへ共有`: メモと「次にやることを3つ以内で整理してほしい」という依頼文を共有し、共有先で ChatGPT を選択できるようにする。
- `📄 TXT保存`: 普通のテキストファイルとして端末へバックアップする。

Web Share API が使えない環境では、Drive / Notion は TXT 保存へ、ChatGPT はクリップボードコピー + ChatGPTを開く動作へフォールバックする。

共有先アプリへの直接ログイン・自動アップロードは行わない。共有画面での保存先選択はユーザー操作で行う。

## PWA / Offline

Arrangement Lab の Service Worker は共通メモModuleもCacheし、既存のオフライン導線を壊さない。

## 互換性

- SongProject schemaVersion 1: 変更なし
- Demo Composer Project Schema 3: 変更なし
- Arrangement Plan Schema: 変更なし
- 既存IndexedDB: 変更なし

## 未確認

- Android実機で共有画面に Google Drive / Notion / ChatGPT が表示されること
- 各共有先で実際に保存・受け取りが完了すること
- stable tagは上記を含む実機確認後のみ作成する
