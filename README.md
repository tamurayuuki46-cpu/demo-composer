# Demo Composer

Androidスマホ中心で使う作曲支援PWAです。

## コンセプト

Demo Composerは「スマホ版DAW」を目指しません。

目的は、PCを起動する前に以下の作曲判断をスマホで進めることです。

- コード進行
- メロディ
- ベース
- ドラム / リズム
- 曲構成
- 裏メロ
- 音色の方向性
- Demo v1

本制作は `Demo Composer → Cubasis → Cubase → 各種プラグイン` へ引き継ぎます。

## Current Version

`v0.1-dev`

## Status

初期Repository / 共同開発基盤を作成済み。

現在は、Hub / Chord / Melody / Rhythm の画面骨格に加えて、schemaVersion 1準拠の共通Project Stateを実装しています。

Hubでは現在、Project名 / BPM / Key / Scaleを編集でき、変更は共通Stateへ反映されます。保存はまだメモリ上のみで、IndexedDB永続化は次工程です。

## AI共同開発

- Claude: `CLAUDE.md`
- ChatGPT / Codex: `AGENTS.md`
- 共通の引き継ぎ正本: `docs/AI_HANDOFF.md`

重要な仕様はAI固有ファイルへ閉じ込めず、必ず `docs/` の共通仕様へ反映してください。

## 最初に読むファイル

1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DATA_SCHEMA.md`
7. `CHANGELOG.md`

## 開発原則

- Androidスマホ優先
- 初心者UX優先
- PC版DAWを再現しない
- Module間を直接依存させない
- `project.json` をDemo Composer内の正本とする
- MIDI Exportを重要機能として扱う
- 過去Versionを上書きしない
- 大規模変更前に復元ポイントを作る

## 起動

現段階はビルド不要です。

`index.html` をローカルサーバーで配信してください。

例:

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

## Repository Structure

```text
demo-composer/
├─ src/
├─ public/
├─ docs/
├─ versions/
├─ README.md
├─ CHANGELOG.md
├─ VERSION
├─ CLAUDE.md
├─ AGENTS.md
├─ package.json
└─ index.html
```
