Version: v0.10-dev
更新日: 2026-10-14

【追加】
・初心者向けの「曲データの受け渡し」導線をDemo Composer Exportへ追加。
・MIDI AnalyzerからのSongProject一時受け取り候補を表示し、明示的な「反映」操作で取り込めるようにした。
・Demo ComposerからArrangement Labへ「保存 → 開く → 反映」の一本道を追加。
・同じChromeではlocalStorageを補助導線として使い、別ブラウザでは保存済みJSON選択へフォールバックする。
・JSON handoff guide smoke testを追加。

【変更】
・交換形式はSongProject v1を継続。技術用語より「前のアプリから受け取る」「Arrangement Labへ渡す」を前面表示。
・MIDI Analyzer由来SongProjectをDemo Composerで編集して再Exportする際、projectIdが一致する元SongProjectへcompositionだけをMergeし、analysis / arrangement / intentを保持する。

【修正】
・アプリ間受け渡しで、JSONを書き出した後に次の操作が分かりにくかった導線を改善。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject schemaVersion 1据え置き。
・Arrangement Plan Schema 4据え置き。
・既存project.json / SongProject JSONのImportを維持。

【未対応】
・Android実機でMIDI Analyzer → Demo Composer → Arrangement Labの通し確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
