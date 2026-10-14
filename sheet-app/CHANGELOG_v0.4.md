Version: v0.4-dev
更新日: 2026-10-14

【追加】
・claude/sheet-markdown-export の原文31シートを全文収録（目次を含めMarkdown32ファイルを保持）
・本文検索、ページ一覧、前後移動、元の文章表示
・空欄313箇所への記入、327項目のチェック、山谷選択、ページ別メモ
・曲ごとの端末内自動保存、保存済み曲の切替、新しい曲
・全記入を含むSongProject v1 JSON保存・復元・Demo Composer受け渡し

【変更】
・latestの入口を作曲シート全集v0.4へ更新
・記入用シートの仮タイトル・場面・参考曲1を受け渡し用入力へ連動
・Workbookは既存compatibility.compositionSheet.fullWorkbookへ保存。Schemaは1のまま
・過去v0.1 / v0.2 / v0.3と既存の曲データを保持

【修正】
・同一Project IDのJSON再読込前に、現在の曲を別IDの復元コピーとして保持
・保存不能時にJSONバックアップを案内し、不正なImportで現在データを変更しない

【未対応】
・Android実機での操作・聴感確認。stable tagは未認定
・ブラウザの保存領域を消した場合は自動復元しないため、JSON保存が必要

原文: c43d2484afd3932c68a2a942afc07e2582fa9efc
復元点: restore/develop-before-sheet-full-v0.4-20261014
