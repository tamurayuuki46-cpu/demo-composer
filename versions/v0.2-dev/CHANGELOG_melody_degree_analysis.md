Version: v0.2-dev
更新日: 2026-10-11

【追加】
- Melody Analyzerに「Keyからの度数」を追加。Key主音を1として、メロディ全体でよく使う度数を集計する。
- Melody Analyzerに「Chordからの度数」を追加。コードがある小節の音を各Chord Root基準のR / 3 / 5等で集計する。
- Melody Analyzerに「Scale内率」を追加。現在のKey / Scale内の音数・Scale外音数を表示する。
- Melody Analysis Smoke TestにMajor / Minor、Scale外音、Chord有無の確認を追加。

【変更】
- 既存のコードトーン率は残し、「コード構成音か」と「Chordから何度か」を別の観点として表示する。
- Melody Analyzerは良い / 悪いの採点ではなく、Key / Chord / Scaleの関係を理解する学習補助として維持する。

【修正】
- なし。

【未対応】
- Major / Minor以外のScale分析は未対応。
- 各Noteを個別タップして3観点を詳細表示するUIは未対応。現時点はMelody Analyzer内の集計表示。

Schema変更: なし（schemaVersion 2を維持）
復元点: restore/v0.2-before-melody-degree-analysis
統合PR: #88
