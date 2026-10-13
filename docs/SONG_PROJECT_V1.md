# SongProject v1 — 共通交換Schema

`SongProject v1` を作曲アプリ群の唯一の交換JSONとして扱う。

## 原則

- Writerは新規Export時に `kind: "song-project"`, `schemaVersion: 1` を出力する。
- Readerは当面、旧Demo Composer `project.json`、旧作曲シート `demo-composer-project`、`composition-sheet-handoff` をImport互換として受け入れてよい。
- 旧形式を読み込んだ後の再Exportは `SongProject v1` にする。
- MIDI / Audio / Stemなど大きい実ファイルをJSONへ埋め込まない。必要な外部ファイルは `assets.files` に参照情報を置く。
- 各アプリは担当領域だけを書き換え、他アプリの領域を保持する。

## 担当領域

| App | 主に書き換える領域 |
| --- | --- |
| Composition Sheet | `intent`。必要に応じて `basic.bpm` / `basic.key` / `basic.scale` |
| Demo Composer | `composition` と制作中の `basic` |
| Arrangement Lab | `arrangement` |
| MIDI Analyzer | `analysis` と解析対象の `reference` metadata |
| 全App共通 | `updatedAt`, `compatibility` の自アプリ領域 |

## Canonical top-level

```json
{
  "kind": "song-project",
  "schemaVersion": 1,
  "projectId": "...",
  "title": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "lineage": {},
  "intent": {},
  "basic": {},
  "analysis": {},
  "composition": {},
  "arrangement": {},
  "history": {},
  "reference": { "items": [] },
  "assets": { "files": [] },
  "export": {},
  "compatibility": {}
}
```

## 外部Asset参照

`assets.files` はファイル本体ではなく参照情報を持つ。

```json
{
  "id": "reference-midi-1",
  "type": "midi",
  "role": "reference",
  "name": "reference.mid",
  "path": "assets/reference.mid",
  "mimeType": "audio/midi",
  "sha256": null,
  "external": true
}
```

ブラウザのローカルFile handleなど、他端末で再利用できないオブジェクトはJSONへ直接保存しない。

## 上書き防止

- Composition Sheetで編集しても `composition` / `arrangement` / `analysis` / `assets` を消さない。
- Demo Composerで作曲を更新しても `intent` / `arrangement` / `analysis` / `assets` を消さない。
- Arrangement Labで編曲を更新しても `intent` / `composition` / `analysis` / `assets` を消さない。
- MIDI Analyzerで解析を更新しても `intent` / `composition` / `arrangement` / `assets` を消さない。
- 解析済みSongProjectをMIDI Analyzerへ入れた場合、既存のBPM/Keyは既定では上書きしない。

## Version方針

`schemaVersion: 1` の後方互換追加は、既存v1ファイルを読み込める限り同じv1内で正規化する。破壊的変更が必要になった場合だけ `schemaVersion: 2` を設計する。
