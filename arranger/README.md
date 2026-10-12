# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## v0.2.1-dev
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

採用したプランは再読み込みで編集再開できます。編曲プランJSONも同じ入力欄で読み込めます。旧プランは元project.json（同じID/revision）の再選択で復元します。

追加検証: `node arranger/tests/regression.test.mjs`。ブラウザCIは `arranger/tests/browser.test.cjs`。
検証詳細は `docs/VERIFICATION_v0.2.1.md`。
