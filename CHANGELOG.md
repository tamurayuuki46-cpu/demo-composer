## 2026-10-15 — v0.15-dev lineage reconciliation candidate

【状態】
- Development candidate: `integration/main-develop-reconcile-20261015`。公開済みmainへは未統合。
- Published main: `v0.15-dev` / `28f85e64adeed26da1d40fc491723438ffecd2f9`。
- Stable: 未認定。Android / Cubasis / Cubase実機確認は未実施。

【統合】
- main系の公開・復元資産を保持し、develop `b322cb47282261db720bf3b74caf455cb56c9cf7`を通常の2-parent mergeで統合。
- PR #252: SongProject v1のcross-app boundary回帰を追加。
- PR #253: Project HomeのDAW-ready判定を実際のSong.mid書き出し記録に連動。
- PR #254: Song.midのFormat / Track / PPQ / Tempo / 拍子 / Channel / Marker / Note timing回帰を強化。
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4 / PPQ 480 / 4/4を維持。

【Version同期】
- Demo Composerを`v0.15-dev`へ統一し、package `0.15.0-dev`とAPP_VERSIONを同期。
- Arrangement Lab `v0.13-dev`、Music Project Home `v0.18-dev`、Composition Sheet latest `v0.9.1-dev`を現行lineageに同期。
- 過去versionファイルは変更せず保持。

【検証】
- reconciliation工程で静的178件、ブラウザ17件、公開済みversion資産38件、保護対象remote refs 162件の保持確認に成功。
- Music Project Home最終確認で、関連静的・build 16 command、Home 4 viewport、曲データメニュー3 mobile viewport、実Song.mid後のDAW-ready遷移、保存再読込、SongProject所有境界を確認。詳細は`docs/PROJECT_HOME_FINAL_VERIFICATION_2026-10-15.md`。
- 統合候補のhosted CIはpush / PR作成後に必要。ローカル結果はhosted CIの代替ではない。

## 作曲シート v0.6-dev — 2026-10-14
記入用を先頭へ、保存/Drive共有、曲データメニューの簡易版表示。詳細 sheet-app/CHANGELOG_v0.6.md。

## v0.5-dev
更新日: 2026-10-13

【追加】
・390px幅で保存・再読込・主要画面・Draft.midダウンロードを確認するブラウザ回帰テスト。

【変更】
・Demo ComposerのMIDI出力ボタン、Drive共有、制作ガイドをDraft.midへ統一。Arrangement Labのfinal Song.midとは役割を分離。
・Legacy Schema 3 / Song Project v1と保存データは維持。

【修正】
・Song.midボタンが存在しない出力キーを参照して「生成できませんでした」となる不具合を修正。

【未対応】
・Android実機とCubasis/Cubase実機確認。
・Cloud Browserはviewport変更APIがないためスマホ幅の直接確認は未実施（390pxはCIで確認）。

# CHANGELOG

## 2026-10-14 作曲シート全集 v0.4-dev
- 原文31シートを全文収録。検索・記入・チェック・メモと曲別保存、SongProject v1での受け渡しに対応。
- 詳細: `sheet-app/CHANGELOG_v0.4.md`。Demo Composer本体・Arrangement LabのVersionは変更しない。


## 2026-10-13 — main統合・公開後の整合性修正

- Demo Composer v0.4-dev / Arrangement Lab v0.5-dev / SongProject v1はPR #177でmain統合済み。
- PR #178でCI gate、PR #179/#180でPages公開元をmainへ変更。main CI / Deploy成功。
- README / AI_HANDOFF / Arrangement VERSION_HISTORYの旧運用記載と、画面Version表示を修正。Version番号・Schema・音楽処理は維持。
- Android/Cubasis/Cubase実機確認は未完了、stable tag未作成。


## v0.3-dev
更新日: 2026-10-12

### 追加
- 曲の設計メモ5項目と個性の5軸、Sectionの自由な役割、感情タグと分けたコード目的タグ。
- 主旋律/裏メロの派生分析と手動タグ、点数を使わない未決定項目、任意の1行採用理由。
- コード進行 / 主旋律 / 裏メロ / 音色A/B、末尾2音・リズム・音高・コード1個・裏メロ・コード音域・音色だけの候補。
- 採用結果と理由をAtomicに保存しUndo1手。候補/試聴は保存しない。
- Schema 1/2→3 Migration、revision別退避（既存バックアップを上書きしない）。DB_VERSION / PPQ / 拍子は維持。
- 設計意図と採用理由をAI相談/Cubaseメモへ反映。MIDI Importでは言葉の設計意図を保持。

### 修正
- 配信HTMLだけが新しく、JavaScript/CSSが旧キャッシュに残る問題を修正。全入口・全Module依存をBuild ID付きURLで配信。
- 拡張和音のGuide Tone判定をpitch classへ正規化。

### 復元
- restore/v0.3-before-decision-support / 6e69333。Schema 3のJSONは旧アプリでは読めないため、復元は旧schema退避データを使用。

### 未確認
- Android実機の表示/音、Cubasis/Cubase実機取込。全自動作曲・DAW詳細編集・Mixing/Mastering/Plugin Hostingは対象外。

## v0.2-dev

### 追加（2026-10-12: 主旋律1小節A/B比較）
- 既存Melody候補から現在案Aと候補Bを仮Projectで比較。差分を表示し、B採用のみUndo1手・AutoSave対象。Project編集時は比較を破棄。Schema/DB/MIDI形式変更なし。
- 復元点 `restore/v0.2-before-melody-ab-20261012`（24e4ffe）。詳細 `docs/MELODY_AB_COMPARE.md`。
- `npm run test:melody-ab` とCIを追加。

更新日: 2026-10-11

### 変更
- 候補の `▶ 聴く`（試聴）を追加。「使う」を押す前に、その場で鳴らして選べる。(1) Chord `曲想から選ぶ` の一覧の各行、(2) Chord Preset の `▶ 聴く`、(3) Melody のメロディ候補3つ（その小節だけ、いまのコード・ベース・ドラムと一緒に）。試聴は仮のProjectを鳴らすだけで、曲のデータ・履歴（↶）は変わらない。コードの試聴はBassを外し、メロディ・裏メロ・ドラムはそのまま重ねる。画面下に「試聴中（まだ曲には入っていません）」と出る。画面同士はイベント（`dc:audition`）でつなぎ、Module間の直接依存は増やしていない。Schema変更なし
- Chord `曲想から選ぶ` に「お気に入り」を追加。選んだタグの組み合わせを `☆ お気に入りに保存` で端末に保存（最大12件・同じ組み合わせは1件にまとまる）し、上の `★ お気に入り` をタップするとその組み合わせを一度に選択、`×` で削除。端末のlocalStorageにだけ保存し、project.json・MIDIには入れない（Schema変更なし）。localStorageが使えない環境でも画面は動く
- Chord `曲想から選ぶ` を1つに統合。「組み合わせて3案に絞る」を、感情 / 質感 / 場面タブの選択に合算した。タブをまたいで複数のタグ（最大5つ）を選べて、**選んでいるタグは、どのタブを開いていても上の「選択中」に常に表示**（タップで外す・`すべて外す`・各タブに選択数バッジ）。一覧は選んだ全部のタグに合う進行を強い順に出す（全部に合う進行が無いときは、いちばん多く合う進行）。Hubの曲想からの自動選択もそのまま。タグのデザインを刷新（角丸の暗いチップ、選択中は青〜紫のグラデーションと✓、選択中の小さなタグはグループ色の枠）。旧「3案カード（王道/個性的/挑戦的）」は一覧に置き換え。UI状態のみ・Schema変更なし
- Melody Analyzer の「Sectionごとの比べ」: 差のメモに `構成音率` と `スケール外` の率（サビとAメロ/Bメロ）を追加し、安定感が増えたか・緊張が強まったかを一言で表示
- Melody Analyzer: `Chordからの度数` の棒をタップすると、その度数を使っている小節へ移動（もう一度押すと次の小節。使っていない度数は押せない）。移動先とn/m件目を画面のメッセージで表示。集計・表示のみ・Schema変更なし
- Melody Analyzer: コード度数の棒グラフを、構成音（青）/ テンション（緑）/ スケール内のその他（水色）/ スケール外（黄）で色分け。Keyからの度数の棒はスケール内（水色）/ 外（黄）。凡例つき
- Melody Analyzer の「Sectionごとの比べ」に、Sectionごとのコード度数ミニ棒グラフを追加。サビがAメロ/Bメロより増やした・減らした度数（10%以上の差）を `コード度数: 5 +75%・R −75%` の形で差のメモに表示。集計・表示のみ・Schema変更なし
- Melody: 置いた音のマスに、その小節のコードから見た度数（R / ♭3 / 5 など）を小さく表示（`度数 ON` のとき。コード未設定の小節は出さない）。メロディ全体をコード度数の並びで読める
- Melody Analyzer: `Chordからの度数` と `Keyからの度数` を「使用率」として12本の棒グラフで表示（上に%、下に度数。上位4つの文字表示はそのまま）。自分のメロディが何度を多く使うかの癖が数字と形で見える。見た目・集計のみ・Schema変更なし
- Melody画面のPiano Rollを、Keyの主音が一番下の段になる並びにした（例: Key Aなら下から A4 … 上が G#5。以前は常に C〜B）。Oct −/+ の表示も `A4–G#5` のように主音始まりに。メロディ候補も同じ範囲に収まる（主音が一番下のとき、鍵盤の外に出る音が無い）。Keyが C のときは従来と同じ。保存データ・Schemaの変更なし
- Chord `曲想から選ぶ` の `感情 / 質感 / 場面` を、閉じたタブにした。初期はどれも閉じていて（未選択）、タブを押すとタグが出る。もう一度押すと閉じる。各タブの先頭に `未選択` を追加。「組み合わせて3案に絞る」の中の3グループも折りたたみにして、選んでいるタグ（無ければ「未選択」）を見出しに表示。UI状態のみ・Schema変更なし
- Melody画面の鍵盤（左のピアノ）に、音名の下へ `コード度数`（そのコードのルートから。水色）と `Key度数`（Keyの主音から。金色）を並べて表示。度数は初期でON（`度数 ON/OFF` で切替、OFFは音名だけ）。コード未設定の小節ではコード度数は「–」。見た目のみ・Schema変更なし
- アプリの更新に気づきやすく。右上のバージョン表示の下に、いま開いている版（コミットID・ビルド日時）を表示。公開側に新しい版があると（起動時・アプリに戻った時・5分ごと）、画面上部に青い `新しい版があります［更新する］` を出す。`更新する` で再読み込み。バージョン表示をタップすると手動で確認でき、最新なら「最新の版です」と出る。ビルド時に `build.json` と `build-info.js` を生成（Schema変更なし）
- Hub `Export` / `AI相談` を押した時に分かりやすく。開いている間はボタンが青＋光る枠になり、文字の横が ▼ → ▲ に変わる（閉じると元に戻る）。開いたパネルは画面内へスクロールする。見た目のみ・Schema変更なし
- Chord `曲想から選ぶ` を `曲想 / 質感 / 場面` の3タブに整理。タブごとに1つのタグを選ぶと、そのタグが強い進行をコード名つきの一覧にする（従来の曲想だけの一覧を3種類に拡張）。強い進行（重み3以上）が無いタグは重み2・1まで広げて探す。「組み合わせて3案に絞る」は折りたたみ（タグを選ぶと開く）にして画面を短くした。UI状態のみ・Schema変更なし
- Sound初期設定を変更。instrumentsに保存が無いProject（新規Projectなど）は、Chord = Pad / Bass = Deep Bass / Melody = Strings Lead（Tone はすべて Natural）で鳴る。保存済みの選択は変わらない（Schema変更なし）

