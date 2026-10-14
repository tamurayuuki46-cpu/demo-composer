# Music Project Home CHANGELOG

Version: v0.16-dev
更新日: 2026-10-15

【追加】
- 「今ここ」を最上段に表示
- 「未決定」を最大3件表示
- 「次にやること」を1アクションだけ大きく表示
- 「今日決めたこと」「次回やること」の端末内メモ
- `docs/PROJECT_HOME.md` を正本仕様として追加

【変更】
- 制作フローを「作曲シート → 必要ならMIDI Analyzer → Demo Composer → Arrangement Lab → DAW」に整理
- Music Project Homeをアプリ一覧ではなく、曲の現在地と次の一手を示す司令塔へ収束
- 既存のSongProject v1、JSON引き継ぎ、Backup、旧Claudeリンクは維持

【修正】
- 作曲データの有無から現在工程を一貫して判定するよう整理
- 未決定項目と制作進行を別概念として表示

【未対応】
- Android実機での最終タップ/縦画面確認
- Cubasis / Cubase実機引き継ぎ確認
- stable tag（実機確認後のみ）
