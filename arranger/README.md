# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## Start
Repository rootをHTTP配信して `/arranger/` を開く。

```bash
python -m http.server 8080
```

`http://localhost:8080/arranger/`

## v0.1
Demo Composerのproject.jsonを読み込み、Sectionごとの編曲方向を3案比較し、採用案をArrangement Plan JSONとして保存する。

## Test

```bash
node arranger/tests/core.test.mjs
```
