# Vocal / Lyrics Design

Version: v0.8-dev
更新日: 2026-10-13

## 目的

歌もの制作で抜けていた「歌詞・音域・仮歌準備」を、スマホ上の作曲工程で必要最小限だけ扱う。

専用のVocal制作アプリは増やさない。

正式な責務分担:

- 作曲シート（Claude Artifact）: 歌詞テーマ / 言葉のイメージ / Vocal方向の初期設計
- Demo Composer: Melodyと一緒に考える歌詞メモ / Phrase / 音節 / Vocal Range / 仮歌・SynthV引き継ぎメモ
- PC DAW: 本歌 / SynthV本制作 / Recording / 詳細Vocal編集 / Mix

Demo Composerは本格Vocal EditorやSynthV代替を目指さない。

## Demo Composerで保存する項目

`project.metadata.vocal` の任意fieldとして保存する。

```text
isVocalSong: boolean | null
lyricsTheme: string
lyricalImage: string
direction: string
range
  low: string
  high: string
  note: string
lyricsDraft: string
phraseNotes: string
syllableNotes: string
synthVNotes: string
```

既存Project Schema番号は変更しない。`metadata.vocal` が無い旧Projectは空として扱う。

## Claude Artifact連携

`composition-sheet-handoff v1` にVocal初期設計があれば、Demo ComposerのVocal/Lyrics Panelの初期候補として表示する。

作曲シートから自動生成するのは設計情報だけで、完成歌詞・Melody・Chordを勝手に確定しない。

正本Prompt:

`docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`

## UI

Hubの作曲シート導線付近に折りたたみPanelを置く。

入力:
- 歌もの / Instrumental / 未決定
- 歌詞テーマ
- 言葉のイメージ
- Vocal方向
- 最低音 / 最高音
- 音域メモ
- 歌詞Draft
- Phraseごとの歌詞 / Melodyとの当たり
- 音節メモ
- 仮歌 / SynthV引き継ぎメモ

Androidで縦1列を基本とし、PC DAW工程の機能を持ち込まない。

## 保存方式

Vocal Panelは既存の巨大な`main.js`編集経路へ強依存させない。

1. 現在Projectを`Save Now`でIndexedDBへ確定
2. `projectId + vocal design`を一時pending情報としてlocalStorageへ保存
3. reload
4. `src/hub/app-entry.js`が`main.js`起動前にActive Projectを読み、同じProject IDの場合だけ`metadata.vocal`へ反映
5. revisionを更新してIndexedDBへ保存
6. pending情報を削除
7. 通常boot

別Project IDのpending情報は誤適用しない。

この保存方式はProject Schema番号を変えず、Project切替・AutoSaveとの競合を避けるためのBridgeである。

## 非対応

- Vocal Audio Recording
- Pitch correction
- Timing correction
- SynthV Engine hosting
- Phoneme editor
- Vocal FX
- Vocal Mixing
- Mastering

これらはPC DAW / Vocal専用ソフトの担当。

## Testing

`test:sheet-handoff`で以下を確認する。

- Claude Handoff Vocal情報の正規化
- 旧Handoff JSONにVocalが無くても読める
- Pending Vocal Design保存
- 同一Projectへだけ適用
- revision更新
- 適用後pending削除
- Project ID不一致時は誤適用しない

## 実機確認

stable tag前にAndroid Chromeで以下を確認する。

1. Claude Handoff JSON読込
2. Vocal Panel初期表示
3. 歌詞Draft保存
4. reload後の保持
5. Project切替後に他Projectへ混ざらない
6. project.json Export / Importで保持
7. 長い歌詞入力時のスマホ操作性
