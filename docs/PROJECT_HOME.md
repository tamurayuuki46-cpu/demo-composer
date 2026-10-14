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

## 制作フロー

- 作曲シート: 曲の方向を決める
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

最大3件まで表示し、ユーザーを責める表現や完成度スコアにはしません。

## 次にやること

AIに丸投げせず、まずルールベースで判定します。

1. 作曲シート未完了 → 作曲シート
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

「今日決めたこと」「次回やること」はProject HomeだけのUI補助メモです。`SongProject v1`へ新しい所有領域を追加せず、端末のlocalStorageに保存します。

保存キー:

`demo-composer.project-home.notes.v1:<project-id>`

これによりHomeの補助メモ追加がSongProject互換性や他アプリのデータを壊さないようにします。

## モバイルUI

- 主操作は48px以上のタップ領域を維持する
- 最上段に「今ここ / 未決定 / 次にやること」を置く
- 制作フローはその下
- 詳細データ、旧Claudeリンク、バックアップは主判断より下に置く
- 360px級の画面でも縦1列で読めること

## 完了条件

- Homeを開いて5秒以内に次の行動が分かる
- SongProject未読込でも安全に案内できる
- SongProject v1読込後に現在地・未決定・次行動が更新される
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
