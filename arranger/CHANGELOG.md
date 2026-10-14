# CHANGELOG

Version: v0.9-dev
更新日: 2026-10-14

【追加】
・コード0件でも、主旋律が1小節あればKeyとメロディの構成音から2つの仮コードをArrangement Lab入力時だけ自動生成
・仮コードを元に既存の「自然 / 色付け / 大胆」リハモ3案を生成し、試聴・採用・Harmony MIDIへ反映可能
・360 / 390 / 430px Mobile Chromiumで「1小節SongProject読込 → 仮コード生成 → A/B/C有効 → リハモ3案 → 採用」を回帰テスト

【変更】
・1小節スケッチのSection名を、仮コードを補完した場合は「1小節スケッチ（仮コード付き）」と表示
・初心者ガイドの④を「リハモ3案など1つだけ試す」に変更し、1小節メロディでもリハモできることを明示
・Arrangement Plan Schema 4 / SongProject v1 / Demo Project Schema 3は変更しない

【修正】
・1小節メロディだけでArrangement Labへ来た場合、コード0件のためリハモ3案が出せなかった問題を修正
・既存コードがある1小節は自動コードで上書きせず、2小節以上にも自動補完しないよう範囲を限定

【未対応】
・Android実機での試聴音量・タップ操作確認
・Cubasis / Cubase実機でのリハモHarmony MIDI取込確認

Version: v0.6-dev
更新日: 2026-10-13

【追加】
・初心者モードを初期ONで追加。①読込 → ②A/B/C試聴 → ③案を選ぶ → ④Sectionを1つ調整 → ⑤判断記録 → ⑥DAW引き継ぎの一本道に整理
・画面上部に「次にやること」を1つだけ表示するガイドを追加
・スマホ下部に「前へ / 現在工程 / 次へ」の固定ナビを追加。完了条件なしで自由に前後移動可能
・④Section調整が未生成の場合に空欄ではなく、①→②の手順と戻るボタンを表示
・「もっと試す」モードを追加し、A/B/C Mix、目隠し比較、50手法、Drum Fill / Bass Approach、詳細MIDI等を展開可能にした
・モード選択を端末内に保持

【変更】
・初心者モードでは④を密度 / 楽器 / 裏メロ / リハモ中心に絞って表示
・高度機能は削除せず「もっと試す」へ収納
・初心者モードでは詳細出力・端末内削除UIを隠し、DAW引き継ぎを主出口として強調
・Arrangement Plan Schema 4、保存キー `demo-composer-arranger-v0.4`、判断ログ `demo-composer-arranger-decisions-v0.5` は維持
・PWA cacheをv0.6へ更新し、v0.6 CSS / 初心者フローModuleを事前cache対象に追加

【修正】
・④のSectionカードがまだ無い時に「機能していない」ように見える空表示を解消
・判断パネル見出しの重複した「⑤」表記をUI補正

【未対応】
・Android Chrome実機での固定ナビ位置・長時間操作確認
・Cubasis / Cubase実機でのBefore/After Song.mid、DAW ZIP内MIDI取込確認

Version: v0.5-dev
更新日: 2026-10-13

【追加】
・アプリ全体を①比較試聴室 ②ハーモニー実験室 ③裏メロ・対話設計 ④展開・密度設計 ⑤判断の記録と復元 ⑥DAW引き継ぎの6分類として整理
・比較試聴室に簡易ラウドネス補正、目隠し消去式比較、変更パートだけ再生、Bメロ/Prechorus→サビ連続試聴を追加
・判断記録に採用/不採用/保留/気になる/制作日記、理由メモ、Section snapshot履歴、原案/過去snapshot復元を追加
・判断ログ用localStorage `demo-composer-arranger-decisions-v0.5` を追加。Arrangement Planにも判断履歴を同梱
・Drum Fill 3案、Bass Approach 3案を実NoteとしてSectionへ適用・解除できる機能を追加
・SMF Type 1のSong.mid一括出力、Section Marker、Before/After Song.midを追加
・Arrangement結果を反映したDemo Composer用複製project.json出力を追加
・DAW引き継ぎZIPを追加。Before/After MIDI、各パートMIDI、Arrangement Plan、Demo Composer JSON、Track/Section指示、判断ログ、比較manifest、DAWチェックリストを同梱

【変更】
・Arrangement Plan Schema 4、保存キー `demo-composer-arranger-v0.4` を維持したままv0.5機能を互換レイヤーとして追加
・簡易試聴に候補密度差の影響を抑えるエネルギー基準のGain補正を追加
・PWA cacheへv0.5 Module / CSSを追加
・Version表示をv0.5-devへ更新

【修正】
・目隠し比較中にCandidate詳細/曲線/Section内容から案を推測できないように非表示化
・PWA更新回帰テストをv0.5表示・cacheへ更新

【未対応】
・Android Chrome実機での音量感・長時間操作確認
・Cubasis / Cubase実機でのBefore/After Song.mid、DAW ZIP内MIDI取込確認

Version: v0.4.1-dev
更新日: 2026-10-13

【修正】
・公開後も旧PWA画面が残る更新問題を修正
・HTML/CSS/全Moduleを同じbuild URLへ固定
・Service Workerをbuild別登録/cacheへ分離し、更新をHTTP cache任せにしない
・Service Workerの事前キャッシュ取得にもbuild IDを付け、旧Workerが新cacheへ旧HTML/Moduleを混入させる更新経路を遮断
・オンラインの画面は新HTMLを取得、オフラインは同build cacheで復元
・旧保存データを消去せず更新。別PWAのcacheは保持

【未対応】
・Android/Cubasis/Cubase実機の音質・取込確認

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
・持続型裏メロでmMaj7/dim7/拡張コードの実7thを選択

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
