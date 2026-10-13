# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## v0.5-dev
Arrangement Labを「候補を自動完成するアプリ」ではなく、編曲判断を行う6つの部屋として整理。

1. 比較試聴室 — A/B/C・Mix、目隠し消去式、簡易ラウドネス補正、変更部分だけ再生、Bメロ→サビ試聴
2. ハーモニー実験室 — v0.4のHarmony/理論Lab 14手法を継続
3. 裏メロ・対話設計 — v0.4のCounter Lab 16手法を継続
4. 展開・密度設計 — v0.4のDevelopment Lab 15手法＋連動5セット、Drum Fill/Bass Approach実Note3案
5. 判断の記録と復元 — 採用/不採用/保留/気になる/制作日記、Section snapshot履歴、原案/過去履歴への復元
6. DAW引き継ぎ — パート別MIDI、Before/After Song.mid、Demo Composer複製JSON、判断ログとチェックリストを含むDAW ZIP

詳細: `docs/V0.5_SIX_ROOMS.md`。

## Compatibility
- Arrangement Plan Schema 4を維持
- 保存キー `demo-composer-arranger-v0.4` を維持
- 判断ログは `demo-composer-arranger-decisions-v0.5`
- Demo Composer本体Schemaは変更しない
- 元project.jsonは上書きしない

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
node --check arranger/src/v05-tools.js
node --check arranger/src/v05-workflow.js
node --check arranger/src/v05-ui.js
node arranger/tests/core.test.mjs
node arranger/tests/regression.test.mjs
node arranger/tests/features.test.mjs
node arranger/tests/music-labs.test.mjs
node arranger/tests/v05.test.mjs
node arranger/tests/v05-workflow.test.mjs
```

Browser CI:

- `arranger/tests/browser.test.cjs`
- `arranger/tests/v05-browser.test.cjs`
- `arranger/tests/pwa-update.test.cjs`

360/390/430pxの既存回帰に加え、v0.5は390pxで目隠し比較、変更部分/Bメロ→サビ試聴、判断履歴/復元、実Note生成、DAW ZIPを確認する。

## v0.4 musical methods
Sectionの編曲ラボ上部からHarmony / Counter / Development / 連動を選択。50手法（14/16/15/5）と157適用Variantは維持し、v0.5の6部屋整理でも既存機能を削除しない。
