# Demo Composer

Androidスマホ中心で使う作曲支援PWA。

目的はPC版DAWをスマホに再現することではなく、Cubasis / Cubaseへ進む前にコード、メロディ、リズム、構成、音色方向性などの主要な作曲判断を整理することです。

## Current status

Version: `v0.1-dev`

現在は初期設計段階です。コード進行と曲想/感情タグを紐付け、複数タグから最大3つのコード進行候補を提示する推薦基盤を実装しています。

## Chord emotion tags

タグは以下の3系統です。

- emotion: 明るい / 切ない / 不安 / 希望 / 高揚 など
- texture: 浮遊感 / 透明 / 暖かい / ダーク / 壮大 など
- scene: 夜 / 青春 / 雨 / ドライブ / 別れ など

コード進行と感情を1対1に固定せず、1つの進行に複数タグと重みを持たせます。

## Test

```bash
npm run test:chord-tags
```

## Shared docs

仕様の正本は `docs/` 以下です。AI間の引き継ぎは `docs/AI_HANDOFF.md` を参照してください。
