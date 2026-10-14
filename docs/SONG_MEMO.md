# 曲データ共通メモ帳

Version: v0.14-dev
更新日: 2026-10-14

## 目的

画面右上の `📦 曲データ` から、現在の曲にひもづく簡単なメモをすぐ開けるようにする。

対象:
- 作曲シート
- Music Project Home
- Demo Composer
- Arrangement Lab
- MIDI Analyzer（別Repository v0.16-dev）

## UI

v0.13-devで導入した `全アプリ遷移 / MIDI保存 / JSON保存 / 作曲シート成果物` の4大操作は維持する。
`📓 メモ帳` は補助操作として追加し、スマホの主要4操作を増やさない。

## 保存

メモは `projectId` ごとに端末の localStorage へ保存する。同じ曲名でも Project ID が違えば別メモとして扱う。

保存形式はアプリ本体の SongProject v1 / Demo Composer Project Schemaを変更しない。既存曲との互換性を優先し、メモは補助データとして分離して保持する。

## 外部共有

- `💾 端末に保存`: 現在の曲専用メモとして保存。入力中も短い遅延で自動保存する。
- `☁️ Drive / Notion`: Android / 対応ブラウザの共有画面を開き、Google DriveまたはNotionをユーザーが共有先として選択する。
- `🤖 ChatGPTへ共有`: メモと「次にやることを3つ以内で整理してほしい」という依頼文を共有し、共有先でChatGPTを選択できるようにする。
- `📄 TXT保存`: 普通のテキストファイルとして端末へバックアップする。

Web Share APIが使えない環境では、Drive / NotionはTXT保存へ、ChatGPTはクリップボードコピー + ChatGPTを開く動作へフォールバックする。

共有先アプリへの直接ログイン・自動アップロードは行わない。共有画面での保存先選択はユーザー操作で行う。

## PWA / Offline

- Demo Composer / Project Home / 作曲シート: root buildが `src/` をPWA precacheへ収集するためメモModuleも事前Cacheされる。
- Arrangement Lab: 独自Service Workerの外部共有Module一覧へ `song-memo-pad.js` を追加する。

## 互換性

- SongProject schemaVersion 1: 変更なし
- Demo Composer Project Schema 3: 変更なし
- Arrangement Plan Schema: 変更なし
- IndexedDB Schema: 変更なし

## 自動検証

- 同名の別Project IDで保存キーが分離されること
- Drive / Notion / ChatGPT共有コードが存在すること
- Arrangement Lab PWAがメモModuleをCacheすること
- Mobile Chromium 360 / 390 / 430pxでメモ帳を開き、入力→自動保存→再表示できること
- 4大操作が引き続き4個のままであること

## 未確認

- Android実機の共有画面にGoogle Drive / Notion / ChatGPTが表示されること
- 各共有先で実際に保存・受け取りが完了すること
- stable tagは上記を含む実機確認後のみ作成する
