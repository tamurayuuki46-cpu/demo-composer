# Music Project Home

最終更新: 2026-10-15
対象: `project-home/`

## 目的

Music Project Home はアプリ一覧ではなく、**曲の現在地と次の一手を5秒で分かるようにする司令塔**です。

初心者向けの最優先情報は次の4つに限定します。

1. **今ここ** — 現在の制作段階
2. **未決定** — まだ決めていない重要事項を最大3件
3. **次にやること** — 次の1アクションを1つだけ大きく表示
4. **制作フロー** — 作曲シート → 必要ならMIDI Analyzer → Demo Composer → Arrangement Lab → DAW

補助情報は次の2つだけをHomeに置きます。

- 今日決めたこと
- 次回やること

## 作曲シート最新版の扱い

Homeは作曲シートのVersion付きURLを保持しません。

Canonical入口:

`../sheet-app/`

最新版情報:

`../sheet-app/latest/manifest.json`

`sheet-app/index.html` → `latest/composition_sheet_latest.html` → 現在の最新版、という1本の導線に統一します。

Homeでは次を行います。

- 制作フローの「⓪ 作曲シート」をcanonical入口へ接続
- 「次にやること：作曲シート」も同じcanonical入口へ接続
- 作曲シートカードに最新版Versionをmanifestから表示
- Home内iframeにもcanonical入口を表示

このため、作曲シートがv0.10、v0.11へ更新されても、`latest` redirectとmanifestを更新するだけでHomeが自動追従します。Home側へVersion番号を直書きしません。

## 制作フロー

- 作曲シート: 曲の方向を決める。初心者は「かんたん入力」から開始
- MIDI Analyzer: 必要な場合だけ素材を理解する。必須工程にしない
- Demo Composer: コード・メロディなど作曲判断を進める
- Arrangement Lab: 編曲案を比較して選ぶ
- DAW: Cubasisは任意、最終仕上げはCubase / PC DAWを想定

既存機能を削除するのではなく、初心者Homeでは次に必要なものだけ前面に出します。

## 未決定の扱い

未決定は評価点ではありません。現在のProjectデータから機械的に判定できる項目だけを出します。

優先候補:

- 曲の方向性
- コード進行
- 主旋律
- 曲構成
- 裏メロ（必要なら）
- ベース（必要なら）
- 編曲方針
- DAWへ渡すデータ

最大3件まで表示し、完成度スコアにはしません。

## 次にやること

1. 作曲シート未完了 → canonical latest作曲シート
2. 作曲データなし → Demo Composer
3. 編曲データなし → Arrangement Lab
4. DAW引き継ぎ未完了 → 書き出し
5. 引き継ぎ済み → Cubasis / Cubaseで仕上げ

MIDI Analyzerは任意なので、未解析でも制作を止めません。

## データ境界

SongProject v1 の所有権境界は変更しません。

- MIDI Analyzer: `analysis` / `reference`
- Demo Composer: `composition`
- Arrangement Lab: `arrangement`
- 共通: `basic` / `lineage`

作曲シートは`intent`と明示的に選んだ`basic`を更新し、他アプリ所有領域を保持します。

「今日決めたこと」「次回やること」はProject HomeだけのUI補助メモです。`SongProject v1`へ新しい所有領域を追加せず、端末のlocalStorageに保存します。

保存キー:

`demo-composer.project-home.notes.v1:<project-id>`

## モバイルUI

- 主操作は48px以上のタップ領域を維持
- 最上段に「今ここ / 未決定 / 次にやること」
- 作曲シート最新版をHome内で確認可能
- 作曲シート本体は初心者モードを初期表示
- 360px級の画面でも縦1列で読めること

## 完了条件

- Homeを開いて5秒以内に次の行動が分かる
- Homeに表示される作曲シートがcanonical latestである
- Homeのコードに作曲シートVersion固定URLがない
- manifestから現在Versionを確認できる
- SongProject未読込でも安全に案内できる
- MIDI Analyzerを飛ばしても進行可能
- 今日/次回メモがSongProject本体を変更しない
- 既存JSON受け渡し、Backup、Claude旧リンクを壊さない
- `npm run test:project-home` と既存CIが通る

## 非目標

現段階では以下をHomeへ追加しません。

- 作曲能力の採点
- 機能使用率ランキング
- 複雑なタスク管理
- SNS/共有フィード
- AIによる自動作曲
- 新しいSongProject Schema領域
