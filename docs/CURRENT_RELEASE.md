# Current Release

更新日: 2026-10-14

- 公開候補Version: `v0.7-dev`
- main統合PR: `#209`
- main merge commit: `e84dff080c2aa5d6ae4ee4b87ac3be95d0336d8d`
- 現行ReleaseのCHANGELOG正本: `versions/v0.7-dev/CHANGELOG_v0.7-dev.md`
- 現行Version履歴: `VERSION_HISTORY.md`
- Demo Composer Project Schema: 3
- SongProject: v1 (`schemaVersion: 1`)
- Arrangement Plan Schema: 4
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## 公開済み導線

- MIDI Analyzer → Demo Composer: 「前のアプリから受け取る」/「受け取った曲を反映」
- ファイル復帰: 「保存したJSONを選ぶ」
- Demo Composer → Arrangement Lab: 「Arrangement Labへ渡す」→「Arrangement Labを開く」
- Arrangement Lab: 「Demo Composerから続ける」→明示的に反映

JSONは端末バックアップとして保存し、同じChromeのlocalStorageは補助的な一時受け渡しだけに使う。自動反映は行わない。

## 互換性

MIDI Analyzer由来SongProjectを受け取った場合、Demo Composerはcompositionを更新し、analysis / arrangement / intent等の所有領域を保持する。既存Project / SongProject JSON読込も維持する。

## 検証

PR #209およびmainでDemo Composer CI / Song Project Integration CI / GitHub Pages / Arrangement Lab CI / Mobile Chromium E2Eが成功済み。

## stable tag

未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。

> `CHANGELOG.md` は過去履歴を保持する累積ログ。現行v0.7-devのRelease記録は上記Version別CHANGELOGを正本とする。
