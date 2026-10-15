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

v0.9-devで「作曲の判断」へ次を実装済み:
- 歌詞テーマ / 言葉の芯
- Vocal音域 / 歌いやすさ
- Phrase歌詞 / 音節メモ
- 歌詞 / Vocal方針

保存先は既存`metadata.composition`のoptional field。Project Schemaは3のまま。
旧Projectでfieldが欠けている場合は読み取り時に空値補完し、破壊的Migrationを行わない。

Claude作曲シートからは、テーマ・想定音域・情景・Vocal方向だけを初期値として反映できる。完成歌詞やVocal Noteを自動生成しない。

Phrase歌詞 / 音節メモは、例として次のような人間向けメモを保存する。

```text
Aメロ1｜雨上がりの道｜8音節
サビ1｜まだ歩いていける｜9音節
```

これは作曲判断であり、完成Vocal制作ではない。

担当範囲:
- Phrase単位の歌詞メモ
- Melody Phraseと歌詞の対応メモ
- 音節数メモ
- Vocal Range
- 言葉の入り位置 / 休みの検討
- 仮歌 / SynthVへ渡す前段メモ

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
- インスト曲ではVocal/Lyrics fieldを未入力のまま使える。未入力を未完了扱いにしない。