### 修正
- Hub Drive: MIDI（一式 / 1ファイルずつ）が端末へのダウンロード頼みで保存できなかった件を修正。project.json と同じく共有画面から送れるよう、中身はそのままで `Song.mid.txt` のように `.txt`（text/plain）名にして共有する（Android Chromeは .mid の共有を拒否するため）。Drive側で末尾の `.txt` を消せば .mid として使える。共有できない場合は従来どおり `.mid` を端末にダウンロードする。ボタン名は「Driveへ」に戻した
- 再生の音が「ざらざら」することがある件への対策。Web Audioの出力バッファを `playback`（大きめ）にして、Androidで負荷が高い場面の音切れ・ざらつきを出にくくした。ヘッドレスで全パートをオフライン描画して、コンプレッサー/リミッターでの歪み（クリップ0%・ピーク0.85）は無いことを確認済み。音量・音色は変えていない
- Hub Drive共有の `NotAllowedError` の根本原因に対応。Android Chromeの共有は許可された拡張子（.txt / 画像 / .wav / .pdf など）しか送れず、.json / .mid は必ず拒否される。`Driveへバックアップ` は中身そのままの `project.json.txt`（text/plain）として共有し、読み込みは .txt も受け付ける。MIDIのDriveボタン（一式 / 1ファイルずつ）は共有を使わず端末に保存し、Driveアプリの「＋ → アップロード」で入れる手順を表示する。ボタン名を「保存（Drive用）」に変更
- Hub Drive共有で、Android実機で `NotAllowedError`（共有を開始できません）になる問題への対策。共有をタップ直後に同期的に開始するよう、IndexedDBの読み込みを待たずに直近の保存済みProjectを使う（読み込みは裏で更新）。共有データから `text` を外し、ファイルとタイトルのみにした。失敗時は従来どおり端末へダウンロードする
- Hub `Driveへバックアップ` / `MIDI一式をDriveへ` を押しても反応しないように見える問題を修正。結果メッセージがHub最上部にしか出ず、下へスクロール中は見えなかったため、ボタン直下にも結果を表示する。保存済みの確認をRevision表示（画面のDOM）に頼らず、押した時にIndexedDBから最新を直接読む。共有画面を開けない場合は、ファイルを端末へダウンロードして案内する（`navigator.share` 非対応・失敗時）
- Demo Player（再生バー）が下部ナビに隠れる / 再生が止まる症状への対策。再生バーの位置を、下部ナビの実際の高さ（`--nav-h`、ResizeObserverで追従）の真上に固定した（Androidの文字サイズ拡大などでナビが高くなっても重ならない）。ビブラートのLFOを「1音につき1つ」に共有し、ボカロ風などの音色で1音あたりのノード数を減らして端末負荷を軽くした（音量・音色は変わらない）

### 追加
- Chord `曲想から選ぶ` に `曲想を1つ選んで一覧`: 曲想（明るい・切ない・希望・高揚・優しい・哀愁・緊張・安心・力強い）を1つ選ぶと、そのScale（Major / Minor）で、その印象が強い進行を強い順に一覧にする（上位10件、`全N件を表示` で全件）。各行にいまのKeyでのコード名・度数・王道/個性的/挑戦的・質感/場面タグを表示し、`使う` で既存のPreset適用（Bass保護などの既存の安全策もそのまま）。同じタグをもう一度押すと解除。従来の「最大3タグを組み合わせて3案に絞る」はそのまま残す。UI状態のみ・Schema変更なし
- Chord画面に `全てのMIDIをクリア`: コード・メロディ・ベース・ドラム・裏メロをまとめて空にする（確認あり・↶で戻せる）。Key・BPM・構成・音色の方向性は残す。再生中なら止める。何も入っていないときは押せない。Schema変更なし（`projectStore.clearAllMusic`、`npm run test:clear-all`）
- Hub `作曲シート`: claude.aiのリンク（作曲シートなど）を端末のlocalStorageだけに保存し、`作曲シートを開く` で新しいタブに開く。保存できるのは `https://claude.ai/` のリンクのみ。アプリは公開されているので、リンクはコード・project.json・MIDIに入れない。Schema変更なし（`npm run test:sheet-link`）
- 裏メロ `Minor Penta Hook` / `Major Penta Hook` を、曲のKey以外のKeyでも作れるようにした（裏メロ画面の `Minor / Major Penta のKey`: 曲のKey・2度上・短3度上・3度上・4度上・5度上・6度上・短7度上と、外れ感の強い半音上など）。選んだKeyのペンタの音だけで作り、曲のスケールから外れる音の数を説明に出す。UI状態のみ・Schema変更なし
- 裏メロの `別案`（`↻ 別案を見る`）: 全タイプの候補を 基本 / 音域を変える / 間引く / 後ノリ の4案で切り替え。pitch classは変えず、音域・間引き・8分ぶんの後ずらしで作り分ける。選んだ結果以外は保存しない
- Demo Playerの `パート` を、聴きたいパートを選んで鳴らす形に整理。鳴るパートに `✓` を表示し、`全部OFF`（そこから聴きたいパートだけ選ぶ）と `全部鳴らす` を追加。Chord / Melody / Bass / Drums / 裏メロを個別に選んで再生できる（ソロも従来どおり）。保存・Exportには影響しない
- Hub Export: 裏メロがあるとき `CounterMelody.mid` の個別ボタンを表示。Export一覧の下に結果を出す（下へスクロール中でも見える）。`Google Drive` に「1ファイルずつDriveへ」（Song / Chord / Melody / Bass / Drums / CounterMelody の各.mid）を追加。Schema変更なし
- Melody画面に `メイン / 裏メロ` の切替。同じPiano Rollで裏メロを1音ずつ手直しできる（タップで入力・削除、音の長さ、8/16分、Clear Bar、Copy Bar、Octave）。裏メロ編集中はメインのメロディを薄い青の目印で重ねて表示し、ぶつかりを確かめやすくした。メロディ候補・山の位置・特徴パネルはメイン専用（裏メロ編集中は隠す）。書き込みは `applyCounterMelody` で全範囲置き換え（Undo 1手、他Trackは不変）。Schema変更なし（`npm run test:counter-edit`）

