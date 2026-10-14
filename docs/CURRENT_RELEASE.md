# Current Release

更新日: 2026-10-14

- 公開候補Version: `v0.8-dev`
- main統合PR: `#212`
- 現行ReleaseのCHANGELOG正本: `versions/v0.8-dev/CHANGELOG_v0.8-dev.md`
- 現行Version履歴: `versions/v0.8-dev/VERSION_HISTORY.md`
- Demo Composer Project Schema: 3
- SongProject: v1 (`schemaVersion: 1`)
- Arrangement Plan Schema: 4
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## 公開候補の導線

`⓪ 作曲シート → ① MIDI解析（任意） → ② Demo Composer → ③ Arrangement Lab → ④ DAW`

- Project Home: 作曲シートは公開済みClaude Artifact登録欄へ案内し、未公開の内蔵Sheet Moduleへはリンクしない。
- MIDI Analyzer → Demo Composer: SongProject v1を保存してからDemo Composerを開き、受け取り側で明示的に反映する。
- Demo Composer: 状態に応じて「受け取った曲を反映」「Arrangement Labへ渡す」「Arrangement Labを開く」のうち、次に必要な操作だけを主ボタンとして強調する。
- Arrangement Lab: Section未作成でもメロディ/コード等があれば、変換時だけ1〜32小節のスケッチSectionを補完する。1小節の場合は「1小節スケッチ」として編曲を開始できる。
- JSONは端末バックアップとして保存し、同じChromeのlocalStorageは補助的な一時受け渡しだけに使う。自動反映は行わない。

## 互換性

- Demo Composer Project Schema 3据え置き。
- SongProject v1据え置き。
- Arrangement Plan Schema 4据え置き。
- 1小節用SectionはArrangement Labへの変換Adapter内だけで生成し、SongProjectのcompositionへ自動書き戻ししない。
- 既存Project / SongProject / MIDI / IndexedDBとの互換性を維持する。

## 検証

PR #212でDemo Composer CI / Song Project Integration CI / Arrangement Lab CI / Mobile Chromium E2E / GitHub Pages PR buildを合格させてからmainへ統合する。

## stable tag

未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。

> `CHANGELOG.md` は過去履歴を保持する累積ログ。現行v0.8-devのRelease記録はVersion別CHANGELOGを正本とする。
