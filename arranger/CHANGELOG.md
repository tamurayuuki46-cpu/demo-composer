# CHANGELOG

Version: v0.2-dev
更新日: 2026-10-13

【追加】
・A/B/C編曲案のWeb Audio簡易試聴
・Sectionごとの密度変更
・SectionごとのDrums / Bass / Harmony / 裏メロ / 色付けON/OFF
・2つの編曲案を合成するMix案生成
・Energy / Density / 楽器数のSectionグラフ
・主旋律と裏メロの近接衝突チェック
・Melody / Bass / Drums / Counter / Harmonyのパート別MIDI書き出し
・Sectionごとのリハモ3案（自然 / 色付け / 大胆）提案と採用
・リハモ済みHarmony MIDI書き出し
・v0.2 Arrangement Plan schema

【変更】
・Arrangement Labを「文章提案中心」から「比較・試聴・編集・MIDI出力」中心へ拡張
・端末保存キーをv0.2へ更新し、v0.1保存データの読み出し互換を維持
・Service Worker cacheをv0.2へ更新

【修正】
・localStorage保存失敗時もJSON書き出しを継続できるようにした
・MIDI書き出し時にSectionの楽器ON/OFFを反映

【未対応】
・Cubasis / Cubase実機での全MIDI取り込み確認
・Demo Composerへの編曲結果の戻し書き
・高品質な音源による完成形プレビュー
