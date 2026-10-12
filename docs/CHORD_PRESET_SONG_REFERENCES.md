# Chord Preset 代表曲リファレンス

## 目的

Chord Presetの数字進行を、初心者が「知っている曲の感じ」と結び付けて理解しやすくする。

100種類すべてへ無理に曲名を付けるのではなく、進行が確認でき、学習用の代表例として分かりやすいものだけを表示する。

## 表示ルール

- Presetの選択肢には数字進行を先頭に表示する。
- 確認済みの代表曲がある場合だけ `曲名 / アーティスト` を併記する。
- 原曲は7th / add9 / sus / 分数コード / 経過和音などを含む場合があるため、Demo ComposerのPresetは簡略化した骨格として扱う。
- 「その曲全体が同じ4コードだけ」という意味ではない。原則として曲中の一部の使用例として示す。
- 特定楽曲の音符・メロディ・歌詞は保存しない。
- 代表曲の追加時は、コード進行の資料を確認し、Spotifyカタログに対象曲・アーティストが存在することも確認する。
- Project Data / schemaVersionには追加しない。Chord画面の学習用表示だけとする。

## 初期採用例

| 数字進行 | Degree | 代表曲 | アーティスト |
| --- | --- | --- | --- |
| 1564 | I–V–vi–IV | チェリー | スピッツ |
| 4536 | IV–V–iii–vi | 夜に駆ける | YOASOBI |
| 6415 | vi–IV–I–V | 前前前世 | RADWIMPS |
| 15634145 | I–V–vi–iii–IV–I–IV–V | マリーゴールド | あいみょん |
| 4156 | IV–I–V–vi | Lemon | 米津玄師 |
| 4561 | IV–V–vi–I | ピースサイン | 米津玄師 |
| 6451 | vi–IV–V–I | Get Wild | TM NETWORK |

## 実装

- `src/chord/chord-song-references.js`: 代表曲メタデータ
- `src/chord/chord-presets.js`: 数字進行を含む選択表示と説明文への代表曲追記
- `scripts/chord-preset-smoke-test.mjs`: Preset数100件の維持、既存ID/内部label互換、代表曲表示を確認

## Version / Schema

- appVersion: 変更なし (`v0.2-dev`)
- schemaVersion: 変更なし (`2`)
- MIDI / project.json / Chord Data: 変更なし
