Version: v0.17-dev
更新日: 2026-10-15

【追加】
- Demo ComposerにSeed / Lock / Divergence Distance / Branch / Keep / Freeze / Snapshot / Restore / Branch Treeを備えた発散モードを追加
- 5軸（主旋律・裏メロ・コード/ハーモニー・リズム/グルーヴ・音色）をLock単位として追加
- Seed値からBranchを再現できる決定論的Branch engineを追加
- 既存のSection Variation、裏メロ候補、コード候補、Sound Presetを発散Transformとして再利用
- Music Project Homeに「曲のアイデアを増やす」「編曲案を増やす」の発散導線を追加
- 発散専用Smoke TestとGitHub Actions CIを追加

【変更】
- Demo Composerの開発Versionをv0.17-devへ更新
- Project appVersionをv0.17-devへ同期
- Static build / PWA precacheへ発散モードRouteを追加

【修正】
- Root VERSIONがv0.16-devなのにProject保存用APP_VERSIONがv0.15-devだった不整合を解消

【安全性】
- schemaVersionは3のまま変更なし
- 元SeedはCloneして扱い、Branch生成で直接変更しない
- Lock中の軸をTransformが変更したと申告した場合はBranch engineが拒否
- 大規模変更前の復元点: restore/v0.16-before-divergence-2026-10-15

【未対応 / 次段階】
- Android実機での長時間試聴・sessionStorage容量境界の確認
- MIDI Analyzer側のBranch差分説明UI（生成責務は追加しない）
- stable tagは実機検証後にのみ作成
