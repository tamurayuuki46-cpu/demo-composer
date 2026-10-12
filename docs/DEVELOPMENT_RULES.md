# DEVELOPMENT_RULES

- Androidスマホでの使いやすさを最優先する。
- 新機能は「スマホで作曲判断がしやすくなるか」で判断する。
- AIは完成曲を自動生成せず、候補提示→ユーザー選択→修正を基本とする。
- Module間の責任を分離し、他Module所有データを勝手に書き換えない。
- project.json Schema変更前は復元ポイントを作る。
- 過去Versionを上書き・削除しない。
- 大規模変更前は feature branch または milestoneを作る。
- 変更時はVERSION、CHANGELOG、AI_HANDOFF、関連docsを同期する。
- Claude / ChatGPT固有の重要仕様をCLAUDE.mdやAGENTS.mdだけに保存しない。