### 変更
- Melody候補 `浮遊感` から、長い音で余白を作る形をなくした。2度・6度の色は残し、休みなく小節の終わりまで切れ目なく動く（1音は最大2マス、同じ音の連打なし。4つの別案すべて）。説明文は「2度・6度も混ぜ、切れ目なくふわっと動く」。Schema変更なし
- Chord Presetの選択肢に、`曲想 / 質感 / 場面` のタグを表示（例: `Pop 6415｜Am–F–C–G｜曲想 切ない｜質感 疾走感｜場面 青春`）。既存のコード進行ムードタグ（感情・質感・場面）から、各グループで1つずつ選ぶ。カテゴリ共通のタグだけだと同じ文字が並ぶため、その進行ならではの特徴（終わり方・出だし・長さ・dim）から来たタグをやや優先する。ムード検索（おすすめ3つ）の重みは変更なし。Schema変更なし
- Chord Presetの選択肢に、いまのKey / Scaleでのコード名を表示（例: `Pop 1564｜C–G–Am–F｜曲名 / アーティスト`）。度数だけでは実際に何のコードか分かりにくかったため。Keyを変えると、次にChord画面を開いたときに選択肢のコード名も変わる。Schema変更なし
- 裏メロ画面で `Character（特性音型）` を候補の一番上に表示（他の並びは従来どおり。生成側の順序・テストは変更なし）
- 裏メロ `Character（特性音型）` を、スケールごとの「らしい動き」で作るようにした（`src/core/character-phrases.js`）。Dorian（♮6を伸ばして下りる）/ Phrygian（♭2↔主音のため息）/ Lydian（♯4から5度へ浮かぶ）/ Mixolydian（♭7）/ Locrian（解決せず♭5で止まる）/ ハーモニックマイナー（♭6→♮7の増2度）/ メロディックマイナー（♮6→♮7の駆け上がり）/ Phrygian Dominant（4→3→♭2→1のアンダルシア）/ Double Harmonic / Hungarian Minor / ホールトーン（全音で浮遊、解決しない）/ ディミニッシュ（減七のジグザグ）/ ブルース（♭5の経過）/ Lydian Dominant / Altered / 都節音階・陰旋法・律・琉球音階。小節ごとに ①提示 ②返し ③高まり ④解決 が違い、範囲の最後は必ず④。型の無いスケールは従来の共通型。主旋律が鳴っている所は少し弱める。Schema変更なし

