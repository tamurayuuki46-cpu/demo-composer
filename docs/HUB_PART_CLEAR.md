# Hub パート個別消去

## 目的

Hubから、曲全体を消さずに `Chord / Melody / Bass / Drums` の各パートだけを消去できるようにする。

## UI

Hubの `🧹 パートを消去` を開くと、次の4ボタンを表示する。

- コードを消去
- メロディを消去
- ベースを消去
- ドラムを消去

対象パートが空のとき、そのボタンは無効にする。

## 動作

- 実行前に確認を表示する
- 選んだパートだけを空にする
- 他のパート、Key、BPM、Scale、曲構成、音色設定は変更しない
- Counter Melody（裏メロ）は今回の4ボタンでは変更しない
- Demo Playerは消去操作時に停止する
- 1回のProject更新として扱い、画面上部の `↶` で1手で戻せる
- 通常のAutoSave対象

Chordだけを消してBassを残すこともできる。ただし既存の安全ルールにより、Bassが残っている間は新しいChordへの変更が拒否されるため、Chordを作り直す場合はBassも先に消去するようUIで案内する。

## 実装

- `src/core/music-clear.js`: Projectを破壊せず、指定パートだけを空にしたコピーを返す純粋関数
- `src/hub/part-clear-ui.js`: Hubの折りたたみUI、確認、空パートの無効化、Undo可能な適用
- `src/hub/starting-point-ui.js`: Hub内にパート消去UIを組み込む
- `scripts/clear-all-smoke-test.mjs`: 個別消去、他パート保持、Undo、既存の全消去を確認

## Data / Version

- `schemaVersion` 変更なし（2のまま）
- `project.json` 形式変更なし
- MIDI形式変更なし
- Versionは `v0.2-dev` のまま
