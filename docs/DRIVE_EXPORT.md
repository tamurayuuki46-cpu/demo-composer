# Drive Export

## 目的

AndroidスマホのDemo Composerから、ExportしたデータをGoogle Driveへ保存しやすくする。

## v0.2-dev 方針

Google Drive API / OAuthはアプリへ直接組み込まない。
Android ChromeのWeb Share APIを使い、OSの共有画面を開いてユーザーがGoogle Driveを選ぶ。

理由:

- GoogleのClient IDや秘密情報をDemo Composerへ持たせない
- ログイン処理や権限画面を増やさない
- Androidの標準共有フローを利用して初心者UXを単純にする
- 外部サービス障害がProject保存そのものへ影響しない

## UI

Hub → Export に次の2ボタンを追加する。

- `Driveへバックアップ`: `project.json` 1ファイルを共有する
- `MIDI一式をDriveへ`: `Song.mid / Chord.mid / Melody.mid / Bass.mid / Drums.mid` と、裏メロが存在する場合は `CounterMelody.mid` をまとめて共有する

ボタンを押すとAndroidの共有画面が開く。そこでGoogle Driveを選んで保存する。
Google Drive以外の共有先を選ぶこともできるため、UIの補足文で「Google Driveを選んで保存」と明記する。

## AutoSaveとの整合

Web Share APIはユーザーのタップ直後に呼び出す必要があるため、タップ後に長い非同期保存処理を挟まない。

Drive Export UIはIndexedDBのActive Projectを事前に読み込み、Hubに表示されている `Revision` と保存済みProjectの `revision` が一致した時だけボタンを有効にする。

一致しない間は:

- ボタンを無効化
- `AutoSaveの完了を待っています` と表示
- 数秒待つか `Save Now` を押すよう案内

これにより、古いRevisionをDriveへ送る事故を避ける。

## 非対応環境

`navigator.share` / File Shareに対応しないブラウザではDriveボタンを無効化し、従来の通常Exportを使うよう案内する。

## Data / Schema

- `project.json` の内容は変更しない
- schemaVersionは2のまま
- MIDI形式は変更しない
- Googleアカウント情報、Drive file ID、OAuth tokenはProject Dataへ保存しない
- Drive保存先フォルダはDemo Composer側で固定しない

## 実装

- `src/hub/drive-export.js`
- `src/hub/app-entry.js` からUIをinstall
- `src/hub/export.css`
- `scripts/drive-export-smoke-test.mjs`

## 復元点

追加前:

`restore/v0.2-before-drive-share-export`