### 追加（v0.3 骨子作り支援: 優先度A + B。計画は `docs/V0_3_SKELETON_PLAN.md`）
- Arrange `📈 骨子レシピ・感情曲線から構成を作る`: **骨子レシピ8種**（切ない→解放 / 王道1番サビ型 / ラスサビ最大型 / 徐々に上昇型 / 一度落として最後に最大 / サビ先行 / ダンス・ループ / バラード）。感情の言葉・山の形（▂▅█）・小節数を見て、`中身を見る`（各Sectionの小節数・感情・役割・つなぎ）→ `このレシピにする`。確認のうえ構成を置き換え、音符・コード・ドラムは変えない（↶で戻せる）。適用結果は「いまの構成の山」と既存の感情曲線に反映される。Schema変更なし（`structure.sections` の既存項目のみ。`src/arrange/skeleton-recipes.js`、`npm run test:recipes`）
- Hub 骨子チェック: 次に決める1つに `次はここ`、それ以外の未完了項目に `今は後でOK`（控えめ表示）。判断疲れを減らす表示のみで、`next` の決まり方は従来どおり
- `なぜ？`: 裏メロ・メロディ生成の候補、Arrangeのつなぎ、レシピの説明文を、折りたたみの `なぜ？` に統一（`src/core/why-ui.js`、`npm run test:why-ui`）。メロディ候補・Bass候補は `<button>` 内のため従来表示
- Arrange 空Sectionアシスト: 入力のない Section に、前のSectionをコピーして始める3つの方向（メロディを少し変える / コードだけ変える / リズムを密にする）。コピー後、`少し違う版にする` の該当Variationに `おすすめ` が付く（既存のコピー・Variationを使うだけ）
- Rhythm Bass候補: `Kickとの関係`（Kickと一緒に鳴る / 裏拍でBassが動く / Bassだけ動く / 一部が重なる）を各候補に表示。Kickが無いときは案内文
- AI相談用テキスト: `■ 骨子チェック（✓ / △ / －と次に決めること）` を追加
- CI: `test:recipes` / `test:why-ui` を追加。`test:syntax` に `character-phrases.js` / `skeleton-recipes.js` / `why-ui.js` を追加
- Chord画面 `メロディをつくる` に「盛り上がり」を追加（`おまかせ / Low / Mid / High`）。おまかせは開始小節のSectionのEnergy（ArrangeのLow / Mid / High）に合わせる。Low = 低めの音域・弱い拍の短い音を間引く・やさしく、High = 高めの音域・強く。Midは従来どおり。Schema変更なし（`PHRASE_ENERGIES`、`npm run test:phrase-melody` に追加）
- 裏メロに `Motion（対位の動き）` を追加。主旋律との動きの関係で作る: 反行（主旋律と逆向きに動く）/ 平行（スケール内の3度下でなぞる）/ 保続（主音を2小節ずつ持続）。裏メロタブに `Motion` セレクトを追加（Arrangeは反行）。候補は計10タイプ。Schema変更なし（`COUNTER_MOTIONS` / `buildMotion`、`npm run test:counter-melody` に追加）
- Chord画面 `🎤 メロディをつくる` に「味付け」と「スケールの色」を追加。味付け: `ふつう / 2度・6度 / 高密度`。2度・6度はキーの2度と6度を弱い拍で多用（小節頭・着地はコードトーンのまま）。高密度は16分を含む同音連打 → 跳躍、拍の裏からの先取り、後ろから2小節目で音域を上げる（YOASOBI系の“参考イメージ”で、特定曲のコピーではない）。スケールの色: 曲のScale以外に、チャーチ・モード / スパニッシュ / 都節音階 / ペンタ / ブルースなどの音だけで同じ型の候補を作れる（選んだスケールは画面の状態で保存しない）。候補のドット表示は ● = 8分の頭、○ = 16分位置の始まり。Schema変更なし（`PHRASE_FLAVORS`、`npm run test:phrase-melody` に追加）
- 裏メロに `Character（特性音型）` を追加。選んだスケールの特性音（Dorian=♮6 / Phrygian=♭2 / Lydian=♯4 / Mixolydian=♭7 / 都節音階=♭2・♭6 など、近い基本スケール＝長3度ならMajor・短3度ならNatural Minor との違いの音）を、長い音・強い拍で鳴らす。助走 → 特性音 → ルート / 5度へ解決を4小節で変化させる。裏メロタブにスケール選択（チャーチ・モード、ハーモニック / メロディック系、スパニッシュ、ホールトーン、ペンタ、ブルース、日本の音階まで）を追加。未選択は Dorian（マイナーKey）/ Lydian（メジャーKey）。候補は計9タイプ。スケールの選択は画面の状態で保存しない。Schema変更なし（`characterIntervals` / `buildCharacter`、`npm run test:counter-melody` に追加）
- 裏メロに2タイプを追加: `Minor Penta Hook（マイナーペンタ）` / `Major Penta Hook（メジャーペンタ）`。Keyのペンタトニックの音だけで短いフックを作り、2小節で型を繰り返し → 3小節目で変化 → 4小節目でコードトーンに着地。候補は計8タイプ（裏メロタブ / Arrangeの `🎶 裏メロ` 共通）。Schema変更なし（`buildPentaHook`、`npm run test:counter-melody` に追加）
- 下部ナビに `裏メロ` タブを追加（7ボタン）。範囲（Section、または 開始小節 + 2 / 4 / 8 / 16小節）を選んで、6タイプの候補を `▶ 聴く` → `これにする`。範囲内の裏メロだけ置き換わり、↶で戻せる。`この範囲の裏メロを消す` もある。Arrangeの各Sectionの裏メロと同じ生成・同じ保存先（`tracks[role=counter]`）で、Schema変更なし（`src/arrange/counter-screen.js`）
- 裏メロに2タイプを追加: `Arpeggio（分散和音型。ピアノ風に8分で上下、メロディの下で半音ぶつかりを避ける）` / `Riff（ギターリフ型。低音域のルート・5度中心、4小節目に駆け上がる）`。Arrangeの `🎶 裏メロ` にも6候補が出る。`npm run test:counter-melody` に追加
- 音色（Sound Sketch）を増やした: Melody `Vocal（ボカロ風） / Vocal Soft / Vocal Bright / Pad Lead（パッド寄り） / Flute / Strings Lead / Bell`、Chord `Strings / Organ / Choir`、Bass `Sub Bass / Pluck Bass / Growl Bass`。声に近い音は、波形の重ね合わせ・ビブラート（少し遅れて揺れ始める）・母音の山（あ / お / い）で作る。Presetを選ぶと、下に一言の説明が出る。音量は既存Presetに近いレベルに合わせた（耳での最終調整は実機で）
- Melodyの初期音色を `Vocal（ボカロ風）` に変更（Chordのパッドに近い、やわらかい立ち上がり）。保存済みの音色選択は変わらず、Presetはいつでも `Keys` などへ戻せる。Schema変更なし（Preset idの追加のみ）
- メインメロディの音量を少し下げた（Demo Playerのパート音量 0.8倍 ≒ -2dB。ミュート / ソロの動作は従来どおり）。裏メロの音量は変えていない
- Chord画面 `🎤 4小節メロディをつくる`: コード進行に合わせて、2 / 4 / 8小節のフレーズを3つの型（モチーフ反復型 / 問いと答え型 / ピーク型）で生成する。`おまかせ / 上行 / 下降 / 平坦` の輪郭を選べ、各候補を `▶ 聴く`（その範囲だけ仮に再生）→ `これにする`（範囲内のMelodyだけ置き換え、↶で戻せる）。小節頭・着地はコードトーン、小節の最後は次のコードへの着地、問いは浮かせて止める。音はすべてKey / Scale内。`↻ 候補を更新` で4通りのモチーフ。Schema変更なし（`src/melody/phrase-generator.js` / `phrase-melody-ui.js`、`npm run test:phrase-melody`、CI対象）。今後の拡張（味付け・裏メロの新しい型など）は `docs/MELODY_PHRASE_PLAN.md`
- Chord `スケール系のコード` を大幅拡張: スケールをセレクトで選べるようにした（C Dorian / Phrygian / Lydian / Mixolydian / Locrian、ハーモニックマイナー系のモード＝Phrygian Dominant（スパニッシュ）など、メロディックマイナー系のモード＝Lydian Dominant・Altered など、Double Harmonic / Hungarian Minor / Spanish 8-Note、Whole Tone、ディミニッシュ（全半・半全）、メジャー・マイナーペンタ、ブルース、都節音階 / 陰旋法 / 律・陽旋法 / 琉球音階）。スケール名はKeyを頭にしたコード表記（例: `C Phrygian Dominant（スパニッシュ）`）。固定表を持たないスケールは「そのスケールの音だけで作れるコード」を度ごとに全部表示する（3和音 / 7th / テンション / 特殊和音）
- Quality を35→44種類へ追加: 7♭5 / 7♯5 / 9♭5 / 9♯5（全音音階向け）、4度堆積（3音・4音）/ 5度堆積 / So What / 神秘和音。許可値の追記のみでschemaVersionは2のまま
- 追加前復元点は develop の 4f7378a 以降（PR #104 時点）
- Chord `スケール系のコード` のテンション段階: 固定の1コードではなく、選んだスケール（Major / ハーモニックマイナー系 / メロディックマイナー系）の音だけで作れるテンション系コード（6th・add9 / 9th・11th・13th / 変化音）を、度ごとにすべて表示するようにした。スケール外の音を含むコードは出さない（例: Cメジャーの I に C7♭9 は出ない）。Schema変更なし（`scaleTensionChords`、`npm run test:chord-scale-sets` に追加）
- Chord: Quality を9種類から35種類へ拡張（6 / m6 / add9 / madd9 / m7♭5 / dim7 / mMaj7 / maj7♯5 / 7sus4 / 9th・11th・13th系 / ♭9・♯9・♭13・♯11 などの変化音）。「基準音からコード種類を選ぶ」は基本 / 6th・add / 7th / テンション / 変化音のグループ表示にした。許可値の追記のみでschemaVersionは2のまま
- Chord: `スケール系のコード` パネルを追加。ダイアトニック（選択Scale）/ ハーモニックマイナー系 / メロディックマイナー系を、3和音 / 7th / テンションの3段階で7コードずつ表示し、1タップで進行へ追加できる（`src/chord/chord-scale-sets.js` / `chord-scale-sets-ui.js`）
- Rhythm: 9th以上を含むコードでもBass候補が1オクターブ内に収まるよう、構成音を `% 12` で畳み込む
- `npm run test:chord-scale-sets`（CI対象）: 35 Qualityの記号・度数、Project検証 / MIDI出力、各スケール系の構成音がスケール内に収まることを確認
- Chord拡張前復元点: `restore/v0.2-before-chord-quality-ext`
- Chord: 「基準音」Selectの各音名の隣に、現在のKey / Scaleでの度数名を併記（例: Cメジャー `C　I` / `D#　♭III`、Aマイナー `C　III`）。表示のみでSchema変更なし（`rootDegreeName`、`npm run test:chord` に追加）
- Melody Piano Rollの色分けを拡張: コード構成音（1・3・5・7相当）= 青 / テンション（9・11・13相当）= 緑 / 選択Scaleの7音以外 = 黄 / アボイドノート（構成音の半音上のScale内の音）= 赤く光る。置いたアボイドの音は縁が赤く光る。優先は 赤 > 青 > 緑 > 黄。見た目のみでSchema変更なし（`src/melody/pitch-roles.js`、`npm run test:pitch-roles`、CI対象）
- Melody Analyzer: `メロディの働き` を追加。和声での役割を `Guide / Chord / Tension / Other` に分け、Guide Toneは3rd / 7th系のChord Tone内数、Tensionは初期版では9th / 11th / 13th相当として表示する（Schema変更なし）
- Melody Analyzer: 経過音 / 刺繍音 / Approach / 倚音 / 逸音 / 先取音 / 係留音候補を、前後関係が明確な場合だけルールベースで派生分析する。係留は解決まで断定せず候補として扱う。`src/core/melodic-functions.js` / `docs/MELODY_FUNCTIONS.md`
- Melody Analyzer: モチーフ / リック / リフ / シーケンスの違いを学習ガイドとして表示。リック / リフは文脈依存のため自動判定しない。Melody Analysis Smoke Testを拡張。追加前復元点: `restore/v0.2-before-melodic-functions`
- Melody Analyzer: `旋律の3つの見方` を追加。既存の分析値を `歌心・浮遊型（草野マサムネ参考） / 輪郭・違和感型（米津玄師参考） / 推進・高密度型（Ayase / YOASOBI参考）` の3方向で読みやすく表示する。アーティスト類似度の採点や特定曲のコピーではなく、作曲時にどの数値を見るかの学習補助（Schema変更なし）
- 3参考モデルは既存の跳躍率 / 最大跳躍 / Chordからの2(9th)・6th / Scale外音 / リズム密度 / モチーフ反復を再利用し、候補生成やProject Dataは変更しない。Melody Analysis Smoke Testを拡張し、Chord未設定時の表示も確認。追加前復元点: `restore/v0.2-before-melody-perspectives`
- Hub: `＋ 新規Project` を追加。現在のProjectを `Save Now` で確定してからDemo Playerを停止し、空の新しいProjectへ切り替える。旧ProjectはIndexedDBの `projects` storeから削除せず、新しいProjectだけを `activeProjectId` にする（Schema変更なし）
- 新規Project切替は `src/hub/app-entry.js` / `new-project.js` / `new-project-ui.js` で実装。reload直前の `visibilitychange` AutoSaveが旧Projectを再びActiveにする競合を避けるため、次回bootで `main.js` を読み込む前に新ProjectのActive保存を確定する
- New Project Smoke Testを `test:history` に追加。追加前の復元ブランチ `restore/v0.2-before-new-project-final`
- MIDI読み込み: Hub → Export → `MIDIを読み込む（.mid）`。トラックごとの役割（Chord / Melody / Bass / Drums / 裏メロ / 使わない）を提案し、人が直してから取り込む。BPM・Key・小節数・各パートの音数を確認でき、Key / Major・Minorは手で直せる。いまの曲は置き換わり、↶で戻せる。Format 0 / 1、ランニングステータス、任意の分解能（480に換算）に対応
- 取り込みの変換: メロディ・ベース・裏メロは16分音符の格子に丸めて単音化、ドラムはキック / スネア / ハイハットへ割り当て（その他は読まずに通知）、コードは和音から小節ごとに判定（9種類のQuality）。4/4以外は読み込まない、128小節を超える部分は読み込まない。Schema変更なし（`src/midi/midi-reader.js` / `midi-import.js` / `src/hub/midi-import-ui.js`）
- MIDI読み込みのSmoke Test（`npm run test:midi-import`、CI対象。書き出したSong.midを読み戻してコード・メロディ・ベース・ドラム・裏メロが戻ることも確認）
- Hub `📖 作編曲の手引き`: 出発点 → 作曲 → 編曲 → 確認・受け渡し の16手順を、スマホで読めるリストにした。各手順は説明とコツを開閉でき、左の丸で「済み」にできる。ChordやArrangeなど、該当画面への移動ボタン付き。✓はこの端末のlocalStorageにだけ保存し、曲のデータには入れない（`src/hub/guide.js` / `guide-ui.js`、Schema変更なし）
- 手引きのSmoke Test（`npm run test:guide`、CI対象）
- `docs/REAL_SONG_TEST.md`: Android実機で1曲を通して作り、MIDIをCubasis / Cubaseへ渡すまでのテスト手順・判定・記録シート
- Counter Melody（裏メロ）: Arrangeの各Sectionに `🎶 裏メロ` を追加。`Sparse（隙間型） / Active（動く型） / Hook（フック型）` の3候補を聴いて、選んだSectionだけに当てる。説明文の小さな `※` 補足で `Sparse=米津系 / Active=YOASOBI系 / Hook=Oasis系` を参考イメージとして示し、特定曲のコピーではないことを明記。消す・別の候補に替える・↶で戻すができる。候補生成は `src/core/counter-melody.js`、Store `applyCounterMelody`（1回の編集）、詳細は `docs/COUNTER_MELODY_STYLES.md`
- 裏メロは `tracks[]` の `role: "counter"`（MIDI Ch.4）に保存。Demo Playerは控えめな音量で再生し、パートパネルに `裏メロ` のミュートを追加。MIDIは裏メロがあるときだけ `CounterMelody.mid` を出力し、Song.midにもトラックを追加（無いProjectの出力は従来と同じ）。Section切り出し / コピー / 小節増減 / Key変更にも追従する
- Hub `✅ 骨子チェック`: Chord / Melody / Bass / Drums / Structure / Energy / Sound Direction を ✓ / △ / － で表示し、「次に決めること」と、その画面へのボタンを出す。裏メロは任意項目。読むだけで、曲の良し悪しは採点しない（`src/core/skeleton-check.js`、Schema変更なし）
- Counter Melody / 骨子チェックのSmoke Test（`npm run test:counter-melody` / `npm run test:skeleton-check`、CI対象）
- Cubase用メモ: 裏メロがあるときは `CounterMelody.mid` も取り込み対象に載せる
- Counter Melody追加前復元点: `restore/v0.2-before-counter-melody`
- Counter Melody 3系統整理前復元点: `restore/v0.2-before-counter-style-3ways`
- Chord Presetを6種類から100種類に拡張。王道・明るい / J-POP・切ない / ロック・力強い / バラード・やさしい / ダンス・ループ / ジャズ・おしゃれ / マイナー・暗めの7カテゴリで、selectをカテゴリ別（optgroup）にした。4小節と8小節があり、説明に「最後のコードの働き」を添えた。既存6種のidと順序は変更なし。Presetは度数配列のみで、適用結果は通常の `project.chords[]` に展開する（Schema変更なし）
- Chord Preset Smoke Testを拡張（100件 / id・進行の重複なし / 4または8小節 / 度数範囲 / カテゴリ所属 / C Major・A Minor・F# Majorで全Preset展開）
- Melody: `↻ 候補を更新`。同じKey / Chord / Barでも、安定 / キャッチー / 浮遊感の方向性を保った4つのVariation Setを順番に切り替えられる。Variation番号はUI状態のみでProject Dataには保存しない（Schema変更なし）
- Melody Candidate Smoke Testを拡張し、4 Setが実際に異なること、全NoteがMIDI範囲内であること、全Setの安定案がChord Tone中心であることを確認
- Melody候補Refresh前の復元ブランチ `restore/v0.2-before-melody-candidate-refresh`
- Section Variation にメロディの候補を2つ追加（`少し違う版にする` の中）: `メロディの音程だけ少し変える`（リズムはそのまま。各小節の2つ目・4つ目の音を、Keyの音階で偶数小節は1つ上・奇数小節は1つ下へ。1つ目の音は残してモチーフを保つ。音階外の音は触らない）、`メロディのリズムだけ変える`（音程と順番はそのまま。各小節の2つ目・4つ目の音が拍の頭なら8分後ろへ。次の音に届かないときは動かさず、2回当てても動かない）。既存の `メロディの終わりを変える` と合わせてメロディ3候補。Schema変更なし
- Section Variation Smoke Testに音程だけ / リズムだけを追加
- 追加前の復元ブランチ `restore/v0.2-before-melody-variation`
- Hub 出発点: `質問で決める`（3つの質問: 雰囲気 / テンポ / 聴かせ方 → 出発点3候補）。ジャンル名を知らなくても始められる入口（`suggestByAnswers`）
- Arrange: `📈 感情曲線から構成を作る`。4〜8列の曲線（Low / Mid / High）を指で選ぶと、イントロ / Aメロ / Bメロ / サビ / 間奏 / Cメロ / アウトロの並び・小節数・盛り上がり（Energy）の叩き台を作る。作った後は自由に直せる。`src/core/energy-curve.js`
- Arrange: `🎼 構成ライブラリ`。好きな曲の構成（Sectionの種類・小節数・盛り上がりだけ。曲の中身は保存しない）を名前を付けて端末に保存し、別の曲へ「当てはめる」。見本3種つき。この端末のlocalStorageのみ、Schema変更なし。`src/arrange/structure-library.js`
- Melody: `⛰ 山の位置から作る`。最高音（山）を置く小節と形（じわじわ上る / 溜めてから一気に / 山のあとに余韻）を選ぶと、そこへ向かう各小節のコード構成音の目安を出し、空の小節にだけ置ける。`src/melody/peak-guide.js`
- Smoke Test追加: `npm run test:energy-curve` / `test:structure-library` / `test:peak-guide`（CI対象）、出発点テストに質問ウィザードを追加
- 追加前の復元ブランチ `restore/v0.2-before-skeleton-entries`（Schema変更なし）
- Melody Analyzer: `Sectionごとの比べ`。構成（Section）ごとに音域 / 音数 / リズム密度（1小節あたり）を並べ、サビと直前のAメロ / Bメロの差（最高音・平均の高さ・音域のひろさ・密度）を表示。差が小さいと「差が小さめ」と気づかせる一言を出す（評価ではなく気づき）。`src/core/section-compare.js`
- Section Compare Smoke Test（`npm run test:section-compare`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-section-compare`（Schema変更なし）
- Rhythm: ドラムフィル（スネア8分 / スネアロール / ブレイク）。Sectionの最後の小節の後半（3・4拍）だけを変え、前半は残す。Sectionが無いときは現在の小節。`各Sectionの最後に入れる` で最後のSectionを除く全Sectionへ一括（`src/rhythm/drum-fills.js`、Schema変更なし）
- Smoke Test追加: `applyDrumFill` / `applyDrumFillToSectionEnds`（`npm run test:rhythm-presets` に含む）
- 追加前の復元ブランチ `restore/v0.2-before-drum-fill`
- Melody: 現在Barのメロディ候補3種類（安定 / キャッチー / 浮遊感）。Key / Scale / Chord / 表示OctaveからAPIなしのルールベースで作り、選択後は通常のPiano Rollで1音ずつ修正できる（Schema変更なし）
- Melody Candidate Smoke Test（`npm run test:melody` に含む）。3候補生成 / Chord Tone中心の安定案 / 現在Barだけの置換 / Chord未設定時のKey・Scale fallbackをCIで確認
- Melody候補追加前の復元ブランチ `restore/v0.2-before-melody-candidates-final`
- Chord: 好きな進行ライブラリ。現在のコード進行を名前を付けて「度数（主音からの距離 + コードの種類）」で保存し、別のKeyの曲にも当てはめられる。この端末のlocalStorageにだけ保存（project.jsonには入れない、Schema変更なし。最大50件・32小節まで。`src/chord/progression-library.js`）
- Progression Library Smoke Test（`npm run test:library`、CI対象）
- CSS Brace Balance Test（`npm run test:css`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-progression-library`
- Arrange: `🔁 ループから曲にする` の案内。8小節ループを先に作り、Sectionへ複製して増やし、「少し違う版にする」で変えていく流れを、いまの段階（①ループを作る / ②複製して増やす / ③違う版にする）を自動判定して次の1手を出す。`ループを複製して追加`（Sectionを末尾に足して中身をコピー、Undo1回。種類はおすすめ初期値あり）、ループと同じ中身のSectionから `少し違う版にする` を直接開く。`src/core/loop-guide.js`、Core Global Operation `appendSectionCopy`
- Loop Guide Smoke Test（`npm run test:loop-guide`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-loop-to-song`（Schema変更なし）。#60（Section Variation）の上に積んでいる
- Section Variation（Arrange: 各Sectionの `少し違う版にする`）: コピーしたSectionなどを「少しだけ違う版」にする候補3つ。ドラムを少し増やす / ベースを少し動かす / メロディの終わりを変える。押したSectionだけが変わり、元のSectionは変わらない。変更が無いときは理由を表示し、履歴も増やさない（`src/core/section-variation.js`、Schema変更なし）
- Section Variation Smoke Test（`npm run test:variation`、CI対象）
- Section Energy: 各Sectionに盛り上がり（Low / Mid / High）を設定。Arrangeの上部に「盛り上がり設計」（Sectionの幅 = 小節数、高さ = Energyの棒グラフ + 「イントロ Low → Aメロ Low → Bメロ Mid → サビ High」の流れ）と、気づきのヒント（サビが前より低い、Buildの次が低い、全部同じ）を表示
- Transition: 各Sectionから次のSectionへのつなぎ（Keep / Fill / Stop / Build / Drop）をタグで設定（最後のSectionには出さない）
- Section Energy / Transition は `structure.sections[]` の任意項目（追記のみ、schemaVersion変更なし）。無い古いProjectは、Sectionの種類ごとの初期値（イントロ Low / Aメロ Low / Bメロ Mid / サビ High / 間奏 Mid / Cメロ Mid / アウトロ Low、つなぎは Keep）で扱う
- AI相談テキスト・Cubaseメモ・曲の特徴カードの構成欄に、盛り上がりとつなぎを反映
- Section Smoke Testに Energy / Transition を追加
- 追加前の復元ブランチ `restore/v0.2-before-section-energy`
- Chord: `🎤 メロディからコードを付ける`。鼻歌（メロディ）を先に作ったあと、小節ごとに「合うコード候補3つ」を出す（Key/Scaleのダイアトニック7和音から、メロの音がコードの構成音に乗る度合いで選ぶ。長い音・拍の頭の音を重く数える。理由と役割ラベル付き）。選ぶとその小節のコードになり次の小節へ進む。`メロのある小節に1つ目の候補をまとめて付ける`（置き換え時は確認、↶で戻せる）。`src/chord/chord-for-melody.js`
- Melody to Chord Smoke Test（`npm run test:melody-chords`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-melody-to-chords`（Schema変更なし）
- Hub 出発点: 候補カードにコード名の進行（例: Dm → A# → F → C）と `▶ 試聴` を追加。試聴は保存せず仮のProjectを鳴らすだけ（曲のデータは変わらない。Bassは外して鳴らす）
- Hub: `🧭 出発点を選ぶ（ジャンル × ムード）`。ジャンル（ポップ / バラード / ロック / ダンス / ボカロ風）とムード（切ない / 明るい / 夜 / 力強い / やさしい）を選ぶと、Key / BPM / コード進行 / ドラム / 伴奏 / 音色の方向性をまとめた出発点を3つ出す（14種のレシピ、どちらか片方の選択でも可）。選ぶと1回の編集（Undo1回）で反映。コード・ドラム（出発点の小節数分）・Key/BPM/音色/伴奏を置き換え、メロディは残す。Bassがある間は不可。`src/hub/starting-point.js` / `starting-point-ui.js`、Storeに `applyStartingPoint`
- Starting Point Smoke Test（`npm run test:starting-point`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-starting-point`（Schema変更なし。`metadata.genre` / `metadata.mood` を既存フィールドとして使用）
- Hub: `Cubaseでやることメモ`（自動作成。プロジェクト設定 / 取り込むMIDI / 使ったコード / 音色の方向性ヒント / 構成 / 次にやることチェックリスト。コピー可。`src/hub/cubase-memo.js`）
- Hub AI相談: 悩みのテンプレート（次のコード / サビを盛り上げる / メロディを覚えやすく / ベース / Aメロとサビの差 / 構成の見直し / Cubaseで次にやること）。タップで相談欄に入り、書き換え・追記できる
- コピー処理を `src/hub/clipboard.js` に共通化
- Cubase Memo Smoke Test（`npm run test:memo`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-hub-memo`（Schema変更なし）
- Melody Analyzer（Melody内の `メロディの特徴` パネル）: 音域 / 跳躍 / コードトーン率 / リズム密度 / 同音連打 / モチーフ反復 の6項目を、数字と一言で表示。評価ではなく特徴の説明（`src/core/melody-analysis.js`）
- Hub: `曲の特徴カード`（構成 / コード進行 / 音域 / 跳躍 / モチーフ反復 / 入力済みパート。`src/hub/song-card.js`）
- Melody Analysis Smoke Test（`npm run test:analysis`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-analyzer`（Schema変更なし）
- Chord: 進行カードにコードの役割ラベル（安定 / つなぎ / 浮遊 / ひらける / 緊張 / 切ない / 不安定。Key外のコードは「借用」）。Melodyの見出しにも表示（`src/chord/chord-role.js`）
- Melody: 度数表示ボタン。鍵盤の文字を、コードのルートから見た度数（R / ♭3 / 3 / 5 / ♭7 …）に切り替える（コードが無い小節はKeyの主音基準。画面の状態のみ、Schema変更なし）
- Smoke Test追加: `chordRole` / `degreeLabel`（`npm run test:candidates` に含む）
- 追加前の復元ブランチ `restore/v0.2-before-learning-labels`
- Chord Backing Pattern 4種類（Block / 8分刻み / Arpeggio / Syncopation）。コード進行自体は変えず、伴奏の鳴らし方だけを選択できる（Schema変更なし）
- Backing Pattern Smoke Test（`npm run test:backing`）。Pattern生成 / AutoSave対象データ / Undo・Redo / Chord.midへの反映をCIで確認
- Backing Pattern最終統合前の復元ブランチ `restore/v0.2-before-backing-pattern-final`
- 画面の文字サイズ3段階（標準 / 大 / 特大。Hub > 文字の大きさ）。画面本体だけを拡大し、上部バー・Demo Player・下部ナビは変えない。この端末のlocalStorageにだけ保存（project.jsonには入れない、Schema変更なし）
- Display Settings Smoke Test（`npm run test:display`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-font-size`
- Chord: 次のコード候補（3つ）。直前のコードに応じて、次に来やすいダイアトニックコードを理由つきで3つ表示。空のときは「最初のコード候補」。タップで追加（`src/chord/chord-next.js`）
- Chord: ひとスパイス（借用和音）。同主調から和音を借りる3候補（Majorなら Fm系 / ♭VII / ♭VI、Minorなら IV / V / I）を、ボタンで開いてタップ追加（`suggestSpiceChords`、Schema変更なし）
- Rhythm: Bass候補（3つ）。現在の小節のBassを、Kickに合わせる（Kickがある場合）/ どっしり / ルート+5度 / はずむ（オクターブ）の3案から選んで置き換え。16マスで1音ずつ直せる（`src/rhythm/bass-candidates.js`）
- Candidates Smoke Test（`npm run test:candidates`、CI対象）
- 追加前の復元ブランチ `restore/v0.2-before-candidates`（Schema変更なし）
- Melody: `Copy Bar`（次の小節へ複製）/ `Copy 2小節`（2小節を続けて複製）。コピー先に音があれば上書き確認、音の長さは保つがコピー先の終わりを超えない
- Rhythm: Drum Presetを「Section全体に適用」（Kick / Snare / Closed HHのみ。Bassは変更しない）
- Arrange: 骨子の進み具合表示（曲全体と各Sectionで コード / メロ / ベース / ドラム の入力済み小節数。✓ / △ / －）
- Melody: Chord Tone強調（現在Barのコード構成音の行を青く色付け。見た目のみ、Schema変更なし）
- Smoke Test追加: `copyMelodyBars` / `applyDrumPresetToBars` / `sectionProgress`（既存の `test:melody` / `test:rhythm-presets` / `test:section` に含む）
- 追加前の復元ブランチ `restore/v0.2-before-copy-progress`（Schema変更なし）
- Demo Playerのパート聴き分け（Chord / Melody / Bass / Drumsのミュート、ソロ）。再生中も反映、保存・MIDIには影響しない（Schema変更なし）
- AI相談用テキストのコピー（Hub > AI相談。曲の基本情報・構成・コード・メロディ・ベース・ドラム + 相談したいこと。APIなし）
- Part Switch Smoke Test（`npm run test:parts`）/ AI Consult Text Smoke Test（`npm run test:consult`）、CI対象
- 追加前の復元ブランチ `restore/v0.2-before-parts-consult`
- Melody / Bassの音の長さ指定（16分〜2分・付点。長い音は途中のマスも表示。小節の終わり・次の音を超えない）。`durationTick` を使うためSchema変更なし
- 共通の `src/core/note-placement.js`（Melody / Rhythmから使う純粋関数）
- Note Length Smoke Test（`npm run test:melody` に含む、CI対象）
- 音の長さ追加前の復元ブランチ `restore/v0.2-before-note-length`
- Rhythm: Bassの半音ずらし（±6）と、主役（ルート系・5度）/ 飾り（3度・7度・ずらした音）の色分け表示（見た目のみ、Schema変更なし）
- Bass半音ずらし前の復元ブランチ `restore/v0.2-before-bass-shift`
- Rhythm: Bassの音程選択（ルート / 3度 / 5度 / 7度 / オクターブ上 / ルート下）。16マスはそのまま、ルート以外のベースラインを入力できる（Schema変更なし）
- Bass Pitch Smoke Test（`npm run test:rhythm` に含む、CI対象）
- Bass音程選択前の復元ブランチ `restore/v0.2-before-bass-pitch`
- project.json読み込み（Hub > Export > 読み込み。検証・schema v1移行・確認ダイアログ・Undo可）
- project.json Import Smoke Test（`npm run test:import`、CI対象）
- Import実装前の復元ブランチ `restore/v0.2-before-project-import`
- 曲の構成（Arrange / Section）: 叩き台3種類、小節数の増減、追加・削除、Section間コピー、Section単位の再生、Melody / Rhythm見出しへのSection表示、MIDI Section Marker（Schema変更なし）
- Section Smoke Test（`npm run test:section`、CI対象）
- Section実装前の復元ブランチ `restore/v0.2-before-arrange-sections`
- Undo / Redo（Project全体で1本の編集履歴、最大50操作、画面上部の `↶` `↷`）
- Edit History Smoke Test（`npm run test:history`、CI対象）
- Undo実装前の復元ブランチ `restore/v0.2-before-undo`
- Sound Sketch Lite: Chord / Melody / Bass の音色Preset変更
- Sound Preset: Chord `Keys / Pad / Piano`、Melody `Lead / Keys / Pluck`、Bass `Soft Bass / Synth Bass / Deep Bass`
- Sound Tone: `Natural / Bright / Soft / Warm / Dark / Airy / Aggressive`
- Sound Sketch Smoke Test（`npm run test:sound`、Undo / RedoもCI確認）
- Sound Sketch Lite追加前の復元ブランチ `restore/v0.2-before-sound-sketch-lite`
- Chordの基準音Select（C〜B）
- 基準音ごとの9種類のChord Quality: Major / Minor / 7 / Maj7 / m7 / sus2 / sus4 / dim / aug
- 共通Chord Quality定義 `src/core/chord-qualities.js`
- schemaVersion 2
- schemaVersion 1 → 2 Migration
- Migration前ProjectをIndexedDB `meta` storeへ退避する処理
- Chord Quality Smoke Test（`npm run test:chord`、CI対象）
- Chord Preset 6種類（Pop 1564 / J-POP 4536 / Pop 1645 / Pop 6415 / 2-5-1 / カノン進行）
- Chord Preset Smoke Test（`npm run test:chord-presets`、CI対象）
- Rhythm Drum Preset 6種類（8ビート 基本 / 4つ打ち / Pop / Rock / Half Time / 16分HH）
- Rhythm Preset Smoke Test（`npm run test:rhythm-presets`、CI対象）
- Hub Key変更の回帰テスト（`npm run test:key-change`、CI対象）
- Diatonic Fan配置Smoke Test（`npm run test:diatonic-fan`、CI対象）
- v0.2統合前の復元ブランチ `restore/v0.1-before-v0.2-integration`
- Chord Preset追加前復元点: `restore/v0.2-before-chord-presets`
- Key変更修正前復元点: `restore/v0.2-before-key-change-fix`
- ダイアトニック扇形UI変更前復元点: `restore/v0.2-before-diatonic-fan-ui`

