# CHANGELOG

Version: v0.4-dev
更新日: 2026-10-13

【追加】
・ハーモニー14手法：メロディ/ベース固定、ベース先行、接続和音、和声リズム、解決、借用、転調候補、共通音、Voicing、トップライン、内声、浮遊
・裏メロ16手法：音階混合、コード別音階、リハモ追従、輪郭/リズム保持、反行/斜行/並行、応答、入り、モチーフ、持続、音域、衝突修正、独立性、Section展開、制約、A/B分担
・展開15手法：曲線、同パート数、入口/出口、つなぎ、サビ前引き算、サビ反復差、ラスサビ、主役、出入り、密度、音域、一度のイベント、イントロ回収、間奏、終わり方
・5つの連動セット。対象Sectionを明示し、複数Sectionでも無関係な編集を維持
・50手法のカテゴリ選択・複数候補・試聴・採用・候補MIDI出力
・実VoicingとパートNote Override、裏メロA/B個別MIDI

【変更】
・独立Arrangement Plan Schema 4、旧1/2/3互換
・保存キーv0.4。v0.3/v0.2/v0.1は読込fallbackとして保持
・新しい変換も共有Note経路で試聴とMIDIへ反映
・対象素材不足/同じ音になる候補には理由を表示

【修正】
・旧7機能の採用結果が新Note Overrideに隠される競合を解消
・裏メロ分担解除後の古いA/Bラベルを除去

【未対応】
・Android実機とCubasis/Cubase実機の音質/取込確認
・本格Voicing最適化、調性感の自動確定、高品質音源は対象外

Version: v0.3-dev
更新日: 2026-10-13

【追加】
・リハモ理論6手法：拡張、機能代理、次へのドミナント、同主短調借用、裏コード、導音dim7
・「なぜこのコード？」：成立条件、聴くポイント、構成音差分、最寄り音対応
・主旋律の構成音重複時間、強拍/長音の非構成音、半音接近、元ベースとの関係
・元/候補/特徴音/残したベースのSection比較試聴
・裏メロ5案：Key、ペンタトニック、Lydian/Dorian、採用Chord Tone、隙間応答
・Section別の候補採用
・サビだけ5案：壮大、疾走、浮遊、静かな熱量、踊れる
・引き算3案：主旋律の余白、低音を休ませる、裏メロを隙間だけに
・主役の受け渡し/裏メロの休み指定、採用理由メモ

【変更】
・Arrangement Plan Schema 3。v0.1/v0.2プランは読込時に既定値で復元
・保存キーv0.3。v0.2/v0.1の既存キーを読込互換として保持
・Harmonyの持続/8分刻み/分散/裏拍を試聴とMIDIで共通化
・Counterの採用Note/休み指定を試聴とMIDIへ反映
・独立PWA cacheに新Moduleを追加

【修正】
・読込PlanのSection小節数の表示をHTMLエスケープ

【未対応】
・Android/Cubasis/Cubase実機の音質・取込確認
・転調確定の自動判定、全声部最適配置、コードスケールの網羅的判定は対象外

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
