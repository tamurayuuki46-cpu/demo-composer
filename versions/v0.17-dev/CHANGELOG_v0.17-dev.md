Version: v0.17-dev
更新日: 2026-10-16

【追加】
- Demo ComposerにSeed / Lock / Divergence Distance / Branch / Keep / Freeze / Snapshot / Restore / Branch Treeを備えた発散モードを追加
- 5軸（主旋律・裏メロ・コード/ハーモニー・リズム/グルーヴ・音色）をLock単位として追加
- Seed値からBranchを再現できる決定論的Branch engineを追加
- 既存のSection Variation、裏メロ候補、コード候補、Sound Presetを発散Transformとして再利用
- Music Project Homeに「曲のアイデアを増やす」「編曲案を増やす」の発散導線を追加
- 発散専用Smoke TestとGitHub Actions CIを追加

【変更】
- Demo ComposerのVersionをv0.17-devへ更新
- Project appVersionをv0.17-devへ同期
- Static build / PWA precacheへ発散モードRouteを追加
- 2026-10-16公開統合でmainのv0.16 / v0.16.1修正をv0.17へ統合
- SongProject受信時の曲ID保持、保存完了待ち、交換情報保持、JSON復帰をv0.17へ引き継ぎ
- Arrangement Lab受信時に本体Import完了をawaitし、初期化前イベント消失を防止

【修正】
- Root VERSIONとProject保存用APP_VERSIONの不整合を解消
- AI MonitoringがVersion / Build IDを旧値へ上書きする問題を修正
- Arrangement Lab本体初期化前の受信操作が消失する問題を修正

【公開統合】
- Release Branch: release/v0.17-publish-20261016
- main/develop reconciliation commit: 7669b6b1a63d5caabf5534101d01338fb6faf2c5
- Demo Composer: v0.17-dev
- Arrangement Lab: v0.14-dev
- Music Project Home: v0.19-dev
- Composition Sheet: v0.9.1-dev
- MIDI Archive/Analyzer: v0.25-dev（別Repository / 公開済み）

【安全性】
- Demo Project schemaVersionは3のまま変更なし
- SongProject v1変更なし
- Arrangement Plan Schema 4変更なし
- 元SeedはCloneして扱い、Branch生成で直接変更しない
- Lock中の軸をTransformが変更したと申告した場合はBranch engineが拒否
- 公開統合前復元点: restore/main-before-v0.17-publish-20261016
- 公開統合前復元点: restore/develop-before-v0.17-publish-20261016
- 発散実装前復元点: restore/v0.16-before-divergence-2026-10-15

【未対応 / 次段階】
- Android実機での長時間試聴・sessionStorage容量境界の確認
- Android実機で発散→Freeze→比較→Song.midまでの通し確認
- Cubasis / Cubase実機Import確認
- MIDI Analyzer側のBranch差分説明UI（生成責務は追加しない）
- stable tagは実機検証後にのみ作成