### 変更
- Counter Melody候補を `Sparse / Active / Hook` の3系統へ整理。候補IDはProject Dataへ保存せず、適用結果だけ通常Noteとして保存するためschemaVersion 2のまま互換性を維持
- Demo Playerのパートパネルを6ボタン（Chord / Melody / Bass / Drums / 裏メロ / Solo）にした
- Section操作（コピー / 同じ中身の判定）の対象トラックに `counter` を追加した
- Melody候補の適用結果を専用形式ではなく通常の `tracks[role=melody].notes[]` として保存し、既存のAutoSave / Undo / Demo Player / MIDI Exportをそのまま利用する方式にした
- Backing Pattern選択を `project.instruments[]` の `part: chord-backing` entryとして保存し、AutoSave / Undo / Redo対象にした。未設定ProjectはBlockへFallbackする
- Demo PlayerのChord発音と `Chord.mid / Song.mid` のChord Track Note配置へBacking Patternを反映。Chord Dataそのものは変更しない
- `instruments[]` の責任をpart単位で分離し、Soundは `chord / melody / bass`、Chordは `chord-backing` を更新する方式にした
- Vercelの自動配信を停止（`vercel.json` に `git.deploymentEnabled: false`）。PRにVercelのチェックが出ないようにした。設定ファイルと手順は残し、公開確認はGitHub Pagesを使う
- Rhythm Copy: 長いBassがコピー先の範囲からはみ出さないよう収め、コピー先に食い込む前の音を短くする
- BarをまたぐBass Copyを、全ノートをルートへそろえる動作から、音程関係を保ってコピー先のルートへ移す動作へ変更
- Bottom Navigationを Hub / Chord / Melody / Rhythm / Arrange / Sound の6 Module構成へ拡張
- Sound選択を既存 `project.instruments[]` に保存し、AutoSaveとProject全体Undo / Redoの対象にした
- Demo PlayerのChord / Melody / Bass仮音をSound Preset / Toneに応じてwaveform / low-pass filter / attack / release / gain変更する方式へ拡張
- ArrangeのSection単体再生でも同じSound設定を保持する
- Sound Sketch LiteはMIDI Note / Chord Data / Rhythm Dataを変更せず、MIDI Program Change / CCも出力しない
- Chord画面はダイアトニック7候補を残しつつ、任意の基準音から9種類のQualityを追加できる構成へ変更
- Chord画面のダイアトニック7候補を2列Gridから五度圏の扇形ビューへ変更
- Majorは `IV / ii ← I / vi → V / iii` + `vii°`、Minorは `VI / iv ← III / i → VII / v` + `ii°` として配置
- 扇形UIは既存 `data-add-chord` Buttonへ表示classだけを付与し、Chord追加ロジック / Project Data / MIDIは変更しない
- Chord画面に `Chord Preset` select + `適用` を追加し、現在Key / Scaleへ自動変換した進行を通常Chord Dataとして展開する方式にした
- Chord Preset適用後も個別コード追加 / 削除 / Clearで自由に修正できるようにした
- Chord QualityをDemo Player / Chord.mid / Song.midへ共通の構成音定義で反映
- Rhythmに `Drum Preset` select + `適用` を追加し、現在BarのKick / Snare / Closed HHだけを置換する方式にした
- Preset適用後も通常の16 stepをTapして自由に修正できるようにした
- HubのKey変更は、Chord root / Melody pitch / Bass pitchを同じ最短半音幅でAtomicに移調し、Drumsは変更しない方式へ変更
- Scale変更はChord / Melody / Bassが存在する場合は引き続き拒否し、意図しないMajor/Minor変換を行わない
- `VERSION` / 画面内Version / package versionをv0.2-devへ更新
- DATA_SCHEMAをschemaVersion 2へ更新
- CIでSyntax / MIDI / Rhythm Copy / Rhythm Preset / Melody / Chord / Chord Preset / Backing Pattern / Hub Key Change / Diatonic Fan / Undo / Arrange / Sound Sketch / Part Switch / AI Consult / Import / Static Buildを確認する構成へ更新

