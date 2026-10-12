# Arrangement Lab v0.3 verification

Story: project.json → Section別の7機能候補 → 理論とメロディ関係を確認 → 試聴/部分採用 → Plan保存 → reload/offline → MIDI。

- core / regression / features tests: PASS。6理論、5scale、5chorus、3subtraction、Section採用、主旋律不変、応答の重なり除去、Schema3保存/MIDI往復を確認。
- 本体のSource/Version/Schemaは維持。ビルドとcache stamping確認。
- 360/390/430pxの7機能操作テストをGitHub Actionsへ追加。
- Android実機、Cubasis/Cubase実機の取込確認は未実施。
