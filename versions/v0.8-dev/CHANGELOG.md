Version: v0.8-dev
更新日: 2026-10-13

【追加】
・Music Project Homeを全体Workflow Hubへ拡張。現在工程、次の一手、任意のMIDI Analyzerレーン、Backup/Recoveryを表示。
・Claude Artifact作曲シートの`composition-sheet-handoff` Schema 1受け入れ。
・Demo Composer Hubで作曲シートの設計情報を確認し、Title / BPM / Key / Scale候補を明示適用する導線。
・SongProject v1へ後方互換のoptional Lineageを追加。root / parent / sourceApp / createdFrom / forkReason / revisionを追跡。
・`forkSongProject()`を追加し、Arrangement結果を新しい作曲Projectとして続ける明示Forkを共通化。
・Lyrics / Vocal責務境界を正本化。
・Workflow Hub / Sheet Handoff / SongProject Lineage-ForkのCI smoke test。

【変更】
・正式Workflowを `作曲シート → 必要なら Moises / MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）` に固定。
・Arrangement Labの旧「Demo Composer戻し」を「新しい作曲ProjectとしてFork」と明示。通常の出口はDAW引き継ぎZIP。
・Demo Composer / Arrangement Lab / MIDI Analyzer間のOwnershipを明文化。
・Project Homeのアプリリンクを単なる入口からWorkflow上の次工程へ変更。
・APP_VERSION / package / UIをv0.8-devへ同期。

【修正】
・各アプリが隣の責務を抱え始めていた境界の曖昧さを整理。
・作曲シート内容を再入力する必要があったWorkflowの穴を、構造化JSON引き継ぎで補完。
・編曲結果を元Compositionへ通常往復させるように見えるUIをFork表現へ修正。

【互換性】
・Demo Composer Project Schemaは3のまま。
・SongProject Schemaは1のまま。旧v1はlineage欠落を許容。
・IndexedDB Schema変更なし。
・MIDI形式変更なし。
・作曲シートVocal fieldはSchema 1内optional。旧handoff JSONを受理。

【復元ポイント】
・`restore/before-workflow-boundary-2026-10-13`

【未対応】
・Android実機でProject Home→Sheet JSON→Demo→Arrangement→DAW Handoffの通し確認。
・Demo Composer内のPhrase単位Lyrics / syllable / Vocal Range UI本実装。
・Arrangement LabのFork出力へSongProject Lineageを直接付与する統合強化。
・Cubasis / Cubase実機取込。
・stable tag作成（実機確認後のみ）。