### 修正
- Melody候補が同じKey / Chord / Barでは毎回同じ3案に固定されていた問題を修正。無制限ランダムではなく、ルールを維持した4 Variation Setの循環にした
- Demo Player: Loop中（または再生中）にコード・メロディなどを編集しても、Stop→Playし直すまで古い音が鳴り続けていた問題を修正。Loopの次の周に入るたびに最新の曲（Section再生なら最新のSection範囲）を読み直して鳴らす。再生中の1周の途中には反映されず、次の周から変わる。Schema変更なし
- `src/chord/chord-presets.css` の閉じ括弧 `}` が1つ抜けていて、そのあとに書いた「次のコード候補」「ひとスパイス」「コードの役割」の見た目が効かなくなっていた。原因: Backing Pattern統合時のrebaseで両側を残した際の取り違え。再発防止としてCSS括弧のテストをCIに追加
- `package.json` に重複していた `test:syntax` 定義を1つへ統合し、ドラムフィルを含む最新Syntax CheckとMelody候補ファイルをまとめて検査するようにした
- Backing Pattern旧PR #45は作業中のdevelop先行更新と競合したためマージせず、最新developからPR #50用branchを作り直し、Bass音程 / Melody長さ / Import / Part Mute/Solo / AI相談を保持したまま再統合した
- 旧schemaVersion 1の保存Projectをv0.2でそのまま破棄せず、自動Migrationして利用できるようにした
- PR #23 / #24がGitHub Pages統合後のdevelopと競合するため、現在developから統合branchを作って安全に再統合した
- Sound Sketch作業中にUndo / Arrangeがdevelopへ先行統合されたため、旧PR #39をマージせず最新developから統合branchを作り直し、Arrange / Undoを保持したままSoundを再統合した
- Chord / Melody / BassがあるとHubのKey Selectが元の値へ戻り、Keyを変更できなかった問題を修正
- Key移調でMIDI Note 0〜127を外れる場合は更新全体を中止し、元Projectを維持するようにした

