Version: v0.9-dev
更新日: 2026-10-13

【追加】
・Demo Composerの「作曲の判断」にVocal/Lyrics作曲情報を追加。
  - 歌詞テーマ / 言葉の芯
  - Vocal音域 / 歌いやすさ
  - Phrase歌詞 / 音節メモ
  - 歌詞 / Vocal方針
・Claude Artifact作曲シートのVocal/Lyrics初期情報を上記作曲メモへ明示反映。
・Vocal/Lyrics workflow smoke test。旧Project互換、Claude mapping、保存、Undoを検証。
・Arrangement Labから作るDemo Composer Forkへ`metadata.lineage`を直接付与。
  - rootProjectId
  - parentProjectId
  - sourceApp=arrangement-lab
  - createdFrom=fork
  - forkReason
  - revision=1
・SongProject v1を入口にArrangement Labへ入った場合、採用済み編曲を**Lineage付きSongProject Fork**として書き出す経路を追加。
  - 新しいSongProject `projectId`
  - root / parent lineage維持
  - sourceApp=`arrangement-lab`
  - createdFrom=`arrangement-fork`
  - forkReason / revision=1
  - 採用した編曲結果を新ForkのCompositionへ反映
  - 元SongProjectは変更しない
・SongProject smoke testへArrangement固有ForkのComposition / Lineage / 親不変回帰を追加。

【変更】
・作曲シート引き継ぎボタンを「基本設定 + Vocal設計を反映」に変更。
・参考曲情報も作曲判断の参考曲メモへ再入力なしで反映可能にした。
・Arrangement ForkはUI表現だけでなく出力project.json自体で系譜を保持する。
・SongProject v1入力時の`新しい作曲ProjectとしてFork`は、legacy project.jsonではなく共通SongProject v1を出力してアプリ間の系譜を維持する。legacy project.json入力時は従来のproject.json Forkを維持。
・APP_VERSION / package / UIをv0.9-devへ更新。

【修正】
・v0.8時点で設計のみだったPhrase歌詞 / 音節 / Vocal Range責務を実際のProject保存領域へ接続。
・Arrangement ForkのProject IDは新規だったが、親子関係を機械的に追えなかった穴を修正。
・SongProjectを使ったWorkflowで、Arrangement採用後にForkすると共通Project側のLineageが途切れる穴を修正。

【互換性】
・Demo Composer Project Schemaは3のまま。
・SongProject Schemaは1のまま。既存optional `lineage`契約を利用する。
・旧Schema 3 Projectで新Vocal fieldが欠落していても受理し、読み取り時に空値補完。
・Vocal/Lyricsはoptionalで、インスト曲に入力を強制しない。
・Arrangement Plan Schema変更なし。
・元Project / 元SongProjectをFork時に変更しない。
・legacy project.json入力時の従来Fork出力を維持。

【復元ポイント】
・Vocal/Workflow変更前: `restore/v0.8-workflow-boundary-feature-complete`
・SongProject Fork強化前: `restore/v0.9-before-arrangement-lineage-fork`

【未対応】
・Android実機でClaude Sheet → Vocal設計反映 → 保存 / reloadの通し確認。
・Android実機でSongProject → Arrangement → Lineage付きForkのDownload / Demo Composer再読込確認。
・SynthV本制作 / 本歌 / Phoneme / Vocal MixはPC DAW工程のため非対応。
・Cubasis / Cubase実機回帰。
・stable tag作成（実機確認後のみ）。
