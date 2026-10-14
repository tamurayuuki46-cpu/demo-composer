# Section調整の試聴

Version: v0.12-dev
更新日: 2026-10-14

## 目的

④「Sectionを1つ調整」で、変更を採用・保存する前に実際の音を確認できるようにする。

## 基本操作

1. 密度、Drums / Bass / Harmony / 裏メロなどを調整する。
2. `▶ このSectionを試聴` を押す。
3. 対象Sectionの開始から終了まで、現在の候補状態で簡易試聴する。
4. 停止は既存の `停止` ボタンを使う。

## リハモ

1. `3案を提案` を押す。
2. 「自然 / 色付け / 大胆」の各候補で `▶ 試聴` を押す。
3. 試聴だけでは現在候補を変更しない。
4. 残したい候補だけ `採用` を押す。
5. 採用後は従来どおりArrangement Plan / MIDI / SongProject引き継ぎへ反映する。

## 安全性・互換性

- 試聴用リハモは一時candidateを生成して鳴らすだけで、stateへ書き込まない。
- 元のDemo Composer Project / SongProject compositionは変更しない。
- SongProject v1、Demo Project Schema 3、Arrangement Plan Schema 4は変更しない。
- 既存のWeb Audio簡易試聴、停止、画面非表示時のAudioContext破棄を再利用する。
- Section試聴は対象Sectionの `startTick` から `endTick` に限定する。

## 回帰テスト

Mobile Chromium 360 / 390 / 430pxで以下を確認する。

- A/B/C全体試聴が従来どおり動く。
- `▶ このSectionを試聴` で発音イベントが生成される。
- リハモ「自然」の `▶ 試聴` で発音イベントが生成される。
- 試聴後に「採用: 自然」へ勝手に変わらない。
- `採用` を押した場合だけ現在候補へ反映される。
- 停止操作が有効。
- 横スクロール、Console error、赤いエラートーストが発生しない。