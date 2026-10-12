# PRODUCT_SPEC

## コンセプト
Androidスマホ中心の作曲支援PWA。PCを起動する前に、コード・メロディ・リズム・構成・音色方向性などの主要な作曲判断を進める。

## ユーザー
作曲初心者〜初中級者。理論を学びながら、自分で候補を選び修正したい人。

## v0.1 の主要機能
- Hub: Project名 / BPM / Key / Scale / 拍子 / Genre / Mood / 進捗
- Chord: コード入力、Degree表示、候補提示、曲想/感情タグ連携
- Melody: メロディ入力の基盤
- Rhythm: Bass / Kick / Snare / Hi-Hat の基盤
- Demo Player: Play / Stop / Loop / Position
- Save
- MIDI Export基盤

## コード進行と曲想/感情タグ
コード進行に感情を一意に決めつけない。1つの進行に複数タグと重みを持たせる。

タグは3系統を基本とする。
- emotion: 明るい / 切ない / 不安 / 希望 / 高揚 など
- texture: 浮遊感 / 透明 / 暖かい / ダーク / 壮大 など
- scene: 夜 / 青春 / 雨 / ドライブ / 別れ など

ユーザーが複数タグを選ぶと、Chord Moduleは「王道 / 少し個性的 / 挑戦的」に相当する候補を最大3つ提示する。最終決定はユーザーが行う。

## 作らない機能
- 高度なMixing / Mastering
- Audio Editing / Vocal Editing
- Plugin Hosting
- AIによる完全自動作曲
- PC版DAWの再現
