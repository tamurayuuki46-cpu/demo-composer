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

Drive Export UIはIndexedDBのActive Projectを事前に読み込み、Hubに表示されている `Revision` と保存済みProjectの `revision` が一致しているか確認する。

古いRevisionをDriveへ送らない方針は維持するが、Androidで「ボタンを押しても何も起きない」ように見えるのを避けるため、Driveボタン自体は常に押せる状態にする。

Revisionがまだ一致しない時に押した場合は:

- Hubメッセージに `Drive用の最新保存を確認中` と表示する
- `Save Now` を押すか1〜2秒待つよう案内する
- 裏では保存済みRevisionの再確認を続ける
- 最新保存が確認できるまでは共有画面を開かない

これにより、古いRevisionの共有防止と、タップ時の明確な反応を両立する。

## 非対応環境

`navigator.share` / File Shareに対応しないブラウザでもDriveボタンは無効化しない。
押した時に `Chromeで開くか、通常Exportを使ってください` とHubメッセージへ表示する。

ChatGPTなどのアプリ内ブラウザでは、Web Share APIが制限される場合がある。その場合はAndroid ChromeでDemo Composerを開いて利用する。

## Data / Schema

- `project.json` の内容は変更しない
- schemaVersionは2のまま
- MIDI形式は変更しない
- Googleアカウント情報、Drive file ID、OAuth tokenはProject Dataへ保存しない
- Drive保存先フォルダはDemo Composer側で固定しない
- 共有先にGoogle Driveを選んだ場合も、その端末で利用しているGoogleアカウント側のDriveへ保存する

## 実装

- `src/hub/drive-export.js`
- `src/hub/app-entry.js` からUIをinstall
- `src/hub/export.css`
- `scripts/drive-export-smoke-test.mjs`

## 復元点

Drive Export追加前:

`restore/v0.2-before-drive-share-export-latest`

Driveボタン反応修正前:

`restore/v0.2-before-drive-share-button-fix`
