# 曲データメニュー v0.13

右上の `📦 曲データ` は、スマートフォンでも迷わず使える4つの主要入口に統一する。

## 主要4操作

1. `🧭 全アプリ遷移`
   - Music Project Home
   - 作曲シート（非公開ChatGPT Site）
   - MIDI Analyzer
   - Demo Composer
   - Arrangement Lab
2. `🎹 MIDI保存`
   - Demo Composer: 既存 `downloadMidiBundle()` を使い Draft / Chord / Melody / Bass / Drums / Counter Melody を保存する。
   - Arrangement Lab: 既存の採用案 `Song.mid` 書き出しを呼ぶ。
   - Music Project Home / 作曲シート: SongProject v1をDemo Projectへ変換して既存MIDI Writerを使う。
3. `💾 JSON保存`
   - SongProject v1をバックアップする。Schemaは変更しない。
4. `📝 作曲シート成果物`
   - 現在のSongProjectに保存された `compatibility.compositionSheet.fullWorkbook` の記入内容だけを読み取り専用で表示する。
   - 31シート本体は公開しない。

## 補助操作

`保存JSONを開く` は従来互換のため残す。次工程ボタンも既存Workflow互換のため小さい補助操作として維持する。

## データ方針

- SongProject schemaVersion 1を維持する。
- Demo Composer Project Schema 3を維持する。
- IndexedDB / localStorage / JSONの既存データを移行不要にする。
- 非公開作曲シートSiteとGitHub Pagesはoriginが異なるため、データ共有はJSONを正本とし、自動同期は行わない。
- 作曲シート本体URLは非公開Siteを直接開く。公開Pagesへ31シート本体を含めない。

## モバイルUI

- 主要4操作は2列×2段の大ボタン。
- アプリ遷移ダイアログはPCで2列、狭い画面では1列。
- 右上トリガーはsafe-areaを考慮する。

## 検証

- `npm run test:syntax`
- `npm run test:song-data-menu`
- `npm run test:midi`
- `npm run test:song-project`
- `npm run build`
- GitHub Actions各CI
- Android実機で4操作と複数MIDIダウンロードを確認後、stable tag判定を行う。
