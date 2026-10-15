# Demo Composer Root PWA / Service Worker

Version: v0.7-dev
更新日: 2026-10-13

## 目的

Demo Composer本体をAndroid Chromeで再訪しやすくし、初回オンライン読込後は通信が一時的に無くても本体ShellとProject Homeを開けるようにする。

この変更はSong Project v1 / Legacy Project Schema 3 / IndexedDB保存形式 / MIDI形式を変更しない。

## 対象

Root Service Worker: `/service-worker.js`

Scope: Demo Composer root (`./`)

事前Cache:
- `index.html`
- `src/` 配下のDemo Composer本体JS/CSS
- `public/manifest.webmanifest`
- `public/icon.svg`
- `project-home/` 配下

Arrangement Lab (`/arranger/`) は独自PWA Cacheを持つため、root workerの事前Cache対象から除外する。

## 更新方式

Production build時に `scripts/build-static.mjs` がGit commit短縮IDをCache Versionとして `dist/service-worker.js` へ埋め込む。

JS/CSSの事前Cache URLは既存のBuild ID query (`?build=<id>`) と一致させる。

`build.json` は更新検知に使うためService Worker Cacheへ入れず、常にnetworkへ問い合わせる。

新Service Workerはinstall後にwaiting状態で待機する。画面の更新通知で「更新する」を押すと `SKIP_WAITING` を送り、controller切替後に1回だけreloadする。

## Offline方針

Navigation:
1. network first
2. network失敗時は同一URL Cache
3. Project Homeは `project-home/index.html` fallback
4. その他はroot `index.html` fallback

Static asset:
- cache first
- Cacheに無ければnetworkから取得してDemo Composer専用Cacheへ保存

## Cache分離

Cache prefix:

`demo-composer-shell-`

更新時に削除するのはこのprefixのCacheだけとする。

Arrangement Labや他アプリのCacheは削除しない。

## Manifest

`public/manifest.webmanifest`

- standalone
- root start_url / scope
- SVG app icon
- maskable purpose

## 検証

CIのStatic build後、既存 `test:build-cache` から `scripts/pwa-smoke-test.mjs` を実行する。

確認項目:
- manifestのstart_url / scope / icon
- root Service Worker登録入口
- Production Service WorkerへBuild IDが埋め込まれること
- index / manifest / icon / PWA登録Module / Project Homeがprecacheに含まれること
- `build.json` がprecacheに含まれないこと
- `/arranger/` がroot precacheに含まれないこと
- 更新Cache削除がDemo Composer prefixだけに限定されること

## 実機確認

stable tag作成前にAndroid Chromeで以下を確認する。

1. オンラインで1回起動
2. ホーム画面追加 / standalone起動
3. Project保存後にreloadして保持
4. オフラインで再起動
5. Hub / Chord / Melody / Rhythm / Arrange / Soundの主要画面を開く
6. Project Homeを開く
7. 再オンライン後に新Build通知→更新
8. Arrangement Lab側Cacheが消えていないこと

Android実機確認前はstable tagを作成しない。
