# Composition Intent Bridge

## 目的

作曲シート / Hubで決めた「曲想・感情」を、Chordなど後段Moduleへ安全に引き継ぐための軽量な共有層。

Demo Composerの役割分担は以下を維持する。

- 作曲シート / Hub: 言葉で決められる意図・制約
- Chord / Melody / Rhythm / Sound: 音を鳴らして選ぶ判断

Intentは自動作曲の指示ではなく、候補を絞るための出発点として扱う。

## 実装

- Core: `src/core/composition-intent.js`
- Hub同期: `src/hub/starting-point-ui.js`
- Chord受取: `src/chord/chord-mood-ui.js`

`composition-intent.js` はProject Dataのコピーを正本にしない。現在Projectの `metadata.mood[]` をUI間で共有するためのメモリ上のBridgeで、保存・Migration・MIDI形式は変更しない。

## データの正本

正本は従来どおり `project.json` の以下。

```json
{
  "metadata": {
    "mood": ["切ない", "夜", "浮遊感"]
  }
}
```

既存Projectでは `切ない` / `明るい` / `夜` / `力強い` / `やさしい` のような日本語Labelが保存される場合がある。

Chord側は保存形式を変更せず、日本語LabelまたはTag IDを既存Chord Mood Tagへ正規化する。

例:

- `切ない` → `sad`
- `明るい` → `bright`
- `夜` → `night`
- `力強い` → `strong`
- `やさしい` / `優しい` → `gentle`
- `浮遊感` → `floating`
- `希望` → `hope`
- `青春` → `youth`

## Hub → Chord

1. Hub表示時、現在Projectの `metadata.mood[]` をComposition Intentへ同期する。
2. Hubの「出発点」を適用した場合、更新後Projectから再同期する。
3. Chordの「曲想から選ぶ」はIntentを受け取り、対応するTagを最大3個まで自動選択する。
4. そのTagから既存Chord Preset 100種類を最大3案へ絞る。
5. ユーザーはChord画面でTagを追加・削除して調整できる。

同じHub Intentのまま画面を行き来した場合、Chordで行った手動Tag調整を勝手に元へ戻さない。Hub側の `metadata.mood[]` が変化した場合だけ、新しいIntentを自動反映する。

## 作曲シートとの接続契約

将来の独立PWA「作曲シート」からDemo Composerへ渡す場合も、曲想は最終的に `metadata.mood[]` と同じ語彙へ寄せる。

初期契約は以下で十分とする。

```json
{
  "mood": ["切ない", "夜", "浮遊感"]
}
```

Demo Composer側で受け取った後、HubがProject Dataへ反映し、Composition Intentを通じてChordへ渡す。

作曲シート専用の巨大SchemaやChord専用フィールドは作らない。

## 非目標

- 曲想から曲全体を自動生成しない
- Intentを絶対的な感情判定として扱わない
- Module間で直接データを書き換えない
- Chordの手動調整をHubから常時上書きしない
- schemaVersionをこの機能だけのために上げない

## テスト

- `scripts/composition-intent-smoke-test.mjs`
- `scripts/chord-mood-ui-smoke-test.mjs`
- `npm run test:starting-point`
- `npm run test:chord-presets`
- `npm run test:syntax`
