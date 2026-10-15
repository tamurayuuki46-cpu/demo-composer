# 公開版 曲データ共通メモ帳

Version: v0.10-dev
更新日: 2026-10-14

## 対象

公開GitHub Pagesの Music Project Home / Demo Composer / Arrangement Lab で、右上 `📦 曲データ` から `📓 メモ帳` を開く。

非公開の31枚作曲シート本体は公開Repositoryへ追加しない。作曲シート側の同機能は非公開Site側で扱う。

## 保存

- `projectId` がある曲はProject ID単位で保存する。
- Project IDがない場合は既存ProjectのIDまたはTitleをフォールバックとして使う。
- 入力中はlocalStorageへ自動保存する。
- SongProject v1 / Demo Composer Project Schema 3は変更しない。

## 共有

- `☁️ Drive / Notion`: Web Share APIでAndroid共有画面を開き、Google DriveまたはNotionをユーザーが選ぶ。
- `🤖 ChatGPTへ共有`: メモと整理依頼文を共有し、共有先でChatGPTを選ぶ。
- `📄 TXT保存`: `${曲名}_memo.txt` として端末へ保存する。
- Web Share非対応時は、Drive/NotionはTXT保存、ChatGPTはクリップボードコピー後にChatGPTを開く。

共有先アプリの表示可否や保存完了は端末側に依存するため、共有画面をキャンセルした場合は成功表示しない。

## 実機確認待ち

Android実機でGoogle Drive / Notion / ChatGPTを共有先として選択し、各サービスで保存・受け取りが完了することはstable判定前に確認する。
