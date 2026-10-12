# CHANGELOG

Version: v0.2.1-dev
更新日: 2026-10-13

【追加】
・試聴開始Section選択（最大16秒）
・元Projectの読取専用snapshot付きプランJSON読込、保存プランから編集再開
・MIDI読戻し・リハモ・旧保存互換テスト、360/390/430pxブラウザCI
・PWAアイコンとmanifest scope/id

【変更】
・試聴とMIDIのNote生成を共通化。Bass/Drumsは元Noteを使用
・最大32同時発音、短い先読み、終了/停止/画面非表示時Context破棄
・薄い/標準Voicingでも7th/9th等の特徴音を維持
・Demo Composerの44 Quality定義を独立PWA内に固定コピーし一致テスト

【修正】
・Drums MIDIをch10に固定、拍子Meta追加、OFF Sectionへの持続音漏れ防止
・試聴でdim/7th/9th等がMajor三和音になっていた問題
・Approach diminishedを次Rootの半音下へ修正、Tritoneを解決先があるV7に限定
・保存済み採用案の後に編集してJSON出力すると古い内容になる問題
・旧保存データ/不正保存データを読込時に勝手に削除する問題
・Service Workerが他アプリのcacheを削除する問題
・密度変更後の役割説明の更新、ユニゾンの誤警告、Section外の衝突重複
・狭い画面の長文折返しと操作領域

【未対応】
・Android実機の音質/性能、Cubasis/Cubase実機への取り込み確認
・色付けは編曲判断メモのみ（試聴・MIDI対象外）

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
