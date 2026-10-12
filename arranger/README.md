# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## v0.2
Demo Composerのproject.jsonを読み込み、A/B/C編曲案を試聴・比較・Mixし、Sectionごとの密度/楽器ON-OFFとリハモ3案を編集して、パート別MIDIとArrangement Plan JSONを書き出す。

## Start
Repository rootをHTTP配信して `/arranger/` を開く。

```bash
python -m http.server 8080
```

`http://localhost:8080/arranger/`

## Test

```bash
node --check arranger/src/core.js
node --check arranger/src/app.js
node arranger/tests/core.test.mjs
```
