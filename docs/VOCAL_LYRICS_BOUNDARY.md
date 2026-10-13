# Lyrics / Vocal Responsibility Boundary

Version: v0.8-dev
更新日: 2026-10-13

## 目的

歌もの制作で不足していたLyrics / Vocal責務を、既存Workflowへ新アプリを増やさず配置する。

スマホでは「歌詞・音域・Melodyとの当たり・仮歌準備」まで進め、PC DAWでは本歌 / SynthV本制作 / 詳細Vocal編集 / Mixへ集中する。

## 作曲シート — テーマを決める

担当:
- 歌詞テーマ
- 伝えたい内容
- 情景 / 言葉のイメージ
- Vocalの方向性
- 想定音域候補

担当しない:
- 完成歌詞Editor
- Note単位の発音編集
- SynthV本制作
- Vocal Recording

Claude ArtifactからDemo Composerへ渡す契約は`docs/CLAUDE_COMPOSITION_SHEET_HANDOFF_PROMPT.md`を正本とする。

## Demo Composer — Melodyと言葉を結びつける

Composition Ownerとして扱う責務:
- Phrase単位の歌詞メモ
- Melody Phraseと歌詞の対応
- 音節数
- Vocal Range
- 言葉の入り位置 / 休み
- 歌詞Draft
- 仮歌 / SynthVへ渡す前段メモ

これは作曲判断であり、完成Vocal制作ではない。

### 保存項目

`project.metadata.vocal` をoptional metadataとして使う。

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

既存Project Schema 3の番号は変更しない。`metadata.vocal`が無い旧Projectは空として扱う。

### 作曲シート連携

`composition-sheet-handoff v1`にVocal初期情報がある場合は、Demo ComposerのVocal/Lyrics Panelの初期候補として表示する。

作曲シートからChord / Melody / Bass / Drums / Counterを自動生成・確定しない。

### UI

Hubの作曲シート導線付近に折りたたみ`歌詞 / Vocal設計` Panelを置く。

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

Android縦1列を優先する。

### 保存方式

既存の巨大な`main.js`の画面ロジックへVocal専用依存を増やさず、安全なBridgeでProject本体へ保存する。

1. 現在Projectを`Save Now`でIndexedDBへ確定
2. `projectId + vocal design`をpending情報としてlocalStorageへ一時保存
3. reload
4. `src/hub/app-entry.js`が`main.js`起動前にActive Projectを読む
5. pendingとActive ProjectのIDが同じ場合だけ`metadata.vocal`へ反映
6. revisionを更新してIndexedDB保存
7. pendingを削除して通常boot

Project IDが異なる場合は誤適用しない。

このBridgeはVocal情報をlocalStorageだけに保存する仕組みではない。localStorageはreloadを跨ぐ一時キューで、正本はActive Projectの`metadata.vocal`。

## Arrangement Lab — Vocalの居場所を守る

担当可能:
- 主旋律の休みと他パートの関係
- Vocalを邪魔しない密度・音域
- Sectionごとの主役交代
- Counter Melodyとの対話

担当しない:
- 歌詞本文の所有
- Vocal Melodyの通常上書き
- Vocal Editor

主旋律は原則保持する。

## PC DAW — Vocalを完成させる

必須最終工程として担当:
- 本歌Recording
- SynthV等の本制作
- Note / Phoneme / Expression詳細編集
- Timing / Pitch / Dynamics
- Vocal FX
- Mix

## 非対応

Demo Composerでは以下を実装しない。

- Vocal Audio Recording
- Pitch correction
- Timing correction
- SynthV Engine hosting
- Phoneme editor
- Vocal FX
- Vocal Mixing
- Mastering

## Testing

`test:sheet-handoff`で確認:
- Claude Handoff Vocal情報の正規化
- 旧Handoff JSONにVocalが無くても読める
- Pending Vocal Design保存
- 同一Projectへだけ適用
- revision更新
- 適用後pending削除
- Project ID不一致時は誤適用しない

## 実機確認

stable tag前にAndroid Chromeで確認:
1. Claude Handoff JSON読込
2. Vocal Panel初期表示
3. 歌詞Draft保存
4. reload後の保持
5. Project切替後に他Projectへ混ざらない
6. project.json Export / Importで保持
7. 長い歌詞入力時のスマホ操作性

## 原則

- 歌詞/Vocal専用の新アプリは現時点で作らない。
- Sheet → Demo Composer → PC DAWの順で情報の詳細度を上げる。
- 同じ歌詞情報を複数アプリで別々に所有しない。
- Arrangement LabはVocalを「編曲上の主役」として参照するが、Composition Ownerにはならない。
