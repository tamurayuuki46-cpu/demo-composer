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

現在は、Hub / Chord / Melody / Rhythm の実データ入力、schemaVersion 1準拠の共通Project State、IndexedDBによる端末保存、常設Demo Playerを実装しています。

HubではProject名 / BPM / Key / Scaleを編集でき、Saveで現在のProjectを端末に保存できます。次回起動時は保存済みProjectを自動で読み込みます。

Chordでは、HubのKey / Scaleに合うダイアトニックコード7つを候補表示し、タップで1小節ずつ進行へ追加できます。追加済みコードの削除 / Clearにも対応しています。

Melodyでは、Androidスマホ向けの簡易Piano Rollを実装しています。1小節を8分音符8 stepとして扱い、4 stepずつ表示してタップ入力できます。Bar / Octave切替とClear Barに対応しています。

Rhythmでは、Bass / Kick / Snare / Closed Hi-Hatを同じ画面で入力できます。1小節16 stepを1 Beat=4 stepずつ表示し、Bassは現在ChordのRootを使用します。

Demo Playerは画面下部に常設し、Chord / Melody / Bass / Drumsを軽量な仮音でPlay / Stop / Loop再生できます。

現段階では手動Saveのみです。Autosave / project.json手動Backup / Migrationは後続実装です。

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
