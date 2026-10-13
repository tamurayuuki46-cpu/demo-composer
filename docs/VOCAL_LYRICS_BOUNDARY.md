# Lyrics / Vocal Responsibility Boundary

更新日: 2026-10-13

## 目的

歌もの制作で不足していたLyrics / Vocal責務を、既存Workflowへ新アプリを増やさず配置する。

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

Composition Ownerとして将来扱う責務:
- Phrase単位の歌詞メモ
- Melody Phraseと歌詞の対応
- 音節数
- Vocal Range
- 言葉の入り位置 / 休み
- 仮歌 / SynthVへ渡す前段メモ

これは作曲判断であり、完成Vocal制作ではない。

既存Project Schema 3へこの設計を直ちに破壊的追加しない。旧Project互換を維持し、実装時はoptional metadataまたは明示Migrationを使用する。

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

## 原則

- 歌詞/Vocal専用の新アプリは現時点で作らない。
- Sheet → Demo Composer → PC DAWの順で情報の詳細度を上げる。
- 同じ歌詞情報を複数アプリで別々に所有しない。
- Arrangement LabはVocalを「編曲上の主役」として参照するが、Composition Ownerにはならない。
