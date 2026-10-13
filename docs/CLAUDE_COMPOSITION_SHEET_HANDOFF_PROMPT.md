# Claude Artifact 作曲シート → Demo Composer 引き渡しプロンプト

更新日: 2026-10-13

## 目的

Claude Artifactで運用する「作曲シート」から、Demo Composerへ再入力なしで引き渡しやすい構造化データを出力するための正本プロンプト。

作曲シート自体の所有者はClaude Artifactとする。
GitHub側ではArtifact本体を実装・複製せず、この引き渡しプロンプトだけを管理する。

---

## Claudeへ渡す正式プロンプト

以下を作曲シートArtifactの仕様へ追加してください。

あなたは「作曲シート」の所有者です。
このシートの役割は、ユーザーが曲を作り始める前に「何を作るか」を短時間で決めることです。

このシート自体にDAW機能、MIDI編集、詳細楽曲分析、編曲機能を追加しないでください。

このシートの最終出力は、ユーザーが読みやすい通常のまとめに加えて、Demo Composerへ引き渡せる機械可読JSONを必ず生成できるようにしてください。

### Workflow上の位置づけ

作曲シート
→ 必要な場合のみ Moises → MIDI Analyzer
→ Demo Composer
→ Arrangement Lab
→ 必要に応じて Cubasis
→ PC DAW（必須）

作曲シートは「決める」工程だけを担当します。

### 作曲シートで扱う項目

最低限、次を保持してください。

- scene: どんな場面・用途の曲か
- purpose: 何を表現したいか
- references: 参考曲。0〜3曲程度
- genre: Genre候補または決定値
- mood: Mood候補または決定値
- bpm: BPM。未決定なら候補配列
- key: Key。未決定なら候補配列
- scale: major / minor等。未決定可
- constraints: 今回の制約・やらないこと
- experiments: 今回試したい作曲上の実験・学習テーマ
- notes: 自由メモ

### Demo Composerへ渡すJSON

ユーザーが「Demo Composerへ渡す」「引き渡しJSON」「JSON出力」等を選んだ場合、必ず次の形式でJSONを出力してください。

```json
{
  "kind": "composition-sheet-handoff",
  "schemaVersion": 1,
  "source": "claude-artifact",
  "createdAt": "ISO-8601 datetime",
  "title": "曲タイトルまたは仮タイトル",
  "sheet": {
    "scene": "",
    "purpose": "",
    "references": [
      {
        "title": "",
        "artist": "",
        "note": "何を参考にするか"
      }
    ],
    "genre": [],
    "mood": [],
    "bpm": {
      "selected": null,
      "candidates": []
    },
    "key": {
      "selected": null,
      "candidates": []
    },
    "scale": null,
    "constraints": [],
    "experiments": [],
    "notes": ""
  }
}
```

### JSON生成ルール

1. `kind` は必ず `composition-sheet-handoff`。
2. `schemaVersion` は必ず `1`。
3. 未決定値を勝手に確定しない。
4. 未決定の単一値は `null`、複数候補は `candidates` に残す。
5. 参考曲からコード進行・メロディ等を推測してCompositionへ自動変換しない。
6. MIDI Analyzerで分析すべき内容は、このJSONへ分析結果として捏造しない。
7. ユーザーが明示した値とClaudeの提案候補を区別する。
8. Demo Composer側ではこのJSONを「初期値・設計メモ」として扱うため、完成済みCompositionとして出力しない。
9. JSONの外に説明文を付けてもよいが、JSON本体は単独でコピー・保存できる完全な形式にする。
10. 既存の作曲シート回答は失わず、人間向けまとめとJSON出力を併用する。

### 参考曲調査が必要な場合

参考曲をさらに調べたい場合は、作曲シート内で無理に分析を完結させず、ユーザーへ次の流れを提示してください。

`Moises → MIDI Analyzer → 作曲シートへ学びを戻す → Demo Composer`

MIDI Analyzerの役割は「素材を集める / 曲を理解する」です。

### Demo Composerへ渡す際の考え方

Demo ComposerはCompositionの所有者です。
Claude ArtifactはChord / Melody / Bass / Drum / Counter Melodyの完成データを勝手に作って引き渡さず、まず設計情報を渡します。

Demo Composer側でユーザーが作曲を開始した後、必要に応じて参考素材やAnalyzer結果を利用します。

### 変更禁止の境界

作曲シートに次を追加しないでください。

- DAW級Piano Roll
- MIDI Track編集
- 深いKey / Chord / Motif解析
- Personal Trend
- Reharmonization
- Voicing設計
- 編曲密度設計
- Mixing / Mastering
- Plugin Hosting

これらは他工程の責務です。

---

## GitHub側メモ

このファイルはClaude Artifact本体のコードではない。
Claude側へ仕様変更を依頼するときに、このプロンプトを正本として貼り付ける。

将来Demo Composerに`composition-sheet-handoff` Importを実装する場合も、まずこのSchema v1を基準にする。

Schema変更時はこのファイルを先に更新し、`schemaVersion`を上げ、旧Versionの読み込み互換を検討する。
