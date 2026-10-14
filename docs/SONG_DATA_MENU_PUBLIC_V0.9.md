# 公開版 曲データメニュー v0.9

公開GitHub Pagesの右上 `📦 曲データ` は、スマートフォンで迷わず使える4つの主要操作に統一する。

## 4つの主要操作

1. `🧭 全アプリ遷移`
   - Music Project Home
   - 作曲シート（非公開ChatGPT Site）
   - MIDI Analyzer
   - Demo Composer
   - Arrangement Lab
2. `🎹 MIDI保存`
   - Demo Composer: 既存MIDI Writerで Draft / Chord / Melody / Bass / Drums / Counter Melody を保存。
   - Music Project Home: 読み込んだSongProject v1をDemo Projectへ変換して既存MIDI Writerで保存。
   - Arrangement Lab: 既存の採用案 `Song.mid` 書き出しを使用。
3. `💾 JSON保存`
   - SongProject v1をバックアップ。Schema変更なし。
4. `📝 作曲シート成果物`
   - 現在のSongProjectに既に含まれる作曲シート記入内容だけを読み取り専用表示。

## 公開範囲

- 31枚の作曲シート本文・入力UIは公開GitHub Pagesへ含めない。
- 作曲シート本体は非公開ChatGPT Siteを開くリンクだけを置く。
- 公開側に持つのはSongProject内の既存成果物を読むための座標マッピングと表示UIのみ。
- 非公開SiteとGitHub Pagesは別originなので、自動同期せずJSONを受け渡しの正本とする。

## 互換性

- Demo Composer Project Schema 3据え置き。
- SongProject schemaVersion 1据え置き。
- IndexedDB / localStorage / JSON保存形式変更なし。
- 既存の `保存JSONを開く` と次工程操作は補助導線として維持する。

## 検証

- JavaScript syntax check
- 公開専用4操作smoke test
- Demo Composer CI
- Arrangement Lab CI
- Song Project Integration CI
- Project Home Sheet Link CI
- Pages build（PR時は本番deployしない）

Android実機とCubasis/Cubase実機確認が終わるまでstable tagは作成しない。
