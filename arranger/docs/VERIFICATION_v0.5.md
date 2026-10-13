# Arrangement Lab v0.5-dev Verification

更新日: 2026-10-13
Branch: `chatgpt/arranger-v0.5`
Restore: `restore/arranger-v0.4.1-before-v0.5`

## 自動検証対象

### Core / regression
- core.test.mjs
- regression.test.mjs
- features.test.mjs
- music-labs.test.mjs
- v05.test.mjs
- v05-workflow.test.mjs

### v0.5 workflow
- Song.mid Type 1 / Track構成
- Drum Fill 3案 / Bass Approach 3案
- Demo Composer複製project.json
- 変更パート検出
- Bメロ/Prechorus→サビ範囲
- 採用/不採用/保留/気になる/制作日記の判断ログ
- Section snapshot / 原案 / 過去履歴への復元
- Store ZIP生成
- DAW ZIP内のBefore/After MIDI、各種指示・判断ログ

### Browser
既存 `browser.test.cjs`: 360 / 390 / 430px、50手法、音声/MIDI/JSON/Offline回帰。

`v05-browser.test.cjs`: 390pxで以下を確認。
- v0.5表示
- ①比較試聴室表示
- 目隠し消去式比較
- 変更部分だけ再生
- Bメロ→サビ試聴
- ⑤判断保存 / 原案復元
- Drum Fill実Note適用
- ⑥DAW ZIP / Before Song.mid / After Song.mid
- 横overflowなし
- Console errorなし

`pwa-update.test.cjs`: v0.3旧Worker/Cacheからv0.5 Build-stamped PWAへ更新し、旧保存データと別PWA Cacheを保持。Offline再読込。

## CI結果
PR作成後のGitHub Actions結果をここへ追記する。

## 実機継続課題
- Android Chrome実機での音量感・長時間操作
- Cubasis / CubaseでのBefore/After Song.midおよびDAW ZIP内MIDIの実取込
- DAW側のGM/Drum map差による音色確認
