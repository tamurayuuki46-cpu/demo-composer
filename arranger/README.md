# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## v0.6-dev
初心者が「次にどこを触るか」で迷わないよう、初期表示を一本道のガイド付き制作ルートに整理。

1. 曲を読み込む
2. A / B / Cを聴く
3. 残す案を1つ選ぶ
4. Sectionを1つ調整する
5. 判断を1つ記録する
6. DAWへ書き出す

- 画面上部に「次にやること」を1つだけ表示
- スマホ下部に「前へ / 現在工程 / 次へ」固定ナビ
- 完了条件なし。いつでも次へ進め、前へ戻って修正可能
- ④が未生成なら空欄にせず、①→②の手順を表示
- 初心者モードでは④を密度 / 楽器 / 裏メロ / リハモ中心に簡略化
- 「もっと試す」へA/B/C Mix、目隠し比較、50手法、Drum Fill / Bass Approach、詳細MIDI等を収納
- 初回は初心者モード。モード選択は端末内に保持

詳細: `docs/V0.6_BEGINNER_FLOW.md`。

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
- v0.6はUI導線の変更だけで、v0.5までの編曲機能と保存データを維持

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
node --check arranger/src/beginner-flow.js
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
- `arranger/tests/v06-browser.test.cjs`
- `arranger/tests/pwa-update.test.cjs`

360/390/430pxの既存回帰に加え、v0.5は390pxで目隠し比較、変更部分/Bメロ→サビ試聴、判断履歴/復元、実Note生成、DAW ZIPを確認する。v0.6は390pxで初心者モード初期ON、④空状態、一本道ナビ、「もっと試す」切替、高度機能の表示復帰、横はみ出しなしを確認する。

## v0.4 musical methods
Sectionの編曲ラボ上部からHarmony / Counter / Development / 連動を選択。50手法（14/16/15/5）と157適用Variantは維持し、v0.5/v0.6の整理でも既存機能を削除しない。
