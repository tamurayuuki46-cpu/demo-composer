Version: v0.8-dev
更新日: 2026-10-14

【追加】
・全体導線を `⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAW` の5段階で表示。
・Arrangement Labで、Section未作成でもメロディ/コード等の素材があれば1小節から編曲を開始できる変換Adapterを追加。
・1小節SongProjectの回帰テストを追加。

【変更】
・Demo Composerの受け渡しカードは、状態に応じて次に必要な主操作を1つだけ強調。
・Project Homeは公開mainに存在しない内蔵作曲シートへリンクせず、既存のClaude Artifact作曲シート登録欄へ案内。
・Arrangement Labをv0.7-devへ更新し、5段階Workflowと「1小節だけでもOK」を表示。

【修正】
・公開Project Homeの`../sheet-app/`リンクがmainに存在しないModuleを参照していた問題を修正。

【互換性】
・Demo Composer Project Schema 3据え置き。
・SongProject v1据え置き。
・Arrangement Plan Schema 4据え置き。
・1小節用SectionはArrangement Lab変換時だけ補完し、SongProjectへ自動書き戻ししない。

【復元ポイント】
・`restore/main-before-mobile-first-flow-20261014`

【未対応】
・Android実機で5段階Workflowの表示・操作確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