### 未対応
- Chord並べ替え / 長さ変更
- 借用和音を目的別に整理した追加候補
- Chord Preset Libraryの追加分類（Scaler / Melody Sauce / Cubase / 書籍等）
- Backing PatternのSection別 / Bar別指定、詳細Step編集
- Melody Velocity編集 / Scale表示
- Melody候補のSection単位・複数小節単位の生成（初期版は1小節3候補のみ）
- Snapshot履歴
- Section Energy
- Arrange / Song Structureの実制作検証・正式整理
- Counter MelodyのPiano Roll内直接編集 / 詳細編集
- Drums音色変更
- 本格Sound Sketch整理（詳細Synth / FX / Mixerは原則追加しない）

## v0.1-dev
更新日: 2026-10-10

### 追加
- Demo Composer初期Repository構成
- Claude / ChatGPT共通開発ルール
- AI_HANDOFF
- PRODUCT_SPEC / ARCHITECTURE / DATA_SCHEMA / UI_SPEC / DEVELOPMENT_RULES / ROADMAP
- Hub / Chord / Melody / Rhythm の最小UIシェル
- Androidスマホ向けの基本レスポンシブUI
- 将来のMelody / Bass等の3候補生成方針を共通仕様へ追加
- schemaVersion 1に沿った共通Project Stateストア
- Project Snapshot / Validation / Subscription / Revision更新
- HubからProject名 / BPM / Key / Scaleを編集するUI
- IndexedDB Storage Module
- Active Projectの手動Saveと起動時自動読込
- Save時のPersistent Storage要求
- 保存方式変更前の復元ブランチ `restore/v0.1-before-indexeddb`
- Key / Scale連動のダイアトニックコード7候補
- Chord候補タップによる1小節追加
- Chord削除 / Clear / startTick再配置
- Chord State Validation / updateChords API
- Melody Track Validation / updateMelodyNotes API
- スマホ向け簡易Melody Piano Roll
- Melody左端の縦ピアノKeyboard（白鍵 / 黒鍵 + Note名表示）
- Melody縦ピアノUI変更前の復元ブランチ `restore/v0.1-before-melody-vertical-piano`
- Melody 8マスUI変更前の復元ブランチ `restore/v0.1-before-melody-8step-grid`
- Melodyの入力単位切替（8分音符 / 16分音符）。16分は前半 / 後半に分けて表示
- Melody 16分切替前の復元ブランチ `restore/v0.1-before-melody-16th-toggle`
- Melody Grid Smoke Test（`npm run test:melody`、CI対象）
- Rhythm 16マスUI変更前の復元ブランチ `restore/v0.1-before-rhythm-16step-grid`
- feature-complete統合前の復元ブランチ `restore/v0.1-before-feature-complete-integration`
- Monophonicな8分音符Tap入力 / Clear Bar
- Melody UI大幅変更前の復元ブランチ `restore/v0.1-before-melody-roll`
- Bass / Drums Track更新API
- スマホ向けRhythm 16 Step Sequencer
- Beat 1〜4切替 / Bar移動 / Clear Bar / Clear Bass
- BassをChord RootまたはKey Rootから入力する方式
- GM準拠Kick 36 / Snare 38 / Closed HH 42
- Rhythm Beat Copy（現在BeatのBass / Drumsを次Beatへコピー。Beat 4は次BarのBeat 1へコピー）
- Rhythm Bar Copy（現在BarのBass / Drumsを次Barへコピー。Bassはコピー先Rootへ追従）
- Rhythm UI変更前の復元ブランチ `restore/v0.1-before-rhythm-sequencer`
- Web Audio APIベースの常設Demo Player
- Demo Player Play / Stop / Loop / Position表示
- Chord / Melody / Bass / Drumsの軽量プレビュー音
- Demo Player実装前の復元ブランチ `restore/v0.1-before-demo-player`
- 外部ライブラリ不要のStandard MIDI File writer
- Song.mid（Conductor + Chord + Melody + Bass + Drums）
- Chord.mid / Melody.mid / Bass.mid / Drums.mid
- SMF Type 1 / PPQ 480 / Tempo / 4/4 / Key Signature
- Hub Export PanelとAll MIDI / 個別MIDI Download
- project.json手動Backup Download
- MIDI構造変更前の復元ブランチ `restore/v0.1-before-midi-export`
- Project State変更後1.5秒のDebounced AutoSave
- アプリがhiddenになる時の即時AutoSave
- AutoSaveの保存Queueによる同時書き込み防止
- AutoSave実装前の復元ブランチ `restore/v0.1-before-autosave`
- Vercel Preview用の静的build処理 `scripts/build-static.mjs`
- Vercel設定 `vercel.json`（`npm run build` → `dist/`）
- Vercel設定変更前の復元ブランチ `restore/v0.1-before-vercel-build-config`
- GitHub Pages Fallback用Workflow `.github/workflows/pages.yml`（`develop` → `npm run build` → `dist/`）
- GitHub Pages運用資料 `docs/GITHUB_PAGES.md`
- GitHub Pages導入前の復元ブランチ `restore/v0.1-before-github-pages`

