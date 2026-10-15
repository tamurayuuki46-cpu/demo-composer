# Creative Decision Progress

更新日: 2026-10-15
対象: Demo Composer v0.16-dev / Music Project Home v0.19-dev

## 目的

このアプリ群の進捗は「何個の機能を使ったか」「100%まで埋めたか」ではなく、曲について現在どのような判断状態にいるかで捉える。

創作は一本道ではなく、次の往復を正式な基本ループとする。

`発散 ↔ 比較 ↔ 収束`

試す → 比較する → 保留する → 戻る → 派生する → 採用する、を安全に繰り返せることを優先する。

## Decision Progress

状態:

- 未着手
- 探索中
- 比較中
- 保留
- 採用
- 完了
- 任意

`探索中 / 比較中 / 保留 / 任意`は失敗や遅れではない。

100%達成を主要KPIにしない。Feature Usageは利用傾向を見る補助情報として残せるが、曲の完成度として表示しない。

可能な限り既存Project情報と端末内操作履歴から導出し、Decision Progress専用の必須Schema fieldは追加しない。

## Music Project Home

HomeはEditorではなく司令塔である。

表示の中心:

- 現在の工程
- 未決定
- 探索中
- 比較中
- 保留 / 任意
- 次にできる選択肢

「次の1手」は命令にしない。原則として最大3件程度の選択肢に整理し、`今日はここまで`も正式な選択肢とする。

HomeはSongProjectのOwnerにならない。既存の`composition / arrangement / export / lineage`を読み取り、Navigation / Workflow表示だけを担当する。

## Human-AI Co-Creation原則

- Low Threshold: 初心者がすぐ使える
- High Ceiling: 慣れれば深く使える
- Wide Walls: 一つの正しい作曲方法へ限定しない
- steerability: 人が方向を変えられる
- interpretability: なぜその状態・候補なのか理解できる
- user control: 最終判断は人が持つ
- multiple options: 少数の意味ある選択肢を比較できる
- reversibility: 元案へ戻れる

AIは曲を決めるOwnerではない。候補・比較材料・説明を出し、人間の判断を支援する。

## 成功指標

重視する:

- 案を安全に保存できる
- 比較できる
- 保留できる
- 元案へ戻れる
- 派生できる
- 過去案を再利用できる
- 人間が最終判断できる
- DAWへ自然に渡せる
- Androidスマホで短時間でも扱える
- 既存データを壊さない

主要KPIにしない:

- 機能利用率100%
- 全項目完了率100%
- AI提案採用率
- 候補生成数
- 最短完成時間

## Data / Compatibility

- SongProject v1を維持する
- Demo Composer内部Project Schema 3を維持する
- PPQ 480 / 4/4固定を維持する
- Decision ProgressだけのためにMigrationを要求しない
- 旧Projectで追加情報が無くても正常表示する
- Project HomeはSongProjectを書き換えない

## 今回の範囲

v0.16-dev / Home v0.19-devではDecision ProgressとHomeの選択肢表示を実装する。

Arrangement LabのA/B/C Compare EngineおよびCreative Version / Forkの本格実装は別工程で扱う。統合後Adversarial Reviewも別タスクとする。