### 変更
- Hub表示を固定値からProject State参照へ変更
- Project名変更時にTop Barへ即時反映するよう変更
- Saveボタンを有効化
- Project Stateと永続化処理を分離
- Chord画面を固定サンプルからProject Data連動UIへ変更
- Chord進行が存在する間はKey / Scale変更を拒否し、Degree不整合を防止
- Melody画面をPlaceholderからProject Data連動の簡易Piano Rollへ変更
- MelodyのPitch表示を文字列だけの列から、白鍵 / 黒鍵が分かる縦ピアノ表示へ変更
- MelodyのBeat 1–2 / Beat 3–4切替を廃止し、`1 & 2 & 3 & 4 &` の8分音符8マスを1画面に同時表示する方式へ変更
- Rhythmの1 Beat=4 step表示を廃止し、`1 e & a / 2 e & a / 3 e & a / 4 e & a` の16マスを1画面に同時表示する方式へ変更
- RhythmのBeat 1〜4ボタンを表示切替からCopy Beatのコピー元選択へ変更（セルTapでもBeatを選択）
- `milestone/v0.1-feature-complete`（655fc14）のコードを新しい統合branch経由で `develop` へ反映（PR #15 / #16を置き換え）
- Melodyで8分と16分を混在させても重ならないよう、既存Noteを短縮 / 新Noteの長さを制限するMonophonic処理へ拡張（8分のみの従来動作は変更なし）
- Melody Noteが存在する間もKey / Scale変更を拒否して整合性を保護
- Rhythm画面をPlaceholderからBass / Drums同時入力UIへ変更
- Bass Noteが存在する間はChord変更を拒否してRoot不整合を防止
- 画面下部にDemo Playerを常設し、その下にModule Navigationを維持
- HubのExportを有効化し、DAW受け渡しとProject Backupを同じPanelに集約
- 通常編集の保存を手動中心からAutoSave中心へ変更
- 手動Saveを`Save Now`として即時保存・Persistent Storage要求用途に整理
- Vercel配布時のみ静的buildを行い、ローカル開発は引き続きビルド不要とした
- Android実機向けにDemo PlayerのChord previewを1オクターブ上の仮voicingへ変更し、Bass previewをtriangle波へ変更
- Demo Playerの出力をloudness gain + compressor + limiter方式へ変更し、スマホ本体スピーカーでの聞き取りやすさを優先
- Vercelを削除せず、GitHub Pagesを第二公開先として追加する方針にした

### 修正
- Chord作成後のKey / Scale変更で表示とDegreeが不整合になる問題を予防
- ChordをClearした後も5小節目以降のMelody Noteへ移動できるようBar数をNote Dataから補完
- Bassが旧Chord Rootのまま見えなくなる問題を避けるため、Bass stepはstartTick単位で表示しTap時に現在Rootへ置換可能にした
- VercelでDeploymentがREADYでも公開ファイルが生成されず404になる配布設定を修正
- Android ChromeでAudioContextがsuspendedのまま無音になる可能性に対しresume処理とfallbackを追加
- 単純な後段2倍出力で発生したクリップ / 音割れを、前段loudness gain + compressor + limiter構成へ置き換えて改善
- Demo PlayerのLoop終端を常に4小節固定にせず、最後に使用しているBarの終端へ合わせるよう修正
- Rhythmの16分Grid見出しがBeat切替後も `1 e & a` 固定だった表示を、選択Beatへ追従するよう修正
- Melody 8マス化後にCSSが4列のまま残っていた不整合を修正
- Melody説明文内の未エスケープBacktickでJavaScript Module全体がParse ErrorになりHubから操作不能になった問題を修正

### 未対応
- Snapshot履歴
- Chord並べ替え / 長さ変更 / 借用和音
- Melody Note Length / Velocity編集
- Scale表示 / Chord Tone強調 / Melody Analyzer
- Bass Pitch手動編集 / Velocity
- Open HH / Percussion / Tom
- WAV Export
- PWA Service Worker
- Android実機テストの残り項目
- Cubasis / CubaseでのMIDI Import実機確認
## Companion Arrangement Lab v0.2.1-dev — 2026-10-13
試聴/MIDIの一致、ch10、Section境界、リハモ計算、プラン再開、PWA scope/cache保護を修正。詳細 arranger/CHANGELOG.md。本体v0.3-dev/Schema 3は変更なし。

## Companion Arrangement Lab v0.3-dev — 2026-10-13
理論リハモとメロディ関係、裏メロスケール案、Section採用、サビ5案、引き算、主役交代を追加。独立Plan Schema 3、旧Plan 1/2互換。本体Version/Schemaは維持。詳細 arranger/CHANGELOG.md / docs/VERIFICATION_v0.3.md。

## Companion Arrangement Lab v0.4-dev — 2026-10-13
Harmony14/Counter16/Development15/連動5の実音楽変換を追加。実Voicing/Note Override、対象Section採用、MIDI A/B、Plan Schema4/旧互換。本体Version/Schemaは維持。詳細 arranger/CHANGELOG.md。

## Companion Arrangement Lab v0.4.1-dev — 2026-10-13
PWAの旧画面が残る更新問題を修正。arranger入口/依存のbuild固定、build別SW/cache、network-first/offline fallback、旧保存保持の更新テストを追加。本体Moduleのstampは維持。

## 記入シート簡易表示 v0.6 — 2026-10-14
Home / Demo / Arrangementの右上「曲データ」に、現在のSongProjectの記入内容を表示。記入シート本体の非公開範囲を保持。
